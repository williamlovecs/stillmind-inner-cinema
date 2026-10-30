from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable


SCHEMA_VERSION = "1.0.0"
RECORD_TYPES = ("concept", "practice", "claim")
TYPE_ORDER = {record_type: index for index, record_type in enumerate(RECORD_TYPES)}

CHAPTER_BOUNDARY_CORRECTIONS = {
    "04": {"end_page": 300, "reason": "volume-upper page 300 is the previous chapter's closing page"},
    "05": {"start_page": 301, "reason": "volume-upper page 301 carries the chapter-05 header"},
    "06": {"start_page": 5, "reason": "volume-lower pages 3-4 are table-of-contents pages; page 5 carries the chapter-06 header"},
}

EVIDENCE_LABELS_ZH = {
    "empirical_support": "实证支持",
    "source_framework": "体系内说法",
    "spiritual_source": "灵修来源",
    "insufficient_evidence": "证据不足",
}

TOPICS: dict[str, dict[str, Any]] = {
    "self_observation": {
        "label_zh": "自我观察与觉察",
        "keywords": ("观察", "觉察", "自我评估", "反思", "审视"),
    },
    "automatic_patterns": {
        "label_zh": "自动反应与惯性模式",
        "keywords": ("自动化", "惯性", "模式", "反应", "习惯"),
    },
    "emotion_regulation": {
        "label_zh": "情绪与调节",
        "keywords": ("情绪", "焦虑", "恐惧", "冷静", "愤怒", "悲伤"),
    },
    "attention_perception": {
        "label_zh": "注意、感知与记忆",
        "keywords": ("注意力", "视觉", "听觉", "感知", "记忆", "观察力"),
    },
    "perspective_empathy": {
        "label_zh": "多视角、同理与共情",
        "keywords": ("换位", "同理", "共情", "视角", "角度", "理解他人"),
    },
    "trust_security": {
        "label_zh": "信任与安全感",
        "keywords": ("信任", "安全感", "安全", "接纳", "归属"),
    },
    "learning_adaptation": {
        "label_zh": "学习与适应",
        "keywords": ("学习", "适应", "新技能", "调整", "改变", "灵活"),
    },
    "practice_guidance": {
        "label_zh": "练习与提升方法",
        "keywords": ("实操指南", "练习", "训练", "提升建议", "尝试", "方法"),
    },
    "spiritual_framework": {
        "label_zh": "灵修与来源体系",
        "keywords": ("神性", "灵性", "灵魂", "能量", "粒子", "维度", "前世"),
    },
    "systems_metaphor": {
        "label_zh": "系统与模块隐喻",
        "keywords": ("模块", "交换", "系统", "互动", "连接", "整合"),
    },
}

INPUT_FILES = {
    "concept": "knowledge-base/concepts.jsonl",
    "practice": "knowledge-base/practices.jsonl",
    "claim": "knowledge-base/claims.jsonl",
}

