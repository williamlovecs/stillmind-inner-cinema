using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using WakeupHelper.Model.System;

namespace WakeupHelper.Model;

public class DocumentTemplate
{
	public string Id { get; set; }

	public string Name { get; set; }

	public string PolicyId { get; set; }

	public string PolicyName { get; set; }

	public string Description { get; set; }

	public string FontName { get; set; }

	public int FontSize { get; set; }

	public bool IsGenerateOverview { get; set; }

	public bool IsRemoveDatetime { get; set; }

	public string RemoveDatetimeRegex { get; set; }

	public bool IsConvertDatetimeToTimer { get; set; }

	public bool IsNickNewLine { get; set; }

	public bool IsNickFontBold { get; set; }

	public bool IsBodyFontBold { get; set; }

	public bool IsEnablePrivacyProtection { get; set; }

	public bool IsShowPageNumber { get; set; }

	public bool IsPageNarrowMargin { get; set; }

	public UserType TypeLevel { get; set; }

	public List<string> FirstMorePeopleList { get; set; }

	public List<string> SecondMorePeopleList { get; set; }

	public bool IsShowEditWindows { get; set; }

	public bool IsParagraphErrorCorrection { get; set; }

	public bool IsDocumentErrorCorrection { get; set; }

	public People FirstPeople { get; set; }

	public People SecondPeople { get; set; }

	[JsonIgnore]
	public DateTime LastWriteTime { get; set; }

	[JsonIgnore]
	public ErrorCorrection ErrorsCorrectionInfo { get; set; }

	[JsonIgnore]
	public IdentificationStrategy IdentificationStrategyInfo { get; set; }

	[JsonIgnore]
	public AiPlugin AiPluginInfo { get; set; }

	public static string SerializeJson(DocumentTemplate document, string filePath)
	{
		string contents = JsonSerializer.Serialize(document);
		File.WriteAllText(filePath, contents, Encoding.UTF8);
		return filePath;
	}

	public static DocumentTemplate DeserializeJson(string filePath)
	{
		string text = null;
		FileInfo fileInfo = new FileInfo(filePath);
		text = ((!fileInfo.Exists) ? File.ReadAllText(Program.TemplatePath + filePath + ".json", Encoding.UTF8) : File.ReadAllText(filePath, Encoding.UTF8));
		DocumentTemplate documentTemplate = JsonSerializer.Deserialize<DocumentTemplate>(text);
		if (documentTemplate == null)
		{
			return null;
		}
		documentTemplate.LastWriteTime = fileInfo.LastWriteTime;
		return documentTemplate;
	}
}
