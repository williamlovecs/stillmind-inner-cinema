using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using WakeupHelper.Model.Organizer;

namespace WakeupHelper.libs;

public class HypnosisCaseOrganizer
{
	private static readonly string[] ConvertedMarkers =
	{
		"_潜催文案助手转换_评论模式v2.3",
		"_潜催文案助手转换v2.3",
		"_潜催文案助手转换_评论模式v3.2",
		"_潜催文案助手转换v3.2",
		"_潜催文案助手转换_评论模式v3.3",
		"_潜催文案助手转换v3.3",
		"_潜催文案助手转换"
	};

	public List<HypnosisCaseGroup> Scan(string folder, bool includeSubfolders = true)
	{
		if (string.IsNullOrWhiteSpace(folder) || !Directory.Exists(folder))
		{
			throw new DirectoryNotFoundException("案例目录不存在：" + folder);
		}

		SearchOption searchOption = includeSubfolders ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly;
		List<HypnosisCaseDocument> documents = Directory.GetFiles(folder, "*.docx", searchOption)
			.Where(path => !Path.GetFileName(path).StartsWith("~$", StringComparison.OrdinalIgnoreCase))
			.Select(InspectDocument)
			.ToList();

		return documents
			.GroupBy(d => d.BaseKey)
			.Select(g => new HypnosisCaseGroup
			{
				CaseKey = g.Key,
				Documents = g.OrderBy(d => d.LastWriteTime).ToList()
			})
			.OrderByDescending(g => g.Documents.Max(d => d.LastWriteTime))
			.ThenBy(g => g.CaseKey)
			.ToList();
	}

	public string ExportMarkdownReport(string folder, List<HypnosisCaseGroup> groups)
	{
		string reportPath = Path.Combine(folder, "互催案例整理报告_" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + ".md");
		File.WriteAllText(reportPath, BuildMarkdownReport(folder, groups), new UTF8Encoding(true));
		return reportPath;
	}

	public string ExportCsvManifest(string folder, List<HypnosisCaseGroup> groups)
	{
		string csvPath = Path.Combine(folder, "互催案例整理清单_" + DateTime.Now.ToString("yyyyMMdd-HHmmss") + ".csv");
		StringBuilder sb = new StringBuilder();
		sb.AppendLine("case_key,recommended,kind,comments,modified,size_bytes,path,signals");
		foreach (HypnosisCaseGroup group in groups)
		{
			HypnosisCaseDocument recommended = group.RecommendedMaster;
			foreach (HypnosisCaseDocument doc in group.Documents.OrderByDescending(d => d.ConfidenceScore))
			{
				sb.Append(Csv(group.CaseKey)).Append(",");
				sb.Append(Csv(recommended != null && recommended.FullPath == doc.FullPath ? "yes" : "")).Append(",");
				sb.Append(Csv(ToDisplayKind(doc.Kind))).Append(",");
				sb.Append(doc.WordCommentCount.ToString(CultureInfo.InvariantCulture)).Append(",");
				sb.Append(Csv(doc.LastWriteTime.ToString("yyyy-MM-dd HH:mm"))).Append(",");
				sb.Append(doc.SizeBytes.ToString(CultureInfo.InvariantCulture)).Append(",");
				sb.Append(Csv(doc.FullPath)).Append(",");
				sb.Append(Csv(string.Join("；", doc.Signals)));
				sb.AppendLine();
			}
		}
		File.WriteAllText(csvPath, sb.ToString(), new UTF8Encoding(true));
		return csvPath;
	}

	public string BuildMarkdownReport(string folder, List<HypnosisCaseGroup> groups)
	{
		StringBuilder sb = new StringBuilder();
		sb.AppendLine("# 互催案例整理报告");
		sb.AppendLine();
		sb.AppendLine("状态：只扫描和建议，不删除、不移动、不改写原始文档。");
		sb.AppendLine();
		sb.AppendLine("- 扫描目录：" + folder);
		sb.AppendLine("- 案例组数：" + groups.Count);
		sb.AppendLine("- 文档总数：" + groups.Sum(g => g.Documents.Count));
		sb.AppendLine("- 已有人工作业痕迹：" + groups.Count(g => g.HasReviewed));
		sb.AppendLine("- 仍需人工复核：" + groups.Count(g => g.NeedsReview));
		sb.AppendLine();
		sb.AppendLine("## 案例组");
		sb.AppendLine();

		foreach (HypnosisCaseGroup group in groups)
		{
			HypnosisCaseDocument recommended = group.RecommendedMaster;
			sb.AppendLine("### " + group.CaseKey);
			sb.AppendLine();
			if (recommended != null)
			{
				sb.AppendLine("- 建议主版本：" + recommended.FileName);
				sb.AppendLine("- 主版本类型：" + ToDisplayKind(recommended.Kind));
				sb.AppendLine("- 批注数：" + recommended.WordCommentCount);
			}
			sb.AppendLine("- 链路：" + BuildPipelineSummary(group));
			if (group.NeedsReview)
			{
				sb.AppendLine("- 待处理：建议人工确认主版本后再归档/合并。");
			}
			sb.AppendLine();
			sb.AppendLine("| 类型 | 批注 | 修改时间 | 文件 |");
			sb.AppendLine("| --- | ---: | --- | --- |");
			foreach (HypnosisCaseDocument doc in group.Documents.OrderByDescending(d => d.ConfidenceScore).ThenByDescending(d => d.LastWriteTime))
			{
				sb.Append("| ")
					.Append(ToDisplayKind(doc.Kind)).Append(" | ")
					.Append(doc.WordCommentCount).Append(" | ")
					.Append(doc.LastWriteTime.ToString("yyyy-MM-dd HH:mm")).Append(" | ")
					.Append(doc.FullPath.Replace("|", "\\|"))
					.AppendLine(" |");
			}
			sb.AppendLine();
		}

		return sb.ToString();
	}

