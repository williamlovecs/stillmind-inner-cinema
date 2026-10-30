using System;
using System.Drawing;
using System.Windows.Forms;

namespace WakeupHelper.libs;

/// <summary>
/// v3.2 UI 主题.
/// 方向: paper-and-ink minimalism. 暖纸画布、墨色文字、淡金点缀、克制桌面工具感。
/// </summary>
public static class Theme
{
    public static readonly Font FontBody = new Font("Microsoft YaHei UI", 9.5F, FontStyle.Regular, GraphicsUnit.Point);
    public static readonly Font FontLabel = new Font("Microsoft YaHei UI", 9.75F, FontStyle.Regular, GraphicsUnit.Point);
    public static readonly Font FontLabelBold = new Font("Microsoft YaHei UI", 9.75F, FontStyle.Bold, GraphicsUnit.Point);
    public static readonly Font FontTitle = new Font("Microsoft YaHei UI", 14F, FontStyle.Bold, GraphicsUnit.Point);
    public static readonly Font FontMono = new Font("Consolas", 9F, FontStyle.Regular, GraphicsUnit.Point);

    public static readonly Color Canvas = Color.FromArgb(246, 242, 233);
    public static readonly Color Background = Color.FromArgb(251, 249, 244);
    public static readonly Color Surface = Color.FromArgb(255, 255, 255);
    public static readonly Color SurfaceMuted = Color.FromArgb(250, 247, 239);
    public static readonly Color Text = Color.FromArgb(39, 35, 30);
    public static readonly Color TextMuted = Color.FromArgb(118, 108, 94);
    public static readonly Color Border = Color.FromArgb(226, 218, 204);
    public static readonly Color Accent = Color.FromArgb(45, 42, 36);
    public static readonly Color AccentHover = Color.FromArgb(69, 62, 51);
    public static readonly Color AccentSoft = Color.FromArgb(246, 236, 211);
    public static readonly Color AccentSoftText = Color.FromArgb(119, 84, 24);
    public static readonly Color JadeSoft = Color.FromArgb(231, 239, 229);
    public static readonly Color JadeText = Color.FromArgb(55, 91, 66);

    // === 间距 (8/12/16/24 grid) ===
    public static readonly Padding PadSmall = new Padding(6, 4, 6, 4);
    public static readonly Padding PadMedium = new Padding(12, 8, 12, 8);
    public static readonly Padding PadLarge = new Padding(16, 12, 16, 12);
    public static readonly Padding ContainerPad = new Padding(18, 14, 18, 14);

    // === ApplyTo: 递归设置 Control 主题 (Swiss style) ===
    /// <summary>
    /// 应用主题到一个 form 及其所有子控件.
    /// 在 InitializeComponent() 后调用.
    /// </summary>
    public static void ApplyTo(Form form) {
        if (form == null) return;
        form.BackColor = Canvas;
        form.Font = FontBody;
        form.ForeColor = Text;
        form.Padding = ContainerPad;
        form.StartPosition = form.StartPosition == FormStartPosition.CenterParent
            ? FormStartPosition.CenterParent
            : FormStartPosition.CenterScreen;

        ApplyToControls(form.Controls);
    }

    private static void ApplyToControls(Control.ControlCollection controls) {
        foreach (Control ctrl in controls) {
            ApplyToControl(ctrl);
            if (ctrl.ContextMenuStrip != null) {
                ApplyToToolStrip(ctrl.ContextMenuStrip);
            }
            if (ctrl.HasChildren) {
                ApplyToControls(ctrl.Controls);
            }
        }
    }

