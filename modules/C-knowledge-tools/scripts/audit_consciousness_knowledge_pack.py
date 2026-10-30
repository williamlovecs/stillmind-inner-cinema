from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any


RECORD_TYPES = ("concept", "practice", "claim")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Print a compact human-review sample.")
    parser.add_argument(
        "--pack",
        type=Path,
        default=Path("artifacts/consciousness-intensity/knowledge-pack"),
    )
    args = parser.parse_args()

    records = read_jsonl(args.pack / "records/all.jsonl")
    samples: dict[tuple[str, str], dict[str, Any]] = {}
    for record in records:
        key = (record["chapter"]["id"], record["type"])
        samples.setdefault(key, record)

    expected = {(f"{chapter:02d}", record_type) for chapter in range(1, 10) for record_type in RECORD_TYPES}
    missing = sorted(expected - set(samples))
    if missing:
        raise RuntimeError(f"Missing chapter/type samples: {missing}")

    print("REPRESENTATIVE MAIN RECORDS (9 chapters x 3 types)")
    for key in sorted(samples):
        record = samples[key]
        source = record["source"]
        print(
            "\t".join(
                (
                    key[0],
                    key[1],
                    record["id"],
                    f"{source['volume']}:{source['pdf_page']}",
                    record["evidence"]["level"],
                    record["title"].replace("\t", " ").replace("\n", " ")[:64],
                )
            )
        )

    unresolved = read_jsonl(args.pack / "records/unresolved.jsonl")
    print(f"\nUNRESOLVED ({len(unresolved)})")
    for record in unresolved:
        source = record["source"]
        print(
            "\t".join(
                (
                    record["id"],
                    f"{source['volume']}:{source['pdf_page']}",
                    ",".join(record["provenance_issues"]),
                    record["title"].replace("\t", " ").replace("\n", " ")[:64],
                )
            )
        )

    noise = read_jsonl(args.pack / "records/excluded-noise.jsonl")
    noise_reasons = sorted({record["reason"] for record in noise})
    print(f"\nEXCLUDED NOISE ({len(noise)}): {', '.join(noise_reasons)}")
    noise_pages = Counter(
        (record["source_candidate"]["volume"], record["source_candidate"]["pdf_page"])
        for record in noise
    )
    print(
        "NOISE PAGES: "
        + ", ".join(
            f"{volume}:{page}={count}"
            for (volume, page), count in sorted(noise_pages.items())
        )
    )


if __name__ == "__main__":
    main()
