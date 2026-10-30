using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Windows.Forms;
using WakeupHelper;
using WakeupHelper.Model;
using WakeupHelper.Model.System;

namespace WakeupHelper.View;

public class ToolWriterTempleCreate : Form
{
	private People FirstPeople;

	private People SecondPeople;

	public DocumentTemplate documentTemplate;

	private IContainer components;

	private GroupBox groupBox1;

	private CheckBox IsNickNewLine;

	private CheckBox IsShowPageNumber;

	private CheckBox IsGenerateOverview;

	private ComboBox comboBoxFontSize;

	private CheckBox IsRemoveDatetime;

	private Label label2;

	private ComboBox comboBoxFontName;

	private Label label1;

	private GroupBox groupBox2;

	private CheckBox IsNickFontBold;

	private CheckBox IsEnablePrivacyProtection;

	private Label label9;

	private Label label8;

	private Label label7;

	private Label label6;

	private Button btnSecondBodyColor;

	private Button btnFirstBodyColor;

	private Button btnSecondNameColor;

	private Button btnFirstNameColor;

	private ComboBox comboBoxSecondRole;

	private Label label3;

	private ComboBox comboBoxFirstRole;

	private Label label4;

	private Label label5;

	private CheckBox IsBodyFontBold;

	private TextBox txtName;

	private Button btnCreateTemplate;

	private Label label10;

	private TextBox txtDescription;

	private GroupBox groupBox3;

	private CheckBox IsConvertDatetimeToTimer;

	private ComboBox comboBoxPolicy;

	private Label label12;

	private CheckBox IsPageNarrowMargin;

	private Label label11;

	private TextBox txtRemoveDatetimeRegex;

	private TextBox txtSecondMorePeople;

	private Label label14;

	private TextBox txtFirstMorePeople;

	private Label label13;

	public ToolWriterTempleCreate()
	{
		InitializeComponent();
		WakeupHelper.libs.Theme.ApplyTo(this);
		comboBoxFontName.SelectedIndex = 1;
		comboBoxFontSize.SelectedIndex = 2;
		comboBoxFirstRole.SelectedIndex = 0;
		comboBoxSecondRole.SelectedIndex = 1;
		comboBoxPolicy.DataSource = Program.setting.IdentificationStrategyList;
		foreach (IdentificationStrategy identificationStrategy in Program.setting.IdentificationStrategyList)
		{
			if (identificationStrategy.Id == "71449c137a414e4ba8f1343416c15ea4")
			{
				comboBoxPolicy.SelectedItem = identificationStrategy;
				break;
			}
		}
		Color v33ClientBlue = Color.FromArgb(0, 128, 255);
		FirstPeople = new People((string)comboBoxFirstRole.SelectedItem, Color.Black, Color.Black);
		SecondPeople = new People((string)comboBoxSecondRole.SelectedItem, v33ClientBlue, v33ClientBlue);
		IsNickFontBold.Checked = true;
		IsBodyFontBold.Checked = true;
	}

	private void ToolWriterTempleCreate_Load(object sender, EventArgs e)
	{
		if (documentTemplate != null)
		{
			txtName.Text = documentTemplate.Name;
			txtDescription.Text = documentTemplate.Description;
			documentTemplate.Name = txtName.Text;
			documentTemplate.Description = txtDescription.Text.Trim();
			comboBoxPolicy.SelectedValue = documentTemplate.PolicyId;
			comboBoxFontName.SelectedItem = documentTemplate.FontName;
			comboBoxFontSize.SelectedItem = documentTemplate.FontSize.ToString();
			IsGenerateOverview.Checked = documentTemplate.IsGenerateOverview;
			IsShowPageNumber.Checked = documentTemplate.IsShowPageNumber;
			IsPageNarrowMargin.Checked = documentTemplate.IsPageNarrowMargin;
			IsEnablePrivacyProtection.Checked = documentTemplate.IsEnablePrivacyProtection;
			IsNickNewLine.Checked = documentTemplate.IsNickNewLine;
			IsNickFontBold.Checked = documentTemplate.IsNickFontBold;
			IsBodyFontBold.Checked = documentTemplate.IsBodyFontBold;
			comboBoxFirstRole.SelectedItem = documentTemplate.FirstPeople.Role;
			btnFirstNameColor.BackColor = Color.FromArgb(int.Parse(documentTemplate.FirstPeople.FontNameColor.ToString(), NumberStyles.HexNumber));
			btnFirstBodyColor.BackColor = Color.FromArgb(int.Parse(documentTemplate.FirstPeople.FontBodyColor.ToString(), NumberStyles.HexNumber));
			comboBoxSecondRole.SelectedItem = documentTemplate.SecondPeople.Role;
			btnSecondNameColor.BackColor = Color.FromArgb(int.Parse(documentTemplate.SecondPeople.FontNameColor.ToString(), NumberStyles.HexNumber));
			btnSecondBodyColor.BackColor = Color.FromArgb(int.Parse(documentTemplate.SecondPeople.FontBodyColor.ToString(), NumberStyles.HexNumber));
			IsRemoveDatetime.Checked = documentTemplate.IsRemoveDatetime;
			txtRemoveDatetimeRegex.Text = documentTemplate.RemoveDatetimeRegex;
			IsConvertDatetimeToTimer.Checked = documentTemplate.IsConvertDatetimeToTimer;
			FirstPeople.Role = documentTemplate.FirstPeople.Role;
			FirstPeople.FontNameColor = documentTemplate.FirstPeople.FontNameColor;
			FirstPeople.FontBodyColor = documentTemplate.FirstPeople.FontBodyColor;
			SecondPeople.Role = documentTemplate.SecondPeople.Role;
			SecondPeople.FontNameColor = documentTemplate.SecondPeople.FontNameColor;
			SecondPeople.FontBodyColor = documentTemplate.SecondPeople.FontBodyColor;
			if (documentTemplate.FirstMorePeopleList != null)
			{
				txtFirstMorePeople.Text = string.Join(",", documentTemplate.FirstMorePeopleList);
			}
			if (documentTemplate.SecondMorePeopleList != null)
			{
				txtSecondMorePeople.Text = string.Join(",", documentTemplate.SecondMorePeopleList);
			}
			btnCreateTemplate.Text = "修改";
		}
	}

