using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using Microsoft.Office.Interop.Word;
using Serilog;
using Serilog.Events;
using WakeupHelper.Model;

namespace WakeupHelper.libs;

public class WordDocumentHelper
{
	private sealed class CommentSnapshot
	{
		public string Text { get; set; }
		public string AnchorText { get; set; }
		public string LeftContext { get; set; }
		public string RightContext { get; set; }
		public string ParagraphTail { get; set; }
		public int OriginalStart { get; set; }
	}

	private List<string> addCommentList;

	private readonly List<CommentSnapshot> originalComments = new List<CommentSnapshot>();

	private Table overviewTable;

	public FileInfo targetFilePath { get; set; }

	public DocumentTemplate documentTemplate { get; set; }

	public ErrorCorrection errorCorrection { get; set; }

	public bool IsDocumentErrorCorrectionCommentDebug { get; set; }

	public bool IsShowWordWindows { get; set; }

	public bool IsGenerateConsciousnessAppendix { get; set; }

	public string ExplicitMainSpeakerName { get; set; }

	public string ExplicitClientSpeakerName { get; set; }

	public string OverviewTopic { get; set; }

	public string OverviewDate { get; set; }

	public Document document { get; set; }

	public Application wordApp { get; set; }

	public WordDocumentHelper(string filePath)
	{
		wordApp = (Application)Activator.CreateInstance(Marshal.GetTypeFromCLSID(new Guid("000209FF-0000-0000-C000-000000000046")));
		wordApp.DisplayAlerts = WdAlertLevel.wdAlertsNone;
		Documents documents = null;
		object FileName = filePath;
		object ConfirmConversions = Type.Missing;
		object ReadOnly = Type.Missing;
		object AddToRecentFiles = Type.Missing;
		object PasswordDocument = Type.Missing;
		object PasswordTemplate = Type.Missing;
		object Revert = Type.Missing;
		object WritePasswordDocument = Type.Missing;
		object WritePasswordTemplate = Type.Missing;
		object Format = Type.Missing;
		object Encoding = Type.Missing;
		object Visible = Type.Missing;
		object OpenAndRepair = Type.Missing;
		object DocumentDirection = Type.Missing;
		object NoEncodingDialog = Type.Missing;
		object XMLTransform = Type.Missing;
		try {
			documents = wordApp.Documents;
			document = documents.Open(ref FileName, ref ConfirmConversions, ref ReadOnly, ref AddToRecentFiles, ref PasswordDocument, ref PasswordTemplate, ref Revert, ref WritePasswordDocument, ref WritePasswordTemplate, ref Format, ref Encoding, ref Visible, ref OpenAndRepair, ref DocumentDirection, ref NoEncodingDialog, ref XMLTransform);
			targetFilePath = new FileInfo(filePath);
		} catch (System.Runtime.InteropServices.COMException ex) {
			Close();
			throw new InvalidOperationException(
				"无法打开 Word 文档。请确认:\n1. 已安装 Microsoft Word 或 WPS\n2. 文件未被其他程序占用\n3. 文件格式正确 (.docx)\n\n技术细节: " + ex.Message, ex);
		} finally {
			ReleaseComObjectSafely(documents);
		}
		Log.Logger = new LoggerConfiguration().MinimumLevel.Debug().Enrich.FromLogContext().WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}").CreateLogger();
	}

	~WordDocumentHelper()
	{
		Close();
	}

	public void Close()
	{
		Table table = overviewTable;
		overviewTable = null;
		ReleaseComObjectSafely(table);

		Document openDocument = document;
		document = null;
		if (openDocument != null)
		{
			try
			{
				object saveChanges = false;
				object originalFormat = Type.Missing;
				object routeDocument = Type.Missing;
				openDocument.Close(ref saveChanges, ref originalFormat, ref routeDocument);
			}
			catch
			{
			}
			finally
			{
				ReleaseComObjectSafely(openDocument);
			}
		}

		Application openApplication = wordApp;
		wordApp = null;
		if (openApplication != null)
		{
			try { openApplication.Quit(false); } catch { }
			finally { ReleaseComObjectSafely(openApplication); }
		}
		GC.Collect();
		GC.WaitForPendingFinalizers();
	}

	private static void ReleaseComObjectSafely(object value)
	{
		if (value == null || !Marshal.IsComObject(value))
		{
			return;
		}
		try { Marshal.FinalReleaseComObject(value); } catch { }
	}

	public bool FormatRecognitionStrategyConflict()
	{
		bool result = true;
		if (Utils.FeishuMiaoji(document.Content.Text) && documentTemplate.IdentificationStrategyInfo.SourceName == "飞书妙记")
		{
			result = false;
		}
		else if (documentTemplate.IdentificationStrategyInfo.SourceName == "腾讯会议" && !Utils.FeishuMiaoji(document.Content.Text))
		{
			result = false;
		}
		return result;
	}

	private void ApplyTemplateFont(Range range)
	{
		if (range == null)
		{
			return;
		}
		string fontName = string.IsNullOrWhiteSpace(documentTemplate?.FontName)
			? "微软雅黑"
			: documentTemplate.FontName;
		float fontSize = documentTemplate?.FontSize > 0 ? documentTemplate.FontSize : 12f;
		// Font.Name alone can leave East Asian text on the document theme font.
		// Set every Word font channel explicitly so generated DOCX files render
		// consistently across source themes and Office versions.
		range.Font.Name = fontName;
		range.Font.NameAscii = fontName;
		range.Font.NameFarEast = fontName;
		range.Font.NameOther = fontName;
		range.Font.Size = fontSize;
	}

	private void ApplyTemplateFontPreservingManualArtifacts()
	{
		if (document == null)
		{
			return;
		}
		foreach (Paragraph paragraph in document.Paragraphs)
		{
			Range range = paragraph.Range.Duplicate;
			try
			{
				range.End = Math.Max(range.Start, range.End - 1);
				if (!HasProtectedManualArtifacts(range))
				{
					ApplyTemplateFont(range);
				}
			}
			finally
			{
				ReleaseComObjectSafely(range);
			}
		}
	}

	public void StartTencentWordDocument()
	{
		wordApp.Visible = IsShowWordWindows;
		CaptureExistingComments();
		if (documentTemplate.ErrorsCorrectionInfo == null)
		{
			documentTemplate.ErrorsCorrectionInfo = errorCorrection;
		}
		ApplyTemplateFontPreservingManualArtifacts();
		if (!string.IsNullOrWhiteSpace(ExplicitMainSpeakerName) && !string.IsNullOrWhiteSpace(ExplicitClientSpeakerName))
		{
			documentTemplate.FirstPeople.Name = ExplicitMainSpeakerName.Trim();
			documentTemplate.SecondPeople.Name = ExplicitClientSpeakerName.Trim();
		}
		else
		{
			AnalysisDocumentRoleName();
		}
		SetPageNarrowMargin();
		SetShowPageNumber();
		SetGenerateOverview();
		RemoveRealtimeTranscriptionNoticeParagraphs();
		WdColor wdColor = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(documentTemplate.FirstPeople.FontNameColor.ToString(), NumberStyles.HexNumber)));
		WdColor wdColor2 = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(documentTemplate.SecondPeople.FontNameColor.ToString(), NumberStyles.HexNumber)));
		WdColor color = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(documentTemplate.FirstPeople.FontBodyColor.ToString(), NumberStyles.HexNumber)));
		WdColor color2 = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(documentTemplate.SecondPeople.FontBodyColor.ToString(), NumberStyles.HexNumber)));
		addCommentList = new List<string>();
		object MatchControl;
		object MatchAlefHamza;
		object MatchDiacritics;
		object MatchKashida;
		object Replace;
		object ReplaceWith;
		object Format;
		object Wrap;
		object Forward;
		object MatchAllWordForms;
		object MatchSoundsLike;
		object MatchWildcards;
		object MatchWholeWord;
		object MatchCase;
		object FindText;
		Regex speakerRegex = new Regex(documentTemplate.IdentificationStrategyInfo.Regex);
		foreach (Paragraph paragraph in document.Paragraphs)
		{
			Range duplicate = paragraph.Range.Duplicate;
			try
			{
				string paragraphText = (duplicate.Text ?? string.Empty).TrimEnd(' ', '\t', '\r', '\n', '\a');
				Match match = speakerRegex.Match(paragraphText);
				if (!match.Success)
				{
					continue;
				}

				string speakerName = Utils.GetMatchKeyword("name", match);
				string datetime = Utils.GetMatchKeyword("datetime", match);
				string time = Utils.GetMatchKeyword("time", match);
				Log.Logger.Information("nickOrigin: " + speakerName + ", datetimeOrigin: " + datetime + ", timeOrigin: " + time);
				if (documentTemplate.IsGenerateOverview && overviewTable != null)
				{
					UpdateOverviewDuration(time);
				}

				if (SpeakerMatches(speakerName, documentTemplate.FirstPeople.Name))
				{
					FormatTencentSpeakerParagraph(duplicate, match, speakerName, documentTemplate.FirstPeople.Role, wdColor, color);
				}
				else if (SpeakerMatches(speakerName, documentTemplate.SecondPeople.Name))
				{
					FormatTencentSpeakerParagraph(duplicate, match, speakerName, documentTemplate.SecondPeople.Role, wdColor2, color2);
				}
			}
			finally
			{
				Marshal.ReleaseComObject(duplicate);
			}
		}
		MergeAdjacentRoleParagraphs();
		if (!IsDocumentErrorCorrectionCommentDebug)
		{
			ApplyPlainErrorCorrections();
		}
		else
		{
			ApplyCommentErrorCorrections();
		}
		RestoreMissingComments();
		AppendConsciousnessReferenceIfEnabled();
		Document obj2 = document;
		MatchControl = targetFilePath.FullName;
		MatchAlefHamza = Type.Missing;
		MatchDiacritics = Type.Missing;
		MatchKashida = Type.Missing;
		Replace = Type.Missing;
		ReplaceWith = Type.Missing;
		Format = Type.Missing;
		Wrap = Type.Missing;
		Forward = Type.Missing;
		MatchAllWordForms = Type.Missing;
		MatchSoundsLike = Type.Missing;
		MatchWildcards = Type.Missing;
		MatchWholeWord = Type.Missing;
		MatchCase = Type.Missing;
		FindText = Type.Missing;
		object AddBiDiMarks = Type.Missing;
		object CompatibilityMode = Type.Missing;
		obj2.SaveAs2(ref MatchControl, ref MatchAlefHamza, ref MatchDiacritics, ref MatchKashida, ref Replace, ref ReplaceWith, ref Format, ref Wrap, ref Forward, ref MatchAllWordForms, ref MatchSoundsLike, ref MatchWildcards, ref MatchWholeWord, ref MatchCase, ref FindText, ref AddBiDiMarks, ref CompatibilityMode);
	}

	public void StartFeishuMiaojiWordDocument()
	{
		wordApp.Visible = IsShowWordWindows;
		CaptureExistingComments();
		if (documentTemplate.ErrorsCorrectionInfo == null)
		{
			documentTemplate.ErrorsCorrectionInfo = errorCorrection;
		}
		ApplyTemplateFontPreservingManualArtifacts();
		SetPageNarrowMargin();
		SetShowPageNumber();
		SetGenerateOverview();
		RemoveRealtimeTranscriptionNoticeParagraphs();
		Find find = document.Content.Find;
		find.Format = true;
		find.MatchCase = true;
		find.MatchWholeWord = true;
		find.Forward = true;
		find.Text = "\v";
		find.Replacement.Text = "\n";
		object FindText = Type.Missing;
		object MatchCase = Type.Missing;
		object MatchWholeWord = Type.Missing;
		object MatchWildcards = Type.Missing;
		object MatchSoundsLike = Type.Missing;
		object MatchAllWordForms = Type.Missing;
		object Forward = Type.Missing;
		object Wrap = Type.Missing;
		object Format = Type.Missing;
		object ReplaceWith = Type.Missing;
		object Replace = WdReplace.wdReplaceAll;
		object MatchKashida = Type.Missing;
		object MatchDiacritics = Type.Missing;
		object MatchAlefHamza = Type.Missing;
		object MatchControl = Type.Missing;
		find.Execute(ref FindText, ref MatchCase, ref MatchWholeWord, ref MatchWildcards, ref MatchSoundsLike, ref MatchAllWordForms, ref Forward, ref Wrap, ref Format, ref ReplaceWith, ref Replace, ref MatchKashida, ref MatchDiacritics, ref MatchAlefHamza, ref MatchControl);
		WdColor color = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(documentTemplate.FirstPeople.FontNameColor.ToString(), NumberStyles.HexNumber)));
		WdColor color2 = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(documentTemplate.SecondPeople.FontNameColor.ToString(), NumberStyles.HexNumber)));
		WdColor color3 = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(documentTemplate.FirstPeople.FontBodyColor.ToString(), NumberStyles.HexNumber)));
		WdColor color4 = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(documentTemplate.SecondPeople.FontBodyColor.ToString(), NumberStyles.HexNumber)));
		addCommentList = new List<string>();
		int num = -1;
		foreach (Paragraph paragraph in document.Paragraphs)
		{
			string text = null;
			string text2 = null;
			string text3 = null;
			string text4 = null;
			Range duplicate = paragraph.Range.Duplicate;
			try
			{
				string text5 = (paragraph.Range.Text ?? string.Empty).TrimEnd(' ', '\t', '\r', '\n', '\a');
				Match match = new Regex(documentTemplate.IdentificationStrategyInfo.Regex).Match(text5);
				if (text5.Contains("文字记录"))
				{
					paragraph.Range.Select();
					paragraph.Range.Font.Bold = 1;
					paragraph.Range.Borders[WdBorderType.wdBorderBottom].LineStyle = WdLineStyle.wdLineStyleDouble;
					continue;
				}
				if (match.Success)
				{
					string[] array = text5.Split(new string[1] { match.Value }, StringSplitOptions.None);
					text = match.Value;
					_ = array[1];
					text2 = Utils.GetMatchKeyword("name", match);
					text3 = Utils.GetMatchKeyword("datetime", match);
					text4 = Utils.GetMatchKeyword("time", match);
					Log.Logger.Information("nickOrigin: " + text2 + ", datetimeOrigin: " + text3 + ", timeOrigin: " + text4);
					if (documentTemplate.IsGenerateOverview && overviewTable != null && !string.IsNullOrEmpty(text4))
					{
						UpdateOverviewDuration(text4);
					}
					string text6 = text;
					if (!string.IsNullOrEmpty(text4))
					{
						text6 = ((!documentTemplate.IsRemoveDatetime) ? text6.Replace(text4, "(" + text4 + "):") : text6.Replace(text4, ":"));
						if (documentTemplate.IsRemoveDatetime)
						{
							text6 = Regex.Replace(text6, @"\s+\d{4}-\d{2}-\d{2}\s+:", "：");
						}
					}
					if (documentTemplate.FirstMorePeopleList.Contains(text2.Trim()) || SpeakerMatches(text2, documentTemplate.FirstPeople.Name))
					{
						num = 1;
						if (documentTemplate.IsEnablePrivacyProtection)
						{
							text6 = text6.Replace(text2, documentTemplate.FirstPeople.Role);
							ReplaceMatchedText(duplicate, match, text6);
						}
						if (!HasProtectedManualArtifacts(duplicate))
						{
							ApplyTemplateFont(duplicate);
							duplicate.Font.Bold = documentTemplate.IsNickFontBold ? 1 : 0;
							duplicate.Font.Color = color;
						}
						continue;
					}
					if (documentTemplate.SecondMorePeopleList.Contains(text2.Trim()) || SpeakerMatches(text2, documentTemplate.SecondPeople.Name))
					{
						num = 2;
						if (documentTemplate.IsEnablePrivacyProtection)
						{
							text6 = text6.Replace(text2, documentTemplate.SecondPeople.Role);
							ReplaceMatchedText(duplicate, match, text6);
						}
						if (!HasProtectedManualArtifacts(duplicate))
						{
							ApplyTemplateFont(duplicate);
							duplicate.Font.Bold = documentTemplate.IsNickFontBold ? 1 : 0;
							duplicate.Font.Color = color2;
						}
						continue;
					}
				}
				switch (num)
				{
				case 1:
					if (!HasProtectedManualArtifacts(duplicate))
					{
						ApplyBodyStylePreservingManualColors(duplicate, color3);
					}
					if (string.IsNullOrEmpty(duplicate.Text.Trim()))
					{
						MatchControl = Type.Missing;
						MatchAlefHamza = Type.Missing;
						duplicate.Delete(ref MatchControl, ref MatchAlefHamza);
					}
					break;
				case 2:
					if (!HasProtectedManualArtifacts(duplicate))
					{
						ApplyBodyStylePreservingManualColors(duplicate, color4);
					}
					if (string.IsNullOrEmpty(duplicate.Text.Trim()))
					{
						MatchAlefHamza = Type.Missing;
						MatchControl = Type.Missing;
						duplicate.Delete(ref MatchAlefHamza, ref MatchControl);
					}
					break;
				}
			}
			finally
			{
				Marshal.ReleaseComObject(duplicate);
			}
		}
		MergeStandaloneRoleLabelParagraphs();
		MergeAdjacentRoleParagraphs();
		if (!IsDocumentErrorCorrectionCommentDebug)
		{
			ApplyPlainErrorCorrections();
		}
		else
		{
			ApplyCommentErrorCorrections();
		}
		RestoreMissingComments();
		AppendConsciousnessReferenceIfEnabled();
		Document obj = document;
		FindText = targetFilePath.FullName;
		MatchCase = Type.Missing;
		MatchWholeWord = Type.Missing;
		MatchWildcards = Type.Missing;
		MatchSoundsLike = Type.Missing;
		MatchAllWordForms = Type.Missing;
		Forward = Type.Missing;
		Wrap = Type.Missing;
		Format = Type.Missing;
		ReplaceWith = Type.Missing;
		Replace = Type.Missing;
		MatchKashida = Type.Missing;
		MatchDiacritics = Type.Missing;
		MatchAlefHamza = Type.Missing;
		MatchControl = Type.Missing;
		object AddBiDiMarks = Type.Missing;
		object CompatibilityMode = Type.Missing;
		obj.SaveAs2(ref FindText, ref MatchCase, ref MatchWholeWord, ref MatchWildcards, ref MatchSoundsLike, ref MatchAllWordForms, ref Forward, ref Wrap, ref Format, ref ReplaceWith, ref Replace, ref MatchKashida, ref MatchDiacritics, ref MatchAlefHamza, ref MatchControl, ref AddBiDiMarks, ref CompatibilityMode);
	}

	private void CaptureExistingComments()
	{
		originalComments.Clear();
		foreach (Comment comment in document.Comments)
		{
			Range scope = null;
			Range commentBody = null;
			Range paragraphRange = null;
			try
			{
				scope = comment.Scope.Duplicate;
				commentBody = comment.Range.Duplicate;
				paragraphRange = scope.Paragraphs[1].Range.Duplicate;
				string paragraphText = paragraphRange.Text ?? "";
				int relativeStart = Math.Max(0, scope.Start - paragraphRange.Start);
				int relativeEnd = Math.Min(paragraphText.Length, Math.Max(relativeStart, scope.End - paragraphRange.Start));
				originalComments.Add(new CommentSnapshot
				{
					Text = (commentBody.Text ?? "").TrimEnd('\r', '\a'),
					AnchorText = (scope.Text ?? "").TrimEnd('\r', '\a'),
					LeftContext = paragraphText.Substring(Math.Max(0, relativeStart - 16), Math.Min(16, relativeStart)),
					RightContext = paragraphText.Substring(relativeEnd, Math.Min(24, paragraphText.Length - relativeEnd)),
					ParagraphTail = paragraphText.Substring(Math.Max(0, paragraphText.Length - 32)).TrimEnd('\r', '\a'),
					OriginalStart = scope.Start
				});
			}
			finally
			{
				if (paragraphRange != null) Marshal.ReleaseComObject(paragraphRange);
				if (commentBody != null) Marshal.ReleaseComObject(commentBody);
				if (scope != null) Marshal.ReleaseComObject(scope);
				Marshal.ReleaseComObject(comment);
			}
		}
	}

	private void RestoreMissingComments()
	{
		if (originalComments.Count == 0)
		{
			return;
		}
		Dictionary<string, int> remaining = new Dictionary<string, int>(StringComparer.Ordinal);
		foreach (Comment comment in document.Comments)
		{
			Range body = null;
			try
			{
				body = comment.Range.Duplicate;
				string text = (body.Text ?? "").TrimEnd('\r', '\a');
				remaining[text] = remaining.TryGetValue(text, out int count) ? count + 1 : 1;
			}
			finally
			{
				if (body != null) Marshal.ReleaseComObject(body);
				Marshal.ReleaseComObject(comment);
			}
		}

		foreach (CommentSnapshot snapshot in originalComments)
		{
			if (remaining.TryGetValue(snapshot.Text, out int count) && count > 0)
			{
				remaining[snapshot.Text] = count - 1;
				continue;
			}
			Range anchor = FindCommentAnchor(snapshot);
			try
			{
				document.Comments.Add(anchor, snapshot.Text);
			}
			finally
			{
				Marshal.ReleaseComObject(anchor);
			}
		}
	}

	private Range FindCommentAnchor(CommentSnapshot snapshot)
	{
		foreach (string candidate in new[] { snapshot.AnchorText, snapshot.RightContext, snapshot.LeftContext, snapshot.ParagraphTail })
		{
			string needle = (candidate ?? "").Trim('\r', '\n', '\a');
			if (needle.Length == 0)
			{
				continue;
			}
			Range search = document.Content.Duplicate;
			Find find = search.Find;
			find.ClearFormatting();
			find.Text = needle;
			find.Forward = true;
			find.Wrap = WdFindWrap.wdFindStop;
			if (find.Execute())
			{
				return search;
			}
			Marshal.ReleaseComObject(search);
		}
		int end = document.Content.End;
		int start = Math.Max(document.Content.Start, Math.Min(snapshot.OriginalStart, Math.Max(document.Content.Start, end - 1)));
		return document.Range(start, Math.Min(start + 1, end));
	}

	private static readonly HashSet<string> ContextOnlyErrorWords = new HashSet<string>(StringComparer.Ordinal)
	{
		"旁观",
		"和一",
		"何一",
		"核一",
		"合一个",
		"合一些",
		"灵合一",
		"灵合一直",
		"你要放松",
		"它应该叫生物好",
		"古林",
		"古龄",
		"一枪",
		"被意识",
		"在具",
		"再具",
		"字形",
		"自习",
		"秀发",
		"abcd",
		"笑我",
		"扶枪",
		"岳父心",
		"丧尸",
		"农科",
		"合100元",
		// “我有” is ordinary first-person Chinese and also an occasional ASR
		// rendering of the name Will. It is never safe as a naked dictionary rule.
		"我有",
		"我有看一下",
		// “微有” can appear across an ordinary word boundary, e.g. “稍微有点”.
		// Treating it as a naked Will alias corrupts valid Chinese.
		"微有",
		// “前推” is ordinary Chinese in phrases such as “往前推进”. Only the
		// specific ASR error “前崔” may normalize to “前催”.
		"前推",
		// “破坏” is valid ordinary Chinese. It must never be a naked dictionary
		// replacement; only PohuanSemanticPolicy may correct verified contexts.
		"破坏"
	};

	private Dictionary<string, string> BuildSafeCorrectionRules()
	{
		Dictionary<string, string> rules = new Dictionary<string, string>(StringComparer.Ordinal);
		if (documentTemplate?.ErrorsCorrectionInfo?.ErrorWordDictionary == null)
		{
			return rules;
		}
		foreach (KeyValuePair<string, ErrorCorrectionWord> item in documentTemplate.ErrorsCorrectionInfo.ErrorWordDictionary)
		{
			foreach (string errorWord in ExpandErrorWords(item.Value.ErrorWordList))
			{
				string wrong = errorWord.Trim();
				string target = item.Key;
				if (wrong.Length == 0 || wrong == target || ContextOnlyErrorWords.Contains(wrong))
				{
					continue;
				}
				// A target containing its own trigger is not idempotent. Re-running
				// v3.3 would match inside already-correct text and grow/corrupt it.
				if (target.Contains(wrong))
				{
					continue;
				}
				if (wrong == "互吹")
				{
					rules[wrong] = "主催";
					continue;
				}
				if (rules.TryGetValue(wrong, out string existing) && existing != target)
				{
					throw new InvalidOperationException($"错词模板冲突: {wrong} 同时映射到 {existing} / {target}");
				}
				rules[wrong] = target;
			}
		}
		rules["vivo1直"] = "Will 一直";
		rules["Will1直"] = "Will 一直";
		rules["二灵0"] = "二灵";
		rules["三灵0"] = "三灵";
		rules["四灵0"] = "四灵";
		// “互吹” is usually a speaker-label ASR error for 主催, but these longer
		// phrases describe the mutual-session activity itself. Longest-first
		// matching keeps the established generic rule while correcting context.
		rules["本场互吹"] = "本场互催";
		rules["平时互吹"] = "平时互催";
		rules["清扫互吹的场域"] = "清扫互催的场域";
		// Longest-match identity guards keep valid Chinese from being consumed by
		// shorter ASR aliases (零和 -> 灵核, 您和 -> 灵核).
		rules["零和博弈"] = "零和博弈";
		rules["您和您团队"] = "您和您团队";
		return rules;
	}

	private void ApplyPlainErrorCorrections()
	{
		Dictionary<string, string> rules = BuildSafeCorrectionRules();
		if (rules.Count == 0)
		{
			ApplyPohuanSemanticCorrections(false);
			ApplyWillAsrSemanticCorrections(false);
			return;
		}

		string expression = string.Join("|", rules.Keys.OrderByDescending(value => value.Length).Select(Regex.Escape));
		Regex correctionRegex = new Regex(expression);
		foreach (Paragraph paragraph in document.Paragraphs)
		{
			Range paragraphRange = paragraph.Range.Duplicate;
			try
			{
				string original = paragraphRange.Text ?? "";
				MatchCollection matches = correctionRegex.Matches(original);
				for (int i = matches.Count - 1; i >= 0; i--)
				{
					Match match = matches[i];
					string target = rules[match.Value];
					if (Regex.IsMatch(match.Value, "^\\d+$") && target.Contains("灵") && !HasSpiritualNumericContext(original, match.Index, match.Length))
					{
						continue;
					}
					Range hit = document.Range(paragraphRange.Start + match.Index, paragraphRange.Start + match.Index + match.Length);
					try
					{
						if (!HasProtectedManualArtifacts(hit))
						{
							hit.Text = target;
						}
					}
					finally
					{
						Marshal.ReleaseComObject(hit);
					}
				}
			}
			finally
			{
				Marshal.ReleaseComObject(paragraphRange);
			}
		}
		ApplyPohuanSemanticCorrections(false);
		ApplyWillAsrSemanticCorrections(false);
	}

	private void ApplyCommentErrorCorrections()
	{
		Dictionary<string, string> rules = BuildSafeCorrectionRules();
		if (rules.Count == 0)
		{
			ApplyPohuanSemanticCorrections(true);
			ApplyWillAsrSemanticCorrections(true);
			return;
		}

		string expression = string.Join("|", rules.Keys.OrderByDescending(value => value.Length).Select(Regex.Escape));
		Regex correctionRegex = new Regex(expression);
		foreach (Paragraph paragraph in document.Paragraphs)
		{
			Range paragraphRange = paragraph.Range.Duplicate;
			try
			{
				string original = paragraphRange.Text ?? "";
				MatchCollection matches = correctionRegex.Matches(original);
				for (int i = matches.Count - 1; i >= 0; i--)
				{
					Match match = matches[i];
					string target = rules[match.Value];
					if (Regex.IsMatch(match.Value, "^\\d+$") && target.Contains("灵") && !HasSpiritualNumericContext(original, match.Index, match.Length))
					{
						continue;
					}

					Range hit = document.Range(paragraphRange.Start + match.Index, paragraphRange.Start + match.Index + match.Length);
					try
					{
						if (HasProtectedManualArtifacts(hit))
						{
							continue;
						}
						int start = hit.Start;
						hit.Text = target;
						Range commentRange = document.Range(start, start + target.Length);
						try
						{
							commentRange.Font.Bold = 1;
							commentRange.Font.Color = WdColor.wdColorDarkRed;
							document.Comments.Add(commentRange, "将“" + match.Value + "”纠正为“" + target + "”");
						}
						finally
						{
							ReleaseComObjectSafely(commentRange);
						}
					}
					finally
					{
						ReleaseComObjectSafely(hit);
					}
				}
			}
			finally
			{
				ReleaseComObjectSafely(paragraphRange);
			}
		}
		ApplyPohuanSemanticCorrections(true);
		ApplyWillAsrSemanticCorrections(true);
	}

	private void ApplyWillAsrSemanticCorrections(bool commentMode)
	{
		string clientName = documentTemplate?.SecondPeople?.Name ?? ExplicitClientSpeakerName ?? string.Empty;
		if (!WillAsrSemanticPolicy.IsWillClientName(clientName))
		{
			return;
		}
		bool inHypnosisPhase = false;
		bool hypnosisPhaseHasEnded = false;
		foreach (Paragraph paragraph in document.Paragraphs)
		{
			Range paragraphRange = paragraph.Range.Duplicate;
			try
			{
				string original = paragraphRange.Text ?? string.Empty;
				bool startsPhase = hypnosisPhaseHasEnded
					? WillAsrSemanticPolicy.IsHypnosisPhaseExplicitStart(original)
					: WillAsrSemanticPolicy.IsHypnosisPhaseStart(original);
				if (!inHypnosisPhase && startsPhase)
				{
					inHypnosisPhase = true;
				}
				IReadOnlyList<WillAsrCorrection> corrections =
					WillAsrSemanticPolicy.FindCorrections(original, inHypnosisPhase, clientName);
				int phaseEndIndex = inHypnosisPhase
					? WillAsrSemanticPolicy.FindHypnosisPhaseEndIndex(original)
					: -1;
				for (int i = corrections.Count - 1; i >= 0; i--)
				{
					WillAsrCorrection correction = corrections[i];
					if (phaseEndIndex >= 0 && correction.Start >= phaseEndIndex)
					{
						continue;
					}
					Range hit = document.Range(
						paragraphRange.Start + correction.Start,
						paragraphRange.Start + correction.Start + correction.Length);
					try
					{
						if (HasProtectedManualArtifacts(hit))
						{
							continue;
						}
						int start = hit.Start;
						hit.Text = correction.After;
						if (commentMode)
						{
							Range commentRange = document.Range(start, start + correction.After.Length);
							try
							{
								commentRange.Font.Bold = 1;
								commentRange.Font.Color = WdColor.wdColorDarkRed;
								document.Comments.Add(commentRange,
									"按语境将“" + correction.Before + "”中的人名纠正为“Will”");
							}
							finally
							{
								ReleaseComObjectSafely(commentRange);
							}
						}
					}
					finally
					{
						ReleaseComObjectSafely(hit);
					}
				}
				if (phaseEndIndex >= 0)
				{
					inHypnosisPhase = false;
					hypnosisPhaseHasEnded = true;
				}
			}
			finally
			{
				ReleaseComObjectSafely(paragraphRange);
			}
		}
	}

	private void ApplyPohuanSemanticCorrections(bool commentMode)
	{
		foreach (Paragraph paragraph in document.Paragraphs)
		{
			Range paragraphRange = paragraph.Range.Duplicate;
			try
			{
				string original = paragraphRange.Text ?? string.Empty;
				IReadOnlyList<PohuanCorrection> corrections = PohuanSemanticPolicy.FindCorrections(original);
				for (int i = corrections.Count - 1; i >= 0; i--)
				{
					PohuanCorrection correction = corrections[i];
					Range hit = document.Range(
						paragraphRange.Start + correction.Start,
						paragraphRange.Start + correction.Start + correction.Length);
					try
					{
						if (HasProtectedManualArtifacts(hit))
						{
							continue;
						}
						int start = hit.Start;
						hit.Text = correction.After;
						if (commentMode)
						{
							Range commentRange = document.Range(start, start + correction.After.Length);
							try
							{
								commentRange.Font.Bold = 1;
								commentRange.Font.Color = WdColor.wdColorDarkRed;
								document.Comments.Add(commentRange,
									"按语境将“" + correction.Before + "”纠正为“" + correction.After + "”");
							}
							finally
							{
								ReleaseComObjectSafely(commentRange);
							}
						}
					}
					finally
					{
						ReleaseComObjectSafely(hit);
					}
				}
			}
			finally
			{
				ReleaseComObjectSafely(paragraphRange);
			}
		}
	}

	private void FormatTencentSpeakerParagraph(Range paragraphRange, Match match, string speakerName, string role, WdColor nameColor, WdColor bodyColor)
	{
		ApplyBodyStylePreservingManualColors(paragraphRange, bodyColor);
		int start = paragraphRange.Start + match.Index;
		int prefixLength = match.Length;
		if (documentTemplate.IsRemoveDatetime && !string.IsNullOrWhiteSpace(documentTemplate.RemoveDatetimeRegex))
		{
			Match timestamp = Regex.Match(match.Value, documentTemplate.RemoveDatetimeRegex);
			if (timestamp.Success)
			{
				Range timestampRange = document.Range(start + timestamp.Index, start + timestamp.Index + timestamp.Length);
				try
				{
					timestampRange.Text = "";
					prefixLength -= timestamp.Length;
				}
				finally
				{
					Marshal.ReleaseComObject(timestampRange);
				}
			}
		}

		Group nameGroup = match.Groups["name"];
		if (documentTemplate.IsEnablePrivacyProtection && nameGroup.Success)
		{
			int nameOffset = nameGroup.Index - match.Index;
			Range nameRange = document.Range(start + nameOffset, start + nameOffset + nameGroup.Length);
			try
			{
				nameRange.Text = role;
				prefixLength += role.Length - nameGroup.Length;
			}
			finally
			{
				Marshal.ReleaseComObject(nameRange);
			}
		}

		if (documentTemplate.IsRemoveDatetime && prefixLength > 0)
		{
			Range colonRange = document.Range(start + prefixLength - 1, start + prefixLength);
			try
			{
				if (colonRange.Text == ":")
				{
					colonRange.Text = "：";
				}
			}
			finally
			{
				Marshal.ReleaseComObject(colonRange);
			}
		}

		Range prefixRange = document.Range(start, start + prefixLength);
		try
		{
			if (!HasProtectedManualArtifacts(prefixRange))
			{
				ApplyTemplateFont(prefixRange);
				prefixRange.Font.Bold = documentTemplate.IsNickFontBold ? 1 : 0;
				prefixRange.Font.Color = nameColor;
			}
		}
		finally
		{
			Marshal.ReleaseComObject(prefixRange);
		}
	}

	private void ReplaceMatchedText(Range paragraphRange, Match match, string replacement)
	{
		Range matchRange = document.Range(
			paragraphRange.Start + match.Index,
			paragraphRange.Start + match.Index + match.Length);
		try
		{
			matchRange.Text = replacement ?? string.Empty;
		}
		finally
		{
			Marshal.ReleaseComObject(matchRange);
		}
	}

	private void ApplyBodyStylePreservingManualColors(Range range, WdColor bodyColor)
	{
		if (HasProtectedManualArtifacts(range))
		{
			return;
		}
		ApplyTemplateFont(range);
		int currentColor = (int)range.Font.Color;
		if (currentColor != (int)WdColor.wdColorAutomatic && currentColor != (int)WdColor.wdColorBlack && currentColor != (int)bodyColor)
		{
			return;
		}
		range.Font.Color = bodyColor;
		if (documentTemplate.IsBodyFontBold)
		{
			range.Font.Bold = 1;
		}
	}

	private static bool HasSpiritualNumericContext(string value, int index, int length)
	{
		bool adjacentDigit = (index > 0 && char.IsDigit(value[index - 1])) ||
			(index + length < value.Length && char.IsDigit(value[index + length]));
		int start = Math.Max(0, index - 12);
		int end = Math.Min(value.Length, index + length + 12);
		return !adjacentDigit && Regex.IsMatch(value.Substring(start, end - start), "灵|频率|意识强度|探索|区域|检测点");
	}

	private void ReplaceAllText(string from, string to, string semanticTarget, bool protectManualRed, bool checkNumericContext)
	{
		if (string.IsNullOrWhiteSpace(from) || from == to)
		{
			return;
		}
		Range search = document.Content.Duplicate;
		try
		{
			int documentEnd = document.Content.End;
			while (search.Start < documentEnd)
			{
				Find find = search.Find;
				find.ClearFormatting();
				find.Text = from.Trim();
				find.MatchCase = true;
				find.MatchWholeWord = false;
				find.MatchWildcards = false;
				find.Forward = true;
				find.Wrap = WdFindWrap.wdFindStop;
				if (!find.Execute())
				{
					break;
				}

				int originalEnd = search.End;
				bool skip = protectManualRed && IsManualRed(search.Font.Color);
				if (!skip && checkNumericContext && Regex.IsMatch(from, "^\\d+$") && semanticTarget.Contains("灵"))
				{
					skip = !HasSpiritualNumericContext(search);
				}
				if (!skip)
				{
					search.Text = to ?? "";
					originalEnd = search.End;
					documentEnd = document.Content.End;
				}
				search.SetRange(Math.Min(Math.Max(originalEnd, search.Start + 1), documentEnd), documentEnd);
			}
		}
		finally
		{
			Marshal.ReleaseComObject(search);
		}
	}

	private static bool IsManualRed(WdColor color)
	{
		int value = (int)color;
		if (value < 0)
		{
			return false;
		}
		int red = value & 0xFF;
		int green = (value >> 8) & 0xFF;
		int blue = (value >> 16) & 0xFF;
		return red >= 160 && green <= 110 && blue <= 110;
	}

	private bool HasSpiritualNumericContext(Range hit)
	{
		int start = Math.Max(document.Content.Start, hit.Start - 12);
		int end = Math.Min(document.Content.End, hit.End + 12);
		Range context = document.Range(start, end);
		try
		{
			string value = context.Text ?? "";
			int leftIndex = hit.Start - start - 1;
			int rightIndex = hit.End - start;
			bool adjacentDigit = (leftIndex >= 0 && leftIndex < value.Length && char.IsDigit(value[leftIndex])) ||
				(rightIndex >= 0 && rightIndex < value.Length && char.IsDigit(value[rightIndex]));
			return !adjacentDigit && Regex.IsMatch(value, "灵|频率|意识强度|探索|区域|检测点");
		}
		finally
		{
			Marshal.ReleaseComObject(context);
		}
	}

	public bool AnalysisDocumentRoleName()
	{
		Regex regex = new Regex(documentTemplate.IdentificationStrategyInfo.Regex);
		int num = 0;
		bool flag = false;
		foreach (Paragraph paragraph in document.Paragraphs)
		{
			Match match = regex.Match(paragraph.Range.Text);
			if (!flag && match.Success)
			{
				documentTemplate.FirstPeople.Name = match.Groups["name"].Value;
				flag = true;
			}
			else if (match.Success && match.Groups["name"].Value != documentTemplate.FirstPeople.Name)
			{
				documentTemplate.SecondPeople.Name = match.Groups["name"].Value;
				return true;
			}
			num++;
			if (num >= 100)
			{
				throw new EntryPointNotFoundException("没有识别到主催、被催身份，请检查识别策略是否设置正确！");
			}
		}
		return false;
	}

	private static bool SpeakerMatches(string actual, string expected)
	{
		string left = CanonicalSpeakerName(actual);
		string right = CanonicalSpeakerName(expected);
		if (left.Length == 0 || right.Length == 0)
		{
			return false;
		}
		if (left.Equals(right, StringComparison.OrdinalIgnoreCase))
		{
			return true;
		}
		// Single-character names such as “无” must not capture longer,
		// different speakers such as “无限”. Multi-character containment is
		// retained for common transcript suffixes/prefixes.
		if (Math.Min(left.Length, right.Length) < 2)
		{
			return false;
		}
		return left.IndexOf(right, StringComparison.OrdinalIgnoreCase) >= 0 ||
			right.IndexOf(left, StringComparison.OrdinalIgnoreCase) >= 0;
	}

	private static string CanonicalSpeakerName(string value)
	{
		string result = value ?? "";
		result = Regex.Replace(result, "[\\s，,。._:：\\-]+", "");
		return result.Trim();
	}

	public bool SetPageNarrowMargin()
	{
		if (documentTemplate.IsPageNarrowMargin)
		{
			document.PageSetup.PaperSize = WdPaperSize.wdPaperA4;
			document.PageSetup.Orientation = WdOrientation.wdOrientPortrait;
			document.PageSetup.TopMargin = 33f;
			document.PageSetup.BottomMargin = 33f;
			document.PageSetup.LeftMargin = 33f;
			document.PageSetup.RightMargin = 33f;
			document.PageSetup.HeaderDistance = 20f;
			return true;
		}
		return false;
	}

	private void AppendConsciousnessReferenceIfEnabled()
	{
		if (!IsGenerateConsciousnessAppendix)
		{
			return;
		}
		try
		{
			int count = new ConsciousnessAppendixHelper().AppendReferenceAppendix(document);
			if (count > 0)
			{
				Log.Logger.Information("Consciousness appendix generated: " + count + " items.");
			}
		}
		catch (Exception ex)
		{
			Log.Logger.Warning(ex, "Consciousness appendix generation skipped.");
		}
	}

	public bool SetShowPageNumber()
	{
		if (documentTemplate.IsShowPageNumber)
		{
			PageNumbers pageNumbers = wordApp.Selection.Sections[1].Headers[WdHeaderFooterIndex.wdHeaderFooterEvenPages].PageNumbers;
			pageNumbers.NumberStyle = WdPageNumberStyle.wdPageNumberStyleNumberInDash;
			pageNumbers.HeadingLevelForChapter = 0;
			pageNumbers.IncludeChapterNumber = false;
			pageNumbers.RestartNumberingAtSection = false;
			pageNumbers.StartingNumber = 0;
			object PageNumberAlignment = WdPageNumberAlignment.wdAlignPageNumberLeft;
			object FirstPage = true;
			wordApp.Selection.Sections[1].Footers[WdHeaderFooterIndex.wdHeaderFooterEvenPages].PageNumbers.Add(ref PageNumberAlignment, ref FirstPage);
			document.Content.InsertAfter("\n");
			return true;
		}
		return false;
	}

	public bool SetGenerateOverview()
	{
		if (documentTemplate.IsGenerateOverview)
		{
			int numRows = 7;
			Tables tables = null;
			Range range = null;
			try
			{
				tables = document.Tables;
				range = document.Range(document.Content.Start, document.Content.Start);
				object DefaultTableBehavior = Type.Missing;
				object AutoFitBehavior = Type.Missing;
				overviewTable = tables.Add(range, numRows, 2, ref DefaultTableBehavior, ref AutoFitBehavior);
			}
			finally
			{
				ReleaseComObjectSafely(range);
				ReleaseComObjectSafely(tables);
			}
			overviewTable.Borders.Enable = 1;
			overviewTable.Range.ParagraphFormat.Alignment = WdParagraphAlignment.wdAlignParagraphCenter;
			overviewTable.Range.ParagraphFormat.SpaceAfter = 0f;
			overviewTable.Range.ParagraphFormat.SpaceBefore = 0f;
			overviewTable.Range.ParagraphFormat.LineSpacing = 12f;
			ApplyTemplateFont(overviewTable.Range);
			overviewTable.Range.Font.Size = 12f;
			overviewTable.Borders.OutsideLineStyle = WdLineStyle.wdLineStyleDouble;
			overviewTable.Borders.InsideLineStyle = WdLineStyle.wdLineStyleSingle;
			SetOverviewCell(1, 1, "互催主题：", true);
			SetOverviewCell(1, 2, OverviewTopic ?? "", false);
			SetOverviewCell(2, 1, "互催日期：", true);
			SetOverviewCell(2, 2, OverviewDate ?? "", false);
			SetOverviewCell(3, 1, "互催时长：", true);
			SetOverviewCell(3, 2, "", false);
			SetOverviewCell(4, 1, "主催名称：", true);
			SetOverviewCell(4, 2, documentTemplate.FirstPeople.Name, false);
			SetOverviewCell(5, 1, "被催名称：", true);
			SetOverviewCell(5, 2, documentTemplate.SecondPeople.Name, false);
			SetOverviewCell(6, 1, "主催复盘：", true);
			SetOverviewCell(6, 2, "", false);
			SetOverviewCell(7, 1, "被催复盘：", true);
			SetOverviewCell(7, 2, "", false);
			return true;
		}
		return false;
	}

	private void SetOverviewCell(int row, int column, string text, bool bold)
	{
		Range range = overviewTable.Cell(row, column).Range;
		try
		{
			range.Text = text ?? string.Empty;
			ApplyTemplateFont(range);
			range.Font.Size = 12f;
			range.Font.Bold = bold ? -1 : 0;
			range.ParagraphFormat.Alignment = column == 1
				? WdParagraphAlignment.wdAlignParagraphCenter
				: WdParagraphAlignment.wdAlignParagraphLeft;
		}
		finally
		{
			ReleaseComObjectSafely(range);
		}
	}

	public void UpdateOverviewDuration(string duration)
	{
		if (documentTemplate.IsGenerateOverview && overviewTable != null)
		{
			SetOverviewCell(3, 2, duration, false);
		}
	}

	public bool SetParagraphStyle(Paragraph paragraph)
	{
		if (documentTemplate.IsGenerateOverview)
		{
			return true;
		}
		return false;
	}

	public bool AddComment(string rightWord, string errorWord)
	{
		if (string.IsNullOrWhiteSpace(errorWord) || string.IsNullOrWhiteSpace(rightWord) || errorWord == rightWord)
		{
			return false;
		}

		bool changed = false;
		int searchStart = document.Content.Start;
		while (searchStart < document.Content.End)
		{
			Range foundRange = document.Range(searchStart, document.Content.End);
			try
			{
				Find find = foundRange.Find;
				find.ClearFormatting();
				find.Text = errorWord;
				find.MatchCase = true;
				find.MatchWholeWord = false;
				find.MatchWildcards = false;
				find.Forward = true;
				find.Wrap = WdFindWrap.wdFindStop;
				if (!find.Execute())
				{
					break;
				}

				int originalEnd = foundRange.End;
				if (HasProtectedManualArtifacts(foundRange))
				{
					searchStart = Math.Max(originalEnd, foundRange.Start + 1);
					continue;
				}

				int start = foundRange.Start;
				foundRange.Text = rightWord;
				Range commentRange = document.Range(start, start + rightWord.Length);
				try
				{
					commentRange.Font.Bold = 1;
					commentRange.Font.Color = WdColor.wdColorDarkRed;
					document.Comments.Add(commentRange, "将“" + errorWord + "”纠正为“" + rightWord + "”");
				}
				finally
				{
					Marshal.ReleaseComObject(commentRange);
				}
				changed = true;
				searchStart = start + rightWord.Length;
			}
			finally
			{
				Marshal.ReleaseComObject(foundRange);
			}
		}
		return changed;
	}

	private void MergeAdjacentRoleParagraphs()
	{
		if (documentTemplate == null || document == null)
		{
			return;
		}
		for (int i = document.Paragraphs.Count; i >= 2; i--)
		{
			Paragraph currentParagraph = document.Paragraphs[i];
			Paragraph previousParagraph = document.Paragraphs[i - 1];
			string currentText = CleanParagraphText(currentParagraph.Range.Text);
			string previousText = CleanParagraphText(previousParagraph.Range.Text);
			if (!TryParseRoleParagraph(currentText, out string currentRole, out string currentBody)
				|| !TryParseRoleParagraph(previousText, out string previousRole, out _)
				|| currentRole != previousRole
				|| HasProtectedManualArtifacts(previousParagraph.Range)
				|| HasProtectedManualArtifacts(currentParagraph.Range))
			{
				continue;
			}
			string mergedText = NormalizeMergedParagraph(previousText, currentBody);
			Range previousContentRange = previousParagraph.Range.Duplicate;
			previousContentRange.End = Math.Max(previousContentRange.Start, previousContentRange.End - 1);
			previousContentRange.Text = mergedText;
			ApplyRoleBlockStyle(previousParagraph.Range, currentRole);
			Range currentRange = currentParagraph.Range;
			object unit = WdUnits.wdCharacter;
			object count = 1;
			currentRange.Delete(ref unit, ref count);
		}
	}

	private string CleanParagraphText(string text)
	{
		return (text ?? string.Empty).Trim(' ', '\t', '\r', '\n', '\a');
	}

	private bool TryParseRoleParagraph(string text, out string role, out string body)
	{
		role = null;
		body = null;
		if (TryParseRoleParagraph(text, documentTemplate.FirstPeople?.Role, out role, out body))
		{
			return true;
		}
		return TryParseRoleParagraph(text, documentTemplate.SecondPeople?.Role, out role, out body);
	}

	private bool TryParseRoleParagraph(string text, string candidateRole, out string role, out string body)
	{
		role = null;
		body = null;
		if (string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(candidateRole))
		{
			return false;
		}
		string prefix = candidateRole + ":";
		string fullWidthPrefix = candidateRole + "：";
		if (text.StartsWith(prefix))
		{
			role = candidateRole;
			body = text.Substring(prefix.Length).Trim();
			return true;
		}
		if (text.StartsWith(fullWidthPrefix))
		{
			role = candidateRole;
			body = text.Substring(fullWidthPrefix.Length).Trim();
			return true;
		}
		return false;
	}

	private void RemoveRealtimeTranscriptionNoticeParagraphs()
	{
		if (document == null)
		{
			return;
		}
		for (int i = document.Paragraphs.Count; i >= 1; i--)
		{
			Paragraph paragraph = document.Paragraphs[i];
			Range range = paragraph.Range.Duplicate;
			try
			{
				string text = CleanParagraphText(range.Text);
				bool isSystemNotice = Regex.IsMatch(
					text,
					@"^(?:会议已开启实时转写(?:[，,。！! ]*机器识别结果仅供参考)?|机器识别结果仅供参考)[。！! ]*$");
				if (!isSystemNotice || range.Comments.Count > 0)
				{
					continue;
				}
				// Keep the paragraph marker: deleting the whole COM range is not
				// reliable here and can leave its text behind in Word.
				Range content = range.Duplicate;
				content.End = Math.Max(content.Start, content.End - 1);
				try
				{
					content.Text = string.Empty;
				}
				finally
				{
					Marshal.ReleaseComObject(content);
				}
			}
			finally
			{
				Marshal.ReleaseComObject(range);
			}
		}
	}

	private void MergeStandaloneRoleLabelParagraphs()
	{
		if (documentTemplate == null || document == null)
		{
			return;
		}
		for (int i = document.Paragraphs.Count; i >= 2; i--)
		{
			Paragraph currentParagraph = document.Paragraphs[i];
			Paragraph previousParagraph = document.Paragraphs[i - 1];
			Range previousRange = previousParagraph.Range.Duplicate;
			Range currentRange = currentParagraph.Range.Duplicate;
			try
			{
				string previousText = CleanParagraphText(previousRange.Text);
				string currentText = CleanParagraphText(currentRange.Text);
				if (!TryParseRoleParagraph(previousText, out string role, out string previousBody)
					|| !string.IsNullOrWhiteSpace(previousBody)
					|| string.IsNullOrWhiteSpace(currentText)
					|| TryParseRoleParagraph(currentText, out _, out _)
					|| HasProtectedManualArtifacts(previousRange)
					|| HasStructuralArtifacts(currentRange))
				{
					continue;
				}

				Range currentContent = currentRange.Duplicate;
				currentContent.End = Math.Max(currentContent.Start, currentContent.End - 1);
				TrimRangeWhitespace(currentContent);
				Range insertion = document.Range(
					Math.Max(previousRange.Start, previousRange.End - 1),
					Math.Max(previousRange.Start, previousRange.End - 1));
				try
				{
					insertion.FormattedText = currentContent.FormattedText;
				}
				finally
				{
					Marshal.ReleaseComObject(insertion);
					Marshal.ReleaseComObject(currentContent);
				}
				object unit = WdUnits.wdCharacter;
				object count = 1;
				currentRange.Delete(ref unit, ref count);
			}
			finally
			{
				Marshal.ReleaseComObject(previousRange);
				Marshal.ReleaseComObject(currentRange);
			}
		}
	}

	private static void TrimRangeWhitespace(Range range)
	{
		string text = range.Text ?? string.Empty;
		int start = 0;
		int end = text.Length;
		while (start < end && char.IsWhiteSpace(text[start]))
		{
			start++;
		}
		while (end > start && char.IsWhiteSpace(text[end - 1]))
		{
			end--;
		}
		range.SetRange(range.Start + start, range.Start + end);
	}

	private string NormalizeMergedParagraph(string previousText, string currentBody)
	{
		if (string.IsNullOrWhiteSpace(currentBody))
		{
			return previousText;
		}
		if (string.IsNullOrWhiteSpace(previousText))
		{
			return currentBody;
		}
		string left = previousText.TrimEnd();
		string right = currentBody.TrimStart();
		string separator = NeedsAsciiWordSeparator(left, right) ? " " : "";
		return left + separator + right;
	}

	private static bool NeedsAsciiWordSeparator(string left, string right)
	{
		if (left.Length == 0 || right.Length == 0)
		{
			return false;
		}
		char last = left[left.Length - 1];
		char first = right[0];
		return last <= 0x7F && first <= 0x7F &&
			char.IsLetterOrDigit(last) && char.IsLetterOrDigit(first);
	}

	private bool HasProtectedManualArtifacts(Range range)
	{
		if (range == null)
		{
			return false;
		}
		if (range.Comments.Count > 0 ||
			range.Hyperlinks.Count > 0 ||
			range.Bookmarks.Count > 0 ||
			range.Fields.Count > 0 ||
			range.InlineShapes.Count > 0)
		{
			return true;
		}

		int color = (int)range.Font.Color;
		if (color == (int)WdConstants.wdUndefined || IsManualRed(range.Font.Color))
		{
			return true;
		}
		if (range.Font.Italic != 0)
		{
			return true;
		}
		return range.Font.Underline != WdUnderline.wdUnderlineNone;
	}

	private static bool HasStructuralArtifacts(Range range)
	{
		return range != null &&
			(range.Hyperlinks.Count > 0 ||
			 range.Bookmarks.Count > 0 ||
			 range.Fields.Count > 0 ||
			 range.InlineShapes.Count > 0);
	}

	private void ApplyRoleBlockStyle(Range range, string role)
	{
		ApplyTemplateFont(range);
		string colorHex = role == documentTemplate.SecondPeople?.Role
			? documentTemplate.SecondPeople.FontBodyColor.ToString()
			: documentTemplate.FirstPeople.FontBodyColor.ToString();
		range.Font.Color = (WdColor)ColorTranslator.ToOle(Color.FromArgb(int.Parse(colorHex, NumberStyles.HexNumber)));
		if (documentTemplate.IsBodyFontBold)
		{
			range.Font.Bold = 1;
		}
	}

	private static IEnumerable<string> ExpandErrorWords(IEnumerable<string> errorWords)
	{
		if (errorWords == null)
		{
			yield break;
		}
		char[] separators = { '、', '，', ',', '；', ';' };
		foreach (string rawWord in errorWords)
		{
			if (string.IsNullOrWhiteSpace(rawWord))
			{
				continue;
			}
			foreach (string part in rawWord.Split(separators, StringSplitOptions.RemoveEmptyEntries))
			{
				string word = part.Trim();
				if (!string.IsNullOrEmpty(word))
				{
					yield return word;
				}
			}
		}
	}
}
