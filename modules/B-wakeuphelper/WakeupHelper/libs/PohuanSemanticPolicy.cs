using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace WakeupHelper.libs;

public sealed class PohuanCorrection
{
	public int Start { get; }
	public int Length { get; }
	public string Before { get; }
	public string After { get; }
	public string Rule { get; }

	public PohuanCorrection(int start, string before, string after, string rule)
	{
		Start = start;
		Length = before.Length;
		Before = before;
		After = after;
		Rule = rule;
	}
}

public static class PohuanSemanticPolicy
{
	private sealed class Candidate
	{
		public PohuanCorrection Correction { get; }
		public int Priority { get; }

		public Candidate(PohuanCorrection correction, int priority)
		{
			Correction = correction;
			Priority = priority;
		}
	}

	private static readonly KeyValuePair<string, string>[] ExactRepairs =
	{
		new KeyValuePair<string, string>("把这个去破一破坏这些", "把这些逐一破幻"),
		new KeyValuePair<string, string>("破坏破这种恐惧感", "破幻这种恐惧感"),
		new KeyValuePair<string, string>("破坏破这种恐惧", "破幻这种恐惧"),
		new KeyValuePair<string, string>("不是这破坏这个", "不是只破幻这个"),
		new KeyValuePair<string, string>("我们破破坏", "我们破幻"),
		new KeyValuePair<string, string>("破一破坏", "破幻")
	};

	private static readonly Regex[] HighPrecisionPatterns =
	{
		new Regex("高效破坏", RegexOptions.Compiled),
		new Regex("破坏再破坏", RegexOptions.Compiled),
		new Regex("破坏的?(?:目的|主题|方向|过程|体系|链路|方法|练习|能力|效率)", RegexOptions.Compiled),
		new Regex("破坏(?:和|、|以及)(?:破除|破解|合一|清理|脱敏|疗愈|觉察|入幻|造幻)", RegexOptions.Compiled),
		new Regex("(?:破除|破解|合一|清理|脱敏|疗愈|觉察|入幻|造幻)(?:和|、|以及)破坏", RegexOptions.Compiled)
	};

	public static IReadOnlyList<PohuanCorrection> FindCorrections(string value)
	{
		string text = value ?? string.Empty;
		List<Candidate> candidates = new List<Candidate>();
		foreach (KeyValuePair<string, string> repair in ExactRepairs)
		{
			int start = text.IndexOf(repair.Key, StringComparison.Ordinal);
			while (start >= 0)
			{
				candidates.Add(new Candidate(
					new PohuanCorrection(start, repair.Key, repair.Value, "exact-asr-repair"), 0));
				start = text.IndexOf(repair.Key, start + repair.Key.Length, StringComparison.Ordinal);
			}
		}

		for (int patternIndex = 0; patternIndex < HighPrecisionPatterns.Length; patternIndex++)
		{
			foreach (Match match in HighPrecisionPatterns[patternIndex].Matches(text))
			{
				string replacement = match.Value.Replace("破坏", "破幻");
				candidates.Add(new Candidate(
					new PohuanCorrection(match.Index, match.Value, replacement, "high-precision-context"),
					10 + patternIndex));
			}
		}

		candidates.Sort((left, right) =>
		{
			int startOrder = left.Correction.Start.CompareTo(right.Correction.Start);
			if (startOrder != 0)
			{
				return startOrder;
			}
			int priorityOrder = left.Priority.CompareTo(right.Priority);
			if (priorityOrder != 0)
			{
				return priorityOrder;
			}
			return right.Correction.Length.CompareTo(left.Correction.Length);
		});

		List<PohuanCorrection> accepted = new List<PohuanCorrection>();
		int occupiedUntil = -1;
		foreach (Candidate candidate in candidates)
		{
			PohuanCorrection correction = candidate.Correction;
			if (correction.Start < occupiedUntil)
			{
				continue;
			}
			accepted.Add(correction);
			occupiedUntil = correction.Start + correction.Length;
		}
		return accepted;
	}

	public static string Normalize(string value)
	{
		string result = value ?? string.Empty;
		IReadOnlyList<PohuanCorrection> corrections = FindCorrections(result);
		for (int i = corrections.Count - 1; i >= 0; i--)
		{
			PohuanCorrection correction = corrections[i];
			result = result.Substring(0, correction.Start) + correction.After +
				result.Substring(correction.Start + correction.Length);
		}
		return result;
	}
}
