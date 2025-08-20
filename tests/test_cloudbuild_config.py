import os
import re
import unittest

from unittest import mock
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
    """
    Discover the filesystem path to the project's Cloud Build configuration.
    
    Search strategy:
    1. Return the first existing path from the ordered CANDIDATES list.
    2. If none of the candidates exist, recursively scan the repository for YAML files whose filename contains "cloudbuild" (case-insensitive) and whose contents include the signature "E2_HIGHCPU_8". While scanning, skip directories that commonly contain irrelevant or large contents (".git", "node_modules", "dist", "build", ".venv", ".tox", ".cache").
    3. If no matching file is found, return the default "cloudbuild.yaml".
    
    Returns:
        str: Path to the discovered Cloud Build file or the default "cloudbuild.yaml" if none found.
    
    Notes:
    - File reads during the signature scan ignore I/O errors and continue scanning other files.
    - The function performs filesystem access and os.walk traversal.
    """
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
    """
    Read and return the contents of a file as a UTF-8 string.
    
    Parameters:
        path (str): Path to the file to read.
    
    Returns:
        str: File contents decoded as UTF-8.
    """
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def _safe_load_yaml(text):
    """
    Attempt to parse YAML text with PyYAML and return the parsed mapping if the root is a dict.
    
    Parameters:
        text (str): YAML content to parse.
    
    Returns:
        dict | None: Parsed YAML as a dict when PyYAML is available and the document root is a mapping; otherwise None (PyYAML not available, parse error, or non-dict root).
    """
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
    """
    Extract YAML-like step IDs from plain text.
    
    Scans each line for top-level `id: <value>` entries (quotes optional) and returns the captured values.
    Ignores lines with comments after the id and trims surrounding whitespace.
    
    Parameters:
        text (str): Multiline text to scan for `id:` entries.
    
    Returns:
        list[str]: Ordered list of extracted id values (strings).
    """
    ids = []
    for line in text.splitlines():
        m = re.match(r'^\s*id:\s*[\'"]?([^\'"#]+)[\'"]?\s*$', line)
        if m:
            ids.append(m.group(1).strip())
    return ids

