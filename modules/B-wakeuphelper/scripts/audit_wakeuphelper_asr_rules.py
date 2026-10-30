from __future__ import annotations

import csv
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path


ROOT = Path(r"E:\WakeupHelper-final")
SOURCE = ROOT / "config/incorrect/4c789ac1553c43bf948683435cef662f.Json"
ARTIFACTS = [
    ROOT / "bin/Debug/config/incorrect/4c789ac1553c43bf948683435cef662f.Json",
    ROOT / "bin/Release/config/incorrect/4c789ac1553c43bf948683435cef662f.Json",
    ROOT / "dist/WakeupHelper-v3.3-case-organizer-20260706-1740/config/incorrect/4c789ac1553c43bf948683435cef662f.Json",
]
OUT = Path(r"C:\Users\willi\OneDrive\Documents\New project\outputs\hypnosis_notes_analysis")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest().upper() if path.exists() else ""


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE
    artifacts = ARTIFACTS if source == SOURCE else []
    data = json.loads(source.read_text(encoding="utf-8-sig"))
    dictionary = data.get("ErrorWordDictionary", {})
    mappings: list[tuple[str, str]] = []
    duplicate_within_entry = 0
    self_mappings = 0
    for right, entry in dictionary.items():
        wrongs = [str(x).strip() for x in entry.get("ErrorWordList", []) if str(x).strip()]
        duplicate_within_entry += len(wrongs) - len(set(wrongs))
        for wrong in wrongs:
            mappings.append((wrong, right))
            self_mappings += int(wrong == right)

    rights_by_wrong: dict[str, set[str]] = defaultdict(set)
    for wrong, right in mappings:
        rights_by_wrong[wrong].add(right)
    conflicts = {wrong: sorted(rights) for wrong, rights in rights_by_wrong.items() if len(rights) > 1}

    cascade_rows: list[dict[str, str]] = []
    wrong_terms = sorted(rights_by_wrong, key=len, reverse=True)
    for wrong, right in mappings:
        for downstream in wrong_terms:
            if downstream != wrong and downstream in right:
                cascade_rows.append(
                    {
                        "wrong": wrong,
                        "first_right": right,
                        "downstream_wrong": downstream,
                        "downstream_rights": " | ".join(sorted(rights_by_wrong[downstream])),
                    }
                )

    short_terms = sorted({wrong for wrong, _ in mappings if len(wrong) <= 2})
    artifact_rows = []
    source_sha = sha(source)
    for path in artifacts:
        artifact_rows.append(
            {
                "path": str(path),
                "exists": path.exists(),
                "bytes": path.stat().st_size if path.exists() else 0,
                "sha256": sha(path),
                "matches_source": path.exists() and sha(path) == source_sha,
            }
        )

    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / "post_audit_asr_cascades_20260710.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["wrong", "first_right", "downstream_wrong", "downstream_rights"])
        writer.writeheader()
        writer.writerows(cascade_rows)
    with (OUT / "post_audit_asr_artifacts_20260710.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["path", "exists", "bytes", "sha256", "matches_source"])
        writer.writeheader()
        writer.writerows(artifact_rows)

    summary = {
        "source": str(source),
        "declared_right_word_count": data.get("RightWordCount"),
        "actual_right_word_count": len(dictionary),
        "declared_error_word_count": data.get("ErrorWordCount"),
        "actual_error_word_count": len(mappings),
        "unique_wrong_term_count": len(rights_by_wrong),
        "duplicate_within_entry": duplicate_within_entry,
        "self_mappings": self_mappings,
        "wrong_terms_with_multiple_targets": conflicts,
        "cascade_risk_count": len(cascade_rows),
        "short_terms_le_2_count": len(short_terms),
        "short_terms_le_2": short_terms,
        "artifacts": artifact_rows,
    }
    path = OUT / "post_audit_asr_summary_20260710.json"
    path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
