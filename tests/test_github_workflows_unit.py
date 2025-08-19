# Detected testing library and framework: pytest
# These unit tests focus on the helper functions and core behaviors defined in tests/test_github_workflows.py.
# They validate a comprehensive set of scenarios around:
# - is_pinned_action: happy paths, edge cases, and failure-like conditions
# - has_minimal_schema: minimal schema presence and incorrect shapes
# - iter_workflows: skip behavior when workflows dir is missing, and glob/sort behavior
# - load_yaml: proper parsing when PyYAML is available, and raising on invalid YAML
#
# We deliberately import the target test module by file path to avoid import path issues and to
# ensure we're testing the exact implementation present in tests/test_github_workflows.py.

from pathlib import Path
import pytest
import importlib.util


def _import_ghwf(unique_name: str = "ghwf_mod"):
    """
    Import tests/test_github_workflows.py as a module with a unique name so we can
    directly access its helper functions without relying on package imports.
    """
    target = Path(__file__).with_name("test_github_workflows.py")
    spec = importlib.util.spec_from_file_location(unique_name, target)
    assert spec is not None and spec.loader is not None, "Unable to load test_github_workflows module spec"
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[attr-defined]
    return mod


@pytest.fixture
def ghwf():
    # Base import that reflects the environment's availability of PyYAML at import time
    return _import_ghwf("ghwf_mod_default")


@pytest.fixture
def ghwf_with_yaml():
    # Ensure we have PyYAML available for tests that rely on parsing
    pytest.importorskip("yaml")
    return _import_ghwf("ghwf_mod_with_yaml")


class TestIsPinnedAction:
    @pytest.mark.parametrize(
        "uses,expected",
        [
            ("actions/checkout", False),               # no '@' -> not pinned
            ("actions/checkout@", False),              # empty ref after '@' -> not pinned
            ("actions/checkout@v4", True),             # explicit tag -> pinned
            ("actions/checkout@main", False),          # main branch -> not pinned
            ("actions/checkout@master", False),        # master branch -> not pinned
            ("actions/checkout@latest", False),        # latest -> not pinned
            ("owner/repo@1234567", False),             # short SHA/branch-like -> not pinned under stricter rules
            ("owner/repo@feature-branch", False),      # branch -> not pinned
            ("docker://alpine", False),                # docker ref without '@' -> not pinned per current logic
            ("docker://alpine@sha256:deadbeef", True), # docker digest -> pinned
            ("path/to/action@ v1.2.3 ", True),         # ref with whitespace trimmed -> pinned
            ("path/to/action@    ", False),            # whitespace-only ref -> empty after strip -> not pinned
        ],
        ids=[
            "no_ref",
            "empty_ref",
            "tag_v4",
            "branch_main",
            "branch_master",
            "latest",
            "sha_like",
            "branch_like",
            "docker_no_ref",
            "docker_digest",
            "whitespace_tag",
            "whitespace_empty_ref",
        ],
    )
    def test_is_pinned_action_various_cases(self, ghwf, uses, expected):
        assert ghwf.is_pinned_action(uses) is expected

class TestHasMinimalSchema:
    @pytest.mark.parametrize(
        "doc,expected",
        [
            ({"name": "WF", "on": ["push"], "jobs": {}}, True),  # minimal valid
            ({"on": ["push"], "jobs": {}}, False),               # missing name
            ({"name": "WF", "jobs": {}}, False),                 # missing on
            ({"name": "WF", "on": [], "jobs": []}, False),       # jobs not dict
            ([], False),                                         # not a dict
            (
                {"name": "WF", "on": {}, "jobs": {"build": {}}},
                True,  # valid: jobs is a dict
            ),
        ],
        ids=[
            "valid_minimal",
            "missing_name",
            "missing_on",
            "jobs_not_dict",
            "doc_not_dict",
            "valid_with_job_dict",
        ],
    )
    def test_has_minimal_schema_various(self, ghwf, doc, expected):
        assert ghwf.has_minimal_schema(doc) is expected


class TestIterWorkflowsBehavior:
        gen = ghwf.iter_workflows()
        with pytest.raises(pytest.SkipException) as excinfo:
            next(gen)
        # Ensure the skip reason matches
    def test_iter_workflows_skips_if_no_dir(self, ghwf):
        """
        Should raise pytest.SkipException if the workflows directory does not exist.
        """
        gen = ghwf.iter_workflows()
        with pytest.raises(pytest.SkipException) as excinfo:
            next(gen)
        # Ensure the skip reason matches
        assert "No .github/workflows directory found" in str(excinfo.value)
    def test_iter_workflows_globs_yaml_and_sorts(self, ghwf, tmp_path):
        # Create a temporary workflows directory with mixed files
        ghwf.WORKFLOWS_DIR = tmp_path
        (tmp_path / "b.yml").write_text("name: B\non: [push]\njobs: {}\n", encoding="utf-8")
        (tmp_path / "a.yml").write_text("name: A\non: [push]\njobs: {}\n", encoding="utf-8")
        (tmp_path / "c.yaml").write_text("name: C\non: [push]\njobs: {}\n", encoding="utf-8")
        (tmp_path / "ignore.txt").write_text("not yaml", encoding="utf-8")

        files = list(ghwf.iter_workflows())
        assert [p.name for p in files] == ["a.yml", "b.yml", "c.yaml"]


class TestLoadYaml:
    def test_load_yaml_parses_valid_yaml_when_pyyaml_available(self, ghwf_with_yaml, tmp_path):
        # Only runs if PyYAML is available
        wf = tmp_path / "wf.yml"
        wf.write_text("name: TestWF\non: [push]\njobs: {}\n", encoding="utf-8")
        doc = ghwf_with_yaml.load_yaml(wf)
        assert isinstance(doc, dict)
        assert doc.get("name") == "TestWF"
        assert "on" in doc
        assert isinstance(doc.get("jobs"), dict)

    def test_load_yaml_raises_on_invalid_yaml(self, ghwf_with_yaml, tmp_path):
        # Only runs if PyYAML is available; ensure invalid YAML bubbles up as YAMLError
        yaml_mod = pytest.importorskip("yaml")
        wf = tmp_path / "bad.yml"
        wf.write_text("name: [unclosed\non: [push]\njobs: {}\n", encoding="utf-8")
        with pytest.raises(yaml_mod.YAMLError):
            ghwf_with_yaml.load_yaml(wf)