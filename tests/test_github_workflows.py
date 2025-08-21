# Detected testing library and framework: pytest
import re
import json
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

import pytest

WORKFLOWS_DIR = Path(".github/workflows")

def load_yaml(path: Path):
    """
    Load and parse a GitHub Actions workflow YAML file, skipping the test if PyYAML is unavailable.
    
    If PyYAML is not installed the test is skipped via pytest.skip. Otherwise the file at `path`
    is opened with UTF-8 encoding and parsed with `yaml.safe_load`.
    
    Parameters:
        path (Path): Path to the YAML file to load.
    
    Returns:
        The Python object produced by `yaml.safe_load` (commonly a dict, list, or None).
    """
    if yaml is None:
        pytest.skip("PyYAML not available to parse GitHub workflow YAML files")
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def iter_workflows():
    """
    Yield all workflow YAML file paths from the repository's .github/workflows directory.
    
    If the workflows directory does not exist, the test is skipped via pytest.skip.
    Yields Path objects for files matching the glob pattern "*.y*ml", returned in sorted order.
    """
    if not WORKFLOWS_DIR.exists():
        pytest.skip("No .github/workflows directory found")
    for p in sorted(WORKFLOWS_DIR.glob("*.y*ml")):
        yield p

def is_pinned_action(uses: str) -> bool:
    """
    Determine whether a GitHub Actions or Docker `uses` reference is pinned.
    
    A reference is considered pinned when it cannot float to newer code:
    - Docker image references (`docker://...@sha256:<digest>`) are pinned only if they include a sha256 digest.
    - GitHub Actions references (`owner/repo@ref`) are pinned if `ref` is:
      - a full 40-character commit SHA (hex), or
      - a `v`-prefixed tag that looks like semver (e.g., `v1`, `v1.2`, `v1.2.3`).
    
    Not pinned examples: missing `@`, empty ref, branch names (`main`, `master`, `head`), `latest`, or other branch-like refs.
    
    Parameters:
        uses (str): the raw `uses` string from a workflow step (e.g., "actions/checkout@v2" or "docker://alpine@sha256:...").
    
    Returns:
        bool: True if the reference is considered pinned, False otherwise.
    """
    if "@" not in uses:
        return False
    if uses.startswith("docker://"):
        return "@sha256:" in uses.lower()
    _, ref = uses.split("@", 1)
    ref = ref.strip()
    if not ref:
        return False
    low = ref.lower()
    if low in {"main", "master", "latest", "head"}:
        return False
    # Full commit SHA (40 hex characters)
    if re.fullmatch(r"[0-9a-f]{40}", ref, flags=re.IGNORECASE):
        return True
    # v1, v1.2, v1.2.3 (require v-prefix to avoid ambiguous numeric refs)
    if re.fullmatch(r"v\d+(?:\.\d+){0,2}$", ref):
        return True
    return False
def has_minimal_schema(doc: dict) -> bool:
    """
    Return True if the parsed YAML document appears to be a minimal GitHub Actions workflow.
    
    Checks that the value is a dict containing the top-level keys "name", "on", and "jobs", and that "jobs" itself is a dict (the minimal structure required for a valid workflow file).
    
    Parameters:
        doc (dict): Parsed YAML document representing a GitHub Actions workflow.
    
    Returns:
        bool: True when the document has the minimal workflow schema, False otherwise.
    """
    return isinstance(doc, dict) and "name" in doc and "on" in doc and "jobs" in doc and isinstance(doc["jobs"], dict)
@pytest.mark.describe("GitHub Workflows - Structure and Schema")
class TestWorkflowSchema:
    def test_workflows_directory_exists(self):
        assert WORKFLOWS_DIR.exists(), "Expected .github/workflows directory to exist"

    def test_each_workflow_is_valid_yaml_with_minimal_schema(self):
        missing = []
        for path in iter_workflows():
            try:
                doc = load_yaml(path)
            except Exception as e:
                if yaml is not None and isinstance(e, yaml.YAMLError):  # type: ignore[attr-defined]
                    pytest.fail(f"YAML parsing error in {path}: {e}")
                raise
            if not has_minimal_schema(doc):
                missing.append(str(path))
        assert not missing, f"Workflows missing minimal schema (name, on, jobs): {missing}"

    def test_jobs_have_required_fields(self):
        problems = []
        for path in iter_workflows():
            doc = load_yaml(path)
            jobs = doc.get("jobs", {})
            for job_id, job in jobs.items():
                if not isinstance(job, dict):
                    problems.append((str(path), job_id, "job-not-dict"))
                    continue
                # Runner or container based
                if not any(k in job for k in ("runs-on", "container")):
                    problems.append((str(path), job_id, "missing-runs-on-or-container"))
                steps = job.get("steps")
                if steps is not None and not isinstance(steps, list):
                    problems.append((str(path), job_id, "steps-not-list"))
        assert not problems, f"Job structure problems found: {problems}"

