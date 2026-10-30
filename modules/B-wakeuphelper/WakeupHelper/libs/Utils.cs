using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using Serilog;
using WakeupHelper.Model;
using WakeupHelper.Model.System;

namespace WakeupHelper.libs;

/// <summary>
/// v3.1 修复:
///   - Bug #9:  CreateFolder 改为幂等 (Directory.Exists check)
///   - Bug #18: FindAllKeywordIndexOf start 偏移 1 算法重写
///   - Bug #41: GetMatchKeyword 只 catch KeyNotFoundException
///   - Bug #10: LoadDocmentTemplatePolicy 用 strategy 缓存避免重复 IO + 防止 PolicyId 当 filePath
///   - 加 try/catch + Serilog 异常日志, 单个文件坏不致命
/// </summary>
public static class Utils {

    public static List<IdentificationStrategy> LoadSettingsIdentificationStrategy() {
        var list = new List<IdentificationStrategy>();
        try {
            var dir = new DirectoryInfo(Program.SettingPath);
            if (!dir.Exists) return list;
            foreach (var file in dir.GetFiles("*.json")) {
                try {
                    list.Add(IdentificationStrategy.DeserializeJson(file.FullName));
                } catch (Exception ex) {
                    Program.logger.Warning(ex, "识别策略 JSON 损坏, 跳过: {File}", file.Name);
                }
            }
        } catch (Exception ex) {
            Program.logger.Error(ex, "LoadSettingsIdentificationStrategy 失败");
        }
        return list;
    }

    public static List<DocumentTemplate> LoadDocmentTemplatePolicy() {
        var list = new List<DocumentTemplate>();
        try {
            var dir = new DirectoryInfo(Program.TemplatePath);
            if (!dir.Exists) return list;
            // 先把所有 IdentificationStrategy 缓存到字典, 避免重复 IO
            var strategyMap = new Dictionary<string, IdentificationStrategy>(StringComparer.OrdinalIgnoreCase);
            foreach (var s in LoadSettingsIdentificationStrategy()) {
                if (!string.IsNullOrEmpty(s.Id)) strategyMap[s.Id] = s;
            }

            foreach (var file in dir.GetFiles("*.json")) {
                try {
                    var tpl = DocumentTemplate.DeserializeJson(file.FullName);
                    if (tpl != null && !string.IsNullOrEmpty(tpl.PolicyId)
                        && strategyMap.TryGetValue(tpl.PolicyId, out var strategy)) {
                        tpl.IdentificationStrategyInfo = strategy;
                    }
                    list.Add(tpl);
                } catch (Exception ex) {
                    Program.logger.Warning(ex, "文案模板 JSON 损坏, 跳过: {File}", file.Name);
                }
            }
        } catch (Exception ex) {
            Program.logger.Error(ex, "LoadDocmentTemplatePolicy 失败");
        }
        return list;
    }

    public static List<ErrorCorrection> LoadErrorCorrectionPolicy() {
        var list = new List<ErrorCorrection>();
        try {
            var dir = new DirectoryInfo(Program.IncorrectPath);
            if (!dir.Exists) return list;
            foreach (var file in dir.GetFiles("*.json")) {
                try {
                    list.Add(ErrorCorrection.DeserializeJson(file.FullName));
                } catch (Exception ex) {
                    Program.logger.Warning(ex, "纠错词库 JSON 损坏, 跳过: {File}", file.Name);
                }
            }
        } catch (Exception ex) {
            Program.logger.Error(ex, "LoadErrorCorrectionPolicy 失败");
        }
        return list;
    }

    /// <summary>
    /// Bug #9 修复: 幂等创建. v2.3 原始写法是 foreach 检查 File.Exists(子目录名) — 逻辑反.
    /// </summary>
    public static bool CreateFolder(string parentPath, string name) {
        if (string.IsNullOrEmpty(parentPath) || string.IsNullOrEmpty(name)) return false;
        try {
            var fullPath = Path.Combine(parentPath, name);
            if (Directory.Exists(fullPath)) return true;
            Directory.CreateDirectory(fullPath);
            return true;
        } catch (Exception ex) {
            Program.logger.Error(ex, "CreateFolder 失败: {Parent}/{Name}", parentPath, name);
            return false;
        }
    }

    public static bool DeleteFile(string filePath) {
        try {
            if (File.Exists(filePath)) {
                File.Delete(filePath);
                return true;
            }
            return false;
        } catch (Exception ex) {
            Program.logger.Error(ex, "DeleteFile 失败: {Path}", filePath);
            return false;
        }
    }

    /// <summary>
    /// Bug #41 修复: 只 catch ArgumentException (命名组不存在), 其他异常往外传
    /// </summary>
    public static string GetMatchKeyword(string keyword, Match match) {
        try {
            return match.Groups[keyword].Value;
        } catch (ArgumentException) {
            return null;
        }
    }

    /// <summary>
    /// Bug #18 修复: start 偏移算法重写. v2.0/v2.3 都是 count=1 起, 导致首次 start=1 偏移 1.
    /// </summary>
    public static List<int> FindAllKeywordIndexOf(string keyword, string searchString) {
        var positions = new List<int>();
        if (string.IsNullOrEmpty(keyword) || string.IsNullOrEmpty(searchString)) {
            return positions;
        }

        int index = searchString.IndexOf(keyword, StringComparison.Ordinal);
        while (index >= 0) {
            positions.Add(index);
            int nextStart = index + keyword.Length;
            if (nextStart >= searchString.Length) break;
            index = searchString.IndexOf(keyword, nextStart, StringComparison.Ordinal);
        }
        return positions;
    }

    public static bool FeishuMiaoji(string content) {
        return new Regex("([\\r\\n]+?文字记录:*?[\\r\\n]+?说话人 \\d) ").Match(content).Success;
    }
}