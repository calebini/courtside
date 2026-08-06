#!/usr/bin/env python3
"""Verify seed-stage Courtside repository invariants without dependencies."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = (
    "README.md",
    "AGENTS.md",
    "specs/overview.md",
    "specs/lifecycle.md",
    "specs/invariants.md",
    "specs/config.md",
    "specs/decisions/0001-ratify-core-domain.md",
    "specs/repo-standard.md",
)
TEMPLATE_MARKERS = tuple(
    "{{" + name + "}}" for name in ("component_slug", "package_name", "Component Name")
)


def main() -> int:
    errors: list[str] = []

    for relative_path in REQUIRED_FILES:
        path = ROOT / relative_path
        if not path.is_file():
            errors.append(f"missing required file: {relative_path}")

    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for marker in TEMPLATE_MARKERS:
            if marker in content:
                errors.append(f"unresolved template marker {marker!r} in {path.relative_to(ROOT)}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("Repository scaffold verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
