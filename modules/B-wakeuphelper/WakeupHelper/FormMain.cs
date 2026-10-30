using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;
using WordApp = Microsoft.Office.Interop.Word;
using WakeupHelper.Model;
using WakeupHelper.View;
using WakeupHelper.View.Tool.template;
using WakeupHelper.libs;

namespace WakeupHelper;

public class FormMain : Form
{
	public delegate void ChangeDelegate(string message);

	public DocumentTemplate documentTemplate;

	public ErrorCorrection errorCorrection;

	public string newFileName;

	private FileInfo originTargetFileInfo;

	// private Document doc;  // unused, removed for CheckBox ambiguity

	private Config config = new Config();

	private bool isFirstLoad = true;

	private IContainer components;

	private Label label5;

	private TextBox txtFilePath;

	private Button btnBrowser;

	private RichTextBox txtLogBox;

	private Button btnStart;

	private StatusStrip statusStrip1;

	private ToolStripStatusLabel toolStripStatusLabel1;

	private ToolStripStatusLabel toolStripStatusLabel2;

	private MenuStrip menuStrip1;

	private ToolStripMenuItem 文件ToolStripMenuItem;

	private ToolStripMenuItem 编辑ToolStripMenuItem;

	private ToolStripMenuItem ToolStripMenuItemWriterTemplate;

	private ToolStripMenuItem ToolStripMenuItemIncorrectWord;

	private ToolStripMenuItem ToolStripMenuItemRecentlyWord;

	private ToolStripMenuItem ToolStripMenuItemExit;

	private ToolStripMenuItem ToolStripMenuItemAIPlugin;

	private ToolStripMenuItem ToolStripMenuItemCaseOrganizer;

	private ToolStripMenuItem 帮助HToolStripMenuItem;

	private ToolStripMenuItem 查看帮助ToolStripMenuItem;

	private ToolStripMenuItem 反馈意见ToolStripMenuItem;

	private ToolStripSeparator toolStripMenuItem3;

	private ToolStripMenuItem 关于我们ToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripMenuItem toolStripMenuItemSysSeting;

	private ToolStripSeparator toolStripSeparator2;

	private ToolStripSeparator toolStripSeparator3;

	private ToolStripSeparator toolStripSeparator4;

	private Label label1;

	private ComboBox comboBoxDocumentTemplate;

	private Label label2;

	private ComboBox comboBoxErrorCorrection;

	private GroupBox groupBox1;

	private CheckBox IsDocumentErrorCorrectionCommentDebug;

	private CheckBox IsShowWordWindows;

	private NotifyIcon notifyIcon1;

	private ContextMenuStrip contextMenuStrip1;

	private ToolStripMenuItem 打开主菜单ToolStripMenuItem;

	private ToolStripSeparator toolStripSeparator5;

	private ToolStripMenuItem 退出ToolStripMenuItem;

	private ToolStripMenuItem 开源捐赠ToolStripMenuItem;

	private CheckBox IsFinishOpenDir;

	private CheckBox IsGenerateConsciousnessAppendix;

	public FormMain()
	{
		InitializeComponent();
		// v3.1 design: 应用 Swiss 主题 (avoid-ai-design 翻译)
		WakeupHelper.libs.Theme.ApplyTo(this);
		Control.CheckForIllegalCrossThreadCalls = false;
		comboBoxDocumentTemplate.DataSource = Program.setting.DocumentTemplateList;
		comboBoxErrorCorrection.DataSource = Program.setting.ErrorCorrectionList;
		config.GetRegistryConfig();
	}

	private void Form1_Load(object sender, EventArgs e)
	{
		LoadViewData();
	}

	private void FormMain_FormClosing(object sender, FormClosingEventArgs e)
	{
		config.SetRegistryConfig();
		switch (MessageBox.Show("是否最小化托盘到后台运行？\n选否，直接退出当前程序。", "操作提示", MessageBoxButtons.YesNo, MessageBoxIcon.Question))
		{
		case DialogResult.No:
			// v3.1 Bug B fix: 显式 Application.Exit, 不依赖 Dispose 后消息循环自然结束
			Application.Exit();
			break;
		case DialogResult.Yes:
			e.Cancel = true;
			base.Visible = false;
			notifyIcon1.ShowBalloonTip(3000, "提示", "互催文案助手，托盘运行中……", ToolTipIcon.Info);
			base.WindowState = FormWindowState.Minimized;
			break;
		}
	}

	public void LoadViewData()
	{
		config.GetRegistryConfig();
		if (config.DocumentTemplateId != null)
		{
			comboBoxDocumentTemplate.SelectedValue = config.DocumentTemplateId;
		}
		if (comboBoxDocumentTemplate.SelectedItem == null && comboBoxDocumentTemplate.Items.Count > 0)
		{
			comboBoxDocumentTemplate.SelectedIndex = 0;
		}
		if (config.ErrorCorrectionId != null)
		{
			comboBoxErrorCorrection.SelectedValue = config.ErrorCorrectionId;
		}
		if (comboBoxErrorCorrection.SelectedItem == null && comboBoxErrorCorrection.Items.Count > 0)
		{
			comboBoxErrorCorrection.SelectedIndex = 0;
		}
		IsDocumentErrorCorrectionCommentDebug.Checked = config.IsDocumentErrorCorrectionCommentDebug;
		IsFinishOpenDir.Checked = config.IsFinishOpenDir;
		IsShowWordWindows.Checked = config.IsShowWordWindows;
		IsGenerateConsciousnessAppendix.Checked = false;
		config.IsGenerateConsciousnessAppendix = false;
	}