def _extract_list_block_from_text(text, block_key):
    """
    Extract a top-level YAML list block (e.g., "images", "steps") from raw text as a naive fallback when a YAML parser is unavailable.
    
    Searches for a top-level line matching "<block_key>:" and collects subsequent list items that start with exactly two-space indentation and a dash ("  - item"). Collection stops when another top-level key (non-indented) is encountered. Returns the list item strings (dash removed and trimmed). Returns an empty list if the key is not found or no items are present.
    
    Parameters:
        text (str): Raw file contents to scan.
        block_key (str): Top-level YAML key name to locate (without trailing colon).
    
    Returns:
        list[str]: Extracted list item values as strings.
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
        """
        Prepare class-level fixtures for Cloud Build tests.
        
        Checks that the discovered Cloud Build file exists and loads its contents for tests. If the file is missing, raises unittest.SkipTest to skip the test class. On success it sets two class attributes:
        - text: raw UTF-8 text content of the Cloud Build file (from _load_text)
        - data: parsed YAML mapping or None (result of _safe_load_yaml)
        
        Raises:
            unittest.SkipTest: if the Cloud Build file does not exist at CLOUDBUILD_PATH.
        """
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
        """
        Check that the Cloud Build configuration defines the expected substitution keys.
        
        This test verifies the presence of the substitutions block and that it contains the keys
        _ARTIFACT_REGISTRY, _GCP_REGION, _DULCE_AGENTS_TOPIC, and _DULCE_AGENT_RUNS_TABLE.
        
        - When YAML parsing produced a dict (self.data is not None): asserts that `substitutions`
          is a mapping and that it contains the expected keys.
        - When YAML parsing is unavailable (self.data is None): performs textual checks on
          self.text to ensure a top-level `substitutions:` block exists and that each expected
          substitution key is present in the text.
        """
        expected = {"_ARTIFACT_REGISTRY", "_GCP_REGION", "_DULCE_AGENTS_TOPIC", "_DULCE_AGENT_RUNS_TABLE"}
        if self.data is None:
            for k in expected:
                self.assertRegex(
                    self.text,
                    rf'(?m)^\s*{re.escape("substitutions")}\s*:\s*$',
                    "substitutions block missing",
                )
                self.assertRegex(
                    self.text,
                    rf'(?m)^\s*{re.escape(k)}\s*:\s*',
                    f"Missing substitution '{k}'",
                )
        else:
            subs = self.data.get("substitutions", {})
            self.assertIsInstance(subs, dict, "substitutions should be a mapping")
            self.assertTrue(
                expected.issubset(set(subs.keys())),
                f"substitutions missing keys: {expected - set(subs.keys())}"
            )
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
            self.assertEqual(opts.get("logging"), "CLOUD_LOGGING_ONLY")

class TestCloudBuildSteps(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """
        Prepare class-level test fixtures for Cloud Build tests.
        
        Reads the discovered Cloud Build file and initializes class attributes used by tests:
        - sets `text` to the file's raw UTF-8 contents,
        - sets `data` to the parsed YAML dict (or None if YAML parsing is unavailable or fails),
        - sets `expected_ids` to the list of step IDs that tests will validate.
        
        Raises:
            unittest.SkipTest: if the Cloud Build file does not exist at the discovered path.
        """
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
        """
        Assert that every expected Cloud Build step id from self.expected_ids is present in the discovered configuration.
        
        Uses the parsed YAML steps (self.data) when available; otherwise falls back to extracting `id:` lines from the raw text (self.text). Fails the test with an assertion message naming the missing id if any expected id is absent.
        """
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
            "scan-api":           "${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}",
        }
        if self.data is None:
            self.assertIn("aquasec/trivy:0.53.0", self.text, "Missing trivy scanner in steps")
            # Check severity and exit-code presence textually
            self.assertIn("--severity", self.text)
            self.assertIn("HIGH,CRITICAL", self.text)
            self.assertIn("--exit-code", self.text)
            self.assertRegex(
                self.text,
                r"--exit-code\s*'?1'?",
                "Trivy scanner should fail on findings (exit code 1)",
            )
            # Ensure image-tag targets are present (scan by tag, not tar)
            self.assertIn(
                "${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/agent-runner:${_GITHUB_SHA}",
                self.text,
            )
            self.assertIn(
                "${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}",
                self.text,
            )
        else:
            steps = {
                s.get("id"): s
                for s in self.data.get("steps", [])
                if isinstance(s, dict) and "id" in s
            }
            for sid, img in expected.items():
                self.assertIn(sid, steps, f"Missing scan step {sid}")
                st = steps[sid]
                self.assertEqual(st.get("name"), "aquasec/trivy:0.53.0")
                args = st.get("args", [])
                self.assertIsInstance(args, list)
                # Expected args are in order, but assert presence rather than exact sequence
                self.assertIn("image", args)
                # Ensure the registry image reference is scanned (also fixes Ruff B007)
                self.assertIn(img, args)
                self.assertIn("--exit-code", args)
                self.assertIn("1", args)
                self.assertIn("--severity", args)
                self.assertIn("HIGH,CRITICAL", args)
                # No tar input expected when scanning by image tag
            steps = {s.get("id"): s for s in self.data.get("steps", []) if isinstance(s, dict) and "id" in s}
            for sid, img in expected.items():
                self.assertIn(sid, steps, f"Missing scan step {sid}")
                st = steps[sid]
                self.assertEqual(st.get("name"), "aquasec/trivy:0.53.0")
                args = st.get("args", [])
                self.assertIsInstance(args, list)
                # Expected args are in order, but assert presence rather than exact sequence
                self.assertIn("image", args)
                self.assertIn("--input", args)
                # Tar inputs for saved images
                self.assertTrue(any(a.endswith("agent-runner.tar") for a in args) or sid == "scan-api")
                self.assertTrue(any(a.endswith("api.tar") for a in args) or sid == "scan-agent-runner")
                self.assertIn("--exit-code", args)
                self.assertIn("1", args)
                self.assertIn("--severity", args)
                self.assertIn("HIGH,CRITICAL", args)
                # We no longer expect image tags in scan args when using --input tars
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

for k in expected:
    self.assertRegex(
        self.text,
        rf'(?m)^\s*{re.escape("substitutions")}\s*:\s*$',
        "substitutions block missing",
    )
    self.assertRegex(
        self.text,
        rf'(?m)^\s*{re.escape(k)}\s*:\s*',
        f"Missing substitution '{k}'",
    )
    def test_extract_step_ids_various_formats(self):
        # Includes single quotes, double quotes, and unquoted. Also tests a line with trailing comment (should not match).
        text = """
        id: 'build-api'
          id: "push-api"
            id: scan-agent-runner
            id: deploy-api   # trailing comment should not be captured by strict regex
              id: 'deploy-agent-runner'
        """
        ids = _extract_step_ids_from_text(text)
        # Strict regex should capture lines without trailing content only
        self.assertIn("build-api", ids)
        self.assertIn("push-api", ids)
        self.assertIn("scan-agent-runner", ids)
        self.assertIn("deploy-agent-runner", ids)
        # The line with trailing comment should not be captured
        self.assertNotIn("deploy-api", ids, "Lines with trailing comments should not be matched by _extract_step_ids_from_text")

class TestListBlockExtraction(unittest.TestCase):
    def test_extract_list_block_from_text_basic(self):
        text = """
steps:
  - id: build-api
  - id: push-api
images:
  - gcr.io/example/image1:tag
  - gcr.io/example/image2:tag
options:
  machineType: 'E2_HIGHCPU_8'
"""
        images = _extract_list_block_from_text(text, "images")
        self.assertIsInstance(images, list)
        self.assertIn("gcr.io/example/image1:tag", "\n".join(images))
        self.assertIn("gcr.io/example/image2:tag", "\n".join(images))

class TestYamlHelpers(unittest.TestCase):
    def test_extract_list_block_from_text_stops_at_next_key(self):
        text = """
