import os
import re
import unittest

# Attempt to import yaml if available; tests will gracefully fallback to textual checks if not.
try:
    import yaml  # type: ignore
    HAVE_YAML = True
except Exception:
    HAVE_YAML = False

# Cloud Build file path detection. This mirrors the shell-side discovery order.
CANDIDATES = [
    "cloudbuild.yaml",
    "cloudbuild.yml",
    ".cloudbuild/cloudbuild.yaml",
    ".cloudbuild/cloudbuild.yml",
    "deploy/cloudbuild.yaml",
    "deploy/cloudbuild.yml",
    "infra/cloudbuild.yaml",
    "infra/cloudbuild.yml",
]

def _discover_cloudbuild_path():
    # Prefer candidates in order
    for p in CANDIDATES:
        if os.path.isfile(p):
            return p
    # As a last resort, try to locate a file containing a unique signature we expect
    signature = "E2_HIGHCPU_8"
    for root, _, files in os.walk(".", topdown=True):
        # Skip large or irrelevant directories
        if any(skip in root for skip in (".git", "node_modules", "dist", "build", ".venv", ".tox", ".cache")):
            continue
        for f in files:
            if f.endswith((".yaml", ".yml")) and "cloudbuild" in f.lower():
                path = os.path.join(root, f)
                try:
                    with open(path, "r", encoding="utf-8") as fh:
                        text = fh.read()
                    if signature in text:
                        return path
                except Exception:
                    pass
    # Default path; tests will provide an explicit failure message if not found
    return "cloudbuild.yaml"

CLOUDBUILD_PATH = _discover_cloudbuild_path()

def _load_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def _safe_load_yaml(text):
    if not HAVE_YAML:
        return None
    try:
        data = yaml.safe_load(text)
        # Cloud Build may be a dict at root
        return data if isinstance(data, dict) else None
    except Exception:
        return None

def _extract_step_ids_from_text(text):
    # Robustly capture ids in YAML like: id: 'build-api' or id: build-api
    ids = []
    for line in text.splitlines():
        m = re.match(r'^\s*id:\s*[\'"]?([^\'"#]+)[\'"]?\s*$', line)
        if m:
            ids.append(m.group(1).strip())
    return ids

def _extract_list_block_from_text(text, block_key):
    """
    Extract a simple YAML top-level list block by key, e.g. images:, steps:, etc. 
    This is a very naive extractor intended as a fallback when PyYAML is unavailable.
    It only inspects indentation 0/2 spaces and dash-started list items.
    """
    lines = text.splitlines()
    collecting = False
    items = []
    for _i, line in enumerate(lines):
        # top-level key
        if re.match(rf'^\s*{re.escape(block_key)}\s*:\s*$', line):
            collecting = True
            # detect next indent level for list items
            continue
        if collecting:
            if re.match(r'^\S', line) and not re.match(r'^\s{2}', line):
                # Next top-level key encountered
                break
            # list item lines: starts with two spaces and a dash
            if re.match(r'^\s{2}-\s*(.+)$', line):
                m = re.match(r'^\s{2}-\s*(.+)$', line)
                if m:
                    items.append(m.group(1).strip())
    return items

class TestCloudBuildConfigPresence(unittest.TestCase):
    def test_cloudbuild_file_exists(self):
        self.assertTrue(
            os.path.isfile(CLOUDBUILD_PATH),
            f"Expected Cloud Build config file at {CLOUDBUILD_PATH}, but it was not found. "
            "If your config is elsewhere, consider renaming to cloudbuild.yaml or adding its path to CANDIDATES.",
        )

