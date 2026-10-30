using System.Drawing;
using System.Text.Json.Serialization;

namespace WakeupHelper.Model;

public class People
{
	[JsonInclude]
	public string Role { get; set; }

	[JsonInclude]
	public string Name { get; set; }

	[JsonInclude]
	public string FontNameColor { get; set; }

	[JsonInclude]
	public string FontBodyColor { get; set; }

	public People()
	{
		Role = string.Empty;
		// v3.1 Bug G fix: 给默认 hex, 避免下游 int.Parse(null) 崩
		FontNameColor = "FFFF0080";
		FontBodyColor = "FF0000FF";
	}

	public People(string Role, Color FontNameColor, Color FontBodyColor, string Name = null)
	{
		this.Role = Role;
		this.Name = Name;
		try {
			this.FontNameColor = FontNameColor.ToArgb().ToString("X");
			this.FontBodyColor = FontBodyColor.ToArgb().ToString("X");
		} catch {
			// v3.1 Bug G fix: Color 异常时给默认值, 不让 People ctor 崩
			this.FontNameColor = "FFFF0080";
			this.FontBodyColor = "FF0000FF";
		}
	}
}
