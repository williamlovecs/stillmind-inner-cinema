namespace WakeupHelper.Model;

public class Version
{
	public int MainVersion { get; set; }

	public int MinorVersion { get; set; }

	public int RevisedVersion { get; set; }

	public override string ToString()
	{
		// v3.1 Bug E fix: 原版 MinorVersion 写了两次, 应该是 RevisedVersion
		return "v" + MainVersion + "." + MinorVersion + "." + RevisedVersion;
	}
}