@pytest.mark.describe("GitHub Workflows - Triggers and Conventions")
class TestWorkflowTriggers:
    def test_no_empty_on_triggers(self):
        issues = []
        for path in iter_workflows():
            doc = load_yaml(path)
            on = doc.get("on")
            if isinstance(on, dict):
                for evt, _cfg in on.items():
                    # empty dict/on: {} for specific event means default config; allow dict or list.
                    # But ensure evt isn't empty/null.
                    if evt is None or (isinstance(evt, str) and not evt.strip()):
                        issues.append(str(path))
            elif isinstance(on, list):
                if not on:
                    issues.append(str(path))
            elif on is None:
                issues.append(str(path))
        assert not issues, f"Found workflows with empty or missing triggers: {issues}"

    def test_pull_request_or_push_present_for_ci_named_workflows(self):
        """
        For workflows whose name suggests CI (contains 'CI' case-insensitive), ensure they trigger
        on push and/or pull_request.
        """
        offenders = []
        for path in iter_workflows():
            doc = load_yaml(path)
            name = str(doc.get("name") or "")
            if re.search(r"\bci\b", name, flags=re.I):
                on = doc.get("on")
                has_push = False
                has_pr = False
                if isinstance(on, (dict, list)):
                    has_push = "push" in on
                    has_pr = "pull_request" in on or "pull_request_target" in on
                if not (has_push or has_pr):
                    offenders.append(str(path))
        assert not offenders, f"CI workflows should trigger on push or pull_request: {offenders}"

@pytest.mark.describe("GitHub Workflows - Security and Best Practices")
class TestWorkflowSecurity:
    def test_actions_usage_is_pinned(self):
        """
        Ensure actions used in 'steps.uses' are pinned to a tag or SHA and not using implicit latest or branches.
        """
        unpinned = []
        for path in iter_workflows():
            doc = load_yaml(path)
            for job_id, job in (doc.get("jobs") or {}).items():
                if not isinstance(job, dict):
                    continue
                for step in (job.get("steps") or []):
                    if not isinstance(step, dict):
                        continue
                    uses = step.get("uses")
                    if not uses:
                        continue
                    if not is_pinned_action(str(uses)):
                        unpinned.append((str(path), job_id, str(uses)))
        assert not unpinned, "Found unpinned actions (prefer specific versions or SHAs): " + json.dumps(unpinned, indent=2)

    def test_permissions_are_not_overly_broad(self):
        """
        Validate that workflow- or job-level GitHub Actions `permissions` do not use the overly-broad value `write-all`.
        
        This test iterates all workflows and collects any occurrences where `permissions` is set to the string `"write-all"` or where an individual permission key is assigned `"write-all"`, at either the workflow level or within a job's `permissions` mapping. If any violations are found, the test fails and reports the workflow path and permission location(s).
        """
        violations = []
        for path in iter_workflows():
            doc = load_yaml(path)
            # Check at workflow level
            perms = doc.get("permissions")
            if isinstance(perms, str):
                if perms.strip().lower() == "write-all":
                    violations.append((str(path), "workflow", "write-all"))
            elif isinstance(perms, dict):
                # ok if keys exist; we only flag if any is write-all
                for k, v in perms.items():
                    if isinstance(v, str) and v.strip().lower() == "write-all":
                        violations.append((str(path), f"workflow.{k}", "write-all"))

            # Check job level overrides
            jobs = doc.get("jobs", {})
            if isinstance(jobs, dict):
                for job_id, job in jobs.items():
                    if not isinstance(job, dict):
                        continue
                    jperms = job.get("permissions")
                    if isinstance(jperms, str):
                        if jperms.strip().lower() == "write-all":
                            violations.append((str(path), f"job:{job_id}", "write-all"))
                    elif isinstance(jperms, dict):
                        for k, v in jperms.items():
                            if isinstance(v, str) and v.strip().lower() == "write-all":
                                violations.append((str(path), f"job:{job_id}.{k}", "write-all"))
        assert not violations, "Overly broad 'write-all' permissions detected: " + json.dumps(violations, indent=2)

@pytest.mark.describe("GitHub Workflows - Jobs and Steps Validations")
class TestWorkflowJobs:
    def test_each_job_has_at_least_one_step(self):
        """
        Verify every job in discovered workflow files contains at least one step.
        
        Scans all workflow YAML files yielded by iter_workflows(), loads each document, and inspects its `jobs` mapping. A job is considered valid if:
        - it is not a mapping (non-dict jobs are ignored), or
        - it has a non-empty `steps` list, or
        - it declares `uses` (reusable-workflow or composite usage) and omits `steps` (matrix-only or reusable-workflow jobs are allowed to have no steps).
        
        Any job that is a dict and has no `steps` (and does not use `uses`) is reported as an offender and causes the test to fail with their workflow path and job id.
        """
        offenders = []
        for path in iter_workflows():
            doc = load_yaml(path)
            jobs = doc.get("jobs", {})
            for job_id, job in jobs.items():
                if not isinstance(job, dict):
                    continue
                steps = job.get("steps", [])
                # Allow matrix-only jobs that use 'uses:' to call reusable workflows without steps.
                if ("uses" in job) and not steps:
                    continue
                if not steps:
                    offenders.append((str(path), job_id))
        assert not offenders, f"Jobs without steps found (unless 'uses' reusable workflow): {offenders}"

    def test_checkout_and_setup_steps_present_for_python_or_node_jobs(self):
        """
        For jobs that install Python or Node, ensure they include actions/checkout and setup actions.
        """
        missing = []
        for path in iter_workflows():
            doc = load_yaml(path)
            for job_id, job in (doc.get("jobs") or {}).items():
                if not isinstance(job, dict):
                    continue
                steps = job.get("steps") or []
                uses_list = [str(s.get("uses")) for s in steps if isinstance(s, dict) and s.get("uses")]
                uses_str = " ".join(uses_list).lower()
                if ("setup-python" in uses_str or "setup-node" in uses_str) and not any("actions/checkout@" in u.lower() for u in uses_list):
                    missing.append((str(path), job_id, "missing checkout"))
        assert not missing, f"Jobs missing checkout before setup actions: {missing}"

if __name__ == "__main__":
    # Runner to allow quick ad-hoc execution: pytest should be used normally.
    import sys
    import pytest as _pytest  # type: ignore
    sys.exit(_pytest.main([__file__]))