	public void ChangeLogMessageTemplate()
	{
		if (documentTemplate != null)
		{
			string msg = "[" + DateTime.Now.ToString() + "] 转换模板：" + documentTemplate.Name + ", " + documentTemplate.FontName + ", " + documentTemplate.FontSize + "pt, " + documentTemplate.PolicyName + "。";
			WriteLogBox(msg);
		}
	}

	public void ChangeLogMessageCorrection()
	{
		if (errorCorrection != null && documentTemplate != null)
		{
			documentTemplate.ErrorsCorrectionInfo = errorCorrection;
			string msg = "[" + DateTime.Now.ToString() + "] 纠错方案：" + errorCorrection.Name + ", 纠错词数" + errorCorrection.RightWordCount + "个, 错词数" + errorCorrection.ErrorWordCount + "个。";
			WriteLogBox(msg);
		}
	}

	private void btnBrowser_Click(object sender, EventArgs e)
	{
		OpenFileDialog openFileDialog = new OpenFileDialog();
		string lastOpenedPath = config.LastOpenedPath;
		if (!string.IsNullOrEmpty(lastOpenedPath) && Directory.Exists(lastOpenedPath))
		{
			openFileDialog.InitialDirectory = lastOpenedPath;
		}
		else
		{
			openFileDialog.InitialDirectory = "c:\\";
		}
		openFileDialog.Filter = "word files (*.docx)|*.docx";
		openFileDialog.FilterIndex = 2;
		openFileDialog.RestoreDirectory = false;
		if (openFileDialog.ShowDialog() == DialogResult.OK)
		{
			originTargetFileInfo = new FileInfo(openFileDialog.FileName);
			txtFilePath.Text = openFileDialog.FileName;
			config.LastOpenedPath = Path.GetDirectoryName(openFileDialog.FileName);
		}
		LoadViewData();
	}

