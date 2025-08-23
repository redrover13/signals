# tests/test_package_json.py
# Test framework: pytest
# Purpose: Validate the repository's package.json for critical fields, versions, and constraints.

import json
import re
from pathlib import Path
import pytest


def _find_package_json(start_dir: Path | None = None) -> Path:
    """
    Locate the nearest package.json by walking up the directory tree from a start directory (up to 8 levels) and, if not found, falling back to the current working directory.
    
    If start_dir is omitted, traversal begins at the directory containing this test module. The function returns the Path to the first package.json found.
    
    Parameters:
        start_dir (Path | None): Directory to start searching from. Defaults to the test file's parent directory.
    
    Returns:
        Path: Path to the located package.json.
    
    Raises:
        FileNotFoundError: If no package.json is found after searching the parent chain and the current working directory.
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
    """
    Load and return the repository's package.json content as a dict.
    
    This function locates package.json (using _find_package_json), reads it with UTF-8 encoding,
    and parses the JSON into a Python dictionary suitable for test assertions.
    
    Raises:
        FileNotFoundError: If package.json cannot be located.
        json.JSONDecodeError: If package.json contains invalid JSON.
    """
    path = _find_package_json()
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def test_top_level_fields_present_and_types(package_data: dict) -> None:
    # Required keys at the top level
    """
    Validate that package.json contains required top-level keys, that those keys have the expected types, and that several critical fields match exact expected values.
    
    Checks performed:
    - Presence of top-level keys: "type", "name", "version", "private", "scripts", "devDependencies", "dependencies", "packageManager", "pnpm", and "engines".
    - Types: verifies that values for those keys have the expected types (e.g., "scripts" is a dict, "private" is a bool).
    - Exact values: enforces specific values for "type" ("module"), "name" ("nx-monorepo"), "version" ("1.0.0"), and that "private" is True.
    
    Parameters:
        package_data (dict): Parsed package.json content to be validated.
    
    Raises:
        AssertionError: If any required key is missing, a value has an unexpected type, or a field does not match its expected value.
    """
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
    """
    Verify packageManager and Node engine constraint values in package.json.
    
    Asserts that packageManager is "pnpm@10.0.0" and that an "node" entry exists in the engines section with the exact constraint ">=18 <21 || >=22".
    """
    assert package_data["packageManager"] == "pnpm@10.0.0"
    engines = package_data["engines"]
    assert "node" in engines
    assert engines["node"] == ">=18 <21 || >=22"


def test_dependencies_expected_versions(package_data: dict) -> None:
    """
    Assert that specific top-level dependencies exist in package.json and have the exact expected versions.
    
    This test checks a fixed set of dependency keys and verifies each is present in package_data["dependencies"] with the exact version string listed below:
    - @google-analytics/data: ^5.2.0
    - @google-cloud/aiplatform: ^5.5.0
    - @google-cloud/bigquery: 8.1.1
    - @google-cloud/secret-manager: ^6.1.0
    - @google-cloud/storage: 7.16.0
    - fastify: ^5.5.0
    - google-auth-library: ^10.2.1
    - lodash: ^4.17.21
    
    Parameters:
        package_data (dict): Parsed package.json content (the fixture providing the full package.json as a dictionary).
    """
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

    # Nx packages should all be version-aligned (allow ~ or ^ prefixes)
    nx_entries = {k: v for k, v in dev.items() if k.startswith("@nx/")}
    expected_nx_version = "19.8.4"
    for expected_key in ["@nx/jest", "@nx/js", "@nx/linter", "@nx/next", "@nx/node", "@nx/workspace"]:
        assert expected_key in nx_entries, f"devDependencies should include {expected_key}"

    def _normalize(ver: str) -> str:
        """
        Normalize a package version string by removing a leading caret (^) or tilde (~).
        
        Takes the input, coerces it to a string, and returns the string with any leading
        '^' or '~' characters removed. Other characters (including additional prefixes
        or whitespace) are preserved.
        """
        return str(ver).lstrip("^~")

    normalized_versions = { _normalize(v) for v in nx_entries.values() }
    assert normalized_versions == {expected_nx_version}, f"All @nx/* devDependencies should align to {expected_nx_version} (got {normalized_versions})"

    # Core Nx CLI is also present in devDependencies
    assert _normalize(dev.get("nx", "")) == expected_nx_version

    # Tooling versions
    assert dev.get("typescript") == "5.8.3"
    assert dev.get("ts-node") == "10.9.2"
    assert dev.get("@types/node") == "18.19.34"

    # Other expected devDeps
    assert dev.get("fs-extra") == "^11.3.1"
    assert dev.get("koa") == "^2.16.2"
    assert dev.get("secretlint") == "^8.5.0"
    assert dev.get("@secretlint/secretlint-rule-preset-recommend") == "^8.5.0"


def test_pnpm_overrides_and_only_built_deps(package_data: dict) -> None:
    """
    Validate the package.json's pnpm configuration.
    
    Checks that the pnpm section contains "onlyBuiltDependencies" and "overrides". Verifies that onlyBuiltDependencies includes at least the entries {"@parcel/watcher", "nx", "protobufjs", "sharp"} and that specific keys in pnpm.overrides exist with the exact expected version strings (e.g., "@swc/core": "^1.3.86", "@swc/helpers": "^0.5.4", "@types/react": "^18.2.0", "koa": "^2.16.2").
    
    Parameters:
        package_data (dict): Parsed package.json content provided by the test fixture.
    """
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
    Assert that all declared dependency versions follow a basic semver format.
    
    Checks dependencies, devDependencies, and pnpm.overrides in the provided package_data for versions that match a simple semantic version pattern (optionally prefixed with `^` or `~`, and allowing pre-release/build metadata). If any non-matching entries are found, the test fails with an assertion listing the offending group keys and values.
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