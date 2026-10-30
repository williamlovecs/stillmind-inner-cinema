using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using WakeupHelper.Model;

namespace WakeupHelper.View.Tool.incorrect;

public class WordEditFrm : Form
{
	public ErrorCorrectionWord errorCorrectionWord;

	private IContainer components;

	private Label label1;

	private TextBox txtRightWord;

	private GroupBox groupBox1;

	private TextBox txtErrorWord;

	private Label label2;

	private Button btnEdit;

	public WordEditFrm()
	{
		InitializeComponent();
		WakeupHelper.libs.Theme.ApplyTo(this);
	}

	private void btnEdit_Click(object sender, EventArgs e)
	{
		if (string.IsNullOrEmpty(txtRightWord.Text))
		{
			txtRightWord.Focus();
			MessageBox.Show("纠错词不能为空！", "错误提醒", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
			return;
		}
		if (string.IsNullOrEmpty(txtErrorWord.Text))
		{
			txtErrorWord.Focus();
			MessageBox.Show("错词不能为空！", "错误提醒", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
			return;
		}
		List<string> list = new List<string>();
		if (errorCorrectionWord != null)
		{
			errorCorrectionWord.RightWord = txtRightWord.Text;
		}
		else
		{
			errorCorrectionWord = new ErrorCorrectionWord
			{
				RightWord = txtRightWord.Text
			};
		}
		foreach (string item in txtErrorWord.Text.Split('\n').ToList())
		{
			string text = item.Trim();
			if (text.Length > 0 && !list.Contains(text))
			{
				list.Add(text);
			}
		}
		errorCorrectionWord.ErrorWordList = list;
		base.Tag = errorCorrectionWord;
		base.DialogResult = DialogResult.OK;
	}

	private void WordEdit_Load(object sender, EventArgs e)
	{
		if (errorCorrectionWord != null)
		{
			txtRightWord.Text = errorCorrectionWord.RightWord;
			txtErrorWord.Text = string.Join("\r\n", errorCorrectionWord.ErrorWordList);
			btnEdit.Text = "修改";
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
		this.txtRightWord = new System.Windows.Forms.TextBox();
		this.groupBox1 = new System.Windows.Forms.GroupBox();
		this.txtErrorWord = new System.Windows.Forms.TextBox();
		this.label2 = new System.Windows.Forms.Label();
		this.btnEdit = new System.Windows.Forms.Button();
		this.groupBox1.SuspendLayout();
		base.SuspendLayout();
		this.label1.AutoSize = true;
		this.label1.Location = new System.Drawing.Point(21, 39);
		this.label1.Name = "label1";
		this.label1.Size = new System.Drawing.Size(67, 15);
		this.label1.TabIndex = 0;
		this.label1.Text = "纠错词：";
		this.txtRightWord.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.txtRightWord.Location = new System.Drawing.Point(95, 36);
		this.txtRightWord.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.txtRightWord.Name = "txtRightWord";
		this.txtRightWord.Size = new System.Drawing.Size(229, 25);
		this.txtRightWord.TabIndex = 1;
		this.groupBox1.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.groupBox1.Controls.Add(this.txtErrorWord);
		this.groupBox1.Controls.Add(this.label2);
		this.groupBox1.Controls.Add(this.txtRightWord);
		this.groupBox1.Controls.Add(this.label1);
		this.groupBox1.Location = new System.Drawing.Point(12, 4);
		this.groupBox1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.groupBox1.Name = "groupBox1";
		this.groupBox1.Padding = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.groupBox1.Size = new System.Drawing.Size(353, 298);
		this.groupBox1.TabIndex = 2;
		this.groupBox1.TabStop = false;
		this.txtErrorWord.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.txtErrorWord.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f);
		this.txtErrorWord.Location = new System.Drawing.Point(95, 89);
		this.txtErrorWord.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.txtErrorWord.Multiline = true;
		this.txtErrorWord.Name = "txtErrorWord";
		this.txtErrorWord.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
		this.txtErrorWord.Size = new System.Drawing.Size(229, 182);
		this.txtErrorWord.TabIndex = 3;
		this.label2.AutoSize = true;
		this.label2.Location = new System.Drawing.Point(21, 89);
		this.label2.Name = "label2";
		this.label2.Size = new System.Drawing.Size(52, 15);
		this.label2.TabIndex = 2;
		this.label2.Text = "错词：";
		this.btnEdit.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
		this.btnEdit.Location = new System.Drawing.Point(139, 320);
		this.btnEdit.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.btnEdit.Name = "btnEdit";
		this.btnEdit.Size = new System.Drawing.Size(112, 30);
		this.btnEdit.TabIndex = 3;
		this.btnEdit.Text = "添加";
		this.btnEdit.UseVisualStyleBackColor = true;
		this.btnEdit.Click += new System.EventHandler(btnEdit_Click);
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 15f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(379, 368);
		base.Controls.Add(this.btnEdit);
		base.Controls.Add(this.groupBox1);
		base.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		base.MinimizeBox = false;
		base.Name = "WordEditFrm";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "编辑纠正词";
		base.Load += new System.EventHandler(WordEdit_Load);
		this.groupBox1.ResumeLayout(false);
		this.groupBox1.PerformLayout();
		base.ResumeLayout(false);
	}
}
