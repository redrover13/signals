import os
import re

# Try to import pytest to leverage its features if available.
# Tests will still run under unittest if pytest is not installed,
# by providing equivalent assertions and a unittest.TestCase fallback.
try:
    import pytest  # type: ignore
    HAS_PYTEST = True
except Exception:  # pragma: no cover
    HAS_PYTEST = False

# Try to import yaml (PyYAML). If missing, we fall back to a simple parser
# or line-based assertions.
try:
    import yaml  # type: ignore
    HAS_YAML = True
except Exception:  # pragma: no cover
    HAS_YAML = False

from typing import List, Dict, Any, Optional


EXPECTED_RUNTIMES = [
    "java@17.0.10",
    "node@22.2.0",
    "python@3.11.11",
]

EXPECTED_TOOLS = [
    "eslint@8.57.0",
    "lizard@1.17.31",
    "pmd@6.55.0",
    "pylint@3.3.7",
    "semgrep@1.78.0",
    "trivy@0.65.0",
]

# Candidate paths for codacy config
CANDIDATE_CONFIG_PATHS = [
    ".codacy.yml",
    ".codacy.yaml",
    "codacy.yml",
    "codacy.yaml",
    ".codacy/.codacy.yml",
    ".codacy/.codacy.yaml",
]


def find_codacy_config() -> Optional[str]:
    for path in CANDIDATE_CONFIG_PATHS:
        if os.path.isfile(path):
            return path
    # As a fallback, scan repo root for a file that contains top-level 'runtimes:' and 'tools:' keys.
    try:
        for root, _, files in os.walk(".", topdown=True):
            # Skip large or irrelevant directories
            skip_dirs = {"node_modules", "dist", "build", ".git", ".venv", "venv", ".mypy_cache", ".pytest_cache", ".tox"}
            if any(seg in skip_dirs for seg in root.split(os.sep)):
                continue
            for f in files:
                if f.endswith((".yml", ".yaml")):
                    candidate = os.path.join(root, f)
                    try:
                        with open(candidate, "r", encoding="utf-8") as fh:
                            content = fh.read(2048)  # read the beginning
                        if runtimes_pattern.search(content) and tools_pattern.search(content):
                            return candidate
                    except Exception:
                        # Ignore unreadable files
                        pass
    except Exception:
        pass
    return None


def simple_yaml_like_parse(text: str) -> Dict[str, Any]:
    """
    Very small YAML-like parser sufficient for this specific structure:
    keys at root (runtimes, tools) mapping to lists of '- item' values.
    Not a general YAML parser. Used only if PyYAML is unavailable.
    """
    data: Dict[str, Any] = {}
    current_key: Optional[str] = None
    indent_level: Optional[int] = None

    for line in text.splitlines():
        line = line.rstrip("\n")
        if not line.strip() or line.strip().startswith("#"):
            continue

        # Match a top-level key:
        m_key = re.match(r"^([A-Za-z0-9_]+)\s*:\s*$", line)
        if m_key:
            current_key = m_key.group(1)
            data[current_key] = []
            # compute indentation level for list items
            indent_level = None
            continue

        # Match list items under current key
        if current_key is not None:
            # Determine indent on first list item
            if indent_level is None:
                m_indent = re.match(r"^(\s+)-\s+(.*)$", line)
                if m_indent:
                    indent_level = len(m_indent.group(1))
                    data[current_key].append(m_indent.group(2).strip())
                    continue
            else:
                m_item = re.match(rf"^\s{{{indent_level}}}-\s+(.*)$", line)
                if m_item:
                    data[current_key].append(m_item.group(1).strip())
                    continue
            # If we get here, the line didn't match an item; ignore for simplicity
        # else ignore lines outside known sections

    return data


