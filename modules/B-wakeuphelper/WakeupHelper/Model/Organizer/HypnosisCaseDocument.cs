using System;
using System.Collections.Generic;

namespace WakeupHelper.Model.Organizer;

public enum HypnosisCaseDocumentKind
{
	RawTranscript,
	ManualRecord,
	Converted,
	ReviewedConverted,
	CleanedReview,
	AiSummary,
	ManualEdited,
	Other
}

public class HypnosisCaseDocument
{
	public string FullPath { get; set; }
	public string FileName { get; set; }
	public string BaseKey { get; set; }
	public HypnosisCaseDocumentKind Kind { get; set; }
	public long SizeBytes { get; set; }
	public DateTime LastWriteTime { get; set; }
	public bool HasWordComments { get; set; }
	public int WordCommentCount { get; set; }
	public string Creator { get; set; }
	public string LastModifiedBy { get; set; }
	public DateTime? DocumentCreated { get; set; }
	public DateTime? DocumentModified { get; set; }
	public int ConfidenceScore { get; set; }
	public List<string> Signals { get; set; } = new List<string>();
}
