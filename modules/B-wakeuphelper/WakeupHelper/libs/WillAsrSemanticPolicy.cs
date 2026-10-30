using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace WakeupHelper.libs;

public enum WillAsrSpeakerRole
{
	Unknown,
	Main,
	Client
}

public sealed class WillAsrCorrection
{
	public int Start { get; }
	public int Length { get; }
	public string Before { get; }
	public string After { get; }
	public string Rule { get; }

	public WillAsrCorrection(int start, string before, string after, string rule)
	{
		Start = start;
		Length = before.Length;
		Before = before;
		After = after;
		Rule = rule;
	}
}

public static class WillAsrSemanticPolicy
{
	private sealed class Rule
	{
		public Regex Pattern { get; }
		public Func<Match, string> Replacement { get; }
		public string Name { get; }

		public Rule(string pattern, Func<Match, string> replacement, string name)
		{
			Pattern = new Regex(pattern, RegexOptions.Compiled);
			Replacement = replacement;
			Name = name;
		}
	}

	// Automatic correction is limited to direct instructions and direct status
	// questions spoken by 主催. Other broken-looking forms may instead contain an
	// extra ASR "有" (for example, 跟我有讲 -> 跟我讲), so they remain review-only.
	private static readonly Rule[] HighPrecisionRules =
	{
		new Rule(
			@"请\s*我有\s*(?=连接|进入|感受|观察|查看|看见|描述|回答|探索|回溯|接收|继续|想象|说出)",
			_ => "请 Will ",
			"request-will-action"),
		new Rule(
			@"(?<lead>现在|请问)\s*我有\s*(?=是否|能否|可否)",
			match => match.Groups["lead"].Value + " Will ",
			"ask-will-state")
	};

	private static readonly Regex[] HypnosisStartPatterns =
	{
		new Regex("(?:录音|互催)(?:已经|现在)?开始", RegexOptions.Compiled),
		new Regex("(?:我们|现在)(?:就|准备)?开始(?:今天|进行|互催|探索|调整|吧|了)", RegexOptions.Compiled),
		new Regex("调整(?:一下)?(?:状态|呼吸).*?(?:呼吸|放松)", RegexOptions.Compiled),
		new Regex("进入(?:到)?(?:越来越深的)?(?:放松|潜意识|旁观|纯旁观)", RegexOptions.Compiled),
		new Regex("保持(?:深)?呼吸|闭上眼睛|看到一朵花", RegexOptions.Compiled),
		new Regex("请\\s*(?:Will|我有)\\s*(?:连接|进入|感受|观察|查看|看见|描述|回答|探索|回溯|接收)", RegexOptions.Compiled),
		new Regex("现在\\s*(?:Will|我有)\\s*(?:是否|能否|可否)", RegexOptions.Compiled)
	};

	private static readonly Regex[] HypnosisEndPatterns =
	{
		new Regex("(?:互催|催眠|录音)(?:到这里|现在)?(?:就)?结束", RegexOptions.Compiled),
		new Regex("(?:好了|好|行|可以)[，,。.!！\\s]*(?:今天)?(?:就)?(?:先)?(?:到这里|结束了|结束吧|结束)", RegexOptions.Compiled),
		new Regex("(?:结束|停止)(?:今天的)?录音|录音可以结束", RegexOptions.Compiled),
		new Regex("(?:慢慢)?睁开眼睛|回到当下|慢慢回来|完全清醒", RegexOptions.Compiled)
	};

	private static readonly string[] SessionTerms =
	{
		"看到", "感受", "接收", "画面", "灵核", "潜意识", "旁观", "放松",
		"连接", "探索", "清理", "调整", "合一本源", "意识状态"
	};

	private static readonly string[] DropYouPrefixes =
	{
		"看到", "看见", "感受", "感知", "感觉", "感觉到", "觉得", "认为", "发现", "接收", "连接",
		"选择", "希望", "是否", "能否", "可否", "可以", "是把", "现在", "刚才",
		"目前", "自己", "对于", "对", "通过", "拿", "上前", "主动", "才", "也",
		"已经", "正在", "继续", "进行", "去", "来", "要", "会", "能", "应该",
		"需要", "想要", "说", "讲", "听到", "意识到", "遇到", "作为", "切换",
		"在", "把", "将", "从", "向", "所有", "父母的", "身体的", "灵核的"
	};

	private static readonly string[] GiveQuantifierPrefixes =
	{
		"给了", "给"
	};

	private static readonly string[] GiveQuantifierSuffixes =
	{
		"一个", "一些", "些", "几个", "很多", "这种", "这个", "一点", "一份", "新的"
	};

