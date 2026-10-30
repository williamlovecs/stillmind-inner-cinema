using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using WakeupHelper;
using WakeupHelper.Model.System;
using WakeupHelper.View.File;
using WakeupHelper.libs;

namespace WakeupHelper.View;

public class FileSysSetting : Form
{
	public DataTable dataTable;

	public List<string> sourceTypes;

	private IContainer components;

	private TabPage tabPage1;

	private DataGridView dataGridView1;

	private TabControl 识别策略;

	private ContextMenuStrip contextMenuStrip1;

	private ToolStripMenuItem 添加ToolStripMenuItem;

	private ToolStripMenuItem 编辑ToolStripMenuItem;

	private ToolStripMenuItem 删除ToolStripMenuItem;

	private DataGridViewTextBoxColumn ID;

	private DataGridViewTextBoxColumn 名称;

	private DataGridViewTextBoxColumn 来源类型;

	private DataGridViewTextBoxColumn 规则;

	private DataGridViewTextBoxColumn 描述;

	private DataGridViewTextBoxColumn 系统类型;

	private DataGridViewTextBoxColumn 更新时间;

	public FileSysSetting()
	{
		InitializeComponent();
		WakeupHelper.libs.Theme.ApplyTo(this);
		sourceTypes = new List<string>();
		sourceTypes.Add("腾讯会议");
		sourceTypes.Add("飞书妙记");
	}

	private void FileSysSetting_Load(object sender, EventArgs e)
	{
		LoadDataViews();
	}

	public void LoadDataViews()
	{
		Program.setting.IdentificationStrategyList = Utils.LoadSettingsIdentificationStrategy();
		dataTable = new DataTable();
		dataTable.Columns.Add("ID", typeof(string));
		dataTable.Columns.Add("名称", typeof(string));
		dataTable.Columns.Add("来源类型", typeof(string));
		dataTable.Columns.Add("系统类型", typeof(string));
		dataTable.Columns.Add("规则", typeof(string));
		dataTable.Columns.Add("描述", typeof(string));
		dataTable.Columns.Add("更新时间", typeof(string));
		foreach (IdentificationStrategy identificationStrategy in Program.setting.IdentificationStrategyList)
		{
			DataRow dataRow = dataTable.NewRow();
			dataRow["ID"] = identificationStrategy.Id;
			dataRow["名称"] = identificationStrategy.Name;
			dataRow["描述"] = identificationStrategy.Description;
			dataRow["规则"] = identificationStrategy.Regex;
			dataRow["来源类型"] = identificationStrategy.SourceName;
			dataRow["系统类型"] = identificationStrategy.TypeLevel;
			dataRow["更新时间"] = identificationStrategy.LastWriteTime.ToString();
			dataTable.Rows.Add(dataRow);
		}
		dataGridView1.DataSource = dataTable;
	}