	private HypnosisCaseDocument InspectDocument(string path)
	{
		FileInfo info = new FileInfo(path);
		HypnosisCaseDocument doc = new HypnosisCaseDocument
		{
			FullPath = info.FullName,
			FileName = info.Name,
			SizeBytes = info.Length,
			LastWriteTime = info.LastWriteTime,
			BaseKey = NormalizeCaseKey(info)
		};

		ReadDocxMetadata(doc);
		doc.Kind = Classify(doc);
		doc.ConfidenceScore = Score(doc);
		return doc;
	}

	private void ReadDocxMetadata(HypnosisCaseDocument doc)
	{
		try
		{
			using (ZipArchive archive = ZipFile.OpenRead(doc.FullPath))
			{
				ZipArchiveEntry comments = archive.GetEntry("word/comments.xml");
				if (comments != null)
				{
					doc.HasWordComments = true;
					using (Stream stream = comments.Open())
					{
						XDocument xml = XDocument.Load(stream);
						XNamespace w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
						doc.WordCommentCount = xml.Descendants(w + "comment").Count();
					}
					if (doc.WordCommentCount > 0)
					{
						doc.Signals.Add("Word批注");
					}
					else
					{
						doc.Signals.Add("批注部件为空");
					}
				}

				ZipArchiveEntry core = archive.GetEntry("docProps/core.xml");
				if (core != null)
				{
					using (Stream stream = core.Open())
					{
						XDocument xml = XDocument.Load(stream);
						XNamespace dc = "http://purl.org/dc/elements/1.1/";
						XNamespace cp = "http://schemas.openxmlformats.org/package/2006/metadata/core-properties";
						XNamespace dcterms = "http://purl.org/dc/terms/";
						doc.Creator = xml.Descendants(dc + "creator").FirstOrDefault()?.Value;
						doc.LastModifiedBy = xml.Descendants(cp + "lastModifiedBy").FirstOrDefault()?.Value;
						doc.DocumentCreated = ParseDate(xml.Descendants(dcterms + "created").FirstOrDefault()?.Value);
						doc.DocumentModified = ParseDate(xml.Descendants(dcterms + "modified").FirstOrDefault()?.Value);
						if (!string.IsNullOrWhiteSpace(doc.LastModifiedBy))
						{
							doc.Signals.Add("最后编辑：" + doc.LastModifiedBy);
						}
					}
				}
			}
		}
		catch (Exception ex)
		{
			doc.Signals.Add("无法读取docx元数据：" + ex.Message);
		}
	}

	private HypnosisCaseDocumentKind Classify(HypnosisCaseDocument doc)
	{
		string name = doc.FileName;
		string path = doc.FullPath;

		if (name.Contains("清洗排版版"))
		{
			doc.Signals.Add("清洗排版");
			return HypnosisCaseDocumentKind.CleanedReview;
		}
		if (path.Contains("AI摘要") ||
			ContainsAny(name, "整理与下一轮", "下一轮衔接", "摘要", "memory", "Chat Log Summary", "Hypnosis Notes"))
		{
			doc.Signals.Add("AI/二次整理命名");
			return HypnosisCaseDocumentKind.AiSummary;
		}
		if (ContainsAny(name, "edit", "已校对", "校对复盘", "修订", "修改"))
		{
			doc.Signals.Add("人工编辑命名");
			return HypnosisCaseDocumentKind.ManualEdited;
		}
		if (ContainsAny(name, "实时转写_", "Transcription", "待人工校对"))
		{
			doc.Signals.Add("原始转写命名");
			return HypnosisCaseDocumentKind.RawTranscript;
		}
		if (ContainsAny(name, ConvertedMarkers))
		{
			doc.Signals.Add("文案助手转换");
			return doc.HasWordComments ? HypnosisCaseDocumentKind.ReviewedConverted : HypnosisCaseDocumentKind.Converted;
		}
		if (LooksLikeHypnosisRecordName(name))
		{
			doc.Signals.Add("人工命名互催记录");
			return HypnosisCaseDocumentKind.ManualRecord;
		}
		return HypnosisCaseDocumentKind.Other;
	}

