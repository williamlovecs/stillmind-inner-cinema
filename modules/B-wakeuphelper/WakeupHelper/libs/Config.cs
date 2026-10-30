using System;
using System.Globalization;
using Microsoft.Win32;
using Serilog;

namespace WakeupHelper.libs;

/// <summary>
/// v3.1 修复: 17 个月启动 NullRef 的元凶. 任何字段缺失或类型错误都用 SafeGet 兜底.
/// </summary>
internal class Config
{
    private static readonly string RegeditFileName = "WakeupHelper";

    public string DocumentTemplateId { get; set; }
    public string ErrorCorrectionId { get; set; }
    public string LastOpenedPath { get; set; }
    public bool IsDocumentErrorCorrectionCommentDebug { get; set; }
    public bool IsFinishOpenDir { get; set; } = true;  // v3.1 默认值: 默认勾选打开目录
    public bool IsShowWordWindows { get; set; } = true;
    public bool IsGenerateConsciousnessAppendix { get; set; } = false;

    public bool GetRegistryConfig() {
        ILogger logger = Program.logger;
        try {
            using (RegistryKey softwareKey = Registry.CurrentUser.OpenSubKey("SOFTWARE", writable: false))
            using (RegistryKey conf = softwareKey?.OpenSubKey(RegeditFileName)) {
                if (conf == null) {
                    // 首次启动 / 注册表不存在, 用属性默认值, 不报错
                    return false;
                }

                DocumentTemplateId                       = SafeGetString(conf, "DocumentTemplateId", string.Empty);
                ErrorCorrectionId                        = SafeGetString(conf, "ErrorCorrectionId", string.Empty);
                IsDocumentErrorCorrectionCommentDebug    = SafeGetBool(conf, "IsDocumentErrorCorrectionCommentDebug", false);
                IsFinishOpenDir                         = SafeGetBool(conf, "IsFinishOpenDir", true);
                IsShowWordWindows                        = SafeGetBool(conf, "IsShowWordWindows", true);
                IsGenerateConsciousnessAppendix          = SafeGetBool(conf, "IsGenerateConsciousnessAppendix", false);
                LastOpenedPath                           = SafeGetString(conf, "LastOpenedPath", string.Empty);
                return true;
            }
        } catch (Exception ex) {
            logger.Warning(ex, "Config.GetRegistryConfig 失败, 使用默认值");
            return false;
        }
    }

    public bool SetRegistryConfig() {
        ILogger logger = Program.logger;
        try {
            using (RegistryKey softwareKey = Registry.CurrentUser.OpenSubKey("SOFTWARE", writable: true)
                                      ?? Registry.CurrentUser.CreateSubKey("SOFTWARE", writable: true))
            using (RegistryKey conf = softwareKey.CreateSubKey(RegeditFileName, writable: true)) {
                if (conf == null) return false;

                conf.SetValue("DocumentTemplateId", DocumentTemplateId ?? string.Empty);
                conf.SetValue("ErrorCorrectionId", ErrorCorrectionId ?? string.Empty);
                conf.SetValue("IsDocumentErrorCorrectionCommentDebug", IsDocumentErrorCorrectionCommentDebug);
                conf.SetValue("IsFinishOpenDir", IsFinishOpenDir);
                conf.SetValue("IsShowWordWindows", IsShowWordWindows);
                conf.SetValue("IsGenerateConsciousnessAppendix", IsGenerateConsciousnessAppendix);
                conf.SetValue("LastOpenedPath", LastOpenedPath ?? string.Empty);
            }
            return true;
        } catch (Exception ex) {
            logger.Warning(ex, "Config.SetRegistryConfig 失败");
            return false;
        }
    }

    private static string SafeGetString(RegistryKey key, string name, string fallback) {
        try {
            var v = key.GetValue(name);
            return v == null ? fallback : v.ToString();
        } catch { return fallback; }
    }

    private static bool SafeGetBool(RegistryKey key, string name, bool fallback) {
        try {
            var v = key.GetValue(name);
            if (v == null) return fallback;
            return bool.Parse(v.ToString());
        } catch { return fallback; }
    }
}