    private static void ApplyToControl(Control ctrl) {
        if (ctrl is Button btn) {
            bool isColorPicker = btn.Name.IndexOf("Color", StringComparison.OrdinalIgnoreCase) >= 0;
            bool isCompactButton = btn.Width <= 64 || btn.Height <= 26 || btn.Text == "...";
            btn.Font = FontLabelBold;
            btn.FlatStyle = FlatStyle.Flat;
            btn.FlatAppearance.BorderColor = Border;
            btn.FlatAppearance.BorderSize = 1;
            btn.FlatAppearance.MouseOverBackColor = SurfaceMuted;
            btn.FlatAppearance.MouseDownBackColor = AccentSoft;
            btn.UseVisualStyleBackColor = false;
            btn.TextAlign = ContentAlignment.MiddleCenter;
            if (!isColorPicker) {
                btn.BackColor = Surface;
                btn.ForeColor = Text;
            }
            btn.Cursor = Cursors.Hand;
            if (isCompactButton) {
                btn.Padding = Padding.Empty;
                btn.MinimumSize = Size.Empty;
            } else {
                btn.Padding = new Padding(12, 6, 12, 6);
                btn.MinimumSize = new Size(88, 32);
            }
            if (!isColorPicker && (btn.Name.IndexOf("Primary", StringComparison.OrdinalIgnoreCase) >= 0
                || btn.Text == "开始" || btn.Text == "保存" || btn.Text == "修改")) {
                btn.BackColor = Accent;
                btn.ForeColor = Color.White;
                btn.FlatAppearance.BorderColor = Accent;
                btn.FlatAppearance.MouseOverBackColor = AccentHover;
                btn.FlatAppearance.MouseDownBackColor = AccentHover;
            }
        } else if (ctrl is Label lbl) {
            // Title label (大号粗体) 保留为 Title
            if (lbl.Font.Size >= 12f) {
                lbl.Font = FontTitle;
            } else {
                lbl.Font = FontLabelBold;
            }
            lbl.ForeColor = lbl.Enabled ? Text : TextMuted;
            lbl.BackColor = Color.Transparent;
        } else if (ctrl is LinkLabel link) {
            link.Font = FontBody;
            link.LinkColor = AccentSoftText;
            link.ActiveLinkColor = AccentHover;
            link.VisitedLinkColor = TextMuted;
            link.ForeColor = TextMuted;
            link.BackColor = Color.Transparent;
        } else if (ctrl is TextBox tb) {
            tb.Font = FontBody;
            tb.BackColor = Surface;
            tb.ForeColor = Text;
            tb.BorderStyle = BorderStyle.FixedSingle;
        } else if (ctrl is RichTextBox rtb) {
            rtb.Font = FontMono;
            rtb.BackColor = SurfaceMuted;
            rtb.ForeColor = Text;
            rtb.BorderStyle = BorderStyle.FixedSingle;
        } else if (ctrl is ComboBox cmb) {
            cmb.Font = FontBody;
            cmb.BackColor = Surface;
            cmb.ForeColor = Text;
            cmb.FlatStyle = FlatStyle.Flat;
        } else if (ctrl is CheckBox chk) {
            chk.Font = FontBody;
            chk.ForeColor = chk.Enabled ? Text : TextMuted;
            chk.BackColor = Color.Transparent;
        } else if (ctrl is GroupBox gb) {
            gb.Font = FontLabelBold;
            gb.ForeColor = Text;
            gb.BackColor = Background;
        } else if (ctrl is DataGridView dgv) {
            dgv.BackgroundColor = Surface;
            dgv.GridColor = Border;
            dgv.DefaultCellStyle.BackColor = Surface;
            dgv.DefaultCellStyle.ForeColor = Text;
            dgv.DefaultCellStyle.Font = FontBody;
            dgv.DefaultCellStyle.SelectionBackColor = AccentSoft;
            dgv.DefaultCellStyle.SelectionForeColor = Text;
            dgv.AlternatingRowsDefaultCellStyle.BackColor = SurfaceMuted;
            dgv.ColumnHeadersDefaultCellStyle.BackColor = SurfaceMuted;
            dgv.ColumnHeadersDefaultCellStyle.ForeColor = TextMuted;
            dgv.ColumnHeadersDefaultCellStyle.Font = FontLabelBold;
            dgv.EnableHeadersVisualStyles = false;
            dgv.RowHeadersVisible = false;
            dgv.BorderStyle = BorderStyle.FixedSingle;
            dgv.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal;
            dgv.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.Single;
            dgv.AutoSizeRowsMode = DataGridViewAutoSizeRowsMode.DisplayedCellsExceptHeaders;
        } else if (ctrl is MenuStrip ms) {
            ApplyToToolStrip(ms);
        } else if (ctrl is StatusStrip ss) {
            ApplyToToolStrip(ss);
            ss.BackColor = Background;
            ss.ForeColor = TextMuted;
            ss.Font = FontBody;
        } else if (ctrl is TabControl tc) {
            tc.Font = FontBody;
        } else if (ctrl is TabPage tp) {
            tp.BackColor = Canvas;
            tp.ForeColor = Text;
            tp.Font = FontBody;
        } else if (ctrl is ListBox lb) {
            lb.Font = FontBody;
            lb.BackColor = Surface;
            lb.ForeColor = Text;
            lb.BorderStyle = BorderStyle.FixedSingle;
        } else if (ctrl is Panel p) {
            p.BackColor = Color.Transparent;
        } else if (ctrl.GetType().Name == "NotifyIcon") {
            // NotifyIcon 是 Component 不是 Control, 但仍可能出现在 controls 列表里
            // 不设置 (非可视)
        } else {
            // 默认: 改字体和前景色, 背景透明
            if (ctrl.Font.Name == "宋体") {
                ctrl.Font = FontBody;
            }
        }
    }