	private int Score(HypnosisCaseDocument doc)
	{
		int score = 0;
		switch (doc.Kind)
		{
			case HypnosisCaseDocumentKind.CleanedReview:
				score += 90;
				break;
			case HypnosisCaseDocumentKind.ReviewedConverted:
				score += 80;
				break;
			case HypnosisCaseDocumentKind.ManualEdited:
				score += 75;
				break;
			case HypnosisCaseDocumentKind.AiSummary:
				score += 55;
				break;
			case HypnosisCaseDocumentKind.Converted:
				score += 45;
				break;
			case HypnosisCaseDocumentKind.RawTranscript:
				score += 20;
				break;
			case HypnosisCaseDocumentKind.ManualRecord:
				score += 30;
				break;
			default:
				score += 30;
				break;
		}
		score += Math.Min(doc.WordCommentCount, 50);
		if (!string.IsNullOrWhiteSpace(doc.LastModifiedBy))
		{
			score += 5;
		}
		return score;
	}

	private static string NormalizeCaseKey(FileInfo info)
	{
		string name = Path.GetFileNameWithoutExtension(info.Name);
		foreach (string marker in ConvertedMarkers)
		{
			name = name.Replace(marker, "");
		}
		name = name.Replace("_清洗排版版", "");
		name = Regex.Replace(name, @"\s*\((\d+)\)$", "");
		name = Regex.Replace(name, @"\s+(edit|edited)$", "", RegexOptions.IgnoreCase);
		name = Regex.Replace(name, @"\s*(已校对复盘|待人工校对)$", "");
		name = Regex.Replace(name, @"\s+2\.0$", "");
		name = Regex.Replace(name, @"\s+", " ").Trim();
		return name;
	}

	private static bool ContainsAny(string value, params string[] parts)
	{
		return parts.Any(p => value.IndexOf(p, StringComparison.OrdinalIgnoreCase) >= 0);
	}

	private static bool LooksLikeHypnosisRecordName(string name)
	{
		if (ContainsAny(name, "主催", "被催", "催will", "催Will", "will催", "Will催", "互催"))
		{
			return true;
		}
		return Regex.IsMatch(name, @"\d{4}年\d{1,2}月\d{1,2}日|\d{8}");
	}

	private static DateTime? ParseDate(string value)
	{
		if (DateTime.TryParse(value, out DateTime parsed))
		{
			return parsed;
		}
		return null;
	}

	private static string ToDisplayKind(HypnosisCaseDocumentKind kind)
	{
		switch (kind)
		{
			case HypnosisCaseDocumentKind.RawTranscript:
				return "原始转写";
			case HypnosisCaseDocumentKind.ManualRecord:
				return "人工命名记录";
			case HypnosisCaseDocumentKind.Converted:
				return "机器转换";
			case HypnosisCaseDocumentKind.ReviewedConverted:
				return "人工批注转换版";
			case HypnosisCaseDocumentKind.CleanedReview:
				return "清洗排版版";
			case HypnosisCaseDocumentKind.AiSummary:
				return "AI/二次摘要";
			case HypnosisCaseDocumentKind.ManualEdited:
				return "人工编辑版";
			default:
				return "其他资料";
		}
	}

	private static string BuildPipelineSummary(HypnosisCaseGroup group)
	{
		List<string> parts = new List<string>();
		if (group.HasRaw) parts.Add("原始/人工记录");
		if (group.Documents.Any(d => d.Kind == HypnosisCaseDocumentKind.Converted)) parts.Add("机器转换");
		if (group.Documents.Any(d => d.Kind == HypnosisCaseDocumentKind.ReviewedConverted || d.Kind == HypnosisCaseDocumentKind.ManualEdited)) parts.Add("人工批注/校对");
		if (group.Documents.Any(d => d.Kind == HypnosisCaseDocumentKind.CleanedReview)) parts.Add("清洗排版");
		if (group.HasSummary) parts.Add("摘要/衔接");
		return parts.Count == 0 ? "未识别" : string.Join(" -> ", parts);
	}

	private static string Csv(string value)
	{
		value = value ?? string.Empty;
		return "\"" + value.Replace("\"", "\"\"") + "\"";
	}
}
