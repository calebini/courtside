#!/usr/bin/env python3
"""Verify Courtside repository shape and accepted source-of-truth invariants."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = (
    "README.md",
    "AGENTS.md",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "specs/overview.md",
    "specs/architecture.md",
    "specs/authentication.md",
    "specs/lifecycle.md",
    "specs/invariants.md",
    "specs/config.md",
    "specs/tech-stack.md",
    "specs/decisions/0001-ratify-core-domain.md",
    "specs/decisions/0002-adopt-initial-tech-stack.md",
    "specs/decisions/0003-use-node-postgres-transactions.md",
    "specs/decisions/0004-deliver-authenticated-admin-slice.md",
    "specs/repo-standard.md",
    "docs/development.md",
    "src/courtside/core/standings.ts",
    "src/courtside/services/finalize-game.ts",
    "src/courtside/services/resolve-authenticated-account.ts",
    "src/courtside/adapters/postgres/finalize-game-store.ts",
    "supabase/migrations/20260807190000_initial_game_result_slice.sql",
    "tests/unit/standings.test.ts",
    "tests/integration/finalize-game.postgres.test.ts",
    "tests/e2e/admin-finalization.spec.ts",
    "supabase/seed.sql",
    ".github/workflows/ci.yml",
)
ACCEPTED_SPECS = (
    "specs/overview.md",
    "specs/architecture.md",
    "specs/authentication.md",
    "specs/lifecycle.md",
    "specs/invariants.md",
    "specs/config.md",
    "specs/tech-stack.md",
    "specs/decisions/0001-ratify-core-domain.md",
    "specs/decisions/0002-adopt-initial-tech-stack.md",
    "specs/decisions/0003-use-node-postgres-transactions.md",
    "specs/decisions/0004-deliver-authenticated-admin-slice.md",
)
TEMPLATE_MARKERS = tuple(
    "{{" + name + "}}" for name in ("component_slug", "package_name", "Component Name")
)
IGNORED_DIRECTORY_NAMES = {
    ".git",
    ".next",
    ".turbo",
    "coverage",
    "node_modules",
}


def main() -> int:
    errors: list[str] = []

    for relative_path in REQUIRED_FILES:
        path = ROOT / relative_path
        if not path.is_file():
            errors.append(f"missing required file: {relative_path}")

    for relative_path in ACCEPTED_SPECS:
        path = ROOT / relative_path
        if path.is_file() and "- Status: accepted" not in path.read_text(encoding="utf-8"):
            errors.append(f"accepted source of truth lost accepted status: {relative_path}")

    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in IGNORED_DIRECTORY_NAMES for part in path.parts):
            continue
        if "supabase" in path.parts and any(part in {".branches", ".temp"} for part in path.parts):
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

    print("Repository verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
