using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;
using WakeupHelper.Model;
using WakeupHelper.Model.System;
using WakeupHelper.libs;

namespace WakeupHelper.View;

public class ToolIncorrectWordList : Form
{
	private DataTable dataTable;

	private IContainer components;

	private Panel panel1;

	private DataGridView dataGridView1;

	private ContextMenuStrip contextMenuStrip1;

	private ToolStripMenuItem 编辑ToolStripMenuItem;

	private ToolStripMenuItem 删除ToolStripMenuItem;

	private ToolStripMenuItem toolStripMenuItem1;

	private ToolStripSeparator toolStripMenuItem2;

	private ToolStripMenuItem 导出ToolStripMenuItem;

	private DataGridViewTextBoxColumn id;

	private DataGridViewTextBoxColumn name;

	private DataGridViewTextBoxColumn rightCount;

	private DataGridViewTextBoxColumn errorCount;

	private DataGridViewTextBoxColumn cretaedAt;

	public event ChangeConfigDelegate ChangeConfig;

	public ToolIncorrectWordList()
	{
		InitializeComponent();
		WakeupHelper.libs.Theme.ApplyTo(this);
		dataGridView1.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
		LoadDataViews();
	}

	public void LoadDataViews()
	{
		Program.setting.ErrorCorrectionList = Utils.LoadErrorCorrectionPolicy();
		dataTable = new DataTable();
		dataTable.Columns.Add("ID", typeof(string));
		dataTable.Columns.Add("词库名称", typeof(string));
		dataTable.Columns.Add("纠错词数", typeof(string));
		dataTable.Columns.Add("错词数", typeof(string));
		dataTable.Columns.Add("更新时间", typeof(string));
		foreach (ErrorCorrection errorCorrection in Program.setting.ErrorCorrectionList)
		{
			DataRow dataRow = dataTable.NewRow();
			dataRow["ID"] = errorCorrection.Id;
			dataRow["词库名称"] = errorCorrection.Name;
			dataRow["纠错词数"] = errorCorrection.RightWordCount;
			dataRow["错词数"] = errorCorrection.ErrorWordCount;
			dataRow["更新时间"] = errorCorrection.LastWriteTime.ToString();
			dataTable.Rows.Add(dataRow);
		}
		dataGridView1.DataSource = dataTable;
	}

	private void toolStripMenuItem1_Click(object sender, EventArgs e)
	{
		if (new ToolIncorrectWordCreate().ShowDialog() == DialogResult.OK)
		{
			LoadDataViews();
		}
		this.ChangeConfig?.Invoke("Change Config!");
	}

	private void 编辑ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (dataGridView1.SelectedRows.Count > 0)
		{
			foreach (DataGridViewRow selectedRow in dataGridView1.SelectedRows)
			{
				ErrorCorrection errorCorrection = ErrorCorrection.DeserializeJson(Program.IncorrectPath + dataTable.Rows[selectedRow.Index]["ID"]?.ToString() + ".json");
				ToolIncorrectWordCreate obj = new ToolIncorrectWordCreate
				{
					errorCorrection = errorCorrection
				};
				if (obj.ShowDialog() == DialogResult.OK)
				{
					LoadDataViews();
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
				ErrorCorrection.DeserializeJson(Program.IncorrectPath + dataTable.Rows[selectedRow.Index]["ID"]?.ToString() + ".json");
				Utils.DeleteFile(Program.IncorrectPath + dataTable.Rows[selectedRow.Index]["ID"]?.ToString() + ".json");
				dataTable.Rows.RemoveAt(selectedRow.Index);
				LoadDataViews();
			}
		}
		this.ChangeConfig?.Invoke("Change Config!");
	}