	private void btnStart_Click(object sender, EventArgs e)
	{
		bool startProccess = false;
		if (txtFilePath.Text == string.Empty || originTargetFileInfo == null)
		{
			MessageBox.Show("请选择要转换的文档！", "温馨提示", MessageBoxButtons.OK, MessageBoxIcon.Question);
			btnBrowser.Focus();
			return;
		}
		documentTemplate = comboBoxDocumentTemplate.SelectedItem as DocumentTemplate;
		errorCorrection = comboBoxErrorCorrection.SelectedItem as ErrorCorrection;

		// v3.1 fix: 空选模板时直接报错, 不再 NRE
		if (documentTemplate == null) {
			MessageBox.Show("请先选择文案模板！\n\n模板菜单 -> 文案模板管理 中添加模板。",
				"提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
			return;
		}
		if (documentTemplate.IdentificationStrategyInfo == null) {
			MessageBox.Show("模板关联的识别策略缺失，请到 系统设置 -> 识别策略 中修复。",
				"提示", MessageBoxButtons.OK, MessageBoxIcon.Warning);
			return;
		}
		try {
			if (V33DocumentPolicy.IsProcessedV33(originTargetFileInfo.FullName)) {
				MessageBox.Show(
					"该文档已经包含 v3.3 标准表头，已拒绝二次处理。\n\n请重新选择原始转写，避免重复表头和累积纠错。",
					"保护原文", MessageBoxButtons.OK, MessageBoxIcon.Warning);
				return;
			}
		} catch (Exception ex) {
			MessageBox.Show("无法检查输入文档: " + ex.Message, "错误",
				MessageBoxButtons.OK, MessageBoxIcon.Error);
			return;
		}

		Task.Factory.StartNew(delegate
		{
			btnStart.Enabled = false;
			btnStart.Text = "处理中";
			toolStripStatusLabel1.Text = "处理中...";
			newFileName = V33DocumentPolicy.BuildSingleFileOutputPath(
				originTargetFileInfo.FullName,
				IsDocumentErrorCorrectionCommentDebug.Checked);
			string stagingFile = Path.Combine(
				originTargetFileInfo.DirectoryName,
				".~wakeuphelper-" + Guid.NewGuid().ToString("N") + ".docx");
			string backupFile = "";
			File.Copy(originTargetFileInfo.FullName, stagingFile, overwrite: false);
			documentTemplate.ErrorsCorrectionInfo = errorCorrection;

			// v3.1 fix: try/finally 保证按钮状态在异常时也能恢复
			WordDocumentHelper wordDocumentHelper = null;
			try {
				wordDocumentHelper = new WordDocumentHelper(stagingFile)
				{
					documentTemplate = documentTemplate,
					errorCorrection = errorCorrection,
					IsDocumentErrorCorrectionCommentDebug = IsDocumentErrorCorrectionCommentDebug.Checked,
					IsShowWordWindows = IsShowWordWindows.Checked,
					IsGenerateConsciousnessAppendix = IsGenerateConsciousnessAppendix.Checked
				};
				if (wordDocumentHelper.FormatRecognitionStrategyConflict())
				{
					if (MessageBox.Show("文档格式和转换模板不匹配是否继续?", "警告", MessageBoxButtons.YesNo, MessageBoxIcon.Exclamation) == DialogResult.Yes)
					{
						startProccess = true;
					}
				}
				else
				{
					startProccess = true;
				}
				if (!startProccess)
				{
					wordDocumentHelper.Close();
				}
				else
				{
					if (documentTemplate.IdentificationStrategyInfo.SourceName == "腾讯会议")
					{
						wordDocumentHelper.StartTencentWordDocument();
					}
					else
					{
						wordDocumentHelper.StartFeishuMiaojiWordDocument();
					}
					wordDocumentHelper.Close();
					wordDocumentHelper = null;
					if (File.Exists(newFileName)) {
						string backupDir = Path.Combine(
							originTargetFileInfo.DirectoryName,
							"_WakeupHelper_Backup",
							DateTime.Now.ToString("yyyyMMdd-HHmmss"));
						Directory.CreateDirectory(backupDir);
						backupFile = Path.Combine(backupDir, Path.GetFileName(newFileName));
						File.Replace(stagingFile, newFileName, backupFile, ignoreMetadataErrors: true);
					} else {
						File.Move(stagingFile, newFileName);
					}
					WriteLogBox("[" + DateTime.Now.ToString() + "] 文件处理完成！路径：" + newFileName);
					if (!string.IsNullOrEmpty(backupFile)) {
						WriteLogBox("[" + DateTime.Now.ToString() + "] 已备份旧输出：" + backupFile);
					}
					toolStripStatusLabel1.Text = "已完成！";
				}
			} catch (Exception ex) {
				Program.logger.Error(ex, "btnStart 处理失败");
				MessageBox.Show($"处理失败: {ex.Message}", "错误",
					MessageBoxButtons.OK, MessageBoxIcon.Error);
				toolStripStatusLabel1.Text = "出错";
			} finally {
				btnStart.Enabled = true;
				btnStart.Text = "开始";
				if (wordDocumentHelper != null) {
					try { wordDocumentHelper.Close(); } catch { }
				}
				if (File.Exists(stagingFile)) {
					try { File.Delete(stagingFile); } catch { }
				}
			}
		}).ContinueWith(delegate
		{
			if (startProccess && IsFinishOpenDir.Checked && originTargetFileInfo != null)
			{
				string directoryName = originTargetFileInfo.DirectoryName;
				if (!string.IsNullOrEmpty(directoryName) && Directory.Exists(directoryName)) {
					Process.Start("explorer.exe", directoryName);
				}
			}
			else
			{
				toolStripStatusLabel1.Text = "就绪！";
			}
		});
	}

	private void 查看帮助ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		Process.Start("https://gitee.com/xmr-stak/wake-up-helper");
	}

