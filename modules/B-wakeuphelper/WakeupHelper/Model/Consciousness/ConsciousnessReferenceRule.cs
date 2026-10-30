using System.Collections.Generic;

namespace WakeupHelper.Model.Consciousness;

public class ConsciousnessReferenceRule
{
	public string Id { get; set; }

	public string Title { get; set; }

	public string Summary { get; set; }

	public List<string> Keywords { get; set; }

	public string Source { get; set; }

	public string EvidenceLevel { get; set; }

	public string Boundary { get; set; }
}
