using System.Collections.Generic;

namespace WakeupHelper.Model.System;

public class Settings
{
	public Dictionary<string, string> RecentlyOpenedDocumentList = new Dictionary<string, string>();

	public List<IdentificationStrategy> IdentificationStrategyList { get; set; }

	public List<DocumentTemplate> DocumentTemplateList { get; set; }

	public List<ErrorCorrection> ErrorCorrectionList { get; set; }
}