    private static void ApplyToToolStrip(ToolStrip strip) {
        strip.BackColor = Surface;
        strip.ForeColor = Text;
        strip.Font = FontBody;
        strip.RenderMode = ToolStripRenderMode.Professional;
        strip.Renderer = new MinimalToolStripRenderer();
        foreach (ToolStripItem item in strip.Items) {
            ApplyToToolStripItem(item);
        }
    }

    private static void ApplyToToolStripItem(ToolStripItem item) {
        item.BackColor = Surface;
        item.ForeColor = item.Enabled ? Text : TextMuted;
        item.Font = FontBody;
        if (item is ToolStripMenuItem menuItem) {
            foreach (ToolStripItem child in menuItem.DropDownItems) {
                ApplyToToolStripItem(child);
            }
        }
    }

    private sealed class MinimalToolStripRenderer : ToolStripProfessionalRenderer
    {
        public MinimalToolStripRenderer() : base(new MinimalColorTable()) { }

        protected override void OnRenderMenuItemBackground(ToolStripItemRenderEventArgs e) {
            Rectangle rect = new Rectangle(Point.Empty, e.Item.Size);
            Color fill = e.Item.Selected && e.Item.Enabled ? SurfaceMuted : Surface;
            using (SolidBrush brush = new SolidBrush(fill)) {
                e.Graphics.FillRectangle(brush, rect);
            }
            if (e.Item.Selected && e.Item.Enabled) {
                using (Pen pen = new Pen(Border)) {
                    rect.Width -= 1;
                    rect.Height -= 1;
                    e.Graphics.DrawRectangle(pen, rect);
                }
            }
        }

        protected override void OnRenderSeparator(ToolStripSeparatorRenderEventArgs e) {
            Rectangle bounds = e.Item.ContentRectangle;
            int y = bounds.Top + bounds.Height / 2;
            using (Pen pen = new Pen(Border)) {
                e.Graphics.DrawLine(pen, bounds.Left + 4, y, bounds.Right - 4, y);
            }
        }
    }

    private sealed class MinimalColorTable : ProfessionalColorTable
    {
        public override Color MenuItemSelected => SurfaceMuted;
        public override Color MenuItemSelectedGradientBegin => SurfaceMuted;
        public override Color MenuItemSelectedGradientEnd => SurfaceMuted;
        public override Color MenuItemBorder => Border;
        public override Color ToolStripDropDownBackground => Surface;
        public override Color ImageMarginGradientBegin => Surface;
        public override Color ImageMarginGradientMiddle => Surface;
        public override Color ImageMarginGradientEnd => Surface;
        public override Color MenuBorder => Border;
        public override Color SeparatorDark => Border;
        public override Color SeparatorLight => Border;
        public override Color ToolStripBorder => Border;
        public override Color ToolStripGradientBegin => Surface;
        public override Color ToolStripGradientMiddle => Surface;
        public override Color ToolStripGradientEnd => Surface;
        public override Color ButtonSelectedGradientBegin => SurfaceMuted;
        public override Color ButtonSelectedGradientMiddle => SurfaceMuted;
        public override Color ButtonSelectedGradientEnd => SurfaceMuted;
        public override Color ButtonSelectedBorder => Border;
    }
}