PRIMARY_FIELDS = {
    "concept": "heading",
    "practice": "marker_line",
    "claim": "claim",
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            row = json.loads(line)
            row["_input_line"] = line_number
            rows.append(row)
    return rows


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")
            count += 1
    return count


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_text(value: str) -> str:
    return sha256_bytes(value.encode("utf-8"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_display(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", value)).strip()


def canonical_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return "".join(
        character
        for character in normalized
        if unicodedata.category(character)[0] not in {"P", "S", "Z"}
        and not character.isspace()
    )


def original_excerpt(record_type: str, raw: dict[str, Any]) -> str:
    if record_type == "claim":
        return str(raw.get("claim", ""))
    return str(raw.get("context", ""))


def load_chapters(root: Path) -> dict[str, dict[str, Any]]:
    rows = read_json(root / "knowledge-base/summary.json")["chapters"]
    chapters = {str(item["id"]): dict(item) for item in rows}
    for chapter_id, correction in CHAPTER_BOUNDARY_CORRECTIONS.items():
        for field in ("start_page", "end_page"):
            if field in correction:
                chapters[chapter_id][field] = correction[field]
    return chapters


def chapter_for_page(
    volume: str, page_number: int, chapters: dict[str, dict[str, Any]]
) -> dict[str, Any] | None:
    matches = [
        chapter
        for chapter in chapters.values()
        if chapter["volume"] == volume
        and int(chapter["start_page"]) <= page_number <= int(chapter["end_page"])
    ]
    return matches[0] if len(matches) == 1 else None


def extractive_summary(title: str, excerpt: str, chapter_title: str) -> str:
    title_key = canonical_text(title)
    chapter_key = canonical_text(chapter_title)
    for raw_line in excerpt.splitlines():
        line = normalize_display(raw_line)
        key = canonical_text(line)
        if not key or key == title_key:
            continue
        if key == chapter_key or key.endswith(chapter_key):
            continue
        if re.search(r"\.{5,}", line) or re.search(r"目\s*录", line):
            continue
        if len(key) < 2:
            continue
        return line
    return title


def topics_for(text: str, safety_tags: list[str]) -> list[str]:
    topic_ids = [
        topic_id
        for topic_id, definition in TOPICS.items()
        if any(keyword in text for keyword in definition["keywords"])
    ]
    if "metaphysical_framework" in safety_tags and "spiritual_framework" not in topic_ids:
        topic_ids.append("spiritual_framework")
    return sorted(topic_ids)


def evidence_for(raw_status: str, safety_tags: list[str]) -> dict[str, Any]:
    if "metaphysical_framework" in safety_tags:
        level = "spiritual_source"
        note = "来源含灵修/形而上框架；只能按来源体系描述，不构成实证或科学结论。"
    elif raw_status == "requires_external_validation":
        level = "insufficient_evidence"
        note = "原抽取器已标记需要外部验证；现有研究台账没有该记录的逐条证据映射。"
    else:
        level = "source_framework"
        note = "内容来自《意识强度》体系；现有研究台账没有该记录的逐条实证映射。"
    return {
        "level": level,
        "label_zh": EVIDENCE_LABELS_ZH[level],
        "original_status": raw_status,
        "research_refs": [],
        "mapping_scope": "none",
        "note": note,
    }


def restriction_codes(evidence_level: str, safety_tags: list[str]) -> list[str]:
    restrictions = {"source_attribution_required"}
    if evidence_level != "empirical_support":
        restrictions.update(
            {"not_validated_effectiveness", "not_scientific_fact", "not_medical_claim"}
        )
    if "metaphysical_framework" in safety_tags:
        restrictions.update({"spiritual_framework_only", "not_scientific_measurement"})
    if "neuroscience_or_anatomy_claim" in safety_tags:
        restrictions.update({"not_neuroscience_fact", "not_scientific_measurement"})
    if "medical_action" in safety_tags:
        restrictions.add("not_diagnosis_or_treatment")
    if "mental_health_sensitive" in safety_tags:
        restrictions.update({"not_mental_health_treatment", "high_risk_human_review"})
    if "sexual_or_reproductive" in safety_tags:
        restrictions.add("sensitive_sexual_reproductive_content")
    return sorted(restrictions)


def merge_record_constraints(target: dict[str, Any], incoming: dict[str, Any]) -> None:
    safety_tags = sorted(set(target.get("safety_tags", [])) | set(incoming.get("safety_tags", [])))
    levels = {target["evidence"]["level"], incoming["evidence"]["level"]}
    if "spiritual_source" in levels:
        merged_status = "source_framework_only"
        evidence = evidence_for(merged_status, sorted(set(safety_tags) | {"metaphysical_framework"}))
    elif "insufficient_evidence" in levels:
        evidence = evidence_for("requires_external_validation", safety_tags)
    else:
        evidence = evidence_for("observable_reflection_candidate", safety_tags)
    original_statuses = sorted(
        {
            str(target["evidence"].get("original_status", "")),
            str(incoming["evidence"].get("original_status", "")),
        }
        - {""}
    )
    evidence["original_statuses"] = original_statuses
    target["safety_tags"] = safety_tags
    target["evidence"] = evidence
    target["restriction_codes"] = restriction_codes(evidence["level"], safety_tags)
    target["scientific_or_medical_claim_allowed"] = False


def obvious_noise_reason(primary: str, excerpt: str, page_text: str) -> str | None:
    if len(canonical_text(primary)) < 2:
        return "empty_or_nonsemantic_primary_text"
    toc_entry_count = sum(
        1
        for line in page_text.splitlines()
        if re.search(r"\.{5,}\s*\d+\s*$", line)
        or re.search(r"…{3,}\s*\d+\s*$", line)
    )
    toc_page = bool(re.search(r"目\s*录", page_text)) or toc_entry_count >= 2
    if toc_page:
        return "table_of_contents_navigation"
    return None


def source_object(
    *,
    root: Path,
    raw: dict[str, Any],
    page: dict[str, Any],
    chapter: dict[str, Any],
    corpus_index: dict[str, Any],
) -> dict[str, Any]:
    volume = str(raw["volume"])
    volume_meta = next(item for item in corpus_index["volumes"] if item["slug"] == volume)
    return {
        "volume": volume,
        "pdf_page": int(raw["page"]),
        "page_label": str(page.get("label", raw["page"])),
        "chapter_id": str(chapter["id"]),
        "corpus_file": f"corpus/{volume}/pages.jsonl",
        "source_pdf_sha256": volume_meta["source_sha256"],
    }


def provenance_issues(
    *,
    raw: dict[str, Any],
    primary: str,
    excerpt: str,
    pages: dict[tuple[str, int], dict[str, Any]],
    chapters: dict[str, dict[str, Any]],
) -> tuple[list[str], dict[str, bool]]:
    issues: list[str] = []
    volume = str(raw.get("volume", ""))
    try:
        page_number = int(raw.get("page"))
    except (TypeError, ValueError):
        page_number = -1
    chapter_id = str(raw.get("chapter_id", ""))
    page = pages.get((volume, page_number))
    chapter = chapters.get(chapter_id)
    if page is None:
        issues.append("source_page_not_found")
    if chapter is None:
        issues.append("chapter_not_found")
    elif (
        chapter["volume"] != volume
        or not int(chapter["start_page"]) <= page_number <= int(chapter["end_page"])
    ):
        issues.append("chapter_page_mismatch")
    match = {"primary_text_in_page": False, "excerpt_in_page": False}
    if page is not None:
        page_key = canonical_text(str(page.get("text", "")))
        primary_key = canonical_text(primary)
        excerpt_key = canonical_text(excerpt)
        match["primary_text_in_page"] = bool(primary_key) and primary_key in page_key
        match["excerpt_in_page"] = bool(excerpt_key) and excerpt_key in page_key
        if not match["primary_text_in_page"]:
            issues.append("primary_text_not_in_page")
        if not match["excerpt_in_page"]:
            issues.append("excerpt_not_in_page")
    return sorted(set(issues)), match


def record_sort_key(record: dict[str, Any]) -> tuple[Any, ...]:
    source = record.get("source", {})
    return (
        TYPE_ORDER.get(record.get("type", ""), 99),
        record.get("chapter", {}).get("id", "99"),
        source.get("volume", ""),
        source.get("pdf_page", 0),
        record.get("id", ""),
    )


def load_research_ledger(root: Path) -> list[dict[str, Any]]:
    sources: dict[str, dict[str, Any]] = {}
    for relative in ("research/index.json", "research/supplemental/index.json"):
        index = read_json(root / relative)
        for item in index.get("sources", []):
            if item.get("category") != "evidence":
                continue
            sources[item["id"]] = {
                key: item.get(key)
                for key in (
                    "id",
                    "name",
                    "url",
                    "authority",
                    "status_code",
                    "ok",
                    "final_url",
                    "content_sha256",
                    "extracted_text_length",
                )
            }
            sources[item["id"]]["record_level_mapping_count"] = 0
    return [sources[key] for key in sorted(sources)]


def record_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://local.invalid/consciousness-intensity/record.schema.json",
        "title": "Consciousness Intensity Knowledge Record",
        "type": "object",
        "required": [
            "schema_version",
            "id",
            "type",
            "title",
            "summary",
            "summary_method",
            "original_excerpt",
            "chapter",
            "source",
            "sources",
            "source_verified",
            "evidence",
            "safety_tags",
            "restriction_codes",
            "topic_ids",
            "query_text",
            "dedup_key",
            "input_trace",
        ],
        "properties": {
            "schema_version": {"const": SCHEMA_VERSION},
            "id": {"type": "string", "pattern": "^ci-(concept|practice|claim)-[0-9a-f]{16}$"},
            "type": {"enum": list(RECORD_TYPES)},
            "title": {"type": "string", "minLength": 1},
            "summary": {"type": "string", "minLength": 1},
            "summary_method": {"const": "extractive"},
            "original_excerpt": {"type": "string", "minLength": 1},
            "chapter": {
                "type": "object",
                "required": ["id", "title"],
                "properties": {"id": {"type": "string"}, "title": {"type": "string"}},
            },
            "source": {
                "type": "object",
                "required": [
                    "volume",
                    "pdf_page",
                    "page_label",
                    "chapter_id",
                    "corpus_file",
                    "source_pdf_sha256",
                ],
            },
            "sources": {"type": "array", "minItems": 1},
            "source_verified": {"const": True},
            "evidence": {
                "type": "object",
                "required": ["level", "label_zh", "research_refs", "mapping_scope", "note"],
                "properties": {
                    "level": {"enum": list(EVIDENCE_LABELS_ZH)},
                    "research_refs": {"type": "array"},
                    "mapping_scope": {"type": "string"},
                },
            },
            "safety_tags": {"type": "array"},
            "restriction_codes": {"type": "array", "minItems": 1},
            "topic_ids": {"type": "array"},
            "query_text": {"type": "string"},
            "dedup_key": {"type": "string", "pattern": "^[0-9a-f]{64}$"},
            "input_trace": {"type": "array", "minItems": 1},
        },
        "additionalProperties": True,
    }


def build_pack(root: Path, output: Path) -> dict[str, Any]:
    corpus_index = read_json(root / "corpus/index.json")
    volume_hashes = {
        str(item["slug"]): str(item["source_sha256"])
        for item in corpus_index["volumes"]
    }
    chapters = load_chapters(root)
    pages: dict[tuple[str, int], dict[str, Any]] = {}
    for volume in ("volume-upper", "volume-lower"):
        for page in read_jsonl(root / f"corpus/{volume}/pages.jsonl"):
            page.pop("_input_line", None)
            pages[(volume, int(page["page"]))] = page

    for generated_dir in ("records", "indexes", "evidence", "schema", "validation"):
        target = output / generated_dir
        if target.exists():
            for path in sorted(target.rglob("*"), reverse=True):
                if path.is_file():
                    path.unlink()
                elif path.is_dir():
                    path.rmdir()
        target.mkdir(parents=True, exist_ok=True)

    verified_candidates: list[dict[str, Any]] = []
    unresolved: list[dict[str, Any]] = []
    excluded_noise: list[dict[str, Any]] = []
    input_counts: Counter[str] = Counter()

    for record_type in RECORD_TYPES:
        relative = INPUT_FILES[record_type]
        raw_rows = read_jsonl(root / relative)
        input_counts[record_type] = len(raw_rows)
        for raw in raw_rows:
            input_line = int(raw.pop("_input_line"))
            primary = str(raw.get(PRIMARY_FIELDS[record_type], ""))
            excerpt = original_excerpt(record_type, raw)
            input_chapter_id = str(raw.get("chapter_id", ""))
            volume = str(raw.get("volume", ""))
            try:
                page_number = int(raw.get("page"))
            except (TypeError, ValueError):
                page_number = -1
            assigned_chapter = chapter_for_page(volume, page_number, chapters)
            chapter_id = (
                str(assigned_chapter["id"]) if assigned_chapter is not None else input_chapter_id
            )
            chapter = chapters.get(chapter_id, {"id": chapter_id, "title": ""})
            provenance_raw = dict(raw)
            provenance_raw["chapter_id"] = chapter_id
            issues, match = provenance_issues(
                raw=provenance_raw,
                primary=primary,
                excerpt=excerpt,
                pages=pages,
                chapters=chapters,
            )
            page = pages.get((volume, page_number), {})
            noise_reason = obvious_noise_reason(primary, excerpt, str(page.get("text", "")))
            raw_hash = sha256_text(json.dumps(raw, ensure_ascii=False, sort_keys=True))
            trace = {
                "input_file": relative,
                "input_line": input_line,
                "input_record_sha256": raw_hash,
                "input_chapter_id": input_chapter_id,
                "assigned_chapter_id": chapter_id,
                "chapter_assignment": (
                    "corrected_from_verified_page_boundary"
                    if chapter_id != input_chapter_id
                    else "preserved"
                ),
            }
            title = normalize_display(primary)
            summary = extractive_summary(title, excerpt, str(chapter["title"]))
            safety_tags = sorted(set(str(tag) for tag in raw.get("safety_tags", [])))
            evidence = evidence_for(str(raw.get("evidence_status", "")), safety_tags)
            restrictions = restriction_codes(str(evidence["level"]), safety_tags)
            topic_ids = topics_for(f"{title}\n{excerpt}", safety_tags)
            dedup_basis = "\u241f".join(
                (record_type, canonical_text(title), canonical_text(excerpt))
            )
            dedup_key = sha256_text(dedup_basis)
            if noise_reason:
                excluded_noise.append(
                    {
                        "record_type": record_type,
                        "reason": noise_reason,
                        "primary_text": primary,
                        "original_excerpt": excerpt,
                        "source_candidate": {
                            "volume": volume,
                            "pdf_page": page_number,
                            "chapter_id": chapter_id,
                            "input_chapter_id": input_chapter_id,
                        },
                        "input_trace": trace,
                    }
                )
                continue
            if issues:
                source_candidate = {
                    "volume": volume,
                    "pdf_page": page_number,
                    "page_label": str(page.get("label", page_number)),
                    "chapter_id": chapter_id,
                    "corpus_file": f"corpus/{volume}/pages.jsonl" if volume else "",
                    "source_pdf_sha256": volume_hashes.get(volume, ""),
                }
                unresolved.append(
                    {
                        "schema_version": SCHEMA_VERSION,
                        "id": f"ci-unresolved-{record_type}-{dedup_key[:16]}",
                        "type": record_type,
                        "title": title,
                        "summary": summary,
                        "summary_method": "extractive",
                        "original_excerpt": excerpt,
                        "chapter": {"id": chapter_id, "title": str(chapter["title"])},
                        "chapters": [{"id": chapter_id, "title": str(chapter["title"])}],
                        "source": source_candidate,
                        "sources": [source_candidate],
                        "source_verified": False,
                        "provenance_issues": issues,
                        "source_match": match,
                        "evidence": evidence,
                        "safety_tags": safety_tags,
                        "restriction_codes": restrictions,
                        "scientific_or_medical_claim_allowed": False,
                        "topic_ids": topic_ids,
                        "query_text": "\n".join(
                            (title, summary, str(chapter["title"]), excerpt)
                        ),
                        "dedup_key": dedup_key,
                        "input_trace": [trace],
                    }
                )
                continue

            source = source_object(
                root=root,
                raw=raw,
                page=page,
                chapter=chapter,
                corpus_index=corpus_index,
            )
            verified_candidates.append(
                {
                    "schema_version": SCHEMA_VERSION,
                    "id": f"ci-{record_type}-{dedup_key[:16]}",
                    "type": record_type,
                    "title": title,
                    "summary": summary,
                    "summary_method": "extractive",
                    "original_excerpt": excerpt,
                    "chapter": {"id": chapter_id, "title": str(chapter["title"])},
                    "chapters": [{"id": chapter_id, "title": str(chapter["title"])}],
                    "source": source,
                    "sources": [source],
                    "source_verified": True,
                    "source_match": match,
                    "evidence": evidence,
                    "safety_tags": safety_tags,
                    "restriction_codes": restrictions,
                    "scientific_or_medical_claim_allowed": evidence["level"] == "empirical_support"
                    and not {
                        "metaphysical_framework",
                        "medical_action",
                        "mental_health_sensitive",
                    }.intersection(safety_tags),
                    "topic_ids": topic_ids,
                    "query_text": "\n".join(
                        (title, summary, str(chapter["title"]), excerpt)
                    ),
                    "dedup_key": dedup_key,
                    "input_trace": [trace],
                }
            )

    deduped: dict[str, dict[str, Any]] = {}
    duplicate_extras = 0
    for candidate in verified_candidates:
        key = candidate["dedup_key"]
        existing = deduped.get(key)
        if existing is None:
            deduped[key] = candidate
            continue
        duplicate_extras += 1
        if candidate["source"] not in existing["sources"]:
            existing["sources"].append(candidate["source"])
        if candidate["chapter"] not in existing["chapters"]:
            existing["chapters"].append(candidate["chapter"])
        existing["input_trace"].extend(candidate["input_trace"])
        merge_record_constraints(existing, candidate)

    unresolved_raw_count = len(unresolved)
    unresolved_deduped: dict[str, dict[str, Any]] = {}
    for candidate in unresolved:
        existing = unresolved_deduped.get(candidate["dedup_key"])
        if existing is None:
            unresolved_deduped[candidate["dedup_key"]] = candidate
            continue
        if candidate["source"] not in existing["sources"]:
            existing["sources"].append(candidate["source"])
        if candidate["chapter"] not in existing["chapters"]:
            existing["chapters"].append(candidate["chapter"])
        existing["input_trace"].extend(candidate["input_trace"])
        existing["provenance_issues"] = sorted(
            set(existing["provenance_issues"]) | set(candidate["provenance_issues"])
        )
        merge_record_constraints(existing, candidate)
    unresolved = sorted(unresolved_deduped.values(), key=record_sort_key)
    for record in unresolved:
        record["sources"] = sorted(
            record["sources"], key=lambda item: (item["volume"], item["pdf_page"])
        )
        record["chapters"] = sorted(record["chapters"], key=lambda item: item["id"])
        record["input_trace"] = sorted(
            record["input_trace"], key=lambda item: (item["input_file"], item["input_line"])
        )

    records = sorted(deduped.values(), key=record_sort_key)
    for record in records:
        record["sources"] = sorted(
            record["sources"], key=lambda item: (item["volume"], item["pdf_page"])
        )
        record["chapters"] = sorted(record["chapters"], key=lambda item: item["id"])
        record["input_trace"] = sorted(
            record["input_trace"], key=lambda item: (item["input_file"], item["input_line"])
        )

    split_records = {
        record_type: [record for record in records if record["type"] == record_type]
        for record_type in RECORD_TYPES
    }
    write_jsonl(output / "records/all.jsonl", records)
    for record_type in RECORD_TYPES:
        write_jsonl(output / f"records/{record_type}s.jsonl", split_records[record_type])
    write_jsonl(
        output / "records/unresolved.jsonl",
        unresolved,
    )
    write_jsonl(
        output / "records/excluded-noise.jsonl",
        sorted(excluded_noise, key=lambda row: (row["record_type"], row["input_trace"]["input_file"], row["input_trace"]["input_line"])),
    )

    chapter_index: dict[str, Any] = {}
    for chapter_id, chapter in sorted(chapters.items()):
        chapter_records = [record for record in records if chapter_id in {item["id"] for item in record["chapters"]}]
        chapter_index[chapter_id] = {
            "id": chapter_id,
            "title": chapter["title"],
            "volume": chapter["volume"],
            "start_page": chapter["start_page"],
            "end_page": chapter["end_page"],
            "counts": dict(Counter(record["type"] for record in chapter_records)),
            "record_ids": {
                record_type: [record["id"] for record in chapter_records if record["type"] == record_type]
                for record_type in RECORD_TYPES
            },
        }
    write_json(output / "indexes/by-chapter.json", chapter_index)

    topic_index: dict[str, Any] = {}
    for topic_id, definition in TOPICS.items():
        topic_records = [record["id"] for record in records if topic_id in record["topic_ids"]]
        topic_index[topic_id] = {
            "label_zh": definition["label_zh"],
            "matching_keywords": list(definition["keywords"]),
            "count": len(topic_records),
            "record_ids": topic_records,
            "indexing_note": "关键词导航索引，不代表科学分类或语义推断。",
        }
    write_json(output / "indexes/by-topic.json", topic_index)

    evidence_index: dict[str, Any] = {}
    for level, label in EVIDENCE_LABELS_ZH.items():
        ids = [record["id"] for record in records if record["evidence"]["level"] == level]
        evidence_index[level] = {"label_zh": label, "count": len(ids), "record_ids": ids}
    write_json(output / "indexes/by-evidence-level.json", evidence_index)

    restriction_index: dict[str, list[str]] = defaultdict(list)
    for record in records:
        for code in record["restriction_codes"]:
            restriction_index[code].append(record["id"])
    write_json(
        output / "indexes/by-restriction.json",
        {code: {"count": len(ids), "record_ids": ids} for code, ids in sorted(restriction_index.items())},
    )

    lookup: dict[str, Any] = {}
    line_numbers = {record_type: 0 for record_type in RECORD_TYPES}
    all_line = 0
    for record in records:
        all_line += 1
        line_numbers[record["type"]] += 1
        lookup[record["id"]] = {
            "all_file": "records/all.jsonl",
            "all_line": all_line,
            "type_file": f"records/{record['type']}s.jsonl",
            "type_line": line_numbers[record["type"]],
        }
    write_json(output / "indexes/record-lookup.json", lookup)
    (output / "indexes/README.md").write_text(
        "# 导航索引\n\n"
        "- `by-chapter.json`：九章元数据、各类型数量和记录 ID。\n"
        "- `by-topic.json`：核心概念/方法的关键词导航；文件内公开匹配关键词。\n"
        "- `by-evidence-level.json`：按证据等级列出记录 ID。\n"
        "- `by-restriction.json`：按禁区代码列出记录 ID，适合安全审核。\n"
        "- `record-lookup.json`：记录 ID 到 `all.jsonl` 和类型文件行号的映射。\n\n"
        "索引只引用主库记录。`unresolved.jsonl` 与 `excluded-noise.jsonl` 不进入任何主索引。"
        "主题索引是可审计的关键词导航，不是嵌入检索、语义模型或科学分类。\n",
        encoding="utf-8",
        newline="\n",
    )

    research_ledger = load_research_ledger(root)
    write_json(
        output / "evidence/research-ledger.json",
        {
            "record_level_mapping_count": 0,
            "note": "现有研究台账没有候选记录级 crosswalk；不得据主题相似性授予实证支持。",
            "sources": research_ledger,
        },
    )
    write_json(output / "schema/record.schema.json", record_schema())

    evidence_counts = Counter(record["evidence"]["level"] for record in records)
    restriction_counts = Counter(code for record in records for code in record["restriction_codes"])
    safety_counts = Counter(tag for record in records for tag in record["safety_tags"])
    chapter_counts: dict[str, Counter[str]] = defaultdict(Counter)
    for record in records:
        chapter_counts[record["chapter"]["id"]][record["type"]] += 1

    counts = {
        "input": dict(input_counts),
        "input_total": sum(input_counts.values()),
        "verified_before_dedup": len(verified_candidates),
        "duplicate_extras_removed": duplicate_extras,
        "main_library": {record_type: len(split_records[record_type]) for record_type in RECORD_TYPES},
        "main_library_total": len(records),
        "unresolved_raw_candidates": unresolved_raw_count,
        "unresolved_provenance": len(unresolved),
        "excluded_noise": len(excluded_noise),
        "evidence_levels": {level: evidence_counts.get(level, 0) for level in EVIDENCE_LABELS_ZH},
        "restrictions": dict(sorted(restriction_counts.items())),
        "safety_tags": dict(sorted(safety_counts.items())),
        "chapter_type_counts": {chapter: dict(counts) for chapter, counts in sorted(chapter_counts.items())},
    }

    overview_lines = [
        "# 《意识强度》知识包概览",
        "",
        "> 这是对既有抽取候选的结构化、去重、溯源和风险标注，不是对原书观点的验证、改写或背书。",
        "",
        "## 总量",
        "",
        f"- 输入候选：{counts['input_total']:,}",
        f"- 主库记录：{counts['main_library_total']:,}",
        f"- 规范化重复移除：{counts['duplicate_extras_removed']:,}",
        f"- 无法溯源：{counts['unresolved_provenance']:,}",
        f"- 明确目录/导航噪声：{counts['excluded_noise']:,}",
        "",
        "## 九章导航",
        "",
        "| 章 | 标题 | 概念 | 练习 | 主张 |",
        "|---|---|---:|---:|---:|",
    ]
    for chapter_id, chapter in sorted(chapters.items()):
        dist = chapter_counts.get(chapter_id, Counter())
        overview_lines.append(
            f"| {chapter_id} | {chapter['title']} | {dist.get('concept', 0):,} | {dist.get('practice', 0):,} | {dist.get('claim', 0):,} |"
        )
    overview_lines.extend(["", "## 证据等级", "", "| 等级 | 数量 |", "|---|---:|"])
    for level, label in EVIDENCE_LABELS_ZH.items():
        overview_lines.append(f"| {label} (`{level}`) | {evidence_counts.get(level, 0):,} |")
    overview_lines.extend(
        [
            "",
            "`实证支持` 为 0 时表示没有逐条研究映射，不表示未执行分级。",
            "",
            "## 导航主题",
            "",
            "主题由公开的关键词规则建立，只用于导航，不代表科学分类。",
            "",
        ]
    )
    for topic_id, item in topic_index.items():
        overview_lines.append(f"- **{item['label_zh']}** (`{topic_id}`)：{item['count']:,} 条")
    (output / "OVERVIEW.md").write_text("\n".join(overview_lines) + "\n", encoding="utf-8", newline="\n")

    quality_lines = [
        "# 知识包质量报告",
        "",
        "## 结论",
        "",
        f"主库共 {len(records):,} 条，全部通过卷、PDF 页码、章节范围、主文本页内包含和原文片段页内包含检查。",
        f"另有 {len(unresolved):,} 条无法满足严格溯源要求，已隔离；{len(excluded_noise):,} 条明确目录/导航噪声，已隔离。",
        "",
        "## 去重",
        "",
        f"- 输入候选：{counts['input_total']:,}",
        f"- 严格溯源后候选：{len(verified_candidates):,}",
        f"- 规范化精确重复移除：{duplicate_extras:,}",
        "- 去重键：类型 + NFKC/大小写/空白/标点/符号规范化后的标题 + 原文片段。",
        "- 未做模糊语义合并，避免误并不同含义。",
        "",
        "## 溯源",
        "",
        f"- 已溯源主库：{len(records):,}",
        f"- 无法溯源隔离：{len(unresolved):,}",
        f"- 无法溯源原始候选：{unresolved_raw_count:,}",
        f"- 噪声隔离：{len(excluded_noise):,}",
        "- 每条主记录包含卷、PDF 页码、页标签、章节、语料文件和原 PDF SHA-256。",
        "",
        "## 证据等级分布",
        "",
        "| 等级 | 数量 | 解释 |",
        "|---|---:|---|",
    ]
    evidence_explanations = {
        "empirical_support": "存在逐条、同构念研究映射。",
        "source_framework": "来自原书体系，未逐条外部验证。",
        "spiritual_source": "含灵修/形而上来源语言，只能按来源体系描述。",
        "insufficient_evidence": "含量化、因果、脑科学或其他需要外部验证的说法。",
    }
    for level, label in EVIDENCE_LABELS_ZH.items():
        quality_lines.append(
            f"| {label} (`{level}`) | {evidence_counts.get(level, 0):,} | {evidence_explanations[level]} |"
        )
    quality_lines.extend(
        [
            "",
            "现有研究台账没有候选记录级 crosswalk，因此本版不授予任何 `empirical_support`；这是保守分级，不是证据遗漏。",
            "",
            "## 禁区分布",
            "",
            "| 限制代码 | 数量 |",
            "|---|---:|",
        ]
    )
    for code, count in sorted(restriction_counts.items()):
        quality_lines.append(f"| `{code}` | {count:,} |")
    quality_lines.extend(
        [
            "",
            "## 已知限制",
            "",
            "- 类型沿用原抽取器的候选类型；尚未经过逐条人工编辑复核。",
            "- `summary` 是抽取式原文行，不是生成式概括。",
            "- 主题索引是关键词导航，不是语义模型或科学分类。",
            "- 章节边界按直接页眉核对修正：上卷第 300 页归第四章、第五章从第 301 页开始；下卷第 3-4 页为目录、第六章从第 5 页开始。原输入章节号保留在 `input_trace`。",
            "- 本包不授予原书内容的再发布权；公开使用需遵守 README 中的知识产权边界。",
        ]
    )
    (output / "QUALITY_REPORT.md").write_text("\n".join(quality_lines) + "\n", encoding="utf-8", newline="\n")

    validation = validate_pack(root, output, expected_counts=counts)
    write_json(output / "validation/validation.json", validation)
    if not validation["valid"]:
        raise RuntimeError(f"Knowledge pack validation failed: {validation['errors']}")

    input_manifest = []
    for relative in (
        "corpus/index.json",
        "corpus/volume-upper/pages.jsonl",
        "corpus/volume-lower/pages.jsonl",
        "knowledge-base/summary.json",
        *INPUT_FILES.values(),
        "research/index.json",
        "research/supplemental/index.json",
    ):
        path = root / relative
        input_manifest.append({"path": relative, "sha256": sha256_file(path), "bytes": path.stat().st_size})

    output_files = []
    for path in sorted(output.rglob("*")):
        if not path.is_file() or path.name == "manifest.json":
            continue
        output_files.append(
            {
                "path": path.relative_to(output).as_posix(),
                "sha256": sha256_file(path),
                "bytes": path.stat().st_size,
            }
        )
    manifest = {
        "pack": "consciousness-intensity-knowledge-pack",
        "schema_version": SCHEMA_VERSION,
        "builder": {
            "path": "scripts/build_consciousness_knowledge_pack.py",
            "sha256": sha256_file(Path(__file__)),
        },
        "chapter_boundary_corrections": CHAPTER_BOUNDARY_CORRECTIONS,
        "source_snapshot_generated_utc": corpus_index["generated_utc"],
        "deterministic_build": True,
        "counts": counts,
        "inputs": input_manifest,
        "outputs": output_files,
    }
    write_json(output / "manifest.json", manifest)
    return manifest


def validate_pack(root: Path, output: Path, expected_counts: dict[str, Any] | None = None) -> dict[str, Any]:
    errors: list[str] = []
    corpus_index = read_json(root / "corpus/index.json")
    volume_hashes = {
        str(item["slug"]): str(item["source_sha256"])
        for item in corpus_index["volumes"]
    }
    chapters = load_chapters(root)
    pages: dict[tuple[str, int], dict[str, Any]] = {}
    for volume in volume_hashes:
        for page in read_jsonl(root / f"corpus/{volume}/pages.jsonl"):
            page.pop("_input_line", None)
            pages[(volume, int(page["page"]))] = page
    records = read_jsonl(output / "records/all.jsonl")
    for record in records:
        record.pop("_input_line", None)
    ids = [record.get("id") for record in records]
    dedup_keys = [record.get("dedup_key") for record in records]
    if len(ids) != len(set(ids)):
        errors.append("duplicate_record_ids")
    if len(dedup_keys) != len(set(dedup_keys)):
        errors.append("duplicate_dedup_keys")

    required = set(record_schema()["required"])
    for index, record in enumerate(records, start=1):
        missing = sorted(required - set(record))
        if missing:
            errors.append(f"record_{index}_missing:{','.join(missing)}")
        if record.get("source_verified") is not True:
            errors.append(f"record_{index}_not_verified")
        if record.get("evidence", {}).get("level") not in EVIDENCE_LABELS_ZH:
            errors.append(f"record_{index}_invalid_evidence")
        if not record.get("restriction_codes"):
            errors.append(f"record_{index}_missing_restrictions")
        evidence = record.get("evidence", {})
        if evidence.get("level") != "empirical_support":
            required_boundaries = {"not_scientific_fact", "not_medical_claim"}
            if not required_boundaries.issubset(set(record.get("restriction_codes", []))):
                errors.append(f"record_{index}_missing_nonempirical_boundaries")
            if record.get("scientific_or_medical_claim_allowed") is not False:
                errors.append(f"record_{index}_nonempirical_claim_allowed")
        excerpt = str(record.get("original_excerpt", ""))
        summary = str(record.get("summary", ""))
        if summary != record.get("title") and canonical_text(summary) not in canonical_text(excerpt):
            errors.append(f"record_{index}_summary_not_extractive")
        source = record.get("source", {})
        volume = str(source.get("volume", ""))
        try:
            page_number = int(source.get("pdf_page"))
        except (TypeError, ValueError):
            page_number = -1
        page = pages.get((volume, page_number))
        chapter_id = str(record.get("chapter", {}).get("id", ""))
        chapter = chapters.get(chapter_id)
        if page is None:
            errors.append(f"record_{index}_source_page_missing")
        else:
            page_key = canonical_text(str(page.get("text", "")))
            if canonical_text(str(record.get("title", ""))) not in page_key:
                errors.append(f"record_{index}_title_not_in_source")
            if canonical_text(excerpt) not in page_key:
                errors.append(f"record_{index}_excerpt_not_in_source")
        if chapter is None or chapter.get("volume") != volume or not (
            int(chapter.get("start_page", -1)) <= page_number <= int(chapter.get("end_page", -1))
        ):
            errors.append(f"record_{index}_chapter_source_mismatch")
        if source.get("source_pdf_sha256") != volume_hashes.get(volume):
            errors.append(f"record_{index}_source_hash_mismatch")

    split_total = 0
    for record_type in RECORD_TYPES:
        rows = read_jsonl(output / f"records/{record_type}s.jsonl")
        split_total += len(rows)
        if any(row.get("type") != record_type for row in rows):
            errors.append(f"wrong_type_in_{record_type}s")
    if split_total != len(records):
        errors.append("split_count_mismatch")

    lookup = read_json(output / "indexes/record-lookup.json")
    if set(lookup) != set(ids):
        errors.append("lookup_id_mismatch")
    if expected_counts is not None and expected_counts["main_library_total"] != len(records):
        errors.append("expected_main_count_mismatch")

    empirical = [record for record in records if record["evidence"]["level"] == "empirical_support"]
    if any(not record["evidence"]["research_refs"] for record in empirical):
        errors.append("empirical_record_without_research_refs")

    unresolved = read_jsonl(output / "records/unresolved.jsonl")
    unresolved_required = required | {"provenance_issues"}
    for index, record in enumerate(unresolved, start=1):
        record.pop("_input_line", None)
        missing = sorted(unresolved_required - set(record))
        if missing:
            errors.append(f"unresolved_{index}_missing:{','.join(missing)}")
        if record.get("source_verified") is not False:
            errors.append(f"unresolved_{index}_incorrectly_verified")
        if not record.get("provenance_issues"):
            errors.append(f"unresolved_{index}_missing_issues")
    unresolved_ids = {record.get("id") for record in unresolved}
    if set(ids) & unresolved_ids:
        errors.append("main_unresolved_id_overlap")
    if set(lookup) & unresolved_ids:
        errors.append("unresolved_present_in_lookup")

    return {
        "valid": not errors,
        "errors": errors,
        "checks": {
            "jsonl_records_parse": len(records),
            "unique_ids": len(set(ids)),
            "unique_dedup_keys": len(set(dedup_keys)),
            "split_records": split_total,
            "lookup_records": len(lookup),
            "empirical_records": len(empirical),
            "unresolved_records": len(unresolved),
        },
    }


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Build a clean, traceable, portable knowledge pack.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path("artifacts/consciousness-intensity"),
        help="Read-only source artifact root.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/consciousness-intensity/knowledge-pack"),
    )
    parser.add_argument("--check", action="store_true", help="Validate an existing pack without rebuilding.")
    args = parser.parse_args()
    if args.check:
        result = validate_pack(args.root, args.output)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        raise SystemExit(0 if result["valid"] else 1)
    manifest = build_pack(args.root, args.output)
    print(json.dumps(manifest["counts"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