def load_config(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if HAS_YAML:
        try:
            parsed = yaml.safe_load(content)  # type: ignore
            if not isinstance(parsed, dict):
                raise AssertionError("Codacy config is not a mapping at top level.")
            return parsed
        except Exception:
            # Fall back to simple parser if YAML parsing fails
            return simple_yaml_like_parse(content)
    else:
        return simple_yaml_like_parse(content)


def version_tuple(s: str) -> List[str]:
    # Extract '<name>@<version>' -> ['name', 'version']
    parts = s.split("@", 1)
    if len(parts) == 2:
        return [parts[0].strip(), parts[1].strip()]
    return [s.strip(), ""]


def assert_contains_exact(items: List[str], expected: List[str], context: str) -> None:
    missing = [x for x in expected if x not in items]
    unexpected = [x for x in items if x not in expected]
    if missing or unexpected:
        raise AssertionError(
            f"{context} mismatch.\n"
            f"  Expected: {expected}\n"
            f"  Actual:   {items}\n"
            f"  Missing:  {missing}\n"
            f"  Extra:    {unexpected}"
        )


def test_codacy_config_presence_and_format():
    """
    Ensure the Codacy configuration file exists and is parseable.
    """
    config_path = find_codacy_config()
    assert config_path is not None, "Codacy config file was not found in common locations."

    # Validate it's non-empty
    stat = os.stat(config_path)
    assert stat.st_size > 0, "Codacy config file is empty."

    # Basic structure verification
    data = load_config(config_path)
    assert isinstance(data, dict), "Codacy config should parse to a mapping/dictionary."

    # Check foundational keys exist
    assert "runtimes" in data, "Codacy config is missing 'runtimes' key."
    assert "tools" in data, "Codacy config is missing 'tools' key."

    # Validate types
    assert isinstance(data["runtimes"], list), "'runtimes' should be a list."
    assert isinstance(data["tools"], list), "'tools' should be a list."


def test_codacy_config_expected_runtimes_and_tools():
    """
    Verify that 'runtimes' and 'tools' match the expected sets including versions.
    """
    config_path = find_codacy_config()
    assert config_path is not None, "Codacy config file was not found."

    data = load_config(config_path)

    # Convert all entries to strings (in case the YAML parser parsed them as something else)
    runtimes = [str(x) for x in data.get("runtimes", [])]
    tools = [str(x) for x in data.get("tools", [])]

    assert_contains_exact(runtimes, EXPECTED_RUNTIMES, context="runtimes")
    assert_contains_exact(tools, EXPECTED_TOOLS, context="tools")

    # Additional validation: ensure each runtime/tool includes a version
    for r in runtimes:
        name, ver = version_tuple(r)
        assert name and ver, f"Runtime entry '{r}' must include a version with '@'."
        assert re.match(r"^\d+\.\d+\.\d+$", ver), f"Runtime '{r}' must have a semantic version (e.g., 1.2.3)."

    for t in tools:
        name, ver = version_tuple(t)
        assert name and ver, f"Tool entry '{t}' must include a version with '@'."
        # Allow optional 'v' or plain semver for tools; be strict here per provided diff
        assert re.match(r"^\d+\.\d+\.\d+$", ver), f"Tool '{t}' must have a semantic version (e.g., 1.2.3)."


def test_codacy_config_disallows_duplicates():
    """
    Ensure there are no duplicate entries in 'runtimes' or 'tools'.
    """
    config_path = find_codacy_config()
    assert config_path is not None, "Codacy config file was not found."

    data = load_config(config_path)
    runtimes = [str(x) for x in data.get("runtimes", [])]
    tools = [str(x) for x in data.get("tools", [])]

    def find_dupes(seq: List[str]) -> List[str]:
        seen = set()
        dupes = []
        for x in seq:
            if x in seen and x not in dupes:
                dupes.append(x)
            seen.add(x)
        return dupes

    runtime_dupes = find_dupes(runtimes)
    tool_dupes = find_dupes(tools)

    assert not runtime_dupes, f"Duplicate runtime entries found: {runtime_dupes}"
    assert not tool_dupes, f"Duplicate tool entries found: {tool_dupes}"


def test_codacy_config_strict_version_pinning():
    """
    Ensure all versions are pinned exactly (no wildcard, range, or pre-release tags), as suggested by the diff.
    """
    config_path = find_codacy_config()
    assert config_path is not None, "Codacy config file was not found."

    data = load_config(config_path)
    all_entries = [str(x) for x in data.get("runtimes", [])] + [str(x) for x in data.get("tools", [])]

    # Disallow range operators and wildcard-like suffixes
    forbidden = re.compile(r"[<>=~^*]|alpha|beta|rc", re.IGNORECASE)
    for entry in all_entries:
        name, ver = version_tuple(entry)
        assert ver, f"Entry '{entry}' must pin a version."
        assert re.match(r"^\d+\.\d+\.\d+$", ver), f"Entry '{entry}' version must be in 'X.Y.Z' format."
        assert not forbidden.search(ver), f"Entry '{entry}' must not use range or pre-release specifiers."


# Provide a unittest fallback so this module can run even without pytest installed
if not HAS_PYTEST:
    import unittest  # pragma: no cover

    class TestCodacyConfig(unittest.TestCase):
        def test_presence_and_format(self):
            test_codacy_config_presence_and_format()

        def test_expected_runtimes_and_tools(self):
            test_codacy_config_expected_runtimes_and_tools()

        def test_disallows_duplicates(self):
            test_codacy_config_disallows_duplicates()

        def test_strict_version_pinning(self):
            test_codacy_config_strict_version_pinning()