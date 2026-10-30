using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Serilog;
using Serilog.Events;
using WakeupHelper.Model.System;
using WakeupHelper.libs;

namespace WakeupHelper;

internal static class Program
{
	public static string RootPath = Application.StartupPath;

	public static string ConfigPath = RootPath + "\\config\\";

	public static string SettingPath = RootPath + "\\config\\setting\\";

	public static string TemplatePath = RootPath + "\\config\\template\\";

	public static string IncorrectPath = RootPath + "\\config\\incorrect\\";

	public static Settings setting = new Settings();

	public static ILogger logger = null;

	[DllImport("user32.dll")]
	public static extern int SetForegroundWindow(IntPtr hwnd);

	[STAThread]
	private static void Main(string[] args)
	{
		logger = new LoggerConfiguration().MinimumLevel.Debug().Enrich.FromLogContext().WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}").CreateLogger();
		Assembly.GetExecutingAssembly().GetName().Version.ToString();
		logger.Information("OS Version: " + Environment.OSVersion.ToString());
		logger.Information(".Net Framework Version: " + Environment.Version.ToString());
		try
		{
			InitializeSettings();
			if (args != null && args.Length > 0)
			{
				Environment.ExitCode = BatchV33Runner.Run(args);
				return;
			}
		}
		catch (Exception ex)
		{
			logger.Error(ex, "命令行批处理失败");
			Environment.ExitCode = 1;
			return;
		}
		Process currentProcess = Process.GetCurrentProcess();
		Process[] processes = Process.GetProcesses();
		foreach (Process process in processes)
		{
			if (process.Id != currentProcess.Id && process.ProcessName == currentProcess.ProcessName)
			{
				SetForegroundWindow(process.MainWindowHandle);
				return;
			}
		}
		try
		{
			Application.EnableVisualStyles();
			Application.SetCompatibleTextRenderingDefault(defaultValue: false);
			Application.Run(new FormMain());
		}
		catch (Exception ex)
		{
			logger.Error(ex.Message);
			logger.Error(ex.StackTrace);
			if (ex.InnerException != null)
			{
				logger.Error(ex.InnerException.Message);
			}
			throw;
		}
	}

	private static void InitializeSettings()
	{
		Utils.CreateFolder(RootPath, "config");
		Utils.CreateFolder(ConfigPath, "setting");
		Utils.CreateFolder(ConfigPath, "template");
		Utils.CreateFolder(ConfigPath, "incorrect");
		setting.IdentificationStrategyList = Utils.LoadSettingsIdentificationStrategy();
		setting.DocumentTemplateList = Utils.LoadDocmentTemplatePolicy();
		setting.ErrorCorrectionList = Utils.LoadErrorCorrectionPolicy();
	}
}
