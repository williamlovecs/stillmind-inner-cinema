using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using WakeupHelper;
using WakeupHelper.Model;
using WakeupHelper.Model.System;
using WakeupHelper.libs;

namespace WakeupHelper.View.Tool.template;

public class ToolWriterTemplateList : Form
{
	private DataTable dataTable;

	private IContainer components;

	private Panel panel1;

	private DataGridView dataGridView1;

	private ContextMenuStrip contextMenuStrip1;

	private ToolStripMenuItem 编辑ToolStripMenuItem;

	private ToolStripMenuItem 删除ToolStripMenuItem;

	private ToolStripMenuItem toolStripMenuItem1;

	private DataGridViewTextBoxColumn id;

	private DataGridViewTextBoxColumn name;

	private DataGridViewTextBoxColumn 识别策略;

	private DataGridViewTextBoxColumn 类型;

	private DataGridViewTextBoxColumn 更新时间;

	private DataGridViewTextBoxColumn description;

	public event ChangeConfigDelegate ChangeConfig;

	public ToolWriterTemplateList()
	{
		InitializeComponent();
		WakeupHelper.libs.Theme.ApplyTo(this);
	}

	public void LoadDataViews()
	{
		Program.setting.DocumentTemplateList = Utils.LoadDocmentTemplatePolicy();
		dataTable = new DataTable();
		dataTable.Columns.Add("ID", typeof(string));
		dataTable.Columns.Add("名称", typeof(string));
		dataTable.Columns.Add("识别策略", typeof(string));
		dataTable.Columns.Add("类型", typeof(string));
		dataTable.Columns.Add("描述", typeof(string));
		dataTable.Columns.Add("更新时间", typeof(string));
		foreach (DocumentTemplate documentTemplate in Program.setting.DocumentTemplateList)
		{
			DataRow dataRow = dataTable.NewRow();
			dataRow["ID"] = documentTemplate.Id;
			dataRow["名称"] = documentTemplate.Name;
			dataRow["识别策略"] = documentTemplate.PolicyName;
			dataRow["类型"] = documentTemplate.TypeLevel;
			dataRow["描述"] = documentTemplate.Description;
			dataRow["更新时间"] = documentTemplate.LastWriteTime.ToString();
			dataTable.Rows.Add(dataRow);
		}
		dataGridView1.DataSource = dataTable;
	}

	private void toolStripMenuItem1_Click(object sender, EventArgs e)
	{
		new ToolWriterTempleCreate().ShowDialog();
		_ = 1;
		LoadDataViews();
		this.ChangeConfig?.Invoke("Change Config!");
	}

