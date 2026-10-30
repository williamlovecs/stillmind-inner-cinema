using System.Collections.Generic;
using System.Linq;

namespace WakeupHelper.Model.Organizer;

public class HypnosisCaseGroup
{
	public string CaseKey { get; set; }
	public List<HypnosisCaseDocument> Documents { get; set; } = new List<HypnosisCaseDocument>();

	public HypnosisCaseDocument RecommendedMaster
	{
		get
		{
			return Documents
				.OrderByDescending(d => d.ConfidenceScore)
				.ThenByDescending(d => d.LastWriteTime)
				.FirstOrDefault();
		}
	}

	public bool HasRaw => Documents.Any(d => d.Kind == HypnosisCaseDocumentKind.RawTranscript || d.Kind == HypnosisCaseDocumentKind.ManualRecord);

	public bool HasConverted => Documents.Any(d =>
		d.Kind == HypnosisCaseDocumentKind.Converted ||
		d.Kind == HypnosisCaseDocumentKind.ReviewedConverted ||
		d.Kind == HypnosisCaseDocumentKind.CleanedReview);

	public bool HasReviewed => Documents.Any(d => d.HasWordComments || d.Kind == HypnosisCaseDocumentKind.ManualEdited || d.Kind == HypnosisCaseDocumentKind.CleanedReview);

	public bool HasSummary => Documents.Any(d => d.Kind == HypnosisCaseDocumentKind.AiSummary);

	public bool NeedsReview => !HasReviewed || Documents.Count > 1 && RecommendedMaster != null && RecommendedMaster.Kind == HypnosisCaseDocumentKind.RawTranscript;
}