	private static readonly string[] PossessiveNounPrefixes =
	{
		"爸爸", "父亲", "妈妈", "母亲", "父母", "家人", "家里", "家",
		"先生", "妻子", "老婆", "丈夫", "孩子", "儿子", "女儿", "伴侣",
		"朋友", "同学", "同事", "身体", "灵核", "高灵", "潜意识"
	};

	private static readonly Regex DirectQuotePrefix = new Regex(
		@"(?:他|她|妈妈|父母|朋友|老师|对方|人家)(?:就|又|还|也)?说(?:是|道)?[，,:：]\s*$",
		RegexOptions.Compiled);

	private static readonly Regex ThirdPartyQuoteLead = new Regex(
		@"(?:他|她|妈妈|父母|朋友|老师|对方|灵核|高灵|同学|同事|老板|医生|人家)(?:就|又|还|也)?(?:说|问|讲|告诉|回答|表示)[^。！？；]{0,20}$",
		RegexOptions.Compiled);

	private static readonly Regex ClientFirstPersonCandidate = new Regex(
		@"我有|我",
		RegexOptions.Compiled);

	private static readonly string[] LexicalWoTerms =
	{
		"我们", "自我", "小我", "无我", "忘我", "本我", "超我", "真我",
		"我执", "我相", "我念", "我方", "我司", "我辈"
	};

	public static WillAsrSpeakerRole GetSpeakerRole(string value)
	{
		string text = value ?? string.Empty;
		if (Regex.IsMatch(text, @"^\s*主催\s*[:：]"))
		{
			return WillAsrSpeakerRole.Main;
		}
		if (Regex.IsMatch(text, @"^\s*被催\s*[:：]"))
		{
			return WillAsrSpeakerRole.Client;
		}
		return WillAsrSpeakerRole.Unknown;
	}

	public static bool IsHypnosisPhaseStart(string value)
	{
		string text = value ?? string.Empty;
		if (IsHypnosisPhaseExplicitStart(text))
		{
			return true;
		}
		int termCount = SessionTerms.Count(text.Contains);
		return GetSpeakerRole(text) == WillAsrSpeakerRole.Client && termCount >= 2;
	}

	public static bool IsHypnosisPhaseExplicitStart(string value)
	{
		string text = value ?? string.Empty;
		foreach (Regex pattern in HypnosisStartPatterns)
		{
			if (pattern.IsMatch(text))
			{
				return true;
			}
		}
		return false;
	}

	public static int FindHypnosisPhaseEndIndex(string value)
	{
		string text = value ?? string.Empty;
		int earliest = -1;
		foreach (Regex pattern in HypnosisEndPatterns)
		{
			Match match = pattern.Match(text);
			if (match.Success && (earliest < 0 || match.Index < earliest))
			{
				earliest = match.Index;
			}
		}
		return earliest;
	}

	public static bool IsWillClientName(string value)
	{
		string normalized = Regex.Replace(value ?? string.Empty, @"[^A-Za-z\u4e00-\u9fff]", string.Empty);
		return normalized.IndexOf("will", StringComparison.OrdinalIgnoreCase) >= 0 ||
			normalized.Contains("威尔");
	}

	public static IReadOnlyList<WillAsrCorrection> FindCorrections(
		string value,
		bool inHypnosisPhase,
		string clientName)
	{
		string text = value ?? string.Empty;
		if (!inHypnosisPhase || !IsWillClientName(clientName))
		{
			return Array.Empty<WillAsrCorrection>();
		}
		List<WillAsrCorrection> candidates = new List<WillAsrCorrection>();
		WillAsrSpeakerRole role = GetSpeakerRole(text);
		int phaseEndIndex = FindHypnosisPhaseEndIndex(text);
		if (role == WillAsrSpeakerRole.Client)
		{
			foreach (Match match in ClientFirstPersonCandidate.Matches(text))
			{
				if (phaseEndIndex >= 0 && match.Index >= phaseEndIndex)
				{
					continue;
				}
				if (IsQuotedFirstPerson(text, match.Index) || IsLexicalWo(text, match.Index))
				{
					continue;
				}
				bool isWoyou = string.Equals(match.Value, "我有", StringComparison.Ordinal);
				bool keepYou = isWoyou && ShouldKeepYou(text, match.Index, match.Length);
				candidates.Add(new WillAsrCorrection(
					match.Index,
					match.Value,
					FormatWill(text, match.Index, match.Length, keepYou),
					keepYou ? "client-observer-will-keep-you" :
						(isWoyou ? "client-observer-will" : "client-observer-will-pronoun")));
			}
		}
		else if (role == WillAsrSpeakerRole.Main)
		{
			foreach (Rule rule in HighPrecisionRules)
			{
				foreach (Match match in rule.Pattern.Matches(text))
				{
					if (phaseEndIndex >= 0 && match.Index >= phaseEndIndex)
					{
						continue;
					}
					string replacement = rule.Replacement(match);
					if (!string.Equals(match.Value, replacement, StringComparison.Ordinal))
					{
						candidates.Add(new WillAsrCorrection(
							match.Index,
							match.Value,
							replacement,
							rule.Name));
					}
				}
			}
		}

		candidates.Sort((left, right) =>
		{
			int startOrder = left.Start.CompareTo(right.Start);
			return startOrder != 0 ? startOrder : right.Length.CompareTo(left.Length);
		});

		List<WillAsrCorrection> accepted = new List<WillAsrCorrection>();
		int occupiedUntil = -1;
		foreach (WillAsrCorrection candidate in candidates)
		{
			if (candidate.Start < occupiedUntil)
			{
				continue;
			}
			accepted.Add(candidate);
			occupiedUntil = candidate.Start + candidate.Length;
		}
		return accepted;
	}

