from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("build_consciousness_knowledge_pack.py")
SPEC = importlib.util.spec_from_file_location("knowledge_pack_builder", SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Unable to load knowledge-pack builder")
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class KnowledgePackBuilderTests(unittest.TestCase):
    def test_canonical_text_normalizes_width_whitespace_and_punctuation(self) -> None:
        self.assertEqual(MODULE.canonical_text("Ａ 方案：观察！"), MODULE.canonical_text("a方案观察"))

    def test_summary_is_extractive_and_not_generated(self) -> None:
        excerpt = "第五章 左方区域：旧有惯性区\n提升建议\n记录一次真实反应。"
        summary = MODULE.extractive_summary("提升建议", excerpt, "左方区域：旧有惯性区")
        self.assertEqual(summary, "记录一次真实反应。")
        self.assertIn(summary, excerpt)

    def test_evidence_never_becomes_empirical_without_mapping(self) -> None:
        for status in (
            "observable_reflection_candidate",
            "requires_external_validation",
            "source_framework_only",
        ):
            evidence = MODULE.evidence_for(status, [])
            self.assertNotEqual(evidence["level"], "empirical_support")
            self.assertEqual(evidence["research_refs"], [])

    def test_metaphysical_content_is_spiritual_and_restricted(self) -> None:
        evidence = MODULE.evidence_for("source_framework_only", ["metaphysical_framework"])
        restrictions = MODULE.restriction_codes(evidence["level"], ["metaphysical_framework"])
        self.assertEqual(evidence["level"], "spiritual_source")
        self.assertIn("not_scientific_measurement", restrictions)
        self.assertIn("spiritual_framework_only", restrictions)

    def test_medical_content_cannot_be_diagnosis_or_treatment(self) -> None:
        restrictions = MODULE.restriction_codes("insufficient_evidence", ["medical_action"])
        self.assertIn("not_diagnosis_or_treatment", restrictions)

    def test_only_obvious_toc_navigation_is_excluded(self) -> None:
        self.assertEqual(
            MODULE.obvious_noise_reason("第一章 中央区域", "目 录\n第一章......1", "目 录\n第一章......1"),
            "table_of_contents_navigation",
        )
        self.assertEqual(
            MODULE.obvious_noise_reason(
                "模块建立部分",
                "模块建立部分",
                "模块建立部分........252\n第一种........253\n第二种........271",
            ),
            "table_of_contents_navigation",
        )
        self.assertIsNone(MODULE.obvious_noise_reason("观察反应", "观察反应\n记录事实", "观察反应\n记录事实"))

    def test_duplicate_merge_keeps_more_conservative_constraints(self) -> None:
        target = {
            "evidence": MODULE.evidence_for("observable_reflection_candidate", []),
            "safety_tags": [],
            "restriction_codes": [],
            "scientific_or_medical_claim_allowed": False,
        }
        incoming = {
            "evidence": MODULE.evidence_for(
                "source_framework_only", ["metaphysical_framework"]
            ),
            "safety_tags": ["metaphysical_framework"],
            "restriction_codes": [],
            "scientific_or_medical_claim_allowed": False,
        }
        MODULE.merge_record_constraints(target, incoming)
        self.assertEqual(target["evidence"]["level"], "spiritual_source")
        self.assertIn("spiritual_framework_only", target["restriction_codes"])
        self.assertFalse(target["scientific_or_medical_claim_allowed"])


if __name__ == "__main__":
    unittest.main()
