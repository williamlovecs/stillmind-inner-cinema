using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using WakeupHelper.Model;
using WakeupHelper.Model.System;

namespace WakeupHelper.libs;

internal static class BatchV33Runner
{
	private const string DefaultTencentTemplate = "腾讯会议模板";
	private const string DefaultFeishuTemplate = "飞书妙记模板";

	public static int Run(string[] args)
	{
		if (args.Length == 0 || args[0] != "--batch-v33")
		{
			PrintUsage();
			return 2;
		}
		if (args.Length < 2)
		{
			PrintUsage();
			return 2;
		}

		string manifest = args[1];
		string outputDir = GetArg(args, "--output-dir") ?? Path.Combine(Path.GetDirectoryName(manifest) ?? Program.RootPath, "batch-v33-output");
		string reportPath = GetArg(args, "--report") ?? Path.Combine(Path.GetDirectoryName(manifest) ?? Program.RootPath, "batch_v33_report.csv");
		bool commentMode = GetBoolArg(args, "--comment", false);
		bool appendix = GetBoolArg(args, "--appendix", false);
		bool overwrite = GetBoolArg(args, "--overwrite", false);
		if (appendix && !File.Exists(Path.Combine(Program.ConfigPath, "consciousness", "references.json")))
		{
			throw new InvalidOperationException("本构建未包含已授权的《意识强度》本地规则，不能启用 --appendix。");
		}

		outputDir = Path.GetFullPath(outputDir);
		Directory.CreateDirectory(outputDir);
		string backupDir = Path.Combine(
			outputDir,
			"_batch-v33-backup",
			DateTime.Now.ToString("yyyyMMdd-HHmmss"));

		ErrorCorrection correction = Program.setting.ErrorCorrectionList?.FirstOrDefault();
		if (correction == null)
		{
			throw new InvalidOperationException("未找到错词纠正模板。");
		}

		List<Dictionary<string, string>> rows = ReadCsv(manifest);
		List<Dictionary<string, string>> report = new List<Dictionary<string, string>>();
		int ok = 0;
		int failed = 0;
		HashSet<string> outputNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
		foreach (Dictionary<string, string> row in rows)
		{
			string input = GetFirst(row, "original_source", "source_path", "path");
			string standardName = GetFirst(row, "standard_name", "name");
			if (string.IsNullOrWhiteSpace(standardName))
			{
				standardName = Path.GetFileName(input);
			}
			string output = "";
			string mainSpeaker = GetFirst(row, "main_speaker", "main", "主催名称");
			string clientSpeaker = GetFirst(row, "client", "client_speaker", "被催名称");
			string topic = GetFirst(row, "topic", "互催主题");
			string date = GetFirst(row, "date", "互催日期");
			string templateName = "";
			string status = "ok";
			string error = "";
			bool copiedOutput = false;
			bool outputExisted = false;
			string backup = "";
			try
			{
				standardName = V33DocumentPolicy.NormalizeOutputFileName(standardName, date);
				output = ResolveSafeOutputPath(outputDir, standardName);
				if (!outputNames.Add(standardName))
				{
					throw new InvalidOperationException("清单包含重复标准文件名，已拒绝覆盖: " + standardName);
				}
				if (string.IsNullOrWhiteSpace(input) || !File.Exists(input))
				{
					throw new FileNotFoundException("原始文件不存在", input);
				}
				if (V33DocumentPolicy.IsProcessedV33(input))
				{
					throw new InvalidOperationException("输入已包含 v3.3 标准表头，已拒绝二次清洗。请始终从原始转写重新生成，避免重复表头和累积纠错。");
				}
				outputExisted = File.Exists(output);
				if (outputExisted && !overwrite)
				{
					throw new IOException("目标文件已存在，默认拒绝覆盖: " + output + "。如需覆盖请显式使用 --overwrite true。");
				}
				if (outputExisted)
				{
					Directory.CreateDirectory(backupDir);
					backup = Path.Combine(backupDir, standardName);
					File.Copy(output, backup, overwrite: false);
				}
				File.Copy(input, output, overwrite: true);
				copiedOutput = true;
				templateName = ChooseTemplateName(output);
				DocumentTemplate template = LoadTemplate(templateName);
				template.ErrorsCorrectionInfo = correction;
				if (!string.IsNullOrWhiteSpace(mainSpeaker) && !string.IsNullOrWhiteSpace(clientSpeaker))
				{
					template.FirstPeople.Name = mainSpeaker.Trim();
					template.SecondPeople.Name = clientSpeaker.Trim();
					if (template.IdentificationStrategyInfo.SourceName == "飞书妙记")
					{
						template.FirstMorePeopleList = new List<string> { mainSpeaker.Trim() };
						template.SecondMorePeopleList = new List<string> { clientSpeaker.Trim() };
					}
				}

				WordDocumentHelper helper = null;
				try
				{
					helper = new WordDocumentHelper(output)
					{
						documentTemplate = template,
						errorCorrection = correction,
						IsDocumentErrorCorrectionCommentDebug = commentMode,
						IsShowWordWindows = false,
						IsGenerateConsciousnessAppendix = appendix,
						ExplicitMainSpeakerName = mainSpeaker,
						ExplicitClientSpeakerName = clientSpeaker,
						OverviewTopic = topic,
						OverviewDate = date
					};
					if (template.IdentificationStrategyInfo.SourceName == "飞书妙记")
					{
						helper.StartFeishuMiaojiWordDocument();
					}
					else
					{
						helper.StartTencentWordDocument();
					}
				}
				finally
				{
					if (helper != null)
					{
						try { helper.Close(); } catch { }
					}
				}
				ok++;
			}
			catch (Exception ex)
			{
				status = "error";
				error = ex.GetType().Name + ": " + ex.Message;
				failed++;
				try
				{
					if (copiedOutput && outputExisted && !string.IsNullOrEmpty(backup) && File.Exists(backup))
					{
						File.Copy(backup, output, overwrite: true);
					}
					else if (copiedOutput && File.Exists(output))
					{
						File.Delete(output);
					}
				}
				catch
				{
				}
			}
			report.Add(new Dictionary<string, string>
			{
				["standard_name"] = standardName,
				["input"] = input,
				["output"] = output,
				["backup"] = backup,
				["template"] = templateName,
				["status"] = status,
				["error"] = error
			});
			Console.WriteLine($"{status}\t{standardName}\t{templateName}");
		}

		WriteCsv(reportPath, report);
		Console.WriteLine($"batch_v33_ok={ok}");
		Console.WriteLine($"batch_v33_failed={failed}");
		Console.WriteLine($"batch_v33_report={reportPath}");
		return failed == 0 ? 0 : 1;
	}

