using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using WakeupHelper;
using WakeupHelper.Model.System;

namespace WakeupHelper.View.File;

public class FileSystemPolicyCreate : Form
{
	public IdentificationStrategy identificationStrategy;

	public List<string> sourceTypes;

	private IContainer components;

	private Label label1;

	private TextBox txtName;

	private TextBox txtRegex;

	private Label label2;

	private GroupBox groupBox1;

	private TextBox txtDescription;

	private Label label5;

	private Button btnEdit;

	private SaveFileDialog saveFileDialog1;

	private ComboBox comboBoxSourceType;

	private Label label3;

	public FileSystemPolicyCreate()
	{
		InitializeComponent();
		WakeupHelper.libs.Theme.ApplyTo(this);
		// v3.1 fix: sourceTypes 是公开字段但从未初始化, 加默认值
		if (sourceTypes == null) {
			sourceTypes = new List<string> { "腾讯会议", "飞书妙记", "微信文字催" };
		}
	}

	private void btnEdit_Click(object sender, EventArgs e)
	{
		if (string.IsNullOrEmpty(txtName.Text))
		{
			txtName.Focus();
			MessageBox.Show("名称不能为空！", "错误提醒");
			return;
		}
		if (string.IsNullOrEmpty(txtRegex.Text))
		{
			txtRegex.Focus();
			MessageBox.Show("规则不能为空！", "错误提醒");
			return;
		}
		if (string.IsNullOrEmpty(txtDescription.Text))
		{
			txtDescription.Focus();
			MessageBox.Show("策略描述不能为空！", "错误提醒");
			return;
		}
		// v3.1 fix: 空选时给默认值而不是 NRE
		string sourceName = comboBoxSourceType.SelectedItem?.ToString() ?? "腾讯会议";
		try {
			if (identificationStrategy != null)
			{
				identificationStrategy.Name = txtName.Text;
				identificationStrategy.Description = txtDescription.Text;
				identificationStrategy.Regex = txtRegex.Text;
				identificationStrategy.SourceName = sourceName;
				// v3.1 fix: 拼完整路径, 不是只传 Id
				var filePath = Path.Combine(Program.SettingPath, identificationStrategy.Id + ".json");
				IdentificationStrategy.SerializeJson(identificationStrategy, filePath);
			}
			else
			{
				identificationStrategy = new IdentificationStrategy
				{
					Name = txtName.Text,
					Id = Guid.NewGuid().ToString("N"),
					Regex = txtRegex.Text,
					Description = txtDescription.Text,
					TypeLevel = UserType.User,
					SourceName = sourceName
				};
				var filePath = Path.Combine(Program.SettingPath, identificationStrategy.Id + ".json");
				IdentificationStrategy.SerializeJson(identificationStrategy, filePath);
			}
			base.DialogResult = DialogResult.OK;
		} catch (Exception ex) {
			MessageBox.Show($"保存失败: {ex.Message}", "错误", MessageBoxButtons.OK, MessageBoxIcon.Error);
		}
	}

