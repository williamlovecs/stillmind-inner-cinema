using System.Collections.Generic;

namespace WakeupHelper.Model;

public class ErrorCorrectionWord
{
	public int Index { get; set; }

	public string RightWord { get; set; }

	public IList<string> ErrorWordList { get; set; }
}
