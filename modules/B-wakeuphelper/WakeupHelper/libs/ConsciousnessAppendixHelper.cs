using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Office.Interop.Word;
using Newtonsoft.Json;
using WakeupHelper.Model.Consciousness;

namespace WakeupHelper.libs;

public class ConsciousnessAppendixHelper
{
	private const int MaxAppendixItems = 8;

	public int AppendReferenceAppendix(Document document)
	{
		if (document == null)
		{
			return 0;
		}

		string documentText = document.Content == null ? string.Empty : document.Content.Text;
		List<ConsciousnessAppendixMatch> matches = Match(documentText);
		if (matches.Count == 0)
		{
			return 0;
		}

		string appendix = BuildAppendix(matches);
		Range endRange = document.Range(Math.Max(0, document.Content.End - 1), Math.Max(0, document.Content.End - 1));
		endRange.InsertAfter(appendix);
		FormatAppendix(document, appendix);
		return matches.Count;
	}

	private List<ConsciousnessAppendixMatch> Match(string documentText)
	{
		string text = documentText ?? string.Empty;
		return LoadRules()
			.Select(rule => new ConsciousnessAppendixMatch
			{
				Rule = rule,
				HitKeywords = (rule.Keywords ?? new List<string>())
					.Where(keyword => !string.IsNullOrWhiteSpace(keyword) && text.IndexOf(keyword, StringComparison.OrdinalIgnoreCase) >= 0)
					.Distinct()
					.ToList()
			})
			.Where(match => match.HitKeywords.Count > 0)
			.OrderByDescending(match => match.HitKeywords.Count)
			.ThenBy(match => match.Rule.Title)
			.Take(MaxAppendixItems)
			.ToList();
	}

	private static List<ConsciousnessReferenceRule> LoadRules()
	{
		string rulePath = Path.Combine(Program.ConfigPath, "consciousness", "references.json");
		if (File.Exists(rulePath))
		{
			string json = File.ReadAllText(rulePath);
			List<ConsciousnessReferenceRule> rules = JsonConvert.DeserializeObject<List<ConsciousnessReferenceRule>>(json);
			if (rules != null && rules.Count > 0)
			{
				return rules;
			}
		}

		// Knowledge content is loaded only from an explicitly supplied local
		// config file. The public core build intentionally carries no embedded
		// book-derived fallback while source authorization is still pending.
		return new List<ConsciousnessReferenceRule>();
	}

	private static string BuildAppendix(List<ConsciousnessAppendixMatch> matches)
	{
		List<string> lines = new List<string>();
		lines.Add("");
		lines.Add("");
		lines.Add("《意识强度》本地参考附录");
		lines.Add("说明：本附录仅根据本机规则把文档中的关键词映射到《意识强度》体系中的参考条目；不接入 API、不上传文档、不构成科学、医疗或心理诊断结论。");
		lines.Add("");
		for (int i = 0; i < matches.Count; i++)
		{
			ConsciousnessAppendixMatch match = matches[i];
			ConsciousnessReferenceRule rule = match.Rule;
			lines.Add((i + 1).ToString() + ". " + rule.Title);
			lines.Add("   命中词：" + string.Join("、", match.HitKeywords));
			lines.Add("   参考：" + rule.Summary);
			lines.Add("   出处：" + rule.Source);
			lines.Add("   证据等级：" + rule.EvidenceLevel);
			lines.Add("   边界：" + rule.Boundary);
			lines.Add("");
		}
		return string.Join("\r", lines);
	}

	private static void FormatAppendix(Document document, string appendix)
	{
		try
		{
			int start = Math.Max(0, document.Content.End - appendix.Length - 1);
			int end = Math.Max(start, document.Content.End - 1);
			Range appendixRange = document.Range(start, end);
			appendixRange.Font.Name = "Microsoft YaHei UI";
			appendixRange.Font.Size = 10;
			appendixRange.ParagraphFormat.SpaceAfter = 6f;
		}
		catch
		{
		}
	}

	private class ConsciousnessAppendixMatch
	{
		public ConsciousnessReferenceRule Rule { get; set; }

		public List<string> HitKeywords { get; set; }
	}
}