	private void 关于我们ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		new HelpAbout().ShowDialog();
	}

	private void toolStripMenuItemSysSeting_Click(object sender, EventArgs e)
	{
		new FileSysSetting().ShowDialog();
	}

	private void 文案模板管理ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		new ToolWriterTemplateList().ShowDialog();
	}

	private void ToolStripMenuItemWriterTemplate_Click(object sender, EventArgs e)
	{
		ToolWriterTemplateList toolWriterTemplateList = new ToolWriterTemplateList();
		toolWriterTemplateList.ChangeConfig += delegate
		{
			comboBoxDocumentTemplate.DataSource = Program.setting.DocumentTemplateList;
			comboBoxDocumentTemplate.SelectedValue = config.DocumentTemplateId;
		};
		toolWriterTemplateList.ShowDialog();
	}

	private void ToolStripMenuItemIncorrectWord_Click(object sender, EventArgs e)
	{
		ToolIncorrectWordList toolIncorrectWordList = new ToolIncorrectWordList();
		toolIncorrectWordList.ChangeConfig += delegate
		{
			comboBoxErrorCorrection.DataSource = Program.setting.ErrorCorrectionList;
			comboBoxErrorCorrection.SelectedValue = config.ErrorCorrectionId;
		};
		toolIncorrectWordList.ShowDialog();
	}

	private void ToolStripMenuItemCaseOrganizer_Click(object sender, EventArgs e)
	{
		new HypnosisCaseOrganizerForm().ShowDialog(this);
	}

	private void WriteLogBox(string msg)
	{
		// v3.1 fix: \u53bb\u6389 "\ud83d\udc7d" emoji \u524d\u7f00, \u6539\u7528 [HH:mm:ss] \u65f6\u95f4\u6233
		string timestamp = DateTime.Now.ToString("HH:mm:ss");
		txtLogBox.AppendText($"[{timestamp}] {msg}{Environment.NewLine}");
		txtLogBox.ScrollToCaret();
	}

	private void 打开主菜单ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		base.Visible = true;
		base.WindowState = FormWindowState.Normal;
	}

	private void 退出ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		notifyIcon1.Dispose();
		Dispose();
		Environment.Exit(0);
	}

	private void notifyIcon1_MouseDoubleClick(object sender, MouseEventArgs e)
	{
		打开主菜单ToolStripMenuItem_Click(sender, e);
	}

	private void 开源捐赠ToolStripMenuItem_Click_1(object sender, EventArgs e)
	{
		Process.Start("https://gitee.com/xmr-stak/wake-up-helper#%E5%BC%80%E6%BA%90%E6%8D%90%E8%B5%A0");
	}

	private void IsDocumentErrorCorrectionCommentDebug_CheckedChanged(object sender, EventArgs e)
	{
		config.IsDocumentErrorCorrectionCommentDebug = IsDocumentErrorCorrectionCommentDebug.Checked;
	}

	private void IsFinishOpenDir_CheckedChanged(object sender, EventArgs e)
	{
		config.IsFinishOpenDir = IsFinishOpenDir.Checked;
	}

	private void IsShowWordWindows_CheckedChanged(object sender, EventArgs e)
	{
		config.IsShowWordWindows = IsShowWordWindows.Checked;
	}

	private void IsGenerateConsciousnessAppendix_CheckedChanged(object sender, EventArgs e)
	{
		config.IsGenerateConsciousnessAppendix = IsGenerateConsciousnessAppendix.Checked;
	}

	private void comboBoxErrorCorrection_SelectionChangeCommitted(object sender, EventArgs e)
	{
		errorCorrection = comboBoxErrorCorrection.SelectedItem as ErrorCorrection;
		// v3.1 fix: SelectedValue 可能是 null, 避免 NRE
		config.ErrorCorrectionId = comboBoxErrorCorrection.SelectedValue?.ToString();
		ChangeLogMessageCorrection();
	}

	private void comboBoxDocumentTemplate_SelectionChangeCommitted(object sender, EventArgs e)
	{
		documentTemplate = comboBoxDocumentTemplate.SelectedItem as DocumentTemplate;
		// v3.1 fix: SelectedValue 可能是 null, 避免 NRE
		config.DocumentTemplateId = comboBoxDocumentTemplate.SelectedValue?.ToString();
		ChangeLogMessageTemplate();
	}

	private void ToolStripMenuItemExit_Click(object sender, EventArgs e)
	{
		Dispose();
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	/// <summary>
	/// v3.1 fix: v2.3 反编译丢了 WakeupHelper.FormMain.resources. 从 embedded .ico 资源手动读.
	/// </summary>
	private static Icon LoadIconFromManifest() {
		var asm = System.Reflection.Assembly.GetExecutingAssembly();
		// embedded resource 名为 "WakeupHelper.ico" (项目根目录的 .ico 文件)
		using (var stream = asm.GetManifestResourceStream("WakeupHelper.ico")) {
			if (stream == null) {
				// 兜底: 用系统默认图标, 不让启动崩
				return SystemIcons.Application;
			}
			return new Icon(stream);
		}
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(WakeupHelper.FormMain));
		this.label5 = new System.Windows.Forms.Label();
		this.txtFilePath = new System.Windows.Forms.TextBox();
		this.btnBrowser = new System.Windows.Forms.Button();
		this.txtLogBox = new System.Windows.Forms.RichTextBox();
		this.btnStart = new System.Windows.Forms.Button();
		this.statusStrip1 = new System.Windows.Forms.StatusStrip();
		this.toolStripStatusLabel1 = new System.Windows.Forms.ToolStripStatusLabel();
		this.toolStripStatusLabel2 = new System.Windows.Forms.ToolStripStatusLabel();
		this.menuStrip1 = new System.Windows.Forms.MenuStrip();
		this.文件ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripMenuItemSysSeting = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.ToolStripMenuItemRecentlyWord = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator3 = new System.Windows.Forms.ToolStripSeparator();
		this.ToolStripMenuItemExit = new System.Windows.Forms.ToolStripMenuItem();
		this.编辑ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.ToolStripMenuItemWriterTemplate = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.ToolStripMenuItemIncorrectWord = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator4 = new System.Windows.Forms.ToolStripSeparator();
		this.ToolStripMenuItemCaseOrganizer = new System.Windows.Forms.ToolStripMenuItem();
		this.ToolStripMenuItemAIPlugin = new System.Windows.Forms.ToolStripMenuItem();
		this.帮助HToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.查看帮助ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.反馈意见ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripMenuItem3 = new System.Windows.Forms.ToolStripSeparator();
		this.关于我们ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.开源捐赠ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.label1 = new System.Windows.Forms.Label();
		this.comboBoxDocumentTemplate = new System.Windows.Forms.ComboBox();
		this.label2 = new System.Windows.Forms.Label();
		this.comboBoxErrorCorrection = new System.Windows.Forms.ComboBox();
		this.groupBox1 = new System.Windows.Forms.GroupBox();
		this.IsFinishOpenDir = new System.Windows.Forms.CheckBox();
		this.IsShowWordWindows = new System.Windows.Forms.CheckBox();
		this.IsDocumentErrorCorrectionCommentDebug = new System.Windows.Forms.CheckBox();
		this.IsGenerateConsciousnessAppendix = new System.Windows.Forms.CheckBox();
		this.notifyIcon1 = new System.Windows.Forms.NotifyIcon(this.components);
		this.contextMenuStrip1 = new System.Windows.Forms.ContextMenuStrip(this.components);
		this.打开主菜单ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripSeparator5 = new System.Windows.Forms.ToolStripSeparator();
		this.退出ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.statusStrip1.SuspendLayout();
		this.menuStrip1.SuspendLayout();
		this.groupBox1.SuspendLayout();
		this.contextMenuStrip1.SuspendLayout();
		base.SuspendLayout();
		this.label5.AutoSize = true;
		this.label5.Font = new System.Drawing.Font("宋体", 9f, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, 134);
		this.label5.Location = new System.Drawing.Point(17, 28);
		this.label5.Name = "label5";
		this.label5.Size = new System.Drawing.Size(70, 12);
		this.label5.TabIndex = 5;
		this.label5.Text = "互催文件：";
		this.txtFilePath.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.txtFilePath.Location = new System.Drawing.Point(88, 25);
		this.txtFilePath.Name = "txtFilePath";
		this.txtFilePath.ReadOnly = true;
		this.txtFilePath.Size = new System.Drawing.Size(292, 21);
		this.txtFilePath.TabIndex = 5;
		this.btnBrowser.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right;
		this.btnBrowser.Location = new System.Drawing.Point(398, 25);
		this.btnBrowser.Name = "btnBrowser";
		this.btnBrowser.Size = new System.Drawing.Size(64, 26);
		this.btnBrowser.TabIndex = 6;
		this.btnBrowser.Text = "选择";
		this.btnBrowser.UseVisualStyleBackColor = true;
		this.btnBrowser.Click += new System.EventHandler(btnBrowser_Click);
		this.txtLogBox.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.txtLogBox.Location = new System.Drawing.Point(18, 238);
		this.txtLogBox.Margin = new System.Windows.Forms.Padding(6, 3, 3, 3);
		this.txtLogBox.Name = "txtLogBox";
		this.txtLogBox.ReadOnly = true;
		this.txtLogBox.Size = new System.Drawing.Size(604, 156);
		this.txtLogBox.TabIndex = 7;
		this.txtLogBox.Text = "";
		this.btnStart.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right;
		this.btnStart.Location = new System.Drawing.Point(472, 25);
		this.btnStart.Name = "btnStart";
		this.btnStart.Size = new System.Drawing.Size(72, 26);
		this.btnStart.TabIndex = 7;
		this.btnStart.Text = "开始";
		this.btnStart.UseVisualStyleBackColor = true;
		this.btnStart.Click += new System.EventHandler(btnStart_Click);
		this.statusStrip1.ImageScalingSize = new System.Drawing.Size(20, 20);
		this.statusStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[2] { this.toolStripStatusLabel1, this.toolStripStatusLabel2 });
		this.statusStrip1.Location = new System.Drawing.Point(0, 408);
		this.statusStrip1.Name = "statusStrip1";
		this.statusStrip1.Size = new System.Drawing.Size(640, 22);
		this.statusStrip1.TabIndex = 8;
		this.statusStrip1.Text = "statusStrip1";
		this.toolStripStatusLabel1.Name = "toolStripStatusLabel1";
		this.toolStripStatusLabel1.Size = new System.Drawing.Size(44, 17);
		this.toolStripStatusLabel1.Text = "就绪！";
		this.toolStripStatusLabel2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
		this.toolStripStatusLabel2.Name = "toolStripStatusLabel2";
		this.toolStripStatusLabel2.Size = new System.Drawing.Size(0, 17);
		this.menuStrip1.ImageScalingSize = new System.Drawing.Size(20, 20);
		this.menuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.文件ToolStripMenuItem, this.编辑ToolStripMenuItem, this.帮助HToolStripMenuItem });
		this.menuStrip1.Location = new System.Drawing.Point(0, 0);
		this.menuStrip1.Name = "menuStrip1";
		this.menuStrip1.Padding = new System.Windows.Forms.Padding(4, 2, 0, 2);
		this.menuStrip1.Size = new System.Drawing.Size(640, 25);
		this.menuStrip1.TabIndex = 9;
		this.menuStrip1.Text = "menuStrip1";
		this.文件ToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[5] { this.toolStripMenuItemSysSeting, this.toolStripSeparator2, this.ToolStripMenuItemRecentlyWord, this.toolStripSeparator3, this.ToolStripMenuItemExit });
		this.文件ToolStripMenuItem.Name = "文件ToolStripMenuItem";
		this.文件ToolStripMenuItem.ShortcutKeys = System.Windows.Forms.Keys.F | System.Windows.Forms.Keys.Control;
		this.文件ToolStripMenuItem.Size = new System.Drawing.Size(58, 21);
		this.文件ToolStripMenuItem.Text = "文件(F)";
		this.toolStripMenuItemSysSeting.Name = "toolStripMenuItemSysSeting";
		this.toolStripMenuItemSysSeting.Size = new System.Drawing.Size(148, 22);
		this.toolStripMenuItemSysSeting.Text = "系统设置";
		this.toolStripMenuItemSysSeting.Click += new System.EventHandler(toolStripMenuItemSysSeting_Click);
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		this.toolStripSeparator2.Size = new System.Drawing.Size(145, 6);
		this.ToolStripMenuItemRecentlyWord.Enabled = false;
		this.ToolStripMenuItemRecentlyWord.Name = "ToolStripMenuItemRecentlyWord";
		this.ToolStripMenuItemRecentlyWord.Size = new System.Drawing.Size(148, 22);
		this.ToolStripMenuItemRecentlyWord.Text = "最近打开文档";
		this.toolStripSeparator3.Name = "toolStripSeparator3";
		this.toolStripSeparator3.Size = new System.Drawing.Size(145, 6);
		this.ToolStripMenuItemExit.Name = "ToolStripMenuItemExit";
		this.ToolStripMenuItemExit.Size = new System.Drawing.Size(148, 22);
		this.ToolStripMenuItemExit.Text = "退出";
		this.ToolStripMenuItemExit.Click += new System.EventHandler(ToolStripMenuItemExit_Click);
		this.编辑ToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[6] { this.ToolStripMenuItemWriterTemplate, this.toolStripSeparator1, this.ToolStripMenuItemIncorrectWord, this.toolStripSeparator4, this.ToolStripMenuItemCaseOrganizer, this.ToolStripMenuItemAIPlugin });
		this.编辑ToolStripMenuItem.Name = "编辑ToolStripMenuItem";
		this.编辑ToolStripMenuItem.Size = new System.Drawing.Size(59, 21);
		this.编辑ToolStripMenuItem.Text = "工具(T)";
		this.ToolStripMenuItemWriterTemplate.Name = "ToolStripMenuItemWriterTemplate";
		this.ToolStripMenuItemWriterTemplate.Size = new System.Drawing.Size(124, 22);
		this.ToolStripMenuItemWriterTemplate.Text = "文案模板";
		this.ToolStripMenuItemWriterTemplate.Click += new System.EventHandler(ToolStripMenuItemWriterTemplate_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		this.toolStripSeparator1.Size = new System.Drawing.Size(121, 6);
		this.ToolStripMenuItemIncorrectWord.Name = "ToolStripMenuItemIncorrectWord";
		this.ToolStripMenuItemIncorrectWord.Size = new System.Drawing.Size(124, 22);
		this.ToolStripMenuItemIncorrectWord.Text = "错词纠正";
		this.ToolStripMenuItemIncorrectWord.Click += new System.EventHandler(ToolStripMenuItemIncorrectWord_Click);
		this.toolStripSeparator4.Name = "toolStripSeparator4";
		this.toolStripSeparator4.Size = new System.Drawing.Size(121, 6);
		this.ToolStripMenuItemCaseOrganizer.Name = "ToolStripMenuItemCaseOrganizer";
		this.ToolStripMenuItemCaseOrganizer.Size = new System.Drawing.Size(148, 22);
		this.ToolStripMenuItemCaseOrganizer.Text = "案例整理台";
		this.ToolStripMenuItemCaseOrganizer.Click += new System.EventHandler(ToolStripMenuItemCaseOrganizer_Click);
		this.ToolStripMenuItemAIPlugin.Enabled = false;
		this.ToolStripMenuItemAIPlugin.Name = "ToolStripMenuItemAIPlugin";
		this.ToolStripMenuItemAIPlugin.Size = new System.Drawing.Size(148, 22);
		this.ToolStripMenuItemAIPlugin.Text = "AI插件";
		this.帮助HToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[5] { this.查看帮助ToolStripMenuItem, this.反馈意见ToolStripMenuItem, this.toolStripMenuItem3, this.关于我们ToolStripMenuItem, this.开源捐赠ToolStripMenuItem });
		this.帮助HToolStripMenuItem.Name = "帮助HToolStripMenuItem";
		this.帮助HToolStripMenuItem.Size = new System.Drawing.Size(61, 21);
		this.帮助HToolStripMenuItem.Text = "帮助(H)";
		this.查看帮助ToolStripMenuItem.Name = "查看帮助ToolStripMenuItem";
		this.查看帮助ToolStripMenuItem.Size = new System.Drawing.Size(124, 22);
		this.查看帮助ToolStripMenuItem.Text = "查看帮助";
		this.查看帮助ToolStripMenuItem.Click += new System.EventHandler(查看帮助ToolStripMenuItem_Click);
		this.反馈意见ToolStripMenuItem.Enabled = false;
		this.反馈意见ToolStripMenuItem.Name = "反馈意见ToolStripMenuItem";
		this.反馈意见ToolStripMenuItem.Size = new System.Drawing.Size(124, 22);
		this.反馈意见ToolStripMenuItem.Text = "反馈意见";
		this.toolStripMenuItem3.Name = "toolStripMenuItem3";
		this.toolStripMenuItem3.Size = new System.Drawing.Size(121, 6);
		this.关于我们ToolStripMenuItem.Name = "关于我们ToolStripMenuItem";
		this.关于我们ToolStripMenuItem.Size = new System.Drawing.Size(124, 22);
		this.关于我们ToolStripMenuItem.Text = "关于我们";
		this.关于我们ToolStripMenuItem.Click += new System.EventHandler(关于我们ToolStripMenuItem_Click);
		this.开源捐赠ToolStripMenuItem.Name = "开源捐赠ToolStripMenuItem";
		this.开源捐赠ToolStripMenuItem.Size = new System.Drawing.Size(124, 22);
		this.开源捐赠ToolStripMenuItem.Text = "开源捐赠";
		this.开源捐赠ToolStripMenuItem.Click += new System.EventHandler(开源捐赠ToolStripMenuItem_Click_1);
		this.label1.AutoSize = true;
		this.label1.Font = new System.Drawing.Font("宋体", 9f, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, 134);
		this.label1.Location = new System.Drawing.Point(18, 66);
		this.label1.Name = "label1";
		this.label1.Size = new System.Drawing.Size(70, 12);
		this.label1.TabIndex = 10;
		this.label1.Text = "转换模板：";
		this.comboBoxDocumentTemplate.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.comboBoxDocumentTemplate.DisplayMember = "Name";
		this.comboBoxDocumentTemplate.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.comboBoxDocumentTemplate.FormattingEnabled = true;
		this.comboBoxDocumentTemplate.Location = new System.Drawing.Point(88, 64);
		this.comboBoxDocumentTemplate.Margin = new System.Windows.Forms.Padding(2);
		this.comboBoxDocumentTemplate.Name = "comboBoxDocumentTemplate";
		this.comboBoxDocumentTemplate.Size = new System.Drawing.Size(176, 20);
		this.comboBoxDocumentTemplate.TabIndex = 11;
		this.comboBoxDocumentTemplate.ValueMember = "Id";
		this.comboBoxDocumentTemplate.SelectionChangeCommitted += new System.EventHandler(comboBoxDocumentTemplate_SelectionChangeCommitted);
		this.label2.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right;
		this.label2.AutoSize = true;
		this.label2.Font = new System.Drawing.Font("宋体", 9f, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, 134);
		this.label2.Location = new System.Drawing.Point(300, 66);
		this.label2.Name = "label2";
		this.label2.Size = new System.Drawing.Size(70, 12);
		this.label2.TabIndex = 12;
		this.label2.Text = "纠错方案：";
		this.comboBoxErrorCorrection.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right;
		this.comboBoxErrorCorrection.DisplayMember = "Name";
		this.comboBoxErrorCorrection.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.comboBoxErrorCorrection.FormattingEnabled = true;
		this.comboBoxErrorCorrection.Items.AddRange(new object[1] { "无" });
		this.comboBoxErrorCorrection.Location = new System.Drawing.Point(374, 64);
		this.comboBoxErrorCorrection.Margin = new System.Windows.Forms.Padding(2);
		this.comboBoxErrorCorrection.Name = "comboBoxErrorCorrection";
		this.comboBoxErrorCorrection.Size = new System.Drawing.Size(170, 20);
		this.comboBoxErrorCorrection.TabIndex = 13;
		this.comboBoxErrorCorrection.ValueMember = "Id";
		this.comboBoxErrorCorrection.SelectionChangeCommitted += new System.EventHandler(comboBoxErrorCorrection_SelectionChangeCommitted);
		this.groupBox1.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.groupBox1.Controls.Add(this.IsFinishOpenDir);
		this.groupBox1.Controls.Add(this.IsShowWordWindows);
		this.groupBox1.Controls.Add(this.IsDocumentErrorCorrectionCommentDebug);
		this.groupBox1.Controls.Add(this.IsGenerateConsciousnessAppendix);
		this.groupBox1.Controls.Add(this.comboBoxErrorCorrection);
		this.groupBox1.Controls.Add(this.label5);
		this.groupBox1.Controls.Add(this.label2);
		this.groupBox1.Controls.Add(this.txtFilePath);
		this.groupBox1.Controls.Add(this.comboBoxDocumentTemplate);
		this.groupBox1.Controls.Add(this.btnBrowser);
		this.groupBox1.Controls.Add(this.label1);
		this.groupBox1.Controls.Add(this.btnStart);
		this.groupBox1.Location = new System.Drawing.Point(18, 38);
		this.groupBox1.Margin = new System.Windows.Forms.Padding(2);
		this.groupBox1.Name = "groupBox1";
		this.groupBox1.Padding = new System.Windows.Forms.Padding(2);
		this.groupBox1.Size = new System.Drawing.Size(604, 184);
		this.groupBox1.TabIndex = 14;
		this.groupBox1.TabStop = false;
		this.IsFinishOpenDir.AutoSize = true;
		this.IsFinishOpenDir.Checked = true;
		this.IsFinishOpenDir.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsFinishOpenDir.Location = new System.Drawing.Point(374, 100);
		this.IsFinishOpenDir.Name = "IsFinishOpenDir";
		this.IsFinishOpenDir.Size = new System.Drawing.Size(132, 16);
		this.IsFinishOpenDir.TabIndex = 16;
		this.IsFinishOpenDir.Text = "完成后打开文件目录";
		this.IsFinishOpenDir.UseVisualStyleBackColor = true;
		this.IsFinishOpenDir.CheckedChanged += new System.EventHandler(IsFinishOpenDir_CheckedChanged);
		this.IsShowWordWindows.AutoSize = true;
		this.IsShowWordWindows.Checked = true;
		this.IsShowWordWindows.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsShowWordWindows.Location = new System.Drawing.Point(20, 140);
		this.IsShowWordWindows.Name = "IsShowWordWindows";
		this.IsShowWordWindows.Size = new System.Drawing.Size(168, 16);
		this.IsShowWordWindows.TabIndex = 15;
		this.IsShowWordWindows.Text = "开启修改过程展示Word窗体";
		this.IsShowWordWindows.UseVisualStyleBackColor = true;
		this.IsShowWordWindows.CheckedChanged += new System.EventHandler(IsShowWordWindows_CheckedChanged);
		this.IsDocumentErrorCorrectionCommentDebug.AutoSize = true;
		this.IsDocumentErrorCorrectionCommentDebug.Checked = true;
		this.IsDocumentErrorCorrectionCommentDebug.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsDocumentErrorCorrectionCommentDebug.Location = new System.Drawing.Point(20, 100);
		this.IsDocumentErrorCorrectionCommentDebug.Margin = new System.Windows.Forms.Padding(2);
		this.IsDocumentErrorCorrectionCommentDebug.Name = "IsDocumentErrorCorrectionCommentDebug";
		this.IsDocumentErrorCorrectionCommentDebug.Size = new System.Drawing.Size(192, 16);
		this.IsDocumentErrorCorrectionCommentDebug.TabIndex = 14;
		this.IsDocumentErrorCorrectionCommentDebug.Text = "开启错词纠正时的评论方式标注";
		this.IsDocumentErrorCorrectionCommentDebug.UseVisualStyleBackColor = true;
		this.IsDocumentErrorCorrectionCommentDebug.CheckedChanged += new System.EventHandler(IsDocumentErrorCorrectionCommentDebug_CheckedChanged);
		this.IsGenerateConsciousnessAppendix.AutoSize = true;
		this.IsGenerateConsciousnessAppendix.Enabled = false;
		this.IsGenerateConsciousnessAppendix.Location = new System.Drawing.Point(374, 140);
		this.IsGenerateConsciousnessAppendix.Name = "IsGenerateConsciousnessAppendix";
		this.IsGenerateConsciousnessAppendix.Size = new System.Drawing.Size(180, 16);
		this.IsGenerateConsciousnessAppendix.TabIndex = 17;
		this.IsGenerateConsciousnessAppendix.Text = "附录（授权中）";
		this.IsGenerateConsciousnessAppendix.UseVisualStyleBackColor = true;
		this.IsGenerateConsciousnessAppendix.CheckedChanged += new System.EventHandler(IsGenerateConsciousnessAppendix_CheckedChanged);
		this.notifyIcon1.BalloonTipText = "互催文案助手";
		this.notifyIcon1.ContextMenuStrip = this.contextMenuStrip1;
		this.notifyIcon1.Icon = LoadIconFromManifest();
		this.notifyIcon1.Text = "互催文档助手";
		this.notifyIcon1.Visible = true;
		this.notifyIcon1.MouseDoubleClick += new System.Windows.Forms.MouseEventHandler(notifyIcon1_MouseDoubleClick);
		this.contextMenuStrip1.ImageScalingSize = new System.Drawing.Size(20, 20);
		this.contextMenuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.打开主菜单ToolStripMenuItem, this.toolStripSeparator5, this.退出ToolStripMenuItem });
		this.contextMenuStrip1.Name = "contextMenuStrip1";
		this.contextMenuStrip1.Size = new System.Drawing.Size(137, 54);
		this.打开主菜单ToolStripMenuItem.Name = "打开主菜单ToolStripMenuItem";
		this.打开主菜单ToolStripMenuItem.Size = new System.Drawing.Size(136, 22);
		this.打开主菜单ToolStripMenuItem.Text = "打开主菜单";
		this.打开主菜单ToolStripMenuItem.Click += new System.EventHandler(打开主菜单ToolStripMenuItem_Click);
		this.toolStripSeparator5.Name = "toolStripSeparator5";
		this.toolStripSeparator5.Size = new System.Drawing.Size(133, 6);
		this.退出ToolStripMenuItem.Name = "退出ToolStripMenuItem";
		this.退出ToolStripMenuItem.Size = new System.Drawing.Size(136, 22);
		this.退出ToolStripMenuItem.Text = "退出";
		this.退出ToolStripMenuItem.Click += new System.EventHandler(退出ToolStripMenuItem_Click);
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(640, 430);
		base.Controls.Add(this.groupBox1);
		base.Controls.Add(this.statusStrip1);
		base.Controls.Add(this.menuStrip1);
		base.Controls.Add(this.txtLogBox);
		base.Icon = LoadIconFromManifest();
		base.MaximizeBox = false;
		base.Name = "FormMain";
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "互催文案助手 v3.3";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(FormMain_FormClosing);
		base.Load += new System.EventHandler(Form1_Load);
		this.statusStrip1.ResumeLayout(false);
		this.statusStrip1.PerformLayout();
		this.menuStrip1.ResumeLayout(false);
		this.menuStrip1.PerformLayout();
		this.groupBox1.ResumeLayout(false);
		this.groupBox1.PerformLayout();
		this.contextMenuStrip1.ResumeLayout(false);
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
