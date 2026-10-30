using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;
using WakeupHelper.Model;
using WakeupHelper.View.Tool.incorrect;

namespace WakeupHelper.View;

public class ToolIncorrectWordCreate : Form
{
	public ErrorCorrection errorCorrection;

	public FileInfo importFilePath;

	private DataTable dataTable;

	private int rightWordCount;

	private int errorWrodCount;

	private Dictionary<string, List<string>> keyValueErrorWordPairs = new Dictionary<string, List<string>>();

	private IContainer components;

	private Button btnBrowse;

	private TextBox txtFilePath;

	private Label label1;

	private Label label2;

	private TextBox txtName;

	private Panel panel1;

	private DataGridView dataGridView1;

	private Button btnSave;

	private ContextMenuStrip contextMenuStrip1;

	private ToolStripMenuItem 添加ToolStripMenuItem;

	private ToolStripMenuItem 编辑ToolStripMenuItem;

	private ToolStripMenuItem 删除ToolStripMenuItem;

	private DataGridViewTextBoxColumn id;

	private DataGridViewTextBoxColumn rightword;

	private DataGridViewTextBoxColumn errorword;

	public ToolIncorrectWordCreate()
	{
		InitializeComponent();
		WakeupHelper.libs.Theme.ApplyTo(this);
	}

	public void LoadDataViews()
	{
		dataTable = new DataTable();
		dataTable.Columns.Add("编号", typeof(int));
		dataTable.Columns.Add("纠错词", typeof(string));
		dataTable.Columns.Add("错词", typeof(string));
		errorWrodCount = 0;
		if (errorCorrection != null && errorCorrection.ErrorWordDictionary != null)
		{
			rightWordCount = errorCorrection.ErrorWordDictionary.Count;
			foreach (KeyValuePair<string, ErrorCorrectionWord> item in errorCorrection.ErrorWordDictionary)
			{
				DataRow dataRow = dataTable.NewRow();
				dataRow["编号"] = item.Value.Index;
				dataRow["纠错词"] = item.Value.RightWord;
				dataRow["错词"] = string.Join("、", item.Value.ErrorWordList);
				dataTable.Rows.Add(dataRow);
				errorWrodCount += item.Value.ErrorWordList.Count;
			}
		}
		dataGridView1.DataSource = dataTable;
	}

	private void ToolIncorrectWordCreate_Load(object sender, EventArgs e)
	{
		if (errorCorrection != null)
		{
			txtName.Text = errorCorrection.Name;
			LoadDataViews();
		}
	}

	private void btnSave_Click(object sender, EventArgs e)
	{
		if (string.IsNullOrEmpty(txtName.Text))
		{
			txtName.Focus();
			MessageBox.Show("词库名称不能为空！", "错误提醒", MessageBoxButtons.OKCancel, MessageBoxIcon.Question);
			return;
		}
		if (errorCorrection != null)
		{
			errorCorrection.Name = txtName.Text;
			string filePath = Program.IncorrectPath + errorCorrection.Id + ".json";
			errorCorrection.RightWordCount = rightWordCount;
			errorCorrection.ErrorWordCount = errorWrodCount;
			ErrorCorrection.SerializeJson(errorCorrection, filePath);
		}
		else
		{
			errorCorrection = new ErrorCorrection
			{
				ErrorWordDictionary = new Dictionary<string, ErrorCorrectionWord>(),
				Name = txtName.Text,
				Id = Guid.NewGuid().ToString("N"),
				RightWordCount = rightWordCount,
				ErrorWordCount = errorWrodCount
			};
			string filePath2 = Program.IncorrectPath + errorCorrection.Id + ".json";
			ErrorCorrection.SerializeJson(errorCorrection, filePath2);
		}
		base.DialogResult = DialogResult.OK;
	}

