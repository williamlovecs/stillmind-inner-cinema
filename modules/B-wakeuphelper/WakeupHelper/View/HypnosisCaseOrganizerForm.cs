using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;
using WakeupHelper.libs;
using WakeupHelper.Model.Organizer;

namespace WakeupHelper.View;

public class HypnosisCaseOrganizerForm : Form
{
	private TextBox txtFolder;
	private Button btnChooseFolder;
	private Button btnScan;
	private Button btnExportReport;
	private CheckBox chkIncludeSubfolders;
	private DataGridView grid;
	private RichTextBox txtDetails;
	private Label lblSummary;

	private readonly HypnosisCaseOrganizer organizer = new HypnosisCaseOrganizer();
	private List<HypnosisCaseGroup> groups = new List<HypnosisCaseGroup>();

	public HypnosisCaseOrganizerForm()
	{
		InitializeComponent();
		Theme.ApplyTo(this);
	}

	private void InitializeComponent()
	{
		Text = "互催案例整理台 v3.3";
		StartPosition = FormStartPosition.CenterParent;
		Size = new Size(980, 640);
		MinimumSize = new Size(860, 560);

		Label label = new Label { Text = "案例目录：", AutoSize = true, Location = new Point(18, 22) };
		txtFolder = new TextBox
		{
			Location = new Point(88, 18),
			Size = new Size(600, 24),
			Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right,
			Text = string.Empty
		};
		btnChooseFolder = new Button
		{
			Text = "选择",
			Location = new Point(700, 16),
			Size = new Size(72, 28),
			Anchor = AnchorStyles.Top | AnchorStyles.Right
		};
		btnChooseFolder.Click += BtnChooseFolder_Click;

		chkIncludeSubfolders = new CheckBox
		{
			Text = "包含子目录",
			Checked = true,
			AutoSize = true,
			Location = new Point(790, 21),
			Anchor = AnchorStyles.Top | AnchorStyles.Right
		};

		btnScan = new Button { Text = "扫描整理", Location = new Point(18, 56), Size = new Size(96, 30) };
		btnScan.Click += BtnScan_Click;

		btnExportReport = new Button { Text = "导出报告", Location = new Point(124, 56), Size = new Size(96, 30), Enabled = false };
		btnExportReport.Click += BtnExportReport_Click;

		lblSummary = new Label
		{
			Text = "只扫描和建议，不删除、不移动、不改写原文。",
			AutoSize = true,
			Location = new Point(238, 64),
			Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right
		};

		grid = new DataGridView
		{
			Location = new Point(18, 100),
			Size = new Size(928, 330),
			Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
			ReadOnly = true,
			AllowUserToAddRows = false,
			AllowUserToDeleteRows = false,
			AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
			SelectionMode = DataGridViewSelectionMode.FullRowSelect,
			MultiSelect = false
		};
		grid.SelectionChanged += Grid_SelectionChanged;

		txtDetails = new RichTextBox
		{
			Location = new Point(18, 444),
			Size = new Size(928, 140),
			Anchor = AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
			ReadOnly = true
		};

		Controls.Add(label);
		Controls.Add(txtFolder);
		Controls.Add(btnChooseFolder);
		Controls.Add(chkIncludeSubfolders);
		Controls.Add(btnScan);
		Controls.Add(btnExportReport);
		Controls.Add(lblSummary);
		Controls.Add(grid);
		Controls.Add(txtDetails);
	}

	private void BtnChooseFolder_Click(object sender, EventArgs e)
	{
		using (FolderBrowserDialog dialog = new FolderBrowserDialog())
		{
			dialog.Description = "选择互催案例目录";
			if (Directory.Exists(txtFolder.Text))
			{
				dialog.SelectedPath = txtFolder.Text;
			}
			if (dialog.ShowDialog(this) == DialogResult.OK)
			{
				txtFolder.Text = dialog.SelectedPath;
			}
		}
	}

