using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Serilog;

namespace WakeupHelper.Model.System;

/// <summary>
/// v3.1 修复:
///   - Bug #12: DeserializeJson 双重路径逻辑删除, 接收完整路径. 找不到抛 FileNotFoundException 让调用方跳过
///   - Bug #15: SerializeJson 强制要求绝对路径, 父目录不存在自动创建
/// </summary>
public class IdentificationStrategy
{
    public string Name { get; set; }
    public string Id { get; set; }
    public string Regex { get; set; }
    public string BeforeRegex { get; set; }
    public string AfterRegex { get; set; }
    public string Description { get; set; }
    public UserType TypeLevel { get; set; }
    public string SourceName { get; set; }

    [JsonIgnore]
    public DateTime LastWriteTime { get; set; }

    public static string SerializeJson(IdentificationStrategy strategy, string filePath) {
        if (strategy == null) throw new ArgumentNullException(nameof(strategy));
        if (string.IsNullOrEmpty(filePath)) throw new ArgumentException("filePath 不能为空", nameof(filePath));

        // Bug #15 修复: 必须传绝对路径
        if (!Path.IsPathRooted(filePath)) {
            throw new ArgumentException(
                $"SerializeJson 必须传完整绝对路径, 当前传的是: {filePath}. " +
                "使用 Program.SettingPath + strategy.Id + \".json\" 拼路径",
                nameof(filePath));
        }

        var dir = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) {
            Directory.CreateDirectory(dir);
        }

        var json = JsonSerializer.Serialize(strategy, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(filePath, json, new UTF8Encoding(false));
        return filePath;
    }

    public static IdentificationStrategy DeserializeJson(string filePath) {
        if (string.IsNullOrEmpty(filePath)) {
            throw new ArgumentException("filePath 不能为空", nameof(filePath));
        }
        // Bug #12 修复: 单一路径逻辑, 找不到直接抛
        if (!File.Exists(filePath)) {
            throw new FileNotFoundException($"识别策略 JSON 不存在: {filePath}", filePath);
        }

        var json = File.ReadAllText(filePath, Encoding.UTF8);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var strategy = JsonSerializer.Deserialize<IdentificationStrategy>(json, options);
        if (strategy == null) {
            throw new InvalidDataException($"识别策略 JSON 解析失败: {filePath}");
        }
        strategy.LastWriteTime = new FileInfo(filePath).LastWriteTime;
        return strategy;
    }
}