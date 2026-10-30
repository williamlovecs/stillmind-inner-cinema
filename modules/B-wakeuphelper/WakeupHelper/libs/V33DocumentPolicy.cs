using System;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace WakeupHelper.libs;

public static class V33DocumentPolicy
{
	private static readonly Regex VersionPrefix = new Regex(@"^v3\.3\s*", RegexOptions.IgnoreCase);
	private static readonly Regex ExactChineseDatePrefix = new Regex(@"^(?<year>20\d{2})年(?<month>\d{1,2})月(?<day>\d{1,2})日\s*");
	private static readonly Regex ExactShortDatePrefix = new Regex(@"^(?<month>\d{1,2})[-/](?<day>\d{1,2})[-/](?<year>\d{2}|20\d{2})\s*");
	private static readonly Regex UncertainDatePrefix = new Regex(@"^(?:(?:20\d{2})年)?(?:日期待确认|未知日期|日期不详)\s*");

	public static bool IsProcessedV33(string path)
	{
		if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
		{
			return false;
		}
		using (ZipArchive zip = ZipFile.OpenRead(path))
		{
			ZipArchiveEntry entry = zip.GetEntry("word/document.xml");
			if (entry == null)
			{
				return false;
			}
			using (Stream stream = entry.Open())
			{
				XNamespace w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
				string text = string.Concat(XDocument.Load(stream).Descendants(w + "t").Select(node => node.Value));
				return IsProcessedV33Text(text);
			}
		}
	}

	public static bool IsProcessedV33Text(string text)
	{
		string value = text ?? string.Empty;
		return value.Contains("互催主题：") &&
			value.Contains("互催日期：") &&
			value.Contains("互催时长：") &&
			value.Contains("主催名称：") &&
			value.Contains("被催名称：");
	}

	public static string NormalizeOutputFileName(string requestedName, string dateEvidence)
	{
		if (string.IsNullOrWhiteSpace(requestedName))
		{
			throw new InvalidOperationException("标准文件名不能为空。");
		}

		string extension = Path.GetExtension(requestedName);
		if (!string.Equals(extension, ".docx", StringComparison.OrdinalIgnoreCase))
		{
			throw new InvalidOperationException("标准文件名必须以 .docx 结尾: " + requestedName);
		}

		string stem = Path.GetFileNameWithoutExtension(requestedName).Trim();
		stem = VersionPrefix.Replace(stem, string.Empty);
		DateTime? nameDate = ExtractLeadingDate(ref stem);
		DateTime? exactDate = TryParseExactDate(dateEvidence) ?? nameDate;
		stem = UncertainDatePrefix.Replace(stem, string.Empty).Trim();
		stem = Regex.Replace(stem, @"\s+", " ");
		stem = ReplaceInvalidFileNameCharacters(stem).Trim(' ', '.');
		if (stem.Length == 0)
		{
			throw new InvalidOperationException("标准文件名去除版本与不确定日期后为空: " + requestedName);
		}

		string prefix = exactDate.HasValue
			? exactDate.Value.ToString("M-d-yy", CultureInfo.InvariantCulture) + " "
			: string.Empty;
		return prefix + stem + ".docx";
	}

	public static string BuildSingleFileOutputPath(string inputPath, bool commentMode)
	{
		string directory = Path.GetDirectoryName(inputPath) ?? string.Empty;
		string normalized = NormalizeOutputFileName(Path.GetFileName(inputPath), null);
		string stem = Path.GetFileNameWithoutExtension(normalized);
		string suffix = commentMode ? "_互催整理_评论模式" : "_互催整理";
		return Path.Combine(directory, stem + suffix + ".docx");
	}

	private static DateTime? ExtractLeadingDate(ref string stem)
	{
		Match chinese = ExactChineseDatePrefix.Match(stem);
		if (chinese.Success && TryBuildDate(chinese, out DateTime parsedChinese))
		{
			stem = stem.Substring(chinese.Length).Trim();
			return parsedChinese;
		}

		Match shortDate = ExactShortDatePrefix.Match(stem);
		if (shortDate.Success && TryBuildDate(shortDate, out DateTime parsedShort))
		{
			stem = stem.Substring(shortDate.Length).Trim();
			return parsedShort;
		}
		return null;
	}

	private static DateTime? TryParseExactDate(string value)
	{
		if (string.IsNullOrWhiteSpace(value) || Regex.IsMatch(value, "待确认|未知|不详"))
		{
			return null;
		}
		string[] formats =
		{
			"yyyy年M月d日", "yyyy年MM月dd日", "yyyy-M-d", "yyyy-MM-dd",
			"M/d/yyyy", "M/d/yy", "M-d-yyyy", "M-d-yy"
		};
		if (DateTime.TryParseExact(value.Trim(), formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsed))
		{
			return parsed;
		}
		return null;
	}

	private static bool TryBuildDate(Match match, out DateTime value)
	{
		value = default;
		if (!int.TryParse(match.Groups["year"].Value, out int year) ||
			!int.TryParse(match.Groups["month"].Value, out int month) ||
			!int.TryParse(match.Groups["day"].Value, out int day))
		{
			return false;
		}
		if (year < 100)
		{
			year += 2000;
		}
		try
		{
			value = new DateTime(year, month, day);
			return true;
		}
		catch (ArgumentOutOfRangeException)
		{
			return false;
		}
	}

	private static string ReplaceInvalidFileNameCharacters(string value)
	{
		StringBuilder result = new StringBuilder(value.Length);
		char[] invalid = Path.GetInvalidFileNameChars();
		foreach (char character in value)
		{
			result.Append(invalid.Contains(character) ? '-' : character);
		}
		return result.ToString();
	}
}