class TestCloudBuildStructure(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.path.isfile(CLOUDBUILD_PATH):
            raise unittest.SkipTest(f"Cloud Build file not found at {CLOUDBUILD_PATH}")
        cls.text = _load_text(CLOUDBUILD_PATH)
        cls.data = _safe_load_yaml(cls.text)

    def test_required_top_level_keys(self):
        if self.data is None:
            # Fallback to textual presence checks
            for key in ("steps:", "substitutions:", "images:", "options:"):
                self.assertIn(key, self.text, f"Missing top-level key '{key}' in Cloud Build YAML (textual check)")
        else:
            for key in ("steps", "substitutions", "images", "options"):
                self.assertIn(key, self.data, f"Missing top-level key '{key}' in Cloud Build YAML")

    def test_substitutions_have_expected_keys(self):
        expected = {"_ARTIFACT_REGISTRY", "_GCP_REGION", "_DULCE_AGENTS_TOPIC", "_DULCE_AGENT_RUNS_TABLE"}
        if self.data is None:
            for k in expected:
                self.assertRegex(self.text, rf'^\s*{re.escape("substitutions")}:\s*$', "substitutions block missing")
                self.assertRegex(
                    self.text,
                    rf'^\s*{re.escape(k)}\s*:\s*',
                    f"Missing substitution '{k}'",
                )
        else:
            subs = self.data.get("substitutions", {})
            self.assertIsInstance(subs, dict, "substitutions should be a mapping")
            self.assertTrue(expected.issubset(set(subs.keys())), f"substitutions missing keys: {expected - set(subs.keys())}")

    def test_images_include_expected_references(self):
        expected_suffixes = [
            '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/agent-runner:${_GITHUB_SHA}',
            '${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}',
        ]
        if self.data is None:
            # Fallback list extraction: very naive
            images = _extract_list_block_from_text(self.text, "images")
            concatenated = "\n".join(images)
            for suf in expected_suffixes:
                self.assertIn(suf, concatenated, f"Expected image reference not found: {suf}")
        else:
            images = self.data.get("images", [])
            self.assertIsInstance(images, list, "images should be a list")
            for suf in expected_suffixes:
                self.assertIn(suf, images, f"Expected image reference not found: {suf}")

    def test_options_values(self):
        if self.data is None:
            self.assertIn("machineType: 'E2_HIGHCPU_8'", self.text)
            # logging may be unquoted in YAML; accept either quoted or unquoted
            self.assertRegex(self.text, r'logging:\s*CLOUD_LOGGING_ONLY|logging:\s*\'CLOUD_LOGGING_ONLY\'|logging:\s*"CLOUD_LOGGING_ONLY"')
        else:
            opts = self.data.get("options", {})
            self.assertIsInstance(opts, dict, "options should be a mapping")
            self.assertEqual(opts.get("machineType"), "E2_HIGHCPU_8")
            self.assertIn(opts.get("logging"), ("CLOUD_LOGGING_ONLY", "CLOUD_LOGGING_ONLY"))

class TestCloudBuildSteps(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not os.path.isfile(CLOUDBUILD_PATH):
            raise unittest.SkipTest(f"Cloud Build file not found at {CLOUDBUILD_PATH}")
        cls.text = _load_text(CLOUDBUILD_PATH)
        cls.data = _safe_load_yaml(cls.text)

        # Expected step ids from the diff
        cls.expected_ids = [
            'build-agent-runner',
            'build-api',
            'scan-agent-runner',
            'scan-api',
            'push-agent-runner',
            'push-api',
            'deploy-cloud-function',
            'deploy-agent-runner',
            'deploy-api',
        ]

    def test_all_expected_step_ids_present(self):
        if self.data is None:
            ids = _extract_step_ids_from_text(self.text)
        else:
            steps = self.data.get("steps", [])
            ids = [s.get("id") for s in steps if isinstance(s, dict) and "id" in s]
        for eid in self.expected_ids:
            self.assertIn(eid, ids, f"Missing expected step id: {eid}")

    def test_build_steps_use_docker_and_correct_dockerfiles(self):
        dockerfiles = {
            "build-agent-runner": "apps/agents/Dockerfile",
            "build-api": "apps/api/Dockerfile",
        }
        if self.data is None:
            # Text checks
            for step_id, dockerfile in dockerfiles.items():
                # Ensure step id block includes docker builder name and -f path
                self.assertIn(step_id, self.text, f"Missing build step id: {step_id}")
                # Ensure docker builder is referenced in the file
                self.assertIn("gcr.io/cloud-builders/docker", self.text, "Missing docker builder")
                # Ensure Dockerfile path is referenced
                self.assertIn(dockerfile, self.text, f"Missing Dockerfile path for {step_id}")
                # Ensure '-t' tag is present in args block
                self.assertIn("- '-t'", self.text.replace('"', "'"), "Missing '-t' argument for tagging the image")
        else:
            steps = {s.get("id"): s for s in self.data.get("steps", []) if isinstance(s, dict) and "id" in s}
            for step_id, dockerfile in dockerfiles.items():
                self.assertIn(step_id, steps, f"Missing build step {step_id}")
                step = steps[step_id]
                self.assertEqual(step.get("name"), "gcr.io/cloud-builders/docker")
                args = step.get("args", [])
                self.assertIsInstance(args, list)
                self.assertIn("build", args)
                self.assertIn("-f", args)
                self.assertIn(dockerfile, args)

    def test_scan_steps_use_trivy_with_strict_severity_and_exit_code(self):
        expected = {
            "scan-agent-runner": "${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/agent-runner:${_GITHUB_SHA}",
            "scan-api": "${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}",
        }
        if self.data is None:
            self.assertIn("aquasec/trivy:latest", self.text, "Missing trivy scanner in steps")
            # Check severity and exit-code presence textually
            self.assertIn("--severity", self.text)
            self.assertIn("HIGH,CRITICAL", self.text)
            self.assertIn("--exit-code", self.text)
            self.assertRegex(self.text, r"--exit-code\s*'?1'?", "Trivy scanner should fail on findings (exit code 1)")
            # Ensure image references are present
            for _, img in expected.items():
                self.assertIn(img, self.text)
        else:
            steps = {s.get("id"): s for s in self.data.get("steps", []) if isinstance(s, dict) and "id" in s}
            for sid, img in expected.items():
                self.assertIn(sid, steps, f"Missing scan step {sid}")
                st = steps[sid]
                self.assertEqual(st.get("name"), "aquasec/trivy:latest")
                args = st.get("args", [])
                self.assertIsInstance(args, list)
                # Expected args are in order, but assert presence rather than exact sequence
                self.assertIn("image", args)
                self.assertIn("--exit-code", args)
                self.assertIn("1", args)
                self.assertIn("--severity", args)
                self.assertIn("HIGH,CRITICAL", args)
                self.assertIn(img, args)

    def test_push_steps_present_for_both_images(self):
        expected_push = {
            "push-agent-runner": "${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/agent-runner:${_GITHUB_SHA}",
            "push-api": "${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}",
        }
        if self.data is None:
            for _, img in expected_push.items():
                self.assertIn(img, self.text)
            self.assertIn("args: ['push'", self.text.replace('"', "'"), "Push steps should use 'push' action")
        else:
            steps = {s.get("id"): s for s in self.data.get("steps", []) if isinstance(s, dict) and "id" in s}
            for sid, img in expected_push.items():
                self.assertIn(sid, steps, f"Missing push step {sid}")
                st = steps[sid]
                self.assertEqual(st.get("name"), "gcr.io/cloud-builders/docker")
                self.assertEqual(st.get("args")[0], "push", "Push step must call docker push")
                self.assertEqual(st.get("args")[1], img)

    def test_deploy_cloud_function_step_configuration(self):
        if self.data is None:
            # Text checks that are flexible to quoting styles
            text = self.text
            self.assertIn("deploy-cloud-function", text)
            self.assertIn("functions", text)
            self.assertIn("deploy", text)
            self.assertIn("event-parser", text)
            self.assertRegex(text, r"--runtime\s*[:=]?\s*'?nodejs20'?", "Cloud Function runtime should be nodejs20")
            self.assertRegex(text, r"--entry-point\s*[:=]?\s*'?parseAgentEvent'?", "Entry point should be parseAgentEvent")
            self.assertRegex(text, r"event-parser-sa@.*\.iam\.gserviceaccount\.com", "Service account should be correctly set")
        else:
            steps = {s.get("id"): s for s in self.data.get("steps", []) if isinstance(s, dict) and "id" in s}
            self.assertIn("deploy-cloud-function", steps)
            st = steps["deploy-cloud-function"]
            self.assertEqual(st.get("name"), "gcr.io/google.com/cloudsdktool/cloud-sdk")
            args = st.get("args", [])
            self.assertIsInstance(args, list)
            self.assertIn("functions", args)
            self.assertIn("deploy", args)
            self.assertIn("event-parser", args)
            self.assertIn("--runtime=nodejs20", args)
            self.assertIn("--entry-point=parseAgentEvent", args)
            # Ensure service account param is present
            self.assertTrue(any(a.startswith("--service-account=") and "event-parser-sa@" in a for a in args))

    def test_deploy_agent_runner_and_api_configs(self):
        if self.data is None:
            text = self.text
            self.assertIn("deploy-agent-runner", text)
            self.assertIn("--no-allow-unauthenticated", text, "agent-runner should not allow unauthenticated")
            self.assertRegex(text, r"DULCE_AGENTS_TOPIC=\$\{_DULCE_AGENTS_TOPIC\}", "ENV var for agents topic missing")
            self.assertRegex(text, r"DULCE_AGENT_RUNS_TABLE=\$\{_DULCE_AGENT_RUNS_TABLE\}", "ENV var for runs table missing")

            self.assertIn("deploy-api", text)
            self.assertIn("--allow-unauthenticated", text, "dulce-api should allow unauthenticated")
        else:
            steps = {s.get("id"): s for s in self.data.get("steps", []) if isinstance(s, dict) and "id" in s}

            # agent-runner
            self.assertIn("deploy-agent-runner", steps)
            st = steps["deploy-agent-runner"]
            self.assertEqual(st.get("name"), "gcr.io/google.com/cloudsdktool/cloud-sdk")
            args = st.get("args", [])
            self.assertIn("run", args)
            self.assertIn("deploy", args)
            self.assertIn("agent-runner", args)
            self.assertIn("--no-allow-unauthenticated", args)
            # Environment variables are set as a single argument with comma-separated values
            env_arg = next((a for a in args if a.startswith("--set-env-vars=")), None)
            self.assertIsNotNone(env_arg, "Missing --set-env-vars for agent-runner")
            self.assertIn("GCP_PROJECT_ID=${PROJECT_ID}", env_arg)
            self.assertIn("DULCE_AGENTS_TOPIC=${_DULCE_AGENTS_TOPIC}", env_arg)
            self.assertIn("DULCE_AGENT_RUNS_TABLE=${_DULCE_AGENT_RUNS_TABLE}", env_arg)

            # api
            self.assertIn("deploy-api", steps)
            st_api = steps["deploy-api"]
            self.assertEqual(st_api.get("name"), "gcr.io/google.com/cloudsdktool/cloud-sdk")
            args_api = st_api.get("args", [])
            self.assertIn("run", args_api)
            self.assertIn("deploy", args_api)
            self.assertIn("dulce-api", args_api)
            self.assertIn("--allow-unauthenticated", args_api)

if __name__ == "__main__":
    unittest.main()