	private void 导出ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		ErrorCorrection errorCorrection = null;
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = "Text Files (*.txt)|*.txt";
		if (saveFileDialog.ShowDialog() != DialogResult.OK)
		{
			return;
		}
		string fileName = saveFileDialog.FileName;
		if (dataGridView1.SelectedRows.Count > 0)
		{
			{
				IEnumerator enumerator = dataGridView1.SelectedRows.GetEnumerator();
				try
				{
					if (enumerator.MoveNext())
					{
						DataGridViewRow dataGridViewRow = (DataGridViewRow)enumerator.Current;
						errorCorrection = ErrorCorrection.DeserializeJson(Program.IncorrectPath + dataTable.Rows[dataGridViewRow.Index]["ID"]?.ToString() + ".json");
					}
				}
				finally
				{
					IDisposable disposable = enumerator as IDisposable;
					if (disposable != null)
					{
						disposable.Dispose();
					}
				}
			}
		}
		try
		{
			if (errorCorrection != null)
			{
				using (StreamWriter streamWriter = new FileInfo(fileName).CreateText())
				{
					streamWriter.WriteLine("###################################################################");
					streamWriter.WriteLine("#");
					streamWriter.WriteLine("# 互催文案助手 v2.0 生成");
					streamWriter.WriteLine("# ");
					streamWriter.WriteLine("# 修改文件时请按照 [纠错词 : 错词] 使用冒号分割；中文英文冒号皆可；冒号两边有无空格皆可；不能以井号'#'开头。");
					streamWriter.WriteLine("# ");
					streamWriter.WriteLine("# 名称：" + errorCorrection.Name + ", 纠错词数：" + errorCorrection.RightWordCount + " 个, 错词数：" + errorCorrection.ErrorWordCount + " 个。");
					streamWriter.WriteLine("#");
					streamWriter.WriteLine("###################################################################\n");
					streamWriter.WriteLine("## 纠错词 : 错词 ##\n");
					int num = 0;
					foreach (KeyValuePair<string, ErrorCorrectionWord> item in errorCorrection.ErrorWordDictionary)
					{
						num++;
						streamWriter.WriteLine("# " + num);
						streamWriter.WriteLine("---------");
						foreach (string item2 in item.Value.ErrorWordList.OrderBy((string s) => s).ToList())
						{
							streamWriter.WriteLine(item.Key + " : " + item2);
						}
						streamWriter.WriteLine("\n");
					}
				}
				MessageBox.Show("“" + errorCorrection.Name + "” 导出成功！", "操作提醒", MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
			}
			Console.WriteLine("文件成功导出为: " + fileName);
		}
		catch (Exception ex)
		{
			Console.WriteLine("导出文件时出现错误: " + ex.Message);
		}
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
		System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle7 = new System.Windows.Forms.DataGridViewCellStyle();
		this.panel1 = new System.Windows.Forms.Panel();
		this.dataGridView1 = new System.Windows.Forms.DataGridView();
		this.contextMenuStrip1 = new System.Windows.Forms.ContextMenuStrip(this.components);
		this.toolStripMenuItem1 = new System.Windows.Forms.ToolStripMenuItem();
		this.编辑ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.删除ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.toolStripMenuItem2 = new System.Windows.Forms.ToolStripSeparator();
		this.导出ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.id = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.name = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.rightCount = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.errorCount = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.cretaedAt = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.panel1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).BeginInit();
		this.contextMenuStrip1.SuspendLayout();
		base.SuspendLayout();
		this.panel1.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.panel1.Controls.Add(this.dataGridView1);
		this.panel1.Location = new System.Drawing.Point(15, 16);
		this.panel1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.panel1.Name = "panel1";
		this.panel1.Size = new System.Drawing.Size(697, 308);
		this.panel1.TabIndex = 0;
		this.dataGridView1.AllowUserToAddRows = false;
		this.dataGridView1.AllowUserToDeleteRows = false;
		this.dataGridView1.AllowUserToResizeRows = false;
		dataGridViewCellStyle.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleLeft;
		dataGridViewCellStyle.BackColor = System.Drawing.SystemColors.Control;
		dataGridViewCellStyle.Font = new System.Drawing.Font("宋体", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		dataGridViewCellStyle.ForeColor = System.Drawing.SystemColors.WindowText;
		dataGridViewCellStyle.SelectionBackColor = System.Drawing.SystemColors.Highlight;
		dataGridViewCellStyle.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
		dataGridViewCellStyle.WrapMode = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridView1.ColumnHeadersDefaultCellStyle = dataGridViewCellStyle;
		this.dataGridView1.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.dataGridView1.Columns.AddRange(this.id, this.name, this.rightCount, this.errorCount, this.cretaedAt);
		this.dataGridView1.ContextMenuStrip = this.contextMenuStrip1;
		this.dataGridView1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.dataGridView1.Location = new System.Drawing.Point(0, 0);
		this.dataGridView1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.dataGridView1.MultiSelect = false;
		this.dataGridView1.Name = "dataGridView1";
		this.dataGridView1.ReadOnly = true;
		dataGridViewCellStyle2.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleLeft;
		dataGridViewCellStyle2.BackColor = System.Drawing.SystemColors.Control;
		dataGridViewCellStyle2.Font = new System.Drawing.Font("宋体", 10.8f, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, 134);
		dataGridViewCellStyle2.ForeColor = System.Drawing.SystemColors.WindowText;
		dataGridViewCellStyle2.SelectionBackColor = System.Drawing.Color.Empty;
		dataGridViewCellStyle2.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
		dataGridViewCellStyle2.WrapMode = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridView1.RowHeadersDefaultCellStyle = dataGridViewCellStyle2;
		this.dataGridView1.RowHeadersVisible = false;
		this.dataGridView1.RowHeadersWidth = 51;
		this.dataGridView1.RowTemplate.Height = 27;
		this.dataGridView1.Size = new System.Drawing.Size(697, 308);
		this.dataGridView1.TabIndex = 0;
		this.dataGridView1.CellDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(dataGridView1_CellDoubleClick);
		this.contextMenuStrip1.ImageScalingSize = new System.Drawing.Size(20, 20);
		this.contextMenuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[5] { this.toolStripMenuItem1, this.编辑ToolStripMenuItem, this.删除ToolStripMenuItem, this.toolStripMenuItem2, this.导出ToolStripMenuItem });
		this.contextMenuStrip1.Name = "contextMenuStrip1";
		this.contextMenuStrip1.Size = new System.Drawing.Size(109, 106);
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
		this.toolStripMenuItem2.Name = "toolStripMenuItem2";
		this.toolStripMenuItem2.Size = new System.Drawing.Size(105, 6);
		this.导出ToolStripMenuItem.Name = "导出ToolStripMenuItem";
		this.导出ToolStripMenuItem.Size = new System.Drawing.Size(108, 24);
		this.导出ToolStripMenuItem.Text = "导出";
		this.导出ToolStripMenuItem.Click += new System.EventHandler(导出ToolStripMenuItem_Click);
		this.id.DataPropertyName = "Id";
		dataGridViewCellStyle3.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle3.SelectionForeColor = System.Drawing.Color.Black;
		this.id.DefaultCellStyle = dataGridViewCellStyle3;
		this.id.FillWeight = 77f;
		this.id.Frozen = true;
		this.id.HeaderText = "ID";
		this.id.MinimumWidth = 6;
		this.id.Name = "id";
		this.id.ReadOnly = true;
		this.id.Width = 77;
		this.name.DataPropertyName = "词库名称";
		dataGridViewCellStyle4.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle4.SelectionForeColor = System.Drawing.Color.Black;
		this.name.DefaultCellStyle = dataGridViewCellStyle4;
		this.name.FillWeight = 139f;
		this.name.Frozen = true;
		this.name.HeaderText = "词库名称";
		this.name.MinimumWidth = 6;
		this.name.Name = "name";
		this.name.ReadOnly = true;
		this.name.Width = 139;
		this.rightCount.DataPropertyName = "纠错词数";
		dataGridViewCellStyle5.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle5.SelectionForeColor = System.Drawing.Color.Black;
		this.rightCount.DefaultCellStyle = dataGridViewCellStyle5;
		this.rightCount.FillWeight = 77f;
		this.rightCount.Frozen = true;
		this.rightCount.HeaderText = "纠错词数";
		this.rightCount.MinimumWidth = 6;
		this.rightCount.Name = "rightCount";
		this.rightCount.ReadOnly = true;
		this.rightCount.Width = 77;
		this.errorCount.DataPropertyName = "错词数";
		dataGridViewCellStyle6.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle6.SelectionForeColor = System.Drawing.Color.Black;
		this.errorCount.DefaultCellStyle = dataGridViewCellStyle6;
		this.errorCount.FillWeight = 72f;
		this.errorCount.Frozen = true;
		this.errorCount.HeaderText = "错词数";
		this.errorCount.MinimumWidth = 6;
		this.errorCount.Name = "errorCount";
		this.errorCount.ReadOnly = true;
		this.errorCount.Width = 72;
		this.cretaedAt.DataPropertyName = "更新时间";
		dataGridViewCellStyle7.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle7.SelectionForeColor = System.Drawing.Color.Black;
		this.cretaedAt.DefaultCellStyle = dataGridViewCellStyle7;
		this.cretaedAt.Frozen = true;
		this.cretaedAt.HeaderText = "更新时间";
		this.cretaedAt.MinimumWidth = 6;
		this.cretaedAt.Name = "cretaedAt";
		this.cretaedAt.ReadOnly = true;
		this.cretaedAt.Width = 125;
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 15f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(724, 336);
		base.Controls.Add(this.panel1);
		base.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "ToolIncorrectWordList";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "错词纠正库管理";
		this.panel1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).EndInit();
		this.contextMenuStrip1.ResumeLayout(false);
		base.ResumeLayout(false);
	}
}
