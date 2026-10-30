from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import fitz


VOLUMES = {
    "volume-upper": "最终版-意识强度-上q.pdf",
    "volume-lower": "最终版-意识强度-下q.pdf",
}


@dataclass
class PageRecord:
    page: int
    label: str
    char_count: int
    word_like_count: int
    block_count: int
    text: str


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def clean_text(text: str) -> str:
    text = text.replace("\u0000", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.strip()


def choose_render_pages(page_count: int, toc: list[list[Any]]) -> list[int]:
    candidates = {0, 1, 2, page_count - 1}
    for fraction in (0.25, 0.5, 0.75):
        candidates.add(round((page_count - 1) * fraction))
    for level, _title, page_number, *_rest in toc[:12]:
        if level <= 2:
            candidates.add(page_number - 1)
    return sorted(page for page in candidates if 0 <= page < page_count)


def extract_volume(source: Path, output_root: Path, slug: str) -> dict[str, Any]:
    volume_dir = output_root / slug
    renders_dir = volume_dir / "renders"
    volume_dir.mkdir(parents=True, exist_ok=True)
    renders_dir.mkdir(parents=True, exist_ok=True)

    document = fitz.open(source)
    toc = document.get_toc(simple=True)
    pages_path = volume_dir / "pages.jsonl"
    text_path = volume_dir / "full_text.md"

    page_records: list[PageRecord] = []
    total_chars = 0
    nonempty_pages = 0

    with pages_path.open("w", encoding="utf-8", newline="\n") as jsonl, text_path.open(
        "w", encoding="utf-8", newline="\n"
    ) as markdown:
        markdown.write(f"# {source.stem}\n\n")
        for index, page in enumerate(document):
            text = clean_text(page.get_text("text", sort=True))
            blocks = page.get_text("blocks", sort=True)
            label = page.get_label() or str(index + 1)
            record = PageRecord(
                page=index + 1,
                label=label,
                char_count=len(text),
                word_like_count=len(re.findall(r"[\u4e00-\u9fff]|[A-Za-z0-9]+", text)),
                block_count=len(blocks),
                text=text,
            )
            page_records.append(record)
            jsonl.write(json.dumps(asdict(record), ensure_ascii=False) + "\n")
            markdown.write(f"## PDF page {index + 1} (label {label})\n\n{text}\n\n")
            total_chars += len(text)
            if text:
                nonempty_pages += 1

    render_pages = choose_render_pages(document.page_count, toc)
    rendered_files: list[str] = []
    for page_index in render_pages:
        page = document.load_page(page_index)
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        render_path = renders_dir / f"page-{page_index + 1:04d}.png"
        pixmap.save(render_path)
        rendered_files.append(str(render_path))

    toc_data = [
        {"level": level, "title": title, "page": page, "extra": extra}
        for level, title, page, *extra in toc
    ]
    (volume_dir / "toc.json").write_text(
        json.dumps(toc_data, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    manifest = {
        "slug": slug,
        "source_path": str(source),
        "source_size_bytes": source.stat().st_size,
        "source_modified_utc": datetime.fromtimestamp(
            source.stat().st_mtime, tz=timezone.utc
        ).isoformat(),
        "source_sha256": sha256_file(source),
        "page_count": document.page_count,
        "metadata": document.metadata,
        "toc_entry_count": len(toc),
        "nonempty_text_pages": nonempty_pages,
        "text_coverage_ratio": round(nonempty_pages / document.page_count, 6),
        "total_extracted_characters": total_chars,
        "average_characters_per_page": round(total_chars / document.page_count, 2),
        "rendered_pages": [page + 1 for page in render_pages],
        "rendered_files": rendered_files,
        "outputs": {
            "pages_jsonl": str(pages_path),
            "full_text_markdown": str(text_path),
            "toc_json": str(volume_dir / "toc.json"),
        },
    }
    document.close()
    (volume_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return manifest


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(
        description="Extract and sample the two-volume Consciousness Intensity corpus."
    )
    parser.add_argument("source_dir", type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/consciousness-intensity/corpus"),
    )
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    manifests = []
    for slug, filename in VOLUMES.items():
        source = args.source_dir / filename
        if not source.is_file():
            raise FileNotFoundError(f"Missing required volume: {source}")
        print(f"Extracting {source} ...", flush=True)
        manifests.append(extract_volume(source, args.output, slug))

    index = {
        "generated_utc": datetime.now(tz=timezone.utc).isoformat(),
        "source_directory": str(args.source_dir),
        "volumes": manifests,
        "totals": {
            "page_count": sum(item["page_count"] for item in manifests),
            "source_size_bytes": sum(item["source_size_bytes"] for item in manifests),
            "extracted_characters": sum(
                item["total_extracted_characters"] for item in manifests
            ),
        },
    }
    index_path = args.output / "index.json"
    index_path.write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(index, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