	private void btnCreateTemplate_Click(object sender, EventArgs e)
	{
		if (string.IsNullOrEmpty(txtName.Text))
		{
			txtName.Focus();
			MessageBox.Show("名称不能为空！", "错误提醒", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
			return;
		}
		if (string.IsNullOrEmpty((string)comboBoxPolicy.SelectedValue))
		{
			comboBoxPolicy.Focus();
			MessageBox.Show("识别策略不能为空！", "错误提醒", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
			return;
		}
		if (documentTemplate != null)
		{
			string filePath = Path.Combine(Program.TemplatePath, documentTemplate.Id + ".json");
			// v3.1 fix: 拼完整路径, 而不是把 PolicyId 当 file path
			var strategyFile = Path.Combine(Program.SettingPath, documentTemplate.PolicyId + ".json");
			documentTemplate.IdentificationStrategyInfo = IdentificationStrategy.DeserializeJson(strategyFile);
			documentTemplate.Name = txtName.Text;
			documentTemplate.Description = txtDescription.Text.Trim();
			documentTemplate.PolicyId = comboBoxPolicy.SelectedValue.ToString();
			// v3.1 fix: comboBox SelectedItem 可能是 null, 用 ?. 链式避免 NRE
			documentTemplate.FontName = comboBoxFontName.SelectedItem?.ToString() ?? "微软雅黑";
			documentTemplate.FontSize = int.TryParse(comboBoxFontSize.SelectedItem?.ToString(), out var fs) ? fs : 12;
			documentTemplate.IsGenerateOverview = IsGenerateOverview.Checked;
			documentTemplate.IsShowPageNumber = IsShowPageNumber.Checked;
			documentTemplate.IsPageNarrowMargin = IsPageNarrowMargin.Checked;
			documentTemplate.IsEnablePrivacyProtection = IsEnablePrivacyProtection.Checked;
			documentTemplate.IsNickNewLine = IsNickNewLine.Checked;
			documentTemplate.IsNickFontBold = IsNickFontBold.Checked;
			documentTemplate.IsBodyFontBold = IsBodyFontBold.Checked;
			documentTemplate.FirstPeople.Role = comboBoxFirstRole.SelectedItem?.ToString() ?? "主催";
			documentTemplate.FirstPeople.FontNameColor = FirstPeople.FontNameColor;
			documentTemplate.FirstPeople.FontBodyColor = FirstPeople.FontBodyColor;
			documentTemplate.SecondPeople.Role = comboBoxSecondRole.SelectedItem?.ToString() ?? "被催";
			documentTemplate.SecondPeople.FontNameColor = SecondPeople.FontNameColor;
			documentTemplate.SecondPeople.FontBodyColor = SecondPeople.FontBodyColor;
			documentTemplate.IsRemoveDatetime = IsRemoveDatetime.Checked;
			documentTemplate.RemoveDatetimeRegex = txtRemoveDatetimeRegex.Text;
			documentTemplate.IsConvertDatetimeToTimer = IsConvertDatetimeToTimer.Checked;
			if (!string.IsNullOrEmpty(txtFirstMorePeople.Text.Trim()))
			{
				documentTemplate.FirstMorePeopleList = new List<string>();
				string[] array = txtFirstMorePeople.Text.Trim().Split(',');
				foreach (string text in array)
				{
					if (!string.IsNullOrEmpty(text))
					{
						documentTemplate.FirstMorePeopleList.Add(text);
					}
				}
			}
			if (!string.IsNullOrEmpty(txtSecondMorePeople.Text.Trim()))
			{
				documentTemplate.SecondMorePeopleList = new List<string>();
				string[] array = txtSecondMorePeople.Text.Trim().Split(',');
				foreach (string text2 in array)
				{
					if (!string.IsNullOrEmpty(text2))
					{
						documentTemplate.SecondMorePeopleList.Add(text2);
					}
				}
			}
			documentTemplate.PolicyName = documentTemplate.IdentificationStrategyInfo.Name;
			DocumentTemplate.SerializeJson(documentTemplate, filePath);
		}
		else
		{
			// v3.1 fix: 拼完整路径, 不再把 PolicyId 当 file path
			var strategyFile = Path.Combine(Program.SettingPath, (comboBoxPolicy.SelectedValue?.ToString() ?? "") + ".json");
			IdentificationStrategy identificationStrategy = IdentificationStrategy.DeserializeJson(strategyFile);
			documentTemplate = new DocumentTemplate
			{
				Name = txtName.Text,
				Id = Guid.NewGuid().ToString("N"),
				Description = txtDescription.Text,
				PolicyId = comboBoxPolicy.SelectedValue?.ToString() ?? "",
				PolicyName = identificationStrategy.Name,
				TypeLevel = UserType.User,
				FontName = comboBoxFontName.SelectedItem?.ToString() ?? "微软雅黑",
				FontSize = int.TryParse(comboBoxFontSize.SelectedItem?.ToString(), out var fs) ? fs : 12,
				IsGenerateOverview = IsGenerateOverview.Checked,
				IsShowPageNumber = IsShowPageNumber.Checked,
				IsPageNarrowMargin = IsPageNarrowMargin.Checked,
				IsEnablePrivacyProtection = IsEnablePrivacyProtection.Checked,
				IsNickNewLine = IsNickNewLine.Checked,
				IsNickFontBold = IsNickFontBold.Checked,
				IsBodyFontBold = IsBodyFontBold.Checked,
				IsRemoveDatetime = IsRemoveDatetime.Checked,
				RemoveDatetimeRegex = txtRemoveDatetimeRegex.Text,
				IsConvertDatetimeToTimer = IsConvertDatetimeToTimer.Checked,
				FirstMorePeopleList = new List<string>(),
				SecondMorePeopleList = new List<string>(),
				FirstPeople = FirstPeople,
				SecondPeople = SecondPeople
			};
			if (!string.IsNullOrEmpty(txtFirstMorePeople.Text.Trim()))
			{
				string[] array = txtFirstMorePeople.Text.Trim().Split(',');
				foreach (string item in array)
				{
					if (!string.IsNullOrEmpty(item)) documentTemplate.FirstMorePeopleList.Add(item);
				}
			}
			if (string.IsNullOrEmpty(txtSecondMorePeople.Text.Trim()))
			{
				string[] array = txtSecondMorePeople.Text.Trim().Split(',');
				foreach (string item2 in array)
				{
					documentTemplate.SecondMorePeopleList.Add(item2);
				}
			}
			string filePath2 = Program.TemplatePath + documentTemplate.Id + ".json";
			DocumentTemplate.SerializeJson(documentTemplate, filePath2);
		}
		base.DialogResult = DialogResult.OK;
	}

	private void btnFirstNameColor_Click(object sender, EventArgs e)
	{
		ColorDialog colorDialog = new ColorDialog();
		colorDialog.AllowFullOpen = true;
		colorDialog.FullOpen = true;
		colorDialog.ShowHelp = false;
		if (colorDialog.ShowDialog() == DialogResult.OK)
		{
			btnFirstNameColor.BackColor = colorDialog.Color;
			FirstPeople.FontNameColor = colorDialog.Color.ToArgb().ToString("X");
		}
	}

	private void btnSecondNameColor_Click(object sender, EventArgs e)
	{
		ColorDialog colorDialog = new ColorDialog
		{
			AllowFullOpen = true,
			FullOpen = true,
			ShowHelp = true
		};
		if (colorDialog.ShowDialog() == DialogResult.OK)
		{
			btnSecondNameColor.BackColor = colorDialog.Color;
			SecondPeople.FontNameColor = colorDialog.Color.ToArgb().ToString("X");
		}
	}

	private void btnFirstBodyColor_Click(object sender, EventArgs e)
	{
		ColorDialog colorDialog = new ColorDialog();
		colorDialog.AllowFullOpen = true;
		colorDialog.FullOpen = true;
		colorDialog.ShowHelp = true;
		if (colorDialog.ShowDialog() == DialogResult.OK)
		{
			btnFirstBodyColor.BackColor = colorDialog.Color;
			FirstPeople.FontBodyColor = colorDialog.Color.ToArgb().ToString("X");
		}
	}

	private void btnSecondBodyColor_Click(object sender, EventArgs e)
	{
		ColorDialog colorDialog = new ColorDialog();
		colorDialog.AllowFullOpen = true;
		colorDialog.FullOpen = true;
		colorDialog.ShowHelp = true;
		if (colorDialog.ShowDialog() == DialogResult.OK)
		{
			btnSecondBodyColor.BackColor = colorDialog.Color;
			SecondPeople.FontBodyColor = colorDialog.Color.ToArgb().ToString("X");
		}
	}

	private void comboBoxFirst_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (comboBoxFirstRole.SelectedItem != null && FirstPeople != null)
		{
			FirstPeople.Role = comboBoxFirstRole.SelectedItem.ToString();
		}
	}

	private void comboBoxSecond_SelectedIndexChanged(object sender, EventArgs e)
	{
		if (comboBoxSecondRole.SelectedItem != null && SecondPeople != null)
		{
			SecondPeople.Role = comboBoxSecondRole.SelectedItem.ToString();
		}
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.groupBox1 = new System.Windows.Forms.GroupBox();
		this.IsPageNarrowMargin = new System.Windows.Forms.CheckBox();
		this.IsShowPageNumber = new System.Windows.Forms.CheckBox();
		this.IsGenerateOverview = new System.Windows.Forms.CheckBox();
		this.comboBoxFontSize = new System.Windows.Forms.ComboBox();
		this.label2 = new System.Windows.Forms.Label();
		this.comboBoxFontName = new System.Windows.Forms.ComboBox();
		this.label1 = new System.Windows.Forms.Label();
		this.IsNickNewLine = new System.Windows.Forms.CheckBox();
		this.IsRemoveDatetime = new System.Windows.Forms.CheckBox();
		this.groupBox2 = new System.Windows.Forms.GroupBox();
		this.IsBodyFontBold = new System.Windows.Forms.CheckBox();
		this.IsNickFontBold = new System.Windows.Forms.CheckBox();
		this.IsEnablePrivacyProtection = new System.Windows.Forms.CheckBox();
		this.label9 = new System.Windows.Forms.Label();
		this.label8 = new System.Windows.Forms.Label();
		this.label7 = new System.Windows.Forms.Label();
		this.label6 = new System.Windows.Forms.Label();
		this.btnSecondBodyColor = new System.Windows.Forms.Button();
		this.btnFirstBodyColor = new System.Windows.Forms.Button();
		this.btnSecondNameColor = new System.Windows.Forms.Button();
		this.btnFirstNameColor = new System.Windows.Forms.Button();
		this.comboBoxSecondRole = new System.Windows.Forms.ComboBox();
		this.label3 = new System.Windows.Forms.Label();
		this.comboBoxFirstRole = new System.Windows.Forms.ComboBox();
		this.label4 = new System.Windows.Forms.Label();
		this.label5 = new System.Windows.Forms.Label();
		this.txtName = new System.Windows.Forms.TextBox();
		this.btnCreateTemplate = new System.Windows.Forms.Button();
		this.label10 = new System.Windows.Forms.Label();
		this.txtDescription = new System.Windows.Forms.TextBox();
		this.groupBox3 = new System.Windows.Forms.GroupBox();
		this.txtSecondMorePeople = new System.Windows.Forms.TextBox();
		this.label14 = new System.Windows.Forms.Label();
		this.txtFirstMorePeople = new System.Windows.Forms.TextBox();
		this.label13 = new System.Windows.Forms.Label();
		this.label11 = new System.Windows.Forms.Label();
		this.txtRemoveDatetimeRegex = new System.Windows.Forms.TextBox();
		this.IsConvertDatetimeToTimer = new System.Windows.Forms.CheckBox();
		this.comboBoxPolicy = new System.Windows.Forms.ComboBox();
		this.label12 = new System.Windows.Forms.Label();
		this.groupBox1.SuspendLayout();
		this.groupBox2.SuspendLayout();
		this.groupBox3.SuspendLayout();
		base.SuspendLayout();
		this.groupBox1.Controls.Add(this.IsPageNarrowMargin);
		this.groupBox1.Controls.Add(this.IsShowPageNumber);
		this.groupBox1.Controls.Add(this.IsGenerateOverview);
		this.groupBox1.Controls.Add(this.comboBoxFontSize);
		this.groupBox1.Controls.Add(this.label2);
		this.groupBox1.Controls.Add(this.comboBoxFontName);
		this.groupBox1.Controls.Add(this.label1);
		this.groupBox1.Location = new System.Drawing.Point(19, 178);
		this.groupBox1.Margin = new System.Windows.Forms.Padding(4);
		this.groupBox1.Name = "groupBox1";
		this.groupBox1.Padding = new System.Windows.Forms.Padding(4);
		this.groupBox1.Size = new System.Drawing.Size(628, 125);
		this.groupBox1.TabIndex = 1;
		this.groupBox1.TabStop = false;
		this.groupBox1.Text = "字体";
		this.IsPageNarrowMargin.AutoSize = true;
		this.IsPageNarrowMargin.Checked = true;
		this.IsPageNarrowMargin.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsPageNarrowMargin.Location = new System.Drawing.Point(269, 80);
		this.IsPageNarrowMargin.Margin = new System.Windows.Forms.Padding(4);
		this.IsPageNarrowMargin.Name = "IsPageNarrowMargin";
		this.IsPageNarrowMargin.Size = new System.Drawing.Size(194, 19);
		this.IsPageNarrowMargin.TabIndex = 7;
		this.IsPageNarrowMargin.Text = "开启文档窄边页边距设置";
		this.IsPageNarrowMargin.UseVisualStyleBackColor = true;
		this.IsShowPageNumber.AutoSize = true;
		this.IsShowPageNumber.Checked = true;
		this.IsShowPageNumber.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsShowPageNumber.Location = new System.Drawing.Point(461, 37);
		this.IsShowPageNumber.Margin = new System.Windows.Forms.Padding(4);
		this.IsShowPageNumber.Name = "IsShowPageNumber";
		this.IsShowPageNumber.Size = new System.Drawing.Size(149, 19);
		this.IsShowPageNumber.TabIndex = 6;
		this.IsShowPageNumber.Text = "开启每页显示行号";
		this.IsShowPageNumber.UseVisualStyleBackColor = true;
		this.IsGenerateOverview.AutoSize = true;
		this.IsGenerateOverview.Checked = true;
		this.IsGenerateOverview.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsGenerateOverview.Location = new System.Drawing.Point(269, 39);
		this.IsGenerateOverview.Margin = new System.Windows.Forms.Padding(4);
		this.IsGenerateOverview.Name = "IsGenerateOverview";
		this.IsGenerateOverview.Size = new System.Drawing.Size(149, 19);
		this.IsGenerateOverview.TabIndex = 5;
		this.IsGenerateOverview.Text = "开启总结模板生成";
		this.IsGenerateOverview.UseVisualStyleBackColor = true;
		this.comboBoxFontSize.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.comboBoxFontSize.FormattingEnabled = true;
		this.comboBoxFontSize.Items.AddRange(new object[6] { "10", "11", "12", "13", "14", "24" });
		this.comboBoxFontSize.Location = new System.Drawing.Point(117, 80);
		this.comboBoxFontSize.Margin = new System.Windows.Forms.Padding(4);
		this.comboBoxFontSize.Name = "comboBoxFontSize";
		this.comboBoxFontSize.Size = new System.Drawing.Size(123, 23);
		this.comboBoxFontSize.TabIndex = 4;
		this.label2.AutoSize = true;
		this.label2.Location = new System.Drawing.Point(25, 84);
		this.label2.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label2.Name = "label2";
		this.label2.Size = new System.Drawing.Size(82, 15);
		this.label2.TabIndex = 2;
		this.label2.Text = "字号设置：";
		this.comboBoxFontName.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.comboBoxFontName.FormattingEnabled = true;
		this.comboBoxFontName.Items.AddRange(new object[2] { "宋体", "微软雅黑" });
		this.comboBoxFontName.Location = new System.Drawing.Point(117, 35);
		this.comboBoxFontName.Margin = new System.Windows.Forms.Padding(4);
		this.comboBoxFontName.Name = "comboBoxFontName";
		this.comboBoxFontName.Size = new System.Drawing.Size(123, 23);
		this.comboBoxFontName.TabIndex = 1;
		this.label1.AutoSize = true;
		this.label1.Location = new System.Drawing.Point(25, 39);
		this.label1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label1.Name = "label1";
		this.label1.Size = new System.Drawing.Size(82, 15);
		this.label1.TabIndex = 0;
		this.label1.Text = "字体设置：";
		this.IsNickNewLine.AutoSize = true;
		this.IsNickNewLine.Location = new System.Drawing.Point(276, 122);
		this.IsNickNewLine.Margin = new System.Windows.Forms.Padding(4);
		this.IsNickNewLine.Name = "IsNickNewLine";
		this.IsNickNewLine.Size = new System.Drawing.Size(157, 19);
		this.IsNickNewLine.TabIndex = 7;
		this.IsNickNewLine.Text = "开启名称/昵称换行";
		this.IsNickNewLine.UseVisualStyleBackColor = true;
		this.IsRemoveDatetime.AutoSize = true;
		this.IsRemoveDatetime.Checked = true;
		this.IsRemoveDatetime.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsRemoveDatetime.Location = new System.Drawing.Point(28, 36);
		this.IsRemoveDatetime.Margin = new System.Windows.Forms.Padding(4);
		this.IsRemoveDatetime.Name = "IsRemoveDatetime";
		this.IsRemoveDatetime.Size = new System.Drawing.Size(209, 19);
		this.IsRemoveDatetime.TabIndex = 3;
		this.IsRemoveDatetime.Text = "开启会议日期时间移除设置";
		this.IsRemoveDatetime.UseVisualStyleBackColor = true;
		this.groupBox2.Controls.Add(this.IsNickNewLine);
		this.groupBox2.Controls.Add(this.IsBodyFontBold);
		this.groupBox2.Controls.Add(this.IsNickFontBold);
		this.groupBox2.Controls.Add(this.IsEnablePrivacyProtection);
		this.groupBox2.Controls.Add(this.label9);
		this.groupBox2.Controls.Add(this.label8);
		this.groupBox2.Controls.Add(this.label7);
		this.groupBox2.Controls.Add(this.label6);
		this.groupBox2.Controls.Add(this.btnSecondBodyColor);
		this.groupBox2.Controls.Add(this.btnFirstBodyColor);
		this.groupBox2.Controls.Add(this.btnSecondNameColor);
		this.groupBox2.Controls.Add(this.btnFirstNameColor);
		this.groupBox2.Controls.Add(this.comboBoxSecondRole);
		this.groupBox2.Controls.Add(this.label3);
		this.groupBox2.Controls.Add(this.comboBoxFirstRole);
		this.groupBox2.Controls.Add(this.label4);
		this.groupBox2.Location = new System.Drawing.Point(19, 312);
		this.groupBox2.Margin = new System.Windows.Forms.Padding(4);
		this.groupBox2.Name = "groupBox2";
		this.groupBox2.Padding = new System.Windows.Forms.Padding(4);
		this.groupBox2.Size = new System.Drawing.Size(628, 204);
		this.groupBox2.TabIndex = 6;
		this.groupBox2.TabStop = false;
		this.groupBox2.Text = "人物";
		this.IsBodyFontBold.AutoSize = true;
		this.IsBodyFontBold.Location = new System.Drawing.Point(276, 161);
		this.IsBodyFontBold.Margin = new System.Windows.Forms.Padding(4);
		this.IsBodyFontBold.Name = "IsBodyFontBold";
		this.IsBodyFontBold.Size = new System.Drawing.Size(179, 19);
		this.IsBodyFontBold.TabIndex = 15;
		this.IsBodyFontBold.Text = "开启段落正文字体加粗";
		this.IsBodyFontBold.UseVisualStyleBackColor = true;
		this.IsNickFontBold.AutoSize = true;
		this.IsNickFontBold.Location = new System.Drawing.Point(28, 161);
		this.IsNickFontBold.Margin = new System.Windows.Forms.Padding(4);
		this.IsNickFontBold.Name = "IsNickFontBold";
		this.IsNickFontBold.Size = new System.Drawing.Size(187, 19);
		this.IsNickFontBold.TabIndex = 14;
		this.IsNickFontBold.Text = "开启名称/昵称字体加粗";
		this.IsNickFontBold.UseVisualStyleBackColor = true;
		this.IsEnablePrivacyProtection.AutoSize = true;
		this.IsEnablePrivacyProtection.Checked = true;
		this.IsEnablePrivacyProtection.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsEnablePrivacyProtection.Location = new System.Drawing.Point(28, 122);
		this.IsEnablePrivacyProtection.Margin = new System.Windows.Forms.Padding(4);
		this.IsEnablePrivacyProtection.Name = "IsEnablePrivacyProtection";
		this.IsEnablePrivacyProtection.Size = new System.Drawing.Size(149, 19);
		this.IsEnablePrivacyProtection.TabIndex = 13;
		this.IsEnablePrivacyProtection.Text = "开启隐私保护模式";
		this.IsEnablePrivacyProtection.UseVisualStyleBackColor = true;
		this.label9.AutoSize = true;
		this.label9.Location = new System.Drawing.Point(429, 82);
		this.label9.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label9.Name = "label9";
		this.label9.Size = new System.Drawing.Size(52, 15);
		this.label9.TabIndex = 12;
		this.label9.Text = "正文：";
		this.label8.AutoSize = true;
		this.label8.Location = new System.Drawing.Point(429, 38);
		this.label8.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label8.Name = "label8";
		this.label8.Size = new System.Drawing.Size(52, 15);
		this.label8.TabIndex = 11;
		this.label8.Text = "正文：";
		this.label7.AutoSize = true;
		this.label7.Location = new System.Drawing.Point(267, 82);
		this.label7.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label7.Name = "label7";
		this.label7.Size = new System.Drawing.Size(68, 15);
		this.label7.TabIndex = 10;
		this.label7.Text = "名称ID：";
		this.label6.AutoSize = true;
		this.label6.Location = new System.Drawing.Point(265, 38);
		this.label6.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label6.Name = "label6";
		this.label6.Size = new System.Drawing.Size(68, 15);
		this.label6.TabIndex = 9;
		this.label6.Text = "名称ID：";
		this.btnSecondBodyColor.BackColor = System.Drawing.Color.Blue;
		this.btnSecondBodyColor.Location = new System.Drawing.Point(483, 75);
		this.btnSecondBodyColor.Margin = new System.Windows.Forms.Padding(4);
		this.btnSecondBodyColor.Name = "btnSecondBodyColor";
		this.btnSecondBodyColor.Size = new System.Drawing.Size(63, 29);
		this.btnSecondBodyColor.TabIndex = 8;
		this.btnSecondBodyColor.UseVisualStyleBackColor = false;
		this.btnSecondBodyColor.Click += new System.EventHandler(btnSecondBodyColor_Click);
		this.btnFirstBodyColor.BackColor = System.Drawing.SystemColors.ActiveCaptionText;
		this.btnFirstBodyColor.Location = new System.Drawing.Point(483, 30);
		this.btnFirstBodyColor.Margin = new System.Windows.Forms.Padding(4);
		this.btnFirstBodyColor.Name = "btnFirstBodyColor";
		this.btnFirstBodyColor.Size = new System.Drawing.Size(63, 29);
		this.btnFirstBodyColor.TabIndex = 7;
		this.btnFirstBodyColor.UseVisualStyleBackColor = false;
		this.btnFirstBodyColor.Click += new System.EventHandler(btnFirstBodyColor_Click);
		this.btnSecondNameColor.BackColor = System.Drawing.Color.Black;
		this.btnSecondNameColor.Location = new System.Drawing.Point(335, 75);
		this.btnSecondNameColor.Margin = new System.Windows.Forms.Padding(4);
		this.btnSecondNameColor.Name = "btnSecondNameColor";
		this.btnSecondNameColor.Size = new System.Drawing.Size(63, 29);
		this.btnSecondNameColor.TabIndex = 6;
		this.btnSecondNameColor.UseVisualStyleBackColor = false;
		this.btnSecondNameColor.Click += new System.EventHandler(btnSecondNameColor_Click);
		this.btnFirstNameColor.BackColor = System.Drawing.SystemColors.ActiveCaptionText;
		this.btnFirstNameColor.Location = new System.Drawing.Point(335, 30);
		this.btnFirstNameColor.Margin = new System.Windows.Forms.Padding(4);
		this.btnFirstNameColor.Name = "btnFirstNameColor";
		this.btnFirstNameColor.Size = new System.Drawing.Size(63, 29);
		this.btnFirstNameColor.TabIndex = 5;
		this.btnFirstNameColor.UseVisualStyleBackColor = false;
		this.btnFirstNameColor.Click += new System.EventHandler(btnFirstNameColor_Click);
		this.comboBoxSecondRole.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.comboBoxSecondRole.FormattingEnabled = true;
		this.comboBoxSecondRole.Items.AddRange(new object[2] { "主催", "被催" });
		this.comboBoxSecondRole.Location = new System.Drawing.Point(117, 78);
		this.comboBoxSecondRole.Margin = new System.Windows.Forms.Padding(4);
		this.comboBoxSecondRole.Name = "comboBoxSecondRole";
		this.comboBoxSecondRole.Size = new System.Drawing.Size(123, 23);
		this.comboBoxSecondRole.TabIndex = 4;
		this.comboBoxSecondRole.SelectedIndexChanged += new System.EventHandler(comboBoxSecond_SelectedIndexChanged);
		this.label3.AutoSize = true;
		this.label3.Location = new System.Drawing.Point(25, 81);
		this.label3.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label3.Name = "label3";
		this.label3.Size = new System.Drawing.Size(67, 15);
		this.label3.TabIndex = 2;
		this.label3.Text = "第二个：";
		this.comboBoxFirstRole.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.comboBoxFirstRole.FormattingEnabled = true;
		this.comboBoxFirstRole.Items.AddRange(new object[2] { "主催", "被催" });
		this.comboBoxFirstRole.Location = new System.Drawing.Point(117, 34);
		this.comboBoxFirstRole.Margin = new System.Windows.Forms.Padding(4);
		this.comboBoxFirstRole.Name = "comboBoxFirstRole";
		this.comboBoxFirstRole.Size = new System.Drawing.Size(123, 23);
		this.comboBoxFirstRole.TabIndex = 1;
		this.comboBoxFirstRole.SelectedIndexChanged += new System.EventHandler(comboBoxFirst_SelectedIndexChanged);
		this.label4.AutoSize = true;
		this.label4.Location = new System.Drawing.Point(25, 39);
		this.label4.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label4.Name = "label4";
		this.label4.Size = new System.Drawing.Size(67, 15);
		this.label4.TabIndex = 0;
		this.label4.Text = "第一个：";
		this.label5.AutoSize = true;
		this.label5.Location = new System.Drawing.Point(21, 25);
		this.label5.Name = "label5";
		this.label5.Size = new System.Drawing.Size(82, 15);
		this.label5.TabIndex = 8;
		this.label5.Text = "模板名称：";
		this.txtName.Location = new System.Drawing.Point(115, 22);
		this.txtName.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.txtName.Name = "txtName";
		this.txtName.Size = new System.Drawing.Size(531, 25);
		this.txtName.TabIndex = 1;
		this.btnCreateTemplate.Location = new System.Drawing.Point(277, 750);
		this.btnCreateTemplate.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.btnCreateTemplate.Name = "btnCreateTemplate";
		this.btnCreateTemplate.Size = new System.Drawing.Size(112, 30);
		this.btnCreateTemplate.TabIndex = 9;
		this.btnCreateTemplate.Text = "创建";
		this.btnCreateTemplate.UseVisualStyleBackColor = true;
		this.btnCreateTemplate.Click += new System.EventHandler(btnCreateTemplate_Click);
		this.label10.AutoSize = true;
		this.label10.Location = new System.Drawing.Point(21, 111);
		this.label10.Name = "label10";
		this.label10.Size = new System.Drawing.Size(82, 15);
		this.label10.TabIndex = 10;
		this.label10.Text = "备注说明：";
		this.txtDescription.ForeColor = System.Drawing.SystemColors.WindowFrame;
		this.txtDescription.Location = new System.Drawing.Point(115, 109);
		this.txtDescription.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.txtDescription.Multiline = true;
		this.txtDescription.Name = "txtDescription";
		this.txtDescription.Size = new System.Drawing.Size(531, 50);
		this.txtDescription.TabIndex = 11;
		this.groupBox3.Controls.Add(this.txtSecondMorePeople);
		this.groupBox3.Controls.Add(this.label14);
		this.groupBox3.Controls.Add(this.txtFirstMorePeople);
		this.groupBox3.Controls.Add(this.label13);
		this.groupBox3.Controls.Add(this.label11);
		this.groupBox3.Controls.Add(this.txtRemoveDatetimeRegex);
		this.groupBox3.Controls.Add(this.IsConvertDatetimeToTimer);
		this.groupBox3.Controls.Add(this.IsRemoveDatetime);
		this.groupBox3.Location = new System.Drawing.Point(17, 531);
		this.groupBox3.Margin = new System.Windows.Forms.Padding(4);
		this.groupBox3.Name = "groupBox3";
		this.groupBox3.Padding = new System.Windows.Forms.Padding(4);
		this.groupBox3.Size = new System.Drawing.Size(629, 208);
		this.groupBox3.TabIndex = 16;
		this.groupBox3.TabStop = false;
		this.groupBox3.Text = "高级";
		this.txtSecondMorePeople.Location = new System.Drawing.Point(146, 160);
		this.txtSecondMorePeople.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.txtSecondMorePeople.Name = "txtSecondMorePeople";
		this.txtSecondMorePeople.Size = new System.Drawing.Size(466, 25);
		this.txtSecondMorePeople.TabIndex = 25;
		this.txtSecondMorePeople.Text = "说话人 2,说话人 3";
		this.label14.AutoSize = true;
		this.label14.Location = new System.Drawing.Point(27, 163);
		this.label14.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label14.Name = "label14";
		this.label14.Size = new System.Drawing.Size(112, 15);
		this.label14.TabIndex = 24;
		this.label14.Text = "第二人物包含：";
		this.txtFirstMorePeople.Location = new System.Drawing.Point(146, 121);
		this.txtFirstMorePeople.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.txtFirstMorePeople.Name = "txtFirstMorePeople";
		this.txtFirstMorePeople.Size = new System.Drawing.Size(466, 25);
		this.txtFirstMorePeople.TabIndex = 23;
		this.txtFirstMorePeople.Text = "说话人 1,";
		this.label13.AutoSize = true;
		this.label13.Location = new System.Drawing.Point(27, 124);
		this.label13.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label13.Name = "label13";
		this.label13.Size = new System.Drawing.Size(112, 15);
		this.label13.TabIndex = 16;
		this.label13.Text = "第一人物包含：";
		this.label11.AutoSize = true;
		this.label11.Location = new System.Drawing.Point(298, 43);
		this.label11.Name = "label11";
		this.label11.Size = new System.Drawing.Size(52, 15);
		this.label11.TabIndex = 20;
		this.label11.Text = "规则：";
		this.txtRemoveDatetimeRegex.Location = new System.Drawing.Point(366, 36);
		this.txtRemoveDatetimeRegex.Name = "txtRemoveDatetimeRegex";
		this.txtRemoveDatetimeRegex.Size = new System.Drawing.Size(246, 25);
		this.txtRemoveDatetimeRegex.TabIndex = 19;
		this.txtRemoveDatetimeRegex.Text = "(\\d{2}:\\d{2}:\\d{2}): ";
		this.IsConvertDatetimeToTimer.AutoSize = true;
		this.IsConvertDatetimeToTimer.Checked = true;
		this.IsConvertDatetimeToTimer.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IsConvertDatetimeToTimer.Enabled = false;
		this.IsConvertDatetimeToTimer.Location = new System.Drawing.Point(28, 81);
		this.IsConvertDatetimeToTimer.Margin = new System.Windows.Forms.Padding(4);
		this.IsConvertDatetimeToTimer.Name = "IsConvertDatetimeToTimer";
		this.IsConvertDatetimeToTimer.Size = new System.Drawing.Size(209, 19);
		this.IsConvertDatetimeToTimer.TabIndex = 18;
		this.IsConvertDatetimeToTimer.Text = "将日期时间转换为计时方式";
		this.IsConvertDatetimeToTimer.UseVisualStyleBackColor = true;
		this.comboBoxPolicy.DisplayMember = "Name";
		this.comboBoxPolicy.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.comboBoxPolicy.FormattingEnabled = true;
		this.comboBoxPolicy.Items.AddRange(new object[6] { "10", "11", "12", "13", "14", "24" });
		this.comboBoxPolicy.Location = new System.Drawing.Point(115, 65);
		this.comboBoxPolicy.Margin = new System.Windows.Forms.Padding(4);
		this.comboBoxPolicy.Name = "comboBoxPolicy";
		this.comboBoxPolicy.Size = new System.Drawing.Size(531, 23);
		this.comboBoxPolicy.TabIndex = 22;
		this.comboBoxPolicy.ValueMember = "Id";
		this.label12.AutoSize = true;
		this.label12.Location = new System.Drawing.Point(23, 68);
		this.label12.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
		this.label12.Name = "label12";
		this.label12.Size = new System.Drawing.Size(82, 15);
		this.label12.TabIndex = 21;
		this.label12.Text = "识别策略：";
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 15f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(664, 791);
		base.Controls.Add(this.comboBoxPolicy);
		base.Controls.Add(this.groupBox3);
		base.Controls.Add(this.label12);
		base.Controls.Add(this.txtDescription);
		base.Controls.Add(this.label10);
		base.Controls.Add(this.btnCreateTemplate);
		base.Controls.Add(this.txtName);
		base.Controls.Add(this.label5);
		base.Controls.Add(this.groupBox2);
		base.Controls.Add(this.groupBox1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
		base.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "ToolWriterTempleCreate";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "创建文案模板";
		base.Load += new System.EventHandler(ToolWriterTempleCreate_Load);
		this.groupBox1.ResumeLayout(false);
		this.groupBox1.PerformLayout();
		this.groupBox2.ResumeLayout(false);
		this.groupBox2.PerformLayout();
		this.groupBox3.ResumeLayout(false);
		this.groupBox3.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