	private void FileSystemPolicyCreate_Load(object sender, EventArgs e)
	{
		comboBoxSourceType.DataSource = sourceTypes;
		if (identificationStrategy != null)
		{
			txtName.Text = identificationStrategy.Name;
			txtRegex.Text = identificationStrategy.Regex;
			txtDescription.Text = identificationStrategy.Description;
			if (!string.IsNullOrEmpty(identificationStrategy.SourceName)) {
				comboBoxSourceType.SelectedItem = identificationStrategy.SourceName;
			}
			btnEdit.Text = "编辑";
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
		this.label1 = new System.Windows.Forms.Label();
		this.txtName = new System.Windows.Forms.TextBox();
		this.txtRegex = new System.Windows.Forms.TextBox();
		this.label2 = new System.Windows.Forms.Label();
		this.groupBox1 = new System.Windows.Forms.GroupBox();
		this.comboBoxSourceType = new System.Windows.Forms.ComboBox();
		this.label3 = new System.Windows.Forms.Label();
		this.txtDescription = new System.Windows.Forms.TextBox();
		this.label5 = new System.Windows.Forms.Label();
		this.btnEdit = new System.Windows.Forms.Button();
		this.saveFileDialog1 = new System.Windows.Forms.SaveFileDialog();
		this.groupBox1.SuspendLayout();
		base.SuspendLayout();
		this.label1.AutoSize = true;
		this.label1.Location = new System.Drawing.Point(42, 31);
		this.label1.Name = "label1";
		this.label1.Size = new System.Drawing.Size(68, 15);
		this.label1.TabIndex = 0;
		this.label1.Text = "名  称：";
		this.txtName.Location = new System.Drawing.Point(116, 28);
		this.txtName.Name = "txtName";
		this.txtName.Size = new System.Drawing.Size(395, 25);
		this.txtName.TabIndex = 1;
		this.txtRegex.Location = new System.Drawing.Point(116, 127);
		this.txtRegex.Name = "txtRegex";
		this.txtRegex.Size = new System.Drawing.Size(395, 25);
		this.txtRegex.TabIndex = 3;
		this.label2.AutoSize = true;
		this.label2.Location = new System.Drawing.Point(42, 130);
		this.label2.Name = "label2";
		this.label2.Size = new System.Drawing.Size(68, 15);
		this.label2.TabIndex = 2;
		this.label2.Text = "规  则：";
		this.groupBox1.Controls.Add(this.comboBoxSourceType);
		this.groupBox1.Controls.Add(this.label3);
		this.groupBox1.Controls.Add(this.txtDescription);
		this.groupBox1.Controls.Add(this.label5);
		this.groupBox1.Controls.Add(this.label1);
		this.groupBox1.Controls.Add(this.txtName);
		this.groupBox1.Controls.Add(this.label2);
		this.groupBox1.Controls.Add(this.txtRegex);
		this.groupBox1.Location = new System.Drawing.Point(12, 3);
		this.groupBox1.Name = "groupBox1";
		this.groupBox1.Size = new System.Drawing.Size(532, 290);
		this.groupBox1.TabIndex = 8;
		this.groupBox1.TabStop = false;
		this.comboBoxSourceType.DisplayMember = "Name";
		this.comboBoxSourceType.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.comboBoxSourceType.FormattingEnabled = true;
		this.comboBoxSourceType.Location = new System.Drawing.Point(116, 76);
		this.comboBoxSourceType.Name = "comboBoxSourceType";
		this.comboBoxSourceType.Size = new System.Drawing.Size(395, 23);
		this.comboBoxSourceType.TabIndex = 12;
		this.comboBoxSourceType.ValueMember = "Name";
		this.label3.AutoSize = true;
		this.label3.Location = new System.Drawing.Point(42, 79);
		this.label3.Name = "label3";
		this.label3.Size = new System.Drawing.Size(68, 15);
		this.label3.TabIndex = 11;
		this.label3.Text = "类  型：";
		this.txtDescription.Location = new System.Drawing.Point(116, 178);
		this.txtDescription.Multiline = true;
		this.txtDescription.Name = "txtDescription";
		this.txtDescription.Size = new System.Drawing.Size(395, 84);
		this.txtDescription.TabIndex = 10;
		this.label5.AutoSize = true;
		this.label5.Location = new System.Drawing.Point(28, 181);
		this.label5.Name = "label5";
		this.label5.Size = new System.Drawing.Size(82, 15);
		this.label5.TabIndex = 9;
		this.label5.Text = "策略描述：";
		this.btnEdit.Location = new System.Drawing.Point(225, 319);
		this.btnEdit.Name = "btnEdit";
		this.btnEdit.Size = new System.Drawing.Size(112, 30);
		this.btnEdit.TabIndex = 9;
		this.btnEdit.Text = "添加";
		this.btnEdit.UseVisualStyleBackColor = true;
		this.btnEdit.Click += new System.EventHandler(btnEdit_Click);
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 15f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(556, 366);
		base.Controls.Add(this.btnEdit);
		base.Controls.Add(this.groupBox1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "FileSystemPolicyCreate";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "识别策略";
		base.Load += new System.EventHandler(FileSystemPolicyCreate_Load);
		this.groupBox1.ResumeLayout(false);
		this.groupBox1.PerformLayout();
		base.ResumeLayout(false);
	}
}