	public static IReadOnlyList<WillAsrCorrection> FindCorrections(string value)
	{
		return FindCorrections(value, IsHypnosisPhaseStart(value), "Will");
	}

	public static IReadOnlyList<WillAsrCorrection> FindCorrections(string value, bool inHypnosisPhase)
	{
		return FindCorrections(value, inHypnosisPhase, "Will");
	}

	private static bool ShouldKeepYou(string text, int start, int length)
	{
		string suffix = text.Substring(start + length);
		if (DropYouPrefixes.Any(suffix.StartsWith))
		{
			return false;
		}
		string prefix = text.Substring(Math.Max(0, start - 4), Math.Min(4, start));
		bool giveQuantifier = GiveQuantifierPrefixes.Any(prefix.EndsWith) &&
			GiveQuantifierSuffixes.Any(suffix.StartsWith);
		return !giveQuantifier;
	}

	private static bool IsQuotedFirstPerson(string text, int start)
	{
		string prefix = text.Substring(Math.Max(0, start - 28), Math.Min(28, start));
		if (DirectQuotePrefix.IsMatch(prefix))
		{
			return true;
		}
		int quoteStart = text.LastIndexOf('“', Math.Max(0, start - 1));
		int quoteEnd = text.LastIndexOf('”', Math.Max(0, start - 1));
		if (quoteStart > quoteEnd)
		{
			string attribution = text.Substring(
				Math.Max(0, quoteStart - 40),
				Math.Min(40, quoteStart));
			return ThirdPartyQuoteLead.IsMatch(attribution);
		}
		return false;
	}

	private static bool IsLexicalWo(string text, int start)
	{
		foreach (string term in LexicalWoTerms)
		{
			int termStart = start;
			if (term.StartsWith("我", StringComparison.Ordinal))
			{
				if (start + term.Length <= text.Length &&
					string.CompareOrdinal(text, start, term, 0, term.Length) == 0)
				{
					return true;
				}
			}
			else
			{
				termStart = start - term.IndexOf('我');
				if (termStart >= 0 && termStart + term.Length <= text.Length &&
					string.CompareOrdinal(text, termStart, term, 0, term.Length) == 0)
				{
					return true;
				}
			}
		}
		return false;
	}

	private static string FormatWill(string text, int start, int length, bool keepYou)
	{
		const string punctuation = "，。！？；：、,.!?;:()（）[]【】{}<>《》\"'“”‘’\r\n\t";
		bool leftSpace = start > 0 && !char.IsWhiteSpace(text[start - 1]) &&
			punctuation.IndexOf(text[start - 1]) < 0;
		int end = start + length;
		string suffix = text.Substring(end);
		bool possessive = !keepYou && PossessiveNounPrefixes.Any(suffix.StartsWith);
		bool rightSpace = !keepYou && end < text.Length && !char.IsWhiteSpace(text[end]) &&
			punctuation.IndexOf(text[end]) < 0;
		return (leftSpace ? " " : string.Empty) + "Will" +
			(keepYou ? " 有" : (possessive ? " 的" : (rightSpace ? " " : string.Empty)));
	}

	public static string Normalize(string value, bool inHypnosisPhase, string clientName)
	{
		string result = value ?? string.Empty;
		IReadOnlyList<WillAsrCorrection> corrections = FindCorrections(result, inHypnosisPhase, clientName);
		for (int i = corrections.Count - 1; i >= 0; i--)
		{
			WillAsrCorrection correction = corrections[i];
			result = result.Substring(0, correction.Start) + correction.After +
				result.Substring(correction.Start + correction.Length);
		}
		return result;
	}

	public static string Normalize(string value)
	{
		return Normalize(value, IsHypnosisPhaseStart(value), "Will");
	}

	public static string Normalize(string value, bool inHypnosisPhase)
	{
		return Normalize(value, inHypnosisPhase, "Will");
	}
}
