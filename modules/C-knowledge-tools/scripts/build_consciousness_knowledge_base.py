from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


@dataclass(frozen=True)
class Chapter:
    id: str
    volume: str
    start_page: int
    end_page: int
    title: str
    product_reading: str


CHAPTERS = (
    Chapter("01", "volume-upper", 9, 63, "中央区域：心智控制区", "self-regulation and executive capabilities"),
    Chapter("02", "volume-upper", 64, 129, "上方区域：自主意识区", "security, trust, expression, and life orientation"),
    Chapter("03", "volume-upper", 130, 225, "下方区域：神性连接区", "meaning, connection, perception, and source-framework spirituality"),
    Chapter("04", "volume-upper", 226, 299, "右方区域：思维扩展区", "learning, adaptation, social cognition, and perspective taking"),
    Chapter("05", "volume-upper", 300, 501, "左方区域：旧有惯性区", "cognitive, behavioral, and emotional patterns"),
    Chapter("06", "volume-lower", 3, 120, "左上区域：神经联络区", "attention, perception, memory, and autonomic metaphors"),
    Chapter("07", "volume-lower", 121, 218, "左下区域：神性交换区", "embodied/energy framework and intention regulation"),
    Chapter("08", "volume-lower", 219, 253, "右上区域：灵性结构区", "source-framework structural spirituality"),
    Chapter("09", "volume-lower", 254, 403, "右下区域：模块交换区", "systems interaction metaphors and integration"),
)

SAFETY_TERMS = {
    "metaphysical_framework": (
        "神性",
        "灵性",
        "灵魂",
        "粒子",
        "能量",
        "催眠波",
        "植入物",
        "脉轮",
        "维度",
        "前世",
    ),
    "neuroscience_or_anatomy_claim": (
        "左脑",
        "右脑",
        "双脑",
        "神经系统",
        "神经联络",
        "大脑开发",
        "穴位",
        "百会",
        "会阴",
    ),
    "mental_health_sensitive": (
        "焦虑",
        "抑郁",
        "绝望",
        "自杀",
        "创伤",
        "恐惧",
        "强迫",
        "沉迷",
        "精神疾病",
    ),
    "sexual_or_reproductive": ("性行为", "性别", "生育", "耻骨", "会阴"),
    "medical_action": ("诊断", "治疗", "医生", "疾病", "药物", "康复"),
}

PRACTICE_MARKERS = ("提升", "实操指南", "练习", "训练", "尝试", "建议", "方法")
CLAIM_MARKERS = ("量化数据", "人类平均", "%", "说明", "表明", "意味着", "影响")
SCHEMA_MARKERS = ("特点", "影响", "例子", "提升", "区别", "联系", "总结", "实操指南")
STOPWORDS = {
    "一个",
    "个体",
    "可以",
    "通过",
    "这种",
    "这个",
    "能够",
    "程度",
    "影响",
    "部分",
    "方面",
    "不同",
    "进行",
    "之间",
    "自己",
    "自身",
    "有助于",
}


