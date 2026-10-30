using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace WakeupHelper.Model;

public class ErrorCorrection
{
	public string Id { get; set; }

	public string Name { get; set; }

	public int RightWordCount { get; set; }

	public int ErrorWordCount { get; set; }

	public bool IsEnableChineseWordSegmentation { get; set; }

	public Dictionary<string, ErrorCorrectionWord> ErrorWordDictionary { get; set; }

	[JsonIgnore]
	public DateTime LastWriteTime { get; set; }

	public static string SerializeJson(ErrorCorrection document, string filePath)
	{
		JsonSerializerSettings settings = new JsonSerializerSettings
		{
			ContractResolver = new DefaultContractResolver
			{
				IgnoreSerializableAttribute = true
			}
		};
		string contents = JsonConvert.SerializeObject(document, settings);
		File.WriteAllText(filePath, contents, Encoding.UTF8);
		return filePath;
	}

	public static ErrorCorrection DeserializeJson(string filePath)
	{
		string resolvedPath = File.Exists(filePath) ? filePath : Program.IncorrectPath + filePath + ".json";
		string text = File.ReadAllText(resolvedPath, Encoding.UTF8);
		FileInfo fileInfo = new FileInfo(resolvedPath);
		if (!string.IsNullOrEmpty(text))
		{
			ErrorCorrection errorCorrection = JsonConvert.DeserializeObject<ErrorCorrection>(text);
			if (errorCorrection == null)
			{
				return null;
			}
			errorCorrection.LastWriteTime = fileInfo.LastWriteTime;
			return errorCorrection;
		}
		return null;
	}
}
