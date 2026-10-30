using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Reflection;
using System.Windows.Forms;

namespace WakeupHelper.View;

public class HelpAbout : Form
{
	private IContainer components;

	private Label label1;

	private Label label2;

	private Label label3;

	private Label label4;

	private LinkLabel linkLabel1;

	private LinkLabel linkLabel2;

	private GroupBox groupBox1;

	public HelpAbout()
	{
		InitializeComponent();
		WakeupHelper.libs.Theme.ApplyTo(this);
		// v3.1 fix: 显示真实版本号和发布时间, 不显示反编译残留的 "s"
		try {
			var asm = Assembly.GetExecutingAssembly();
			var version = asm.GetName().Version;
			label4.Text = $"当前版本：v{version.Major}.{version.Minor}.{version.Build}";
			var buildTime = System.IO.File.GetLastWriteTime(asm.Location);
			label2.Text = $"发布时间：{buildTime:yyyy-MM-dd HH:mm}";
		} catch {
			label4.Text = "当前版本：v3.3";
			label2.Text = $"发布时间：{DateTime.Now:yyyy-MM-dd}";
		}
		// v3.1 fix: linkLabel1 (检查是否最新版本) 默认被 disable, 启用
		linkLabel1.Enabled = true;
	}

	private void linkLabel1_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
	{
		// v3.1 fix: 实际打开 gitee release 页
		try {
			Process.Start(new ProcessStartInfo {
				FileName = "https://gitee.com/xmr-stak/wake-up-helper/releases",
				UseShellExecute = true
			});
		} catch (Exception ex) {
			MessageBox.Show($"无法打开链接: {ex.Message}", "错误",
				MessageBoxButtons.OK, MessageBoxIcon.Error);
		}
	}

	private void linkLabel2_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
	{
		try {
			Process.Start(new ProcessStartInfo {
				FileName = "https://gitee.com/xmr-stak/wake-up-helper",
				UseShellExecute = true
			});
		} catch (Exception ex) {
			MessageBox.Show($"无法打开链接: {ex.Message}", "错误",
				MessageBoxButtons.OK, MessageBoxIcon.Error);
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
		this.label2 = new System.Windows.Forms.Label();
		this.label3 = new System.Windows.Forms.Label();
		this.label4 = new System.Windows.Forms.Label();
		this.linkLabel1 = new System.Windows.Forms.LinkLabel();
		this.linkLabel2 = new System.Windows.Forms.LinkLabel();
		this.groupBox1 = new System.Windows.Forms.GroupBox();
		this.groupBox1.SuspendLayout();
		base.SuspendLayout();
		this.label1.AutoSize = true;
		this.label1.Font = new System.Drawing.Font("宋体", 12f, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, 134);
		this.label1.Location = new System.Drawing.Point(24, 18);
		this.label1.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
		this.label1.Name = "label1";
		this.label1.Size = new System.Drawing.Size(244, 16);
		this.label1.TabIndex = 0;
		this.label1.Text = "互催文档助手 - WakeupHelper";
		this.label2.AutoSize = true;
		this.label2.Location = new System.Drawing.Point(20, 24);
		this.label2.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
		this.label2.Name = "label2";
		this.label2.Size = new System.Drawing.Size(125, 12);
		this.label2.TabIndex = 1;
		this.label2.Text = "发布时间：2024-11-07";
		this.label3.AutoSize = true;
		this.label3.Location = new System.Drawing.Point(20, 52);
		this.label3.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
		this.label3.Name = "label3";
		this.label3.Size = new System.Drawing.Size(230, 12);
		this.label3.TabIndex = 2;
		this.label3.Text = "原作者：Freedom；v3.3 本地安全整理版";
		this.label4.AutoSize = true;
		this.label4.Location = new System.Drawing.Point(20, 80);
		this.label4.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
		this.label4.Name = "label4";
		this.label4.Size = new System.Drawing.Size(11, 12);
		this.label4.TabIndex = 3;
		this.label4.Text = "s";
		this.linkLabel1.AutoSize = true;
		this.linkLabel1.Enabled = false;
		this.linkLabel1.Location = new System.Drawing.Point(190, 80);
		this.linkLabel1.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
		this.linkLabel1.Name = "linkLabel1";
		this.linkLabel1.Size = new System.Drawing.Size(101, 12);
		this.linkLabel1.TabIndex = 4;
		this.linkLabel1.TabStop = true;
		this.linkLabel1.Text = "检查是否最新版本";
		this.linkLabel1.LinkClicked += new System.Windows.Forms.LinkLabelLinkClickedEventHandler(linkLabel1_LinkClicked);
		this.linkLabel2.AutoSize = true;
		this.linkLabel2.LinkColor = System.Drawing.Color.Black;
		this.linkLabel2.Location = new System.Drawing.Point(20, 112);
		this.linkLabel2.Margin = new System.Windows.Forms.Padding(2, 0, 2, 0);
		this.linkLabel2.Name = "linkLabel2";
		this.linkLabel2.Size = new System.Drawing.Size(251, 12);
		this.linkLabel2.TabIndex = 5;
		this.linkLabel2.TabStop = true;
		this.linkLabel2.Text = "https://gitee.com/xmr-stak/wake-up-helper";
		this.linkLabel2.LinkClicked += new System.Windows.Forms.LinkLabelLinkClickedEventHandler(linkLabel2_LinkClicked);
		this.groupBox1.Controls.Add(this.label2);
		this.groupBox1.Controls.Add(this.linkLabel2);
		this.groupBox1.Controls.Add(this.label3);
		this.groupBox1.Controls.Add(this.linkLabel1);
		this.groupBox1.Controls.Add(this.label4);
		this.groupBox1.Location = new System.Drawing.Point(18, 52);
		this.groupBox1.Margin = new System.Windows.Forms.Padding(2);
		this.groupBox1.Name = "groupBox1";
		this.groupBox1.Padding = new System.Windows.Forms.Padding(2);
		this.groupBox1.Size = new System.Drawing.Size(420, 148);
		this.groupBox1.TabIndex = 6;
		this.groupBox1.TabStop = false;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(456, 214);
		base.Controls.Add(this.groupBox1);
		base.Controls.Add(this.label1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
		base.Margin = new System.Windows.Forms.Padding(2);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "HelpAbout";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "关于我们";
		this.groupBox1.ResumeLayout(false);
		this.groupBox1.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
