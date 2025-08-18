import re
from pathlib import Path

# Testing library and framework:
# Using pytest (de-facto in Python repos with tests/ and test_*.py patterns).
# Tests gracefully degrade to string-based assertions if PyYAML is unavailable.

try:
    import yaml  # type: ignore
    HAVE_YAML = True
except ImportError:
    HAVE_YAML = False

def _find_cloudbuild_file():
    # Expand search to a few common directories without walking entire repo to keep tests fast.
    extra_dirs = ["infra", "deploy", "ops", "."]
    for d in extra_dirs:
        p1 = Path(d) / "cloudbuild.yaml"
        p2 = Path(d) / "cloudbuild.yml"
        for p in (p1, p2):
            if p.exists() and p.is_file():
                return p
    # Last resort: scan shallow depth for files named cloudbuild.*yml
    for p in Path(".").glob("**/cloudbuild.y*ml"):
        if p.is_file():
            return p
    raise FileNotFoundError("cloudbuild.yaml not found in repository")

def _load_text(path: Path) -> str:
    with path.open("r", encoding="utf-8") as f:
        return f.read()

def _safe_yaml_load(text: str):
    if not HAVE_YAML:
        return None
    return yaml.safe_load(text)

def test_cloudbuild_file_present():
    path = _find_cloudbuild_file()
    assert path.exists(), "cloudbuild.yaml should exist"
    assert path.is_file(), "cloudbuild.yaml should be a file"

def test_top_level_sections_and_basic_structure():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    if HAVE_YAML:
        data = _safe_yaml_load(text)
        assert isinstance(data, dict), "cloudbuild.yaml should parse to a mapping"
        assert "steps" in data, "Expected 'steps' at top-level"
        assert isinstance(data["steps"], list) and len(data["steps"]) > 0, "steps should be a non-empty list"
        assert "substitutions" in data, "Expected 'substitutions' at top-level"
        assert "images" in data, "Expected 'images' at top-level"
        assert "options" in data, "Expected 'options' at top-level"
    else:
        # Conservative checks without YAML dependency
        for key in ["steps:", "substitutions:", "images:", "options:"]:
            assert key in text, f"Missing top-level key: {key}"