	private void btnBrowse_Click(object sender, EventArgs e)
	{
		using OpenFileDialog openFileDialog = new OpenFileDialog();
		openFileDialog.InitialDirectory = "c:\\";
		openFileDialog.Filter = "txt (*.txt)|*.txt";
		openFileDialog.FilterIndex = 2;
		openFileDialog.RestoreDirectory = false;
		if (openFileDialog.ShowDialog() != DialogResult.OK)
		{
			return;
		}
		txtFilePath.Text = openFileDialog.FileName;
		importFilePath = new FileInfo(openFileDialog.FileName);
		if (!importFilePath.Exists)
		{
			return;
		}
		if (errorCorrection == null)
		{
			errorCorrection = new ErrorCorrection
			{
				ErrorWordDictionary = new Dictionary<string, ErrorCorrectionWord>(),
				Name = txtName.Text,
				Id = Guid.NewGuid().ToString("N")
			};
		}
		using StreamReader streamReader = importFilePath.OpenText();
		int num = 0;
		string text;
		while ((text = streamReader.ReadLine()) != null)
		{
			if (text.StartsWith("#") || text.StartsWith("--"))
			{
				continue;
			}
			char c = '\0';
			if (text.Contains("："))
			{
				c = '：';
			}
			else if (text.Contains(":"))
			{
				c = ':';
			}
			if (c == '\0')
			{
				continue;
			}
			num++;
			int num2 = text.IndexOf(c);
			int num3 = text.LastIndexOf(c);
			if (num2 != -1 && num3 == num2)
			{
				string[] array = text.Split(c);
				string text2 = array[0].Trim();
				string item = array[1].Trim();
				if (!errorCorrection.ErrorWordDictionary.ContainsKey(text2))
				{
					errorCorrection.ErrorWordDictionary[text2] = new ErrorCorrectionWord
					{
						Index = num,
						RightWord = text2,
						ErrorWordList = new List<string>()
					};
				}
				if (!errorCorrection.ErrorWordDictionary[text2].ErrorWordList.Contains(item))
				{
					errorCorrection.ErrorWordDictionary[text2].ErrorWordList.Add(item);
				}
			}
		}
		LoadDataViews();
	}