	private void 编辑ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (dataGridView1.SelectedRows.Count > 0)
		{
			foreach (DataGridViewRow selectedRow in dataGridView1.SelectedRows)
			{
				DocumentTemplate documentTemplate = DocumentTemplate.DeserializeJson(Path.Combine(Program.TemplatePath, dataTable.Rows[selectedRow.Index]["ID"].ToString() + ".json"));
				ToolWriterTempleCreate obj = new ToolWriterTempleCreate
				{
					documentTemplate = documentTemplate
				};
				if (obj.ShowDialog() == DialogResult.OK)
				{
					Program.setting.DocumentTemplateList = Utils.LoadDocmentTemplatePolicy();
				}
				obj.Dispose();
			}
		}
		LoadDataViews();
		this.ChangeConfig?.Invoke("Change Config!");
	}

	private void 删除ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (MessageBox.Show("确定删除选择数据吗?", "温馨提示", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes && dataGridView1.SelectedRows.Count > 0)
		{
			foreach (DataGridViewRow selectedRow in dataGridView1.SelectedRows)
			{
				if (DocumentTemplate.DeserializeJson(Path.Combine(Program.TemplatePath, dataTable.Rows[selectedRow.Index]["ID"].ToString() + ".json")).TypeLevel == UserType.User)
				{
					Utils.DeleteFile(Path.Combine(Program.TemplatePath, dataTable.Rows[selectedRow.Index]["ID"].ToString() + ".json"));
					dataTable.Rows.RemoveAt(selectedRow.Index);
					Program.setting.DocumentTemplateList = Utils.LoadDocmentTemplatePolicy();
				}
				else
				{
					MessageBox.Show("系统配置文件不能删除!", "错误提醒", MessageBoxButtons.OK, MessageBoxIcon.Hand);
				}
			}
		}
		this.ChangeConfig?.Invoke("Change Config!");
	}

	private void ToolWriterTemplateList_Load(object sender, EventArgs e)
	{
		LoadDataViews();
	}

	private void dataGridView1_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
	{
		编辑ToolStripMenuItem_Click(sender, e);
		this.ChangeConfig?.Invoke("Change Config!");
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
		this.panel1 = new System.Windows.Forms.Panel();
		this.dataGridView1 = new System.Windows.Forms.DataGridView();
		this.contextMenuStrip1 = new System.Windows.Forms.ContextMenuStrip(this.components);
		this.toolStripMenuItem1 = new System.Windows.Forms.ToolStripMenuItem();
		this.编辑ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.删除ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.id = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.name = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.识别策略 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.类型 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.更新时间 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.description = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.panel1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).BeginInit();
		this.contextMenuStrip1.SuspendLayout();
		base.SuspendLayout();
		this.panel1.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.panel1.Controls.Add(this.dataGridView1);
		this.panel1.Location = new System.Drawing.Point(11, 10);
		this.panel1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.panel1.Name = "panel1";
		this.panel1.Size = new System.Drawing.Size(764, 355);
		this.panel1.TabIndex = 0;
		this.dataGridView1.AllowUserToAddRows = false;
		this.dataGridView1.AllowUserToDeleteRows = false;
		this.dataGridView1.AllowUserToResizeRows = false;
		this.dataGridView1.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.dataGridView1.Columns.AddRange(this.id, this.name, this.识别策略, this.类型, this.更新时间, this.description);
		this.dataGridView1.ContextMenuStrip = this.contextMenuStrip1;
		this.dataGridView1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.dataGridView1.Location = new System.Drawing.Point(0, 0);
		this.dataGridView1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.dataGridView1.MultiSelect = false;
		this.dataGridView1.Name = "dataGridView1";
		this.dataGridView1.ReadOnly = true;
		this.dataGridView1.RowHeadersVisible = false;
		this.dataGridView1.RowHeadersWidth = 62;
		this.dataGridView1.RowTemplate.Height = 30;
		this.dataGridView1.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.dataGridView1.Size = new System.Drawing.Size(764, 355);
		this.dataGridView1.TabIndex = 0;
		this.dataGridView1.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(dataGridView1_CellDoubleClick);
		this.contextMenuStrip1.ImageScalingSize = new System.Drawing.Size(24, 24);
		this.contextMenuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[3] { this.toolStripMenuItem1, this.编辑ToolStripMenuItem, this.删除ToolStripMenuItem });
		this.contextMenuStrip1.Name = "contextMenuStrip1";
		this.contextMenuStrip1.Size = new System.Drawing.Size(109, 76);
		this.toolStripMenuItem1.Name = "toolStripMenuItem1";
		this.toolStripMenuItem1.Size = new System.Drawing.Size(108, 24);
		this.toolStripMenuItem1.Text = "添加";
		this.toolStripMenuItem1.Click += new System.EventHandler(toolStripMenuItem1_Click);
		this.编辑ToolStripMenuItem.Name = "编辑ToolStripMenuItem";
		this.编辑ToolStripMenuItem.Size = new System.Drawing.Size(108, 24);
		this.编辑ToolStripMenuItem.Text = "编辑";
		this.编辑ToolStripMenuItem.Click += new System.EventHandler(编辑ToolStripMenuItem_Click);
		this.删除ToolStripMenuItem.Name = "删除ToolStripMenuItem";
		this.删除ToolStripMenuItem.Size = new System.Drawing.Size(108, 24);
		this.删除ToolStripMenuItem.Text = "删除";
		this.删除ToolStripMenuItem.Click += new System.EventHandler(删除ToolStripMenuItem_Click);
		this.id.DataPropertyName = "Id";
		dataGridViewCellStyle.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle.SelectionForeColor = System.Drawing.Color.Black;
		this.id.DefaultCellStyle = dataGridViewCellStyle;
		this.id.FillWeight = 69f;
		this.id.Frozen = true;
		this.id.HeaderText = "ID";
		this.id.MinimumWidth = 8;
		this.id.Name = "id";
		this.id.ReadOnly = true;
		this.id.Width = 69;
		this.name.DataPropertyName = "名称";
		dataGridViewCellStyle2.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle2.SelectionForeColor = System.Drawing.Color.Black;
		this.name.DefaultCellStyle = dataGridViewCellStyle2;
		this.name.FillWeight = 126f;
		this.name.Frozen = true;
		this.name.HeaderText = "名称";
		this.name.MinimumWidth = 8;
		this.name.Name = "name";
		this.name.ReadOnly = true;
		this.name.Width = 126;
		this.识别策略.DataPropertyName = "识别策略";
		dataGridViewCellStyle3.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle3.SelectionForeColor = System.Drawing.Color.Black;
		this.识别策略.DefaultCellStyle = dataGridViewCellStyle3;
		this.识别策略.Frozen = true;
		this.识别策略.HeaderText = "识别策略";
		this.识别策略.MinimumWidth = 6;
		this.识别策略.Name = "识别策略";
		this.识别策略.ReadOnly = true;
		this.识别策略.Width = 125;
		this.类型.DataPropertyName = "类型";
		dataGridViewCellStyle4.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle4.SelectionForeColor = System.Drawing.Color.Black;
		this.类型.DefaultCellStyle = dataGridViewCellStyle4;
		this.类型.Frozen = true;
		this.类型.HeaderText = "类型";
		this.类型.MinimumWidth = 6;
		this.类型.Name = "类型";
		this.类型.ReadOnly = true;
		this.类型.Width = 125;
		this.更新时间.DataPropertyName = "更新时间";
		dataGridViewCellStyle5.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle5.SelectionForeColor = System.Drawing.Color.Black;
		this.更新时间.DefaultCellStyle = dataGridViewCellStyle5;
		this.更新时间.Frozen = true;
		this.更新时间.HeaderText = "更新时间";
		this.更新时间.MinimumWidth = 8;
		this.更新时间.Name = "更新时间";
		this.更新时间.ReadOnly = true;
		this.更新时间.Width = 150;
		this.description.DataPropertyName = "描述";
		dataGridViewCellStyle6.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle6.SelectionForeColor = System.Drawing.Color.Black;
		this.description.DefaultCellStyle = dataGridViewCellStyle6;
		this.description.FillWeight = 489f;
		this.description.Frozen = true;
		this.description.HeaderText = "描述";
		this.description.MinimumWidth = 8;
		this.description.Name = "description";
		this.description.ReadOnly = true;
		this.description.Width = 489;
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 15f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(785, 372);
		base.Controls.Add(this.panel1);
		base.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "ToolWriterTemplateList";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "文案模板管理";
		base.Load += new System.EventHandler(ToolWriterTemplateList_Load);
		this.panel1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).EndInit();
		this.contextMenuStrip1.ResumeLayout(false);
		base.ResumeLayout(false);
	}
}