def test_contains_expected_build_and_push_steps_in_order():
    """
    Focus on the diff: ensure docker build for agent-runner and api,
    trivy scans, then docker push, then deploys, in a plausible order.
    """
    path = _find_cloudbuild_file()
    text = _load_text(path)

    # Regexes kept fairly strict to avoid false positives
    # Build steps
    # Break down the build-agent-runner step into simpler patterns
    build_agent_patterns = [
        r"name:\s*'gcr\.io/cloud-builders/docker'",
        r"id:\s*'build-agent-runner'",
        r"args:.*?- 'build'",
        r"- '-t'.*?\$\{_ARTIFACT_REGISTRY\}.*?/dulce/agent-runner:\$\{_GITHUB_SHA\}",
        r"- '-f'.*?apps/agents/Dockerfile",
        r"- '\.'"
    ]
    build_api_pattern = r"name:\s*'gcr\.io/cloud-builders/docker'.*?id:\s*'build-api'.*?args:.*?- 'build'.*?- '-t'.*?\$\{_ARTIFACT_REGISTRY\}.*?/dulce/api:\$\{_GITHUB_SHA\}.*?- '-f'.*?apps/api/Dockerfile.*?-\s*'\.'"
    # Break down the build-api step into simpler patterns
    build_api_patterns = [
        r"name:\s*'gcr\.io/cloud-builders/docker'",
        r"id:\s*'build-api'",
        r"args:.*?- 'build'",
        r"- '-t'.*?\$\{_ARTIFACT_REGISTRY\}.*?/dulce/api:\$\{_GITHUB_SHA\}",
        r"- '-f'.*?apps/api/Dockerfile",
        r"- '\.'"
    ]
    build_api_patterns = [
        r"name:\s*'gcr\.io/cloud-builders/docker'",
        r"id:\s*'build-api'",
        r"args:.*?- 'build'",
        r"- '-t'.*?\$\{_ARTIFACT_REGISTRY\}.*?/dulce/api:\$\{_GITHUB_SHA\}",
        r"- '-f'.*?apps/api/Dockerfile",
        r"- '\.'"
    ]
    # Scan steps
    scan_agent_pattern = r"name:\s*'aquasec/trivy:latest'.*?id:\s*'scan-agent-runner'.*?args:.*?- 'image'.*?--exit-code.*?1.*?--severity.*?HIGH,CRITICAL.*?\$\{_ARTIFACT_REGISTRY\}.*?/dulce/agent-runner:\$\{_GITHUB_SHA\}"
    scan_api_pattern = r"name:\s*'aquasec/trivy:latest'.*?id:\s*'scan-api'.*?args:.*?- 'image'.*?--exit-code.*?1.*?--severity.*?HIGH,CRITICAL.*?\$\{_ARTIFACT_REGISTRY\}.*?/dulce/api:\$\{_GITHUB_SHA\}"

    if HAVE_YAML:
        data = _safe_yaml_load(text)
        assert isinstance(data, dict), "cloudbuild.yaml should parse to a mapping"
        steps = data.get("steps", [])
        # Define expected steps in order (by id)
        expected_ids = [
            "build-agent-runner",
            "build-api",
            "scan-agent-runner",
            "scan-api",
            "push-agent-runner",
            "push-api",
            # Optionally add deploy steps if needed
        ]
        found_ids = [step.get("id") for step in steps if "id" in step]
        # Check that expected steps appear in order
        idx = 0
        for eid in expected_ids:
            while idx < len(found_ids) and found_ids[idx] != eid:
                idx += 1
            assert idx < len(found_ids), f"Step with id '{eid}' not found in order"
            idx += 1
        # Optionally, check details of each step
        # Example: check build-agent-runner uses correct docker image and args
        build_agent = next((s for s in steps if s.get("id") == "build-agent-runner"), None)
        assert build_agent is not None, "Missing build-agent-runner step"
        assert build_agent.get("name") == "gcr.io/cloud-builders/docker", "build-agent-runner should use docker builder"
        assert "build" in build_agent.get("args", []), "build-agent-runner should have 'build' in args"
        # Repeat for other steps as needed
    else:
        # Fallback: break down checks into simpler regexes or string searches
        # Check for build-agent-runner step
        assert "id: 'build-agent-runner'" in text, "Missing build-agent-runner step"
        assert "name: 'gcr.io/cloud-builders/docker'" in text, "Missing docker builder for build-agent-runner"
        assert "apps/agents/Dockerfile" in text, "Missing Dockerfile path for agent-runner"
        # Check for build-api step
        assert "id: 'build-api'" in text, "Missing build-api step"
        assert "apps/api/Dockerfile" in text, "Missing Dockerfile path for api"
        # Check for scan steps
        assert "id: 'scan-agent-runner'" in text, "Missing scan-agent-runner step"
        assert "id: 'scan-api'" in text, "Missing scan-api step"
        assert "aquasec/trivy:latest" in text, "Missing trivy scan image"
        # Check for push steps
        assert "id: 'push-agent-runner'" in text, "Missing push-agent-runner step"
        assert "id: 'push-api'" in text, "Missing push-api step"
        # Optionally check order by searching for indices
        def find_index(s): return text.find(s)
        ids_in_order = [
            "id: 'build-agent-runner'",
            "id: 'build-api'",
            "id: 'scan-agent-runner'",
            "id: 'scan-api'",
            "id: 'push-agent-runner'",
            "id: 'push-api'",
        ]
        indices = [find_index(s) for s in ids_in_order]
        assert all(i >= 0 for i in indices), "Some expected steps not found"
        assert indices == sorted(indices), "Steps are not in expected order"
    push_agent_pattern = r"id:\s*'push-agent-runner'.*?args:\s*\[\s*'push',\s*'\$\{_ARTIFACT_REGISTRY\}.*?/dulce/agent-runner:\$\{_GITHUB_SHA\}'\s*\]"
    push_api_pattern = r"id:\s*'push-api'.*?args:\s*\[\s*'push',\s*'\$\{_ARTIFACT_REGISTRY\}.*?/dulce/api:\$\{_GITHUB_SHA\}'\s*\]"

    # Deploy steps
    deploy_function_pattern = r"name:\s*'gcr\.io/google\.com/cloudsdktool/cloud-sdk'.*?id:\s*'deploy-cloud-function'.*?args:.*?'functions'.*?'deploy'.*?'event-parser'.*?'--project=\$\{PROJECT_ID\}'.*?'--region=\$\{_GCP_REGION\}'.*?'--trigger-topic=dulce\.agents'.*?'--runtime=nodejs20'.*?'--source=apps/event-parser'.*?'--entry-point=parseAgentEvent'.*?'--service-account=event-parser-sa@\$\{PROJECT_ID\}\.iam\.gserviceaccount\.com'"
    deploy_runner_pattern = r"id:\s*'deploy-agent-runner'.*?args:.*?'run'.*?'deploy'.*?'agent-runner'.*?'--project=\$\{PROJECT_ID\}'.*?'--region=\$\{_GCP_REGION\}'.*?'--image=\$\{_ARTIFACT_REGISTRY\}.*?/dulce/agent-runner:\$\{_GITHUB_SHA\}'.*?'--platform=managed'.*?'--no-allow-unauthenticated'.*?'--service-account=agent-runner-sa@\$\{PROJECT_ID\}\.iam\.gserviceaccount\.com'.*?'--set-env-vars=GCP_PROJECT_ID=\$\{PROJECT_ID\},DULCE_AGENTS_TOPIC=\$\{_DULCE_AGENTS_TOPIC\},DULCE_AGENT_RUNS_TABLE=\$\{_DULCE_AGENT_RUNS_TABLE\}'"
    deploy_api_pattern = r"id:\s*'deploy-api'.*?args:.*?'run'.*?'deploy'.*?'dulce-api'.*?'--project=\$\{PROJECT_ID\}'.*?'--region=\$\{_GCP_REGION\}'.*?'--image=\$\{_ARTIFACT_REGISTRY\}.*?/dulce/api:\$\{_GITHUB_SHA\}'.*?'--platform=managed'.*?'--allow-unauthenticated'"

    for pat in [
        build_agent_pattern, build_api_pattern,
        scan_agent_pattern, scan_api_pattern,
        push_agent_pattern, push_api_pattern,
        deploy_function_pattern, deploy_runner_pattern, deploy_api_pattern
    ]:
        assert re.search(pat, text, flags=re.DOTALL), f"Expected to match pattern: {pat[:60]}..."
    patterns = [
        ("build_agent_pattern", build_agent_pattern),
        ("build_api_pattern", build_api_pattern),
        ("scan_agent_pattern", scan_agent_pattern),
        ("scan_api_pattern", scan_api_pattern),
        ("push_agent_pattern", push_agent_pattern),
        ("push_api_pattern", push_api_pattern),
        ("deploy_function_pattern", deploy_function_pattern),
        ("deploy_runner_pattern", deploy_runner_pattern),
        ("deploy_api_pattern", deploy_api_pattern),
    ]
    for idx, (name, pat) in enumerate(patterns):
        assert re.search(pat, text, flags=re.DOTALL), (
            f"Pattern #{idx+1} '{name}' failed to match.\n"
            f"Pattern: {pat[:80]}...\n"
            f"Text snippet: {text[:200]}..."
        )
    # Enforce logical ordering: build -> scan -> push -> deploy (coarse check via index positions)
    build_agent_idx = re.search(build_agent_pattern, text, flags=re.DOTALL).start()
    build_api_idx = re.search(build_api_pattern, text, flags=re.DOTALL).start()
    scan_agent_idx = re.search(scan_agent_pattern, text, flags=re.DOTALL).start()
    scan_api_idx = re.search(scan_api_pattern, text, flags=re.DOTALL).start()
    push_agent_idx = re.search(push_agent_pattern, text, flags=re.DOTALL).start()
    push_api_idx = re.search(push_api_pattern, text, flags=re.DOTALL).start()
    deploy_fn_idx = re.search(deploy_function_pattern, text, flags=re.DOTALL).start()
    deploy_runner_idx = re.search(deploy_runner_pattern, text, flags=re.DOTALL).start()
    deploy_api_idx = re.search(deploy_api_pattern, text, flags=re.DOTALL).start()

    assert build_agent_idx < scan_agent_idx < push_agent_idx < deploy_runner_idx, "agent-runner steps ordering should be build -> scan -> push -> deploy"
    assert build_api_idx < scan_api_idx < push_api_idx < deploy_api_idx, "api steps ordering should be build -> scan -> push -> deploy"
    assert deploy_fn_idx < deploy_runner_idx or deploy_fn_idx < deploy_api_idx, "function deployment should occur before or alongside service deploys"