def load_pages(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def clean_lines(text: str) -> list[str]:
    lines = []
    for raw in text.splitlines():
        line = re.sub(r"\s+", " ", raw).strip(" \t\r\n•")
        if not line or re.fullmatch(r"[-—– ]*\d+[-—– ]*", line):
            continue
        lines.append(line)
    return lines


def tags_for(text: str) -> list[str]:
    return [tag for tag, terms in SAFETY_TERMS.items() if any(term in text for term in terms)]


def evidence_status(tags: list[str], text: str) -> str:
    if "metaphysical_framework" in tags:
        return "source_framework_only"
    if "neuroscience_or_anatomy_claim" in tags or any(marker in text for marker in CLAIM_MARKERS):
        return "requires_external_validation"
    return "observable_reflection_candidate"


def context_window(lines: list[str], index: int, radius: int = 2) -> str:
    return "\n".join(lines[max(0, index - radius) : min(len(lines), index + radius + 1)])


def candidate_heading(line: str) -> bool:
    patterns = (
        r"^第[一二三四五六七八九十]+章",
        r"^[一二三四五六七八九十]+[、.．]\s*\S+",
        r"^\d{1,2}[-、.．]\s*\S+",
        r"^第[一二三四五六七八九十]+[层部区]",
    )
    return len(line) <= 80 and any(re.search(pattern, line) for pattern in patterns)


def top_terms(texts: Iterable[str], limit: int = 80) -> list[dict[str, Any]]:
    counts: Counter[str] = Counter()
    for text in texts:
        tokens = re.findall(r"[\u4e00-\u9fff]{2,8}|[A-Za-z]{3,}", text)
        counts.update(token for token in tokens if token not in STOPWORDS)
    return [{"term": term, "count": count} for term, count in counts.most_common(limit)]


def build(corpus_root: Path, output_root: Path) -> dict[str, Any]:
    output_root.mkdir(parents=True, exist_ok=True)
    chapters_dir = output_root / "chapters"
    chapters_dir.mkdir(exist_ok=True)

    pages_by_volume = {
        volume: load_pages(corpus_root / volume / "pages.jsonl")
        for volume in ("volume-upper", "volume-lower")
    }

    all_page_keys = {
        (volume, page["page"])
        for volume, pages in pages_by_volume.items()
        for page in pages
    }
    assigned_page_keys: set[tuple[str, int]] = set()
    concepts: list[dict[str, Any]] = []
    practices: list[dict[str, Any]] = []
    claims: list[dict[str, Any]] = []
    chapter_summaries: list[dict[str, Any]] = []

    for chapter in CHAPTERS:
        pages = [
            page
            for page in pages_by_volume[chapter.volume]
            if chapter.start_page <= page["page"] <= chapter.end_page
        ]
        assigned_page_keys.update((chapter.volume, page["page"]) for page in pages)
        chapter_text_parts = []
        schema_counts: Counter[str] = Counter()
        safety_counts: Counter[str] = Counter()
        heading_count = 0

        for page in pages:
            lines = clean_lines(page["text"])
            chapter_text_parts.extend(lines)
            for marker in SCHEMA_MARKERS:
                schema_counts[marker] += page["text"].count(marker)
            for tag in tags_for(page["text"]):
                safety_counts[tag] += 1

            for index, line in enumerate(lines):
                page_tags = tags_for(line)
                if candidate_heading(line):
                    heading_count += 1
                    concepts.append(
                        {
                            "chapter_id": chapter.id,
                            "chapter_title": chapter.title,
                            "volume": chapter.volume,
                            "page": page["page"],
                            "heading": line,
                            "context": context_window(lines, index, radius=1),
                            "safety_tags": page_tags,
                            "evidence_status": evidence_status(page_tags, line),
                        }
                    )
                if any(marker in line for marker in PRACTICE_MARKERS):
                    window = context_window(lines, index)
                    window_tags = tags_for(window)
                    practices.append(
                        {
                            "chapter_id": chapter.id,
                            "volume": chapter.volume,
                            "page": page["page"],
                            "marker_line": line,
                            "context": window,
                            "safety_tags": window_tags,
                            "evidence_status": evidence_status(window_tags, window),
                        }
                    )
                if any(marker in line for marker in CLAIM_MARKERS):
                    line_tags = tags_for(line)
                    claims.append(
                        {
                            "chapter_id": chapter.id,
                            "volume": chapter.volume,
                            "page": page["page"],
                            "claim": line,
                            "safety_tags": line_tags,
                            "evidence_status": evidence_status(line_tags, line),
                        }
                    )

        chapter_text = "\n".join(chapter_text_parts)
        chapter_path = chapters_dir / f"chapter-{chapter.id}.md"
        with chapter_path.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(f"# Chapter {chapter.id}: {chapter.title}\n\n")
            handle.write(f"- Source: {chapter.volume}, PDF pages {chapter.start_page}-{chapter.end_page}\n")
            handle.write(f"- Product reading: {chapter.product_reading}\n\n")
            for page in pages:
                handle.write(f"## PDF page {page['page']}\n\n{page['text']}\n\n")

        chapter_summaries.append(
            {
                "id": chapter.id,
                "title": chapter.title,
                "volume": chapter.volume,
                "start_page": chapter.start_page,
                "end_page": chapter.end_page,
                "page_count": len(pages),
                "character_count": len(chapter_text),
                "product_reading": chapter.product_reading,
                "candidate_heading_count": heading_count,
                "schema_marker_counts": dict(schema_counts),
                "safety_page_counts": dict(safety_counts),
                "top_terms": top_terms(chapter_text_parts, limit=30),
                "source_file": str(chapter_path),
            }
        )

    unassigned = sorted(all_page_keys - assigned_page_keys)
    outputs = {
        "concepts.jsonl": concepts,
        "practices.jsonl": practices,
        "claims.jsonl": claims,
    }
    for filename, rows in outputs.items():
        with (output_root / filename).open("w", encoding="utf-8", newline="\n") as handle:
            for row in rows:
                handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    summary = {
        "chapters": chapter_summaries,
        "counts": {
            "source_pages": len(all_page_keys),
            "assigned_chapter_pages": len(assigned_page_keys),
            "unassigned_pages": len(unassigned),
            "candidate_concepts": len(concepts),
            "practice_windows": len(practices),
            "claim_lines": len(claims),
        },
        "unassigned_page_keys": [
            {"volume": volume, "page": page} for volume, page in unassigned
        ],
        "safety_taxonomy": {tag: list(terms) for tag, terms in SAFETY_TERMS.items()},
        "evidence_statuses": {
            "observable_reflection_candidate": "May inform reflective prompts after product review; not a validated scale.",
            "requires_external_validation": "Scientific-sounding or quantitative claim requires independent evidence before product use.",
            "source_framework_only": "May be described only as the authors' framework, never as established fact or diagnosis.",
        },
    }
    (output_root / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    with (output_root / "chapter-index.md").open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("# Consciousness Intensity Chapter Index\n\n")
        handle.write("The PDF bookmark page targets are inconsistent with rendered chapter headers. "
                     "Ranges below use page-header evidence.\n\n")
        for item in chapter_summaries:
            handle.write(
                f"## {item['id']}. {item['title']}\n\n"
                f"- Source: `{item['volume']}` PDF pages {item['start_page']}-{item['end_page']}\n"
                f"- Product reading: {item['product_reading']}\n"
                f"- Characters: {item['character_count']:,}\n"
                f"- Candidate concepts: {item['candidate_heading_count']}\n"
                f"- Schema markers: {json.dumps(item['schema_marker_counts'], ensure_ascii=False)}\n"
                f"- Safety-tagged pages: {json.dumps(item['safety_page_counts'], ensure_ascii=False)}\n\n"
            )

    return summary


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Build a page-provenanced knowledge base from the extracted corpus.")
    parser.add_argument(
        "--corpus",
        type=Path,
        default=Path("artifacts/consciousness-intensity/corpus"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/consciousness-intensity/knowledge-base"),
    )
    args = parser.parse_args()
    summary = build(args.corpus, args.output)
    print(json.dumps(summary["counts"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
