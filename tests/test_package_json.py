# tests/test_package_json.py
# Test framework: pytest
# Purpose: Validate the repository's package.json for critical fields, versions, and constraints.

import json
import re
from pathlib import Path
import pytest


def _find_package_json(start_dir: Path | None = None) -> Path:
    """
    Attempt to locate package.json by walking up from the current
    test directory and falling back to the current working directory.
    """
    start_dir = (start_dir or Path(__file__).resolve().parent)
    for _ in range(8):
        candidate = start_dir / "package.json"
        if candidate.exists():
            return candidate
        if start_dir.parent == start_dir:
            break
        start_dir = start_dir.parent
    cwd_candidate = Path.cwd() / "package.json"
    if cwd_candidate.exists():
        return cwd_candidate
    raise FileNotFoundError("Could not locate package.json from test context")


@pytest.fixture(scope="session")
def package_data() -> dict:
    path = _find_package_json()
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def test_top_level_fields_present_and_types(package_data: dict) -> None:
    # Required keys at the top level
    required = [
        "type",
        "name",
        "version",
        "private",
        "scripts",
        "devDependencies",
        "dependencies",
        "packageManager",
        "pnpm",
        "engines",
    ]
    for key in required:
        assert key in package_data, f"Missing required top-level key: {key}"

    # Types and specific values
    assert isinstance(package_data["type"], str)
    assert package_data["type"] == "module"
    assert isinstance(package_data["name"], str)
    assert package_data["name"] == "nx-monorepo"
    assert isinstance(package_data["version"], str)
    assert package_data["version"] == "1.0.0"
    assert isinstance(package_data["private"], bool)
    assert package_data["private"] is True
    assert isinstance(package_data["scripts"], dict)
    assert isinstance(package_data["devDependencies"], dict)
    assert isinstance(package_data["dependencies"], dict)
    assert isinstance(package_data["packageManager"], str)
    assert isinstance(package_data["pnpm"], dict)
    assert isinstance(package_data["engines"], dict)


def test_scripts_are_defined_correctly(package_data: dict) -> None:
    scripts = package_data["scripts"]
    expected = {
        "nx": "nx",
        "start": "nx serve",
        "build": "nx build",
        "test": "nx test",
        "lint": "nx lint",
        "affected": "nx affected --target=build",
    }
    for key, val in expected.items():
        assert key in scripts, f"scripts.{key} should exist"
        assert scripts[key] == val, f"scripts.{key} should be '{val}'"


def test_package_manager_and_node_engines(package_data: dict) -> None:
    assert package_data["packageManager"] == "pnpm@10.0.0"
    engines = package_data["engines"]
    assert "node" in engines
    assert engines["node"] == ">=18 <21 || >=22"


def test_dependencies_expected_versions(package_data: dict) -> None:
    deps = package_data["dependencies"]
    expected = {
        "@google-analytics/data": "^5.2.0",
        "@google-cloud/aiplatform": "^5.5.0",
        "@google-cloud/bigquery": "8.1.1",
        "@google-cloud/secret-manager": "^6.1.0",
        "@google-cloud/storage": "7.16.0",
        "fastify": "^5.5.0",
        "google-auth-library": "^10.2.1",
        "lodash": "^4.17.21",
    }
    for key, val in expected.items():
        assert key in deps, f"dependencies.{key} should exist"
        assert deps[key] == val, f"dependencies.{key} should be '{val}'"


def test_dev_dependencies_expected_versions_and_consistency(package_data: dict) -> None:
    dev = package_data["devDependencies"]

    # Nx packages should all be pinned to the same version
    nx_entries = {k: v for k, v in dev.items() if k.startswith("@nx/")}
    expected_nx_version = "19.8.4"
    for expected_key in ["@nx/jest", "@nx/js", "@nx/linter", "@nx/next", "@nx/node", "@nx/workspace"]:
        assert expected_key in nx_entries, f"devDependencies should include {expected_key}"
    assert set(nx_entries.values()) == {expected_nx_version}, f"All @nx/* devDependencies should be pinned to {expected_nx_version}"

    # Core Nx CLI is also present in devDependencies
    # (Redundant assertion removed; already checked above)

    # Core Nx CLI is also present in devDependencies
    assert dev.get("nx") == "19.8.4"

    # Tooling versions
    assert dev.get("typescript") == "5.8.3"
    assert dev.get("ts-node") == "10.9.2"
    assert dev.get("@types/node") == "18.19.34"

    # Other expected devDeps
    assert dev.get("fs-extra") == "^11.3.1"
    assert dev.get("koa") == "^2.16.2"
    assert dev.get("secretlint") == "^8.5.0"
    assert dev.get("@secretlint/secretlint-rule-preset-recommend") == "^8.5.0"


def test_pnpm_overrides_and_only_built_dependencies(package_data: dict) -> None:
    pnpm_cfg = package_data["pnpm"]
    assert "onlyBuiltDependencies" in pnpm_cfg
    assert "overrides" in pnpm_cfg
    only_built = set(pnpm_cfg["onlyBuiltDependencies"])
    expected_only_built = {"@parcel/watcher", "nx", "protobufjs", "sharp"}
    assert expected_only_built.issubset(only_built), "pnpm.onlyBuiltDependencies should include required entries"

    overrides = pnpm_cfg["overrides"]
    expected_overrides = {
        "@swc/core": "^1.3.86",
        "@swc/helpers": "^0.5.4",
        "@types/react": "^18.2.0",
        "koa": "^2.16.2",
    }
    for key, val in expected_overrides.items():
        assert key in overrides, f"pnpm.overrides.{key} should exist"
        assert overrides[key] == val, f"pnpm.overrides.{key} should be '{val}'"


def test_all_declared_versions_follow_basic_semver(package_data: dict) -> None:
    """
    Validate that versions look like semver (optionally prefixed with ^ or ~).
    This applies to dependencies, devDependencies, and pnpm.overrides.
    """
    semver_re = re.compile(r"^[~^]?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$")
    groups = {
        "dependencies": package_data.get("dependencies", {}),
        "devDependencies": package_data.get("devDependencies", {}),
        "pnpm.overrides": package_data.get("pnpm", {}).get("overrides", {}),
    }

    non_semver = {}
    for group_name, group in groups.items():
        bad_in_group = {k: v for k, v in group.items() if not semver_re.match(str(v))}
        if bad_in_group:
            non_semver[group_name] = bad_in_group

    assert non_semver == {}, f"Non-semver versions detected: {non_semver}"


def test_type_module_is_set(package_data: dict) -> None:
    # Ensure ESM is enabled
    assert package_data["type"] == "module"