	private void 添加ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		FileSystemPolicyCreate obj = new FileSystemPolicyCreate
		{
			sourceTypes = sourceTypes
		};
		DialogResult dialogResult = obj.ShowDialog();
		obj.TopMost = true;
		_ = 1;
		obj.Dispose();
		LoadDataViews();
	}

	private void 删除ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (MessageBox.Show("确定删除选择数据吗?", "温馨提示", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes || dataGridView1.SelectedRows.Count <= 0)
		{
			return;
		}
		foreach (DataGridViewRow selectedRow in dataGridView1.SelectedRows)
		{
			// v3.1 fix: 拼完整路径, 不再用 ID 当文件路径
			var id = dataTable.Rows[selectedRow.Index]["ID"]?.ToString();
			if (string.IsNullOrEmpty(id)) continue;
			var strategyFile = Path.Combine(Program.SettingPath, id + ".json");
			if (IdentificationStrategy.DeserializeJson(strategyFile).TypeLevel == UserType.User)
			{
				Utils.DeleteFile(strategyFile);
				dataTable.Rows.RemoveAt(selectedRow.Index);
				Program.setting.IdentificationStrategyList = Utils.LoadSettingsIdentificationStrategy();
			}
			else
			{
				MessageBox.Show("系统配置文件不能删除!", "错误提醒", MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void 编辑ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (dataGridView1.SelectedRows.Count > 0)
		{
			foreach (DataGridViewRow selectedRow in dataGridView1.SelectedRows)
			{
				var id = dataTable.Rows[selectedRow.Index]["ID"]?.ToString();
				if (string.IsNullOrEmpty(id)) continue;
				var strategyFile = Path.Combine(Program.SettingPath, id + ".json");
				IdentificationStrategy identificationStrategy = IdentificationStrategy.DeserializeJson(strategyFile);
				FileSystemPolicyCreate fileSystemPolicyCreate = new FileSystemPolicyCreate
				{
					sourceTypes = sourceTypes
				};
				fileSystemPolicyCreate.identificationStrategy = identificationStrategy;
				if (fileSystemPolicyCreate.ShowDialog() == DialogResult.OK)
				{
					fileSystemPolicyCreate.TopMost = true;
				}
				fileSystemPolicyCreate.Dispose();
			}
		}
		LoadDataViews();
	}

	private void dataGridView1_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
	{
		编辑ToolStripMenuItem_Click(sender, e);
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
		this.components = new System.ComponentModel.Container();
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle = new System.Windows.Forms.DataGridViewCellStyle();
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle2 = new System.Windows.Forms.DataGridViewCellStyle();
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle3 = new System.Windows.Forms.DataGridViewCellStyle();
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle4 = new System.Windows.Forms.DataGridViewCellStyle();
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle5 = new System.Windows.Forms.DataGridViewCellStyle();
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle6 = new System.Windows.Forms.DataGridViewCellStyle();
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle7 = new System.Windows.Forms.DataGridViewCellStyle();
		this.tabPage1 = new System.Windows.Forms.TabPage();
		this.dataGridView1 = new System.Windows.Forms.DataGridView();
		this.contextMenuStrip1 = new System.Windows.Forms.ContextMenuStrip(this.components);
		this.添加ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.编辑ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.删除ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.识别策略 = new System.Windows.Forms.TabControl();
		this.ID = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.名称 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.来源类型 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.规则 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.描述 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.系统类型 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.更新时间 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.tabPage1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).BeginInit();
		this.contextMenuStrip1.SuspendLayout();
		this.识别策略.SuspendLayout();
		base.SuspendLayout();
		this.tabPage1.Controls.Add(this.dataGridView1);
		this.tabPage1.Location = new System.Drawing.Point(4, 25);
		this.tabPage1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.tabPage1.Name = "tabPage1";
		this.tabPage1.Padding = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.tabPage1.Size = new System.Drawing.Size(948, 317);
		this.tabPage1.TabIndex = 0;
		this.tabPage1.Text = "识别策略";
		this.tabPage1.UseVisualStyleBackColor = true;
		this.dataGridView1.AllowUserToAddRows = false;
		this.dataGridView1.AllowUserToDeleteRows = false;
		this.dataGridView1.AllowUserToResizeRows = false;
		this.dataGridView1.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.dataGridView1.Columns.AddRange(this.ID, this.名称, this.来源类型, this.规则, this.描述, this.系统类型, this.更新时间);
		this.dataGridView1.ContextMenuStrip = this.contextMenuStrip1;
		this.dataGridView1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.dataGridView1.Location = new System.Drawing.Point(3, 2);
		this.dataGridView1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.dataGridView1.MultiSelect = false;
		this.dataGridView1.Name = "dataGridView1";
		this.dataGridView1.ReadOnly = true;
		this.dataGridView1.RowHeadersVisible = false;
		this.dataGridView1.RowHeadersWidth = 20;
		this.dataGridView1.RowTemplate.Height = 27;
		this.dataGridView1.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.dataGridView1.Size = new System.Drawing.Size(942, 313);
		this.dataGridView1.TabIndex = 1;
		this.dataGridView1.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(dataGridView1_CellDoubleClick);
		this.contextMenuStrip1.ImageScalingSize = new System.Drawing.Size(20, 20);
		this.contextMenuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.添加ToolStripMenuItem, this.编辑ToolStripMenuItem, this.删除ToolStripMenuItem });
		this.contextMenuStrip1.Name = "contextMenuStrip1";
		this.contextMenuStrip1.Size = new System.Drawing.Size(109, 76);
		this.添加ToolStripMenuItem.Name = "添加ToolStripMenuItem";
		this.添加ToolStripMenuItem.Size = new System.Drawing.Size(108, 24);
		this.添加ToolStripMenuItem.Text = "添加";
		this.添加ToolStripMenuItem.Click += new System.EventHandler(添加ToolStripMenuItem_Click);
		this.编辑ToolStripMenuItem.Name = "编辑ToolStripMenuItem";
		this.编辑ToolStripMenuItem.Size = new System.Drawing.Size(108, 24);
		this.编辑ToolStripMenuItem.Text = "编辑";
		this.编辑ToolStripMenuItem.Click += new System.EventHandler(编辑ToolStripMenuItem_Click);
		this.删除ToolStripMenuItem.Name = "删除ToolStripMenuItem";
		this.删除ToolStripMenuItem.Size = new System.Drawing.Size(108, 24);
		this.删除ToolStripMenuItem.Text = "删除";
		this.删除ToolStripMenuItem.Click += new System.EventHandler(删除ToolStripMenuItem_Click);
		this.识别策略.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.识别策略.Controls.Add(this.tabPage1);
		this.识别策略.Location = new System.Drawing.Point(12, 12);
		this.识别策略.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.识别策略.Name = "识别策略";
		this.识别策略.SelectedIndex = 0;
		this.识别策略.Size = new System.Drawing.Size(956, 346);
		this.识别策略.TabIndex = 0;
		this.ID.DataPropertyName = "ID";
		dataGridViewCellStyle.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle.SelectionForeColor = System.Drawing.Color.Black;
		this.ID.DefaultCellStyle = dataGridViewCellStyle;
		this.ID.FillWeight = 69f;
		this.ID.Frozen = true;
		this.ID.HeaderText = "ID";
		this.ID.MinimumWidth = 6;
		this.ID.Name = "ID";
		this.ID.ReadOnly = true;
		this.ID.Width = 69;
		this.名称.DataPropertyName = "名称";
		dataGridViewCellStyle2.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle2.SelectionForeColor = System.Drawing.Color.Black;
		this.名称.DefaultCellStyle = dataGridViewCellStyle2;
		this.名称.FillWeight = 210f;
		this.名称.Frozen = true;
		this.名称.HeaderText = "名称";
		this.名称.MinimumWidth = 6;
		this.名称.Name = "名称";
		this.名称.ReadOnly = true;
		this.名称.Width = 210;
		this.来源类型.DataPropertyName = "来源类型";
		dataGridViewCellStyle3.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle3.SelectionForeColor = System.Drawing.Color.Black;
		this.来源类型.DefaultCellStyle = dataGridViewCellStyle3;
		this.来源类型.Frozen = true;
		this.来源类型.HeaderText = "来源类型";
		this.来源类型.MinimumWidth = 6;
		this.来源类型.Name = "来源类型";
		this.来源类型.ReadOnly = true;
		this.来源类型.Width = 125;
		this.规则.DataPropertyName = "规则";
		dataGridViewCellStyle4.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle4.SelectionForeColor = System.Drawing.Color.Black;
		this.规则.DefaultCellStyle = dataGridViewCellStyle4;
		this.规则.Frozen = true;
		this.规则.HeaderText = "规则";
		this.规则.MinimumWidth = 6;
		this.规则.Name = "规则";
		this.规则.ReadOnly = true;
		this.规则.Width = 125;
		this.描述.DataPropertyName = "描述";
		dataGridViewCellStyle5.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle5.SelectionForeColor = System.Drawing.Color.Black;
		this.描述.DefaultCellStyle = dataGridViewCellStyle5;
		this.描述.Frozen = true;
		this.描述.HeaderText = "描述";
		this.描述.MinimumWidth = 6;
		this.描述.Name = "描述";
		this.描述.ReadOnly = true;
		this.描述.Width = 125;
		this.系统类型.DataPropertyName = "系统类型";
		dataGridViewCellStyle6.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle6.SelectionForeColor = System.Drawing.Color.Black;
		this.系统类型.DefaultCellStyle = dataGridViewCellStyle6;
		this.系统类型.FillWeight = 126f;
		this.系统类型.Frozen = true;
		this.系统类型.HeaderText = "系统类型";
		this.系统类型.MinimumWidth = 6;
		this.系统类型.Name = "系统类型";
		this.系统类型.ReadOnly = true;
		this.系统类型.Resizable = System.Windows.Forms.DataGridViewTriState.False;
		this.系统类型.Width = 126;
		this.更新时间.DataPropertyName = "更新时间";
		dataGridViewCellStyle7.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle7.SelectionForeColor = System.Drawing.Color.Black;
		this.更新时间.DefaultCellStyle = dataGridViewCellStyle7;
		this.更新时间.Frozen = true;
		this.更新时间.HeaderText = "更新时间";
		this.更新时间.MinimumWidth = 6;
		this.更新时间.Name = "更新时间";
		this.更新时间.ReadOnly = true;
		this.更新时间.Width = 125;
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 15f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(980, 372);
		base.Controls.Add(this.识别策略);
		base.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "FileSysSetting";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "系统设置";
		base.Load += new System.EventHandler(FileSysSetting_Load);
		this.tabPage1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).EndInit();
		this.contextMenuStrip1.ResumeLayout(false);
		this.识别策略.ResumeLayout(false);
		base.ResumeLayout(false);
	}
}