	private void BtnScan_Click(object sender, EventArgs e)
	{
		try
		{
			groups = organizer.Scan(txtFolder.Text, chkIncludeSubfolders.Checked);
			BindGrid();
			btnExportReport.Enabled = groups.Count > 0;
			lblSummary.Text = $"案例组 {groups.Count} 个，文档 {groups.Sum(g => g.Documents.Count)} 个，已有人工作业痕迹 {groups.Count(g => g.HasReviewed)} 个，仍需复核 {groups.Count(g => g.NeedsReview)} 个。";
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, ex.Message, "扫描失败", MessageBoxButtons.OK, MessageBoxIcon.Error);
		}
	}

	private void BtnExportReport_Click(object sender, EventArgs e)
	{
		try
		{
			string md = organizer.ExportMarkdownReport(txtFolder.Text, groups);
			string csv = organizer.ExportCsvManifest(txtFolder.Text, groups);
			MessageBox.Show(this, "已导出：\n" + md + "\n" + csv, "导出完成", MessageBoxButtons.OK, MessageBoxIcon.Information);
			Process.Start("explorer.exe", "/select,\"" + md + "\"");
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, ex.Message, "导出失败", MessageBoxButtons.OK, MessageBoxIcon.Error);
		}
	}

	private void BindGrid()
	{
		var rows = groups.Select(g =>
		{
			HypnosisCaseDocument recommended = g.RecommendedMaster;
			return new
			{
				案例 = g.CaseKey,
				文档数 = g.Documents.Count,
				链路 = BuildPipeline(g),
				建议主版本 = recommended?.FileName,
				主版本类型 = recommended == null ? "" : DisplayKind(recommended.Kind),
				批注数 = recommended?.WordCommentCount ?? 0,
				状态 = g.NeedsReview ? "待复核" : "可归档",
				修改时间 = recommended?.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
			};
		}).ToList();
		grid.DataSource = rows;
		if (grid.Columns["案例"] != null) grid.Columns["案例"].FillWeight = 180;
		if (grid.Columns["建议主版本"] != null) grid.Columns["建议主版本"].FillWeight = 220;
	}

	private void Grid_SelectionChanged(object sender, EventArgs e)
	{
		if (grid.CurrentRow == null || grid.CurrentRow.Index < 0 || grid.CurrentRow.Index >= groups.Count)
		{
			return;
		}
		HypnosisCaseGroup group = groups[grid.CurrentRow.Index];
		txtDetails.Clear();
		txtDetails.AppendText("案例：" + group.CaseKey + Environment.NewLine);
		txtDetails.AppendText("链路：" + BuildPipeline(group) + Environment.NewLine);
		txtDetails.AppendText("建议主版本：" + group.RecommendedMaster?.FullPath + Environment.NewLine);
		txtDetails.AppendText(Environment.NewLine);
		foreach (HypnosisCaseDocument doc in group.Documents.OrderByDescending(d => d.ConfidenceScore).ThenByDescending(d => d.LastWriteTime))
		{
			txtDetails.AppendText($"- {DisplayKind(doc.Kind)} | 批注 {doc.WordCommentCount} | {doc.LastWriteTime:yyyy-MM-dd HH:mm} | {doc.FileName}" + Environment.NewLine);
			if (doc.Signals.Count > 0)
			{
				txtDetails.AppendText("  信号：" + string.Join("；", doc.Signals) + Environment.NewLine);
			}
		}
	}

	private static string BuildPipeline(HypnosisCaseGroup group)
	{
		List<string> parts = new List<string>();
		if (group.HasRaw) parts.Add("原始/人工记录");
		if (group.Documents.Any(d => d.Kind == HypnosisCaseDocumentKind.Converted)) parts.Add("机器转换");
		if (group.Documents.Any(d => d.Kind == HypnosisCaseDocumentKind.ReviewedConverted || d.Kind == HypnosisCaseDocumentKind.ManualEdited)) parts.Add("人工批注/校对");
		if (group.Documents.Any(d => d.Kind == HypnosisCaseDocumentKind.CleanedReview)) parts.Add("清洗排版");
		if (group.HasSummary) parts.Add("摘要/衔接");
		return parts.Count == 0 ? "未识别" : string.Join(" -> ", parts);
	}

	private static string DisplayKind(HypnosisCaseDocumentKind kind)
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
}
