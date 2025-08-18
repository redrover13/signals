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
    if yaml is None:
        pytest.skip("PyYAML not available to parse GitHub workflow YAML files")
    with path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def iter_workflows():
    if not WORKFLOWS_DIR.exists():
        pytest.skip("No .github/workflows directory found")
    for p in sorted(WORKFLOWS_DIR.glob("*.y*ml")):
        yield p

def is_pinned_action(uses: str) -> bool:
    """
    Treat as pinned only if:
    - docker:// refs use an explicit digest (e.g., @sha256:<digest>)
    - GitHub actions use a full 40-hex commit SHA, or a semver-like tag (v1, v1.2.3)
    Branch names (e.g., main, master, feature/*) and 'latest' are not pinned.
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
    # Full commit SHA
    if re.fullmatch(r"[0-9a-fA-F]{40}", ref):
        return True
    # v1 or v1.2.3 tags
    def test_each_workflow_is_valid_yaml_with_minimal_schema(self):
        return True
    return False
def has_minimal_schema(doc: dict) -> bool:
    return isinstance(doc, dict) and "name" in doc and "on" in doc and "jobs" in doc and isinstance(doc["jobs"], dict)
@pytest.mark.describe("GitHub Workflows - Structure and Schema")
class TestWorkflowSchema:
    def test_workflows_directory_exists(self):
        assert WORKFLOWS_DIR.exists(), "Expected .github/workflows directory to exist"

     def test_each_workflow_is_valid_yaml_with_minimal_schema(self):
         missing = []
         for path in iter_workflows():
-            try:
-                doc = load_yaml(path)
-            except yaml.YAMLError as e:
            try:
                doc = load_yaml(path)
            except Exception as e:
                # Only treat real PyYAML parse errors as failures; allow skips or other errors to propagate
                if yaml is not None and isinstance(e, yaml.YAMLError):  # type: ignore[attr-defined]
                    pytest.fail(f"YAML parsing error in {path}: {e}")
                raise
             if not has_minimal_schema(doc):
                 missing.append(path)
         assert not missing, f"Missing minimal schema in workflows: {missing}"
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
        If 'permissions' are set at the workflow or job level, ensure they are not 'write-all'.
        Allow read-all, or explicit scoped permissions.
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