def test_substitutions_and_images_sections():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    if HAVE_YAML:
        data = _safe_yaml_load(text)
        subs = data.get("substitutions", {})
        assert subs.get("_ARTIFACT_REGISTRY") == "asia-southeast1-docker.pkg.dev"
        assert subs.get("_GCP_REGION") == "asia-southeast1"
        assert subs.get("_DULCE_AGENTS_TOPIC") == "dulce.agents"
        assert subs.get("_DULCE_AGENT_RUNS_TABLE") == "dulce_agent_runs"

        images = data.get("images", [])
        assert isinstance(images, list) and len(images) >= 2
        assert any("/dulce/agent-runner:${_GITHUB_SHA}" in img for img in images)
        assert any("/dulce/api:${_GITHUB_SHA}" in img for img in images)
    else:
        # Minimal substring presence checks
        required_lines = [
            "_ARTIFACT_REGISTRY: 'asia-southeast1-docker.pkg.dev'",
            "_GCP_REGION: 'asia-southeast1'",
            "_DULCE_AGENTS_TOPIC: 'dulce.agents'",
            "_DULCE_AGENT_RUNS_TABLE: 'dulce_agent_runs'",
            "- '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/agent-runner:${_GITHUB_SHA}'",
            "- '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}'",
        ]
        for line in required_lines:
            assert line in text, f"Missing expected substitution/image line: {line}"