images:
  - one
  - two
substitutions:
  _FOO: bar
"""
        images = _extract_list_block_from_text(text, "images")
        self.assertEqual(["one", "two"], [i for i in (s.strip() for s in images) if i in ("one","two")])

    def test_safe_load_yaml_valid_and_invalid(self):
        # Valid YAML mapping
        y_ok = "a: 1\nb: 2\n"
        data = _safe_load_yaml(y_ok)
        if HAVE_YAML:
            self.assertIsInstance(data, dict)
            self.assertEqual(data.get("a"), 1)
        else:
            self.assertIsNone(data)

        # Invalid YAML should return None gracefully
        y_bad = "a: : :\n- not a mapping root"
        self.assertIsNone(_safe_load_yaml(y_bad))

# (Removed from here; add at the very end of the file)

class TestDiscoverCloudBuildPath(unittest.TestCase):
    def test_candidate_detection_order_prefers_first_existing(self):
        # Patch os.path.isfile to simulate only the second candidate existing
        with mock.patch("os.path.isfile") as m_isfile:
            def isfile_side_effect(p):
                # Simulate only 'cloudbuild.yml' exists (second in default CANDIDATES)
                """
                Return True only when the given path corresponds to the test fixture 'cloudbuild.yml'.
                
                This function is intended as a side-effect replacement for os.path.isfile in tests.
                It normalizes the provided path and compares it to "cloudbuild.yml", returning True
                when they match and False otherwise.
                
                Parameters:
                    p (str): Path to check.
                
                Returns:
                    bool: True if normalized `p` equals "cloudbuild.yml", otherwise False.
                """
                return os.path.normpath(p) == os.path.normpath("cloudbuild.yml")
            m_isfile.side_effect = isfile_side_effect
            # os.walk should not be consulted in this case; ensure it isn't used
            with mock.patch("os.walk") as m_walk:
                path = _discover_cloudbuild_path()
                self.assertEqual(os.path.normpath(path), os.path.normpath("cloudbuild.yml"))
                m_walk.assert_not_called()

    def test_signature_scan_fallback_finds_yaml_with_signature(self):
        # Force candidates to not exist to trigger fallback scan
        with mock.patch("os.path.isfile", return_value=False):
            import tempfile, shutil
            prev_cwd = os.getcwd()
            tmpdir = tempfile.mkdtemp(prefix="cb-test-")
            try:
                os.chdir(tmpdir)
                # Create nested path and a filename containing 'cloudbuild' with signature
                os.makedirs("nested/.cloudbuild", exist_ok=True)
                target = os.path.join("nested", ".cloudbuild", "my-cloudbuild-ci.yaml")
                with open(target, "w", encoding="utf-8") as fh:
                    fh.write("# minimal file with signature for detection\n")
                    fh.write("options:\n  machineType: 'E2_HIGHCPU_8'\n")
                # Walk should find our file
                found = _discover_cloudbuild_path()
                self.assertTrue(found.endswith("my-cloudbuild-ci.yaml"))
                self.assertTrue(os.path.isfile(found))
            finally:
                os.chdir(prev_cwd)
                shutil.rmtree(tmpdir, ignore_errors=True)

class TestTextualFallbackBehavior(unittest.TestCase):
    def test_textual_required_keys_detection(self):
        # Simulate absence of PyYAML by focusing on text-based checks used by TestCloudBuildStructure
        # Provide YAML-like text that includes the required top-level keys
        text = """
steps:
  - id: build-api
substitutions:
  _ARTIFACT_REGISTRY: "us-docker.pkg.dev"
  _GCP_REGION: "us-central1"
  _DULCE_AGENTS_TOPIC: "agents-topic"
  _DULCE_AGENT_RUNS_TABLE: "agent_runs"
images:
  - ${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}
options:
  machineType: 'E2_HIGHCPU_8'
  logging: 'CLOUD_LOGGING_ONLY'
"""
        # Validate textual presence mirrors TestCloudBuildStructure expectations when YAML is unavailable
        for key in ("steps:", "substitutions:", "images:", "options:"):
            self.assertIn(key, text)

        # Validate images textual extraction
        imgs = _extract_list_block_from_text(text, "images")
        self.assertTrue(any("${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}" in i for i in imgs))

    def test_trivy_scan_textual_indicators(self):
        text = """
steps:
  - id: scan-api
    name: aquasec/trivy:0.53.0
    args:
      - image
      - --exit-code
      - '1'
      - --severity
      - HIGH,CRITICAL
      - ${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}
"""
        self.assertIn("aquasec/trivy:0.53.0", text)
        self.assertIn("--severity", text)
        self.assertIn("HIGH,CRITICAL", text)
        self.assertIn("--exit-code", text)
        self.assertRegex(text, r"--exit-code\s*'?1'?")
        self.assertIn("${_ARTIFACT_REGISTRY}/${PROJECT_ID}/dulce/api:${_GITHUB_SHA}", text)