	private static string ChooseTemplateName(string path)
	{
		string text = ReadDocxText(path, 6000);
		return Utils.FeishuMiaoji(text) ? DefaultFeishuTemplate : DefaultTencentTemplate;
	}

	private static string ResolveSafeOutputPath(string outputDir, string standardName)
	{
		if (string.IsNullOrWhiteSpace(standardName))
		{
			throw new InvalidOperationException("标准文件名不能为空。");
		}
		if (Path.IsPathRooted(standardName) ||
			standardName.IndexOf(Path.DirectorySeparatorChar) >= 0 ||
			standardName.IndexOf(Path.AltDirectorySeparatorChar) >= 0 ||
			standardName != Path.GetFileName(standardName))
		{
			throw new InvalidOperationException("标准文件名只能是文件名，不能包含目录或绝对路径: " + standardName);
		}
		if (!string.Equals(Path.GetExtension(standardName), ".docx", StringComparison.OrdinalIgnoreCase))
		{
			throw new InvalidOperationException("标准文件名必须以 .docx 结尾: " + standardName);
		}

		string root = Path.GetFullPath(outputDir).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
		string output = Path.GetFullPath(Path.Combine(root, standardName));
		if (!output.StartsWith(root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
		{
			throw new InvalidOperationException("输出路径越界，已拒绝: " + output);
		}
		return output;
	}

	private static DocumentTemplate LoadTemplate(string name)
	{
		DocumentTemplate source = Program.setting.DocumentTemplateList?.FirstOrDefault(t => t.Name == name);
		if (source == null)
		{
			throw new InvalidOperationException("未找到模板: " + name);
		}
		DocumentTemplate template = DocumentTemplate.DeserializeJson(Path.Combine(Program.TemplatePath, source.Id + ".json"));
		IdentificationStrategy strategy = Program.setting.IdentificationStrategyList?.FirstOrDefault(s => s.Id == template.PolicyId);
		if (strategy == null)
		{
			throw new InvalidOperationException("模板缺少识别策略: " + name);
		}
		template.IdentificationStrategyInfo = strategy;
		return template;
	}

	private static string ReadDocxText(string path, int maxChars)
	{
		using (ZipArchive zip = ZipFile.OpenRead(path))
		{
			ZipArchiveEntry entry = zip.GetEntry("word/document.xml");
			if (entry == null)
			{
				return "";
			}
			using (Stream stream = entry.Open())
			using (StreamReader reader = new StreamReader(stream, Encoding.UTF8))
			{
				string xml = reader.ReadToEnd();
				string text = Regex.Replace(xml, "<[^>]+>", "");
				return text.Length > maxChars ? text.Substring(0, maxChars) : text;
			}
		}
	}

	private static string GetArg(string[] args, string name)
	{
		for (int i = 0; i < args.Length - 1; i++)
		{
			if (args[i] == name)
			{
				return args[i + 1];
			}
		}
		return null;
	}

	private static bool GetBoolArg(string[] args, string name, bool fallback)
	{
		string value = GetArg(args, name);
		if (string.IsNullOrWhiteSpace(value))
		{
			return fallback;
		}
		return value.Equals("true", StringComparison.OrdinalIgnoreCase) || value == "1" || value.Equals("yes", StringComparison.OrdinalIgnoreCase);
	}

	private static string GetFirst(Dictionary<string, string> row, params string[] names)
	{
		foreach (string name in names)
		{
			if (row.TryGetValue(name, out string value) && !string.IsNullOrWhiteSpace(value))
			{
				return value;
			}
		}
		return "";
	}

	private static List<Dictionary<string, string>> ReadCsv(string path)
	{
		string[] lines = File.ReadAllLines(path, Encoding.UTF8);
		if (lines.Length == 0)
		{
			return new List<Dictionary<string, string>>();
		}
		List<string> headers = ParseCsvLine(lines[0]);
		List<Dictionary<string, string>> rows = new List<Dictionary<string, string>>();
		for (int i = 1; i < lines.Length; i++)
		{
			if (string.IsNullOrWhiteSpace(lines[i]))
			{
				continue;
			}
			List<string> values = ParseCsvLine(lines[i]);
			Dictionary<string, string> row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
			for (int j = 0; j < headers.Count; j++)
			{
				row[headers[j]] = j < values.Count ? values[j] : "";
			}
			rows.Add(row);
		}
		return rows;
	}

	private static List<string> ParseCsvLine(string line)
	{
		List<string> values = new List<string>();
		StringBuilder current = new StringBuilder();
		bool quoted = false;
		for (int i = 0; i < line.Length; i++)
		{
			char c = line[i];
			if (c == '"')
			{
				if (quoted && i + 1 < line.Length && line[i + 1] == '"')
				{
					current.Append('"');
					i++;
				}
				else
				{
					quoted = !quoted;
				}
			}
			else if (c == ',' && !quoted)
			{
				values.Add(current.ToString());
				current.Clear();
			}
			else
			{
				current.Append(c);
			}
		}
		values.Add(current.ToString());
		return values;
	}

	private static void WriteCsv(string path, List<Dictionary<string, string>> rows)
	{
		Directory.CreateDirectory(Path.GetDirectoryName(path) ?? Program.RootPath);
		string[] headers = new[] { "standard_name", "input", "output", "backup", "template", "status", "error" };
		using (StreamWriter writer = new StreamWriter(path, false, new UTF8Encoding(true)))
		{
			writer.WriteLine(string.Join(",", headers.Select(EscapeCsv)));
			foreach (Dictionary<string, string> row in rows)
			{
				writer.WriteLine(string.Join(",", headers.Select(h => EscapeCsv(row.ContainsKey(h) ? row[h] : ""))));
			}
		}
	}

	private static string EscapeCsv(string value)
	{
		value = value ?? "";
		if (value.Contains(",") || value.Contains("\"") || value.Contains("\n") || value.Contains("\r"))
		{
			return "\"" + value.Replace("\"", "\"\"") + "\"";
		}
		return value;
	}

	private static void PrintUsage()
	{
		Console.WriteLine("Usage: WakeupHelper.exe --batch-v33 <manifest.csv> --output-dir <dir> [--report <csv>] [--comment false] [--appendix false] [--overwrite false]");
	}
}