def test_options_section_has_expected_values():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    if HAVE_YAML:
        data = _safe_yaml_load(text)
        opts = data.get("options", {})
        assert opts.get("machineType") == "E2_HIGHCPU_8"
        assert opts.get("logging") == "CLOUD_LOGGING_ONLY"
    else:
        assert "machineType: 'E2_HIGHCPU_8'" in text
        assert "logging: CLOUD_LOGGING_ONLY" in text

def test_no_unauthenticated_for_agent_runner_and_allowed_for_api():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    # Ensure agent-runner has no-allow-unauthenticated
    assert "--no-allow-unauthenticated" in text, "agent-runner should disallow unauthenticated access"
    # Ensure api has allow-unauthenticated
    assert "--allow-unauthenticated" in text, "api should allow unauthenticated access for public endpoints"

def test_service_accounts_and_env_vars_present_for_deployments():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    # Function SA
    assert re.search(r"--service-account=event-parser-sa@\$\{PROJECT_ID\}\.iam\.gserviceaccount\.com", text), "Function SA missing"
    # Agent-runner SA
    assert re.search(r"--service-account=agent-runner-sa@\$\{PROJECT_ID\}\.iam\.gserviceaccount\.com", text), "Agent Runner SA missing"
    # Env vars for agent-runner
    assert "GCP_PROJECT_ID=${PROJECT_ID}" in text
    assert "DULCE_AGENTS_TOPIC=${_DULCE_AGENTS_TOPIC}" in text
    assert "DULCE_AGENT_RUNS_TABLE=${_DULCE_AGENT_RUNS_TABLE}" in text

def test_scans_block_build_on_high_or_critical_vulns():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    # Check both scans have exit code 1 and severity HIGH,CRITICAL
    occurrences = re.findall(r"aquasec/trivy:latest.*?args:.*?--exit-code\s*'\s*1\s*'.*?--severity\s*'\s*HIGH,CRITICAL\s*'", text, flags=re.DOTALL)
    assert len(occurrences) >= 2, "Both images should be scanned with exit-code 1 and severity HIGH,CRITICAL"

def test_build_args_use_github_sha_and_artifact_registry():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    # Verify both build steps tag with ${_GITHUB_SHA} and use ${_ARTIFACT_REGISTRY}
    assert re.search(r"build'.*?- '-t'.*\$\{_ARTIFACT_REGISTRY\}.*agent-runner:\$\{_GITHUB_SHA\}", text, flags=re.DOTALL)
    assert re.search(r"build'.*?- '-t'.*\$\{_ARTIFACT_REGISTRY\}.*api:\$\{_GITHUB_SHA\}", text, flags=re.DOTALL)

def test_deployments_use_correct_images_from_build():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    assert re.search(r"--image=\$\{_ARTIFACT_REGISTRY\}/\$\{PROJECT_ID\}/dulce/agent-runner:\$\{_GITHUB_SHA\}", text)
    assert re.search(r"--image=\$\{_ARTIFACT_REGISTRY\}/\$\{PROJECT_ID\}/dulce/api:\$\{_GITHUB_SHA\}", text)

def test_security_best_practices_flags_present():
    path = _find_cloudbuild_file()
    text = _load_text(path)
    # Ensure platform managed is explicitly set
    assert "--platform=managed" in text
    # Ensure region is templated
    assert "--region=${_GCP_REGION}" in text
    # Ensure project templated
    assert "--project=${PROJECT_ID}" in text