	private void 添加ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		WordEditFrm wordEditFrm = new WordEditFrm();
		if (wordEditFrm.ShowDialog() == DialogResult.OK)
		{
			ErrorCorrectionWord errorCorrectionWord = (ErrorCorrectionWord)wordEditFrm.Tag;
			errorCorrectionWord.Index = errorCorrection.RightWordCount + 1;
			if (errorCorrection == null)
			{
				errorCorrection = new ErrorCorrection
				{
					ErrorWordDictionary = new Dictionary<string, ErrorCorrectionWord>(),
					Name = txtName.Text,
					Id = Guid.NewGuid().ToString("N")
				};
			}
			if (errorCorrection.ErrorWordDictionary.ContainsKey(errorCorrectionWord.RightWord))
			{
				List<string> errorWordList = errorCorrection.ErrorWordDictionary[errorCorrectionWord.RightWord].ErrorWordList.Union(errorCorrectionWord.ErrorWordList).ToList();
				errorCorrection.ErrorWordDictionary[errorCorrectionWord.RightWord].ErrorWordList = errorWordList;
			}
			else
			{
				errorCorrection.ErrorWordDictionary[errorCorrectionWord.RightWord] = errorCorrectionWord;
			}
			ErrorCorrection.SerializeJson(errorCorrection, Path.Combine(Program.IncorrectPath, errorCorrection.Id + ".json"));
			LoadDataViews();
		}
	}

	private void 编辑ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (dataGridView1.SelectedRows.Count > 0)
		{
			foreach (DataGridViewRow selectedRow in dataGridView1.SelectedRows)
			{
				WordEditFrm wordEditFrm = new WordEditFrm();
				int index = int.Parse(dataTable.Rows[selectedRow.Index][0].ToString());
				string text = (string)dataTable.Rows[selectedRow.Index]["纠错词"];
				ErrorCorrectionWord errorCorrectionWord = new ErrorCorrectionWord
				{
					Index = index,
					RightWord = text,
					ErrorWordList = errorCorrection.ErrorWordDictionary[text].ErrorWordList
				};
				wordEditFrm.errorCorrectionWord = errorCorrectionWord;
				if (wordEditFrm.ShowDialog() == DialogResult.OK)
				{
					errorCorrectionWord = (ErrorCorrectionWord)wordEditFrm.Tag;
					if (errorCorrection.ErrorWordDictionary.ContainsKey(errorCorrectionWord.RightWord))
					{
						errorCorrection.ErrorWordDictionary[errorCorrectionWord.RightWord] = errorCorrectionWord;
					}
					else
					{
						errorCorrection.ErrorWordDictionary.Add(errorCorrectionWord.RightWord, errorCorrectionWord);
					}
					ErrorCorrection.SerializeJson(errorCorrection, Path.Combine(Program.IncorrectPath, errorCorrection.Id + ".json"));
				}
			}
		}
		LoadDataViews();
	}

	private void 删除ToolStripMenuItem_Click(object sender, EventArgs e)
	{
		if (MessageBox.Show("确定删除选择数据吗?", "温馨提示", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes)
		{
			return;
		}
		if (dataGridView1.SelectedRows.Count > 0)
		{
			foreach (DataGridViewRow selectedRow in dataGridView1.SelectedRows)
			{
				string key = (string)dataTable.Rows[selectedRow.Index]["纠错词"];
				if (errorCorrection != null && errorCorrection.ErrorWordDictionary.ContainsKey(key))
				{
					ErrorCorrectionWord errorCorrectionWord = errorCorrection.ErrorWordDictionary[key];
					errorCorrection.ErrorWordDictionary.Remove(key);
					string filePath = Program.IncorrectPath + errorCorrection.Id + ".json";
					errorCorrection.RightWordCount = rightWordCount - 1;
					errorCorrection.ErrorWordCount = errorWrodCount - errorCorrectionWord.ErrorWordList.Count;
					ErrorCorrection.SerializeJson(errorCorrection, filePath);
				}
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
		this.btnBrowse = new System.Windows.Forms.Button();
		this.txtFilePath = new System.Windows.Forms.TextBox();
		this.label1 = new System.Windows.Forms.Label();
		this.label2 = new System.Windows.Forms.Label();
		this.txtName = new System.Windows.Forms.TextBox();
		this.panel1 = new System.Windows.Forms.Panel();
		this.dataGridView1 = new System.Windows.Forms.DataGridView();
		this.contextMenuStrip1 = new System.Windows.Forms.ContextMenuStrip(this.components);
		this.添加ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.编辑ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.删除ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
		this.btnSave = new System.Windows.Forms.Button();
		this.id = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.rightword = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.errorword = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.panel1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).BeginInit();
		this.contextMenuStrip1.SuspendLayout();
		base.SuspendLayout();
		this.btnBrowse.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Right;
		this.btnBrowse.Location = new System.Drawing.Point(499, 54);
		this.btnBrowse.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.btnBrowse.Name = "btnBrowse";
		this.btnBrowse.Size = new System.Drawing.Size(156, 30);
		this.btnBrowse.TabIndex = 6;
		this.btnBrowse.Text = "导入词库";
		this.btnBrowse.UseVisualStyleBackColor = true;
		this.btnBrowse.Click += new System.EventHandler(btnBrowse_Click);
		this.txtFilePath.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.txtFilePath.Location = new System.Drawing.Point(120, 54);
		this.txtFilePath.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.txtFilePath.Name = "txtFilePath";
		this.txtFilePath.ReadOnly = true;
		this.txtFilePath.Size = new System.Drawing.Size(361, 25);
		this.txtFilePath.TabIndex = 5;
		this.label1.AutoSize = true;
		this.label1.Location = new System.Drawing.Point(11, 58);
		this.label1.Name = "label1";
		this.label1.Size = new System.Drawing.Size(82, 15);
		this.label1.TabIndex = 4;
		this.label1.Text = "词库导入：";
		this.label2.AutoSize = true;
		this.label2.Location = new System.Drawing.Point(11, 22);
		this.label2.Name = "label2";
		this.label2.Size = new System.Drawing.Size(82, 15);
		this.label2.TabIndex = 8;
		this.label2.Text = "词库名称：";
		this.txtName.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.txtName.Location = new System.Drawing.Point(120, 21);
		this.txtName.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.txtName.Name = "txtName";
		this.txtName.Size = new System.Drawing.Size(361, 25);
		this.txtName.TabIndex = 1;
		this.panel1.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.panel1.Controls.Add(this.dataGridView1);
		this.panel1.Location = new System.Drawing.Point(13, 96);
		this.panel1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.panel1.Name = "panel1";
		this.panel1.Size = new System.Drawing.Size(640, 275);
		this.panel1.TabIndex = 10;
		this.dataGridView1.AllowUserToAddRows = false;
		this.dataGridView1.AllowUserToDeleteRows = false;
		this.dataGridView1.AllowUserToResizeRows = false;
		dataGridViewCellStyle.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleLeft;
		dataGridViewCellStyle.BackColor = System.Drawing.SystemColors.Control;
		dataGridViewCellStyle.Font = new System.Drawing.Font("宋体", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 134);
		dataGridViewCellStyle.ForeColor = System.Drawing.SystemColors.WindowText;
		dataGridViewCellStyle.SelectionForeColor = System.Drawing.SystemColors.HighlightText;
		dataGridViewCellStyle.WrapMode = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridView1.ColumnHeadersDefaultCellStyle = dataGridViewCellStyle;
		this.dataGridView1.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.dataGridView1.Columns.AddRange(this.id, this.rightword, this.errorword);
		this.dataGridView1.ContextMenuStrip = this.contextMenuStrip1;
		this.dataGridView1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.dataGridView1.Location = new System.Drawing.Point(0, 0);
		this.dataGridView1.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.dataGridView1.MultiSelect = false;
		this.dataGridView1.Name = "dataGridView1";
		this.dataGridView1.ReadOnly = true;
		this.dataGridView1.RowHeadersVisible = false;
		this.dataGridView1.RowHeadersWidth = 51;
		this.dataGridView1.RowTemplate.Height = 27;
		this.dataGridView1.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.dataGridView1.Size = new System.Drawing.Size(640, 275);
		this.dataGridView1.TabIndex = 0;
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
		this.btnSave.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
		this.btnSave.Location = new System.Drawing.Point(287, 390);
		this.btnSave.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		this.btnSave.Name = "btnSave";
		this.btnSave.Size = new System.Drawing.Size(112, 30);
		this.btnSave.TabIndex = 11;
		this.btnSave.Text = "保存";
		this.btnSave.UseVisualStyleBackColor = true;
		this.btnSave.Click += new System.EventHandler(btnSave_Click);
		this.id.DataPropertyName = "编号";
		dataGridViewCellStyle2.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle2.SelectionForeColor = System.Drawing.Color.Black;
		this.id.DefaultCellStyle = dataGridViewCellStyle2;
		this.id.FillWeight = 69f;
		this.id.HeaderText = "编号";
		this.id.MinimumWidth = 6;
		this.id.Name = "id";
		this.id.ReadOnly = true;
		this.id.Width = 69;
		this.rightword.DataPropertyName = "纠错词";
		dataGridViewCellStyle3.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle3.SelectionForeColor = System.Drawing.Color.Black;
		this.rightword.DefaultCellStyle = dataGridViewCellStyle3;
		this.rightword.FillWeight = 140f;
		this.rightword.HeaderText = "纠错词";
		this.rightword.MinimumWidth = 6;
		this.rightword.Name = "rightword";
		this.rightword.ReadOnly = true;
		this.rightword.Width = 140;
		this.errorword.DataPropertyName = "错词";
		dataGridViewCellStyle4.SelectionBackColor = System.Drawing.Color.FromArgb(224, 224, 224);
		dataGridViewCellStyle4.SelectionForeColor = System.Drawing.Color.Black;
		this.errorword.DefaultCellStyle = dataGridViewCellStyle4;
		this.errorword.FillWeight = 250f;
		this.errorword.HeaderText = "错词";
		this.errorword.MinimumWidth = 6;
		this.errorword.Name = "errorword";
		this.errorword.ReadOnly = true;
		this.errorword.Width = 250;
		base.AutoScaleDimensions = new System.Drawing.SizeF(8f, 15f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(669, 431);
		base.Controls.Add(this.btnSave);
		base.Controls.Add(this.panel1);
		base.Controls.Add(this.txtName);
		base.Controls.Add(this.label2);
		base.Controls.Add(this.btnBrowse);
		base.Controls.Add(this.txtFilePath);
		base.Controls.Add(this.label1);
		base.Margin = new System.Windows.Forms.Padding(3, 2, 3, 2);
		base.MinimizeBox = false;
		base.Name = "ToolIncorrectWordCreate";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "创建纠正词库";
		base.Load += new System.EventHandler(ToolIncorrectWordCreate_Load);
		this.panel1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.dataGridView1).EndInit();
		this.contextMenuStrip1.ResumeLayout(false);
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
