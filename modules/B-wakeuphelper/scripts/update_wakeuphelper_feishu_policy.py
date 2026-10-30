"""Update the bundled Feishu policy for separate ISO speaker/time lines.

The backup is only created once. This changes a source config file; a normal
Release build then copies it into the distributable config directory.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path


POLICY = Path(r"E:\WakeupHelper-final\config\setting\513df0b0d991411a92e7aa339ac9aa61.json")
TEMPLATE = Path(r"E:\WakeupHelper-final\config\template\ab4d542e53114f1ab6d155f01cc28800.json")

ISO_OR_SHORT_TIME_REGEX = (
    r"^(?<name>.+?)\s+(?:(?<datetime>\d{4}-\d{2}-\d{2})\s+)?"
    r"(?<time>\d{1,2}:\d{2}(?::\d{2})?)\s*$"
)
TIMESTAMP_TO_REMOVE = r"(?:\d{4}-\d{2}-\d{2}\s+)?\d{1,2}:\d{2}(?::\d{2})?"


def update_json(path: Path, updates: dict[str, object]) -> None:
    backup = path.with_suffix(path.suffix + ".bak-realtime-parser-20260715")
    if not backup.exists():
        shutil.copy2(path, backup)
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    data.update(updates)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"updated={path}")
    print(f"backup={backup}")


def main() -> None:
    update_json(POLICY, {"Regex": ISO_OR_SHORT_TIME_REGEX})
    update_json(TEMPLATE, {"RemoveDatetimeRegex": TIMESTAMP_TO_REMOVE})


if __name__ == "__main__":
    main()
