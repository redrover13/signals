import json
import os
import glob
import unittest

"""
Test suite for validating the NX project configuration for the 'web' application.

Testing framework:
- Primary: unittest (Python standard library)
- Compatible with pytest: Yes, pytest will collect and run these unittest tests if pytest is used in the repo.

Focus:
- Validate the structure and critical values described in the PR diff for the 'web' project's project.json.
- Cover presence of required keys, correct executor values, output paths, default configurations, and lint patterns.
"""

def find_web_project_json():
    """
    Locate the NX "web" application's project.json and return its absolute path.
    
    Search order:
    1. If "apps/web/project.json" exists, return it.
    2. Otherwise, scan the repository for files named "project.json" and select files that appear to describe the web app. A file is considered a candidate if any of the following are true:
       - its top-level "name" is "web",
       - its "sourceRoot" is "apps/web",
       - it has both a "build" target with executor "@nx/next:build" and a "serve" target with executor "@nx/next:server".
    
    Selection:
    - If multiple candidates are found, the function returns the candidate with the shortest path (prefers canonical locations like apps/web/project.json).
    
    Returns:
        str: Absolute path to the located project.json.
    
    Raises:
        FileNotFoundError: If no suitable project.json can be found.
    """
    candidates = []
    # Direct expected path
    direct_path = os.path.join("apps", "web", "project.json")
    if os.path.isfile(direct_path):
        return os.path.abspath(direct_path)

    # Fallback: search across repo
    for path in glob.glob("**/project.json", recursive=True):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue

        # Basic checks to identify the 'web' project
        name = data.get("name")
        source_root = data.get("sourceRoot")
        targets = data.get("targets") or {}
        build = targets.get("build") or {}
        serve = targets.get("serve") or {}
        is_web_name = name == "web"
        is_web_source = source_root == "apps/web"
        has_next_build = (build.get("executor") == "@nx/next:build")
        has_next_server = (serve.get("executor") == "@nx/next:server")

        if is_web_name or is_web_source or (has_next_build and has_next_server):
            candidates.append(path)

    if not candidates:
        raise FileNotFoundError("Could not locate the 'web' project's project.json (looked for apps/web/project.json or matching indicators).")
    # Choose the shortest path as the likely canonical location (apps/web/project.json typically shorter)
    best = sorted(candidates, key=lambda p: (len(p.split(os.sep)), len(p)))[0]
    return os.path.abspath(best)


class TestWebProjectJson(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """
        Initialize class-wide test fixtures by locating the web project's project.json and loading its JSON content.
        
        Sets:
            project_json_path (str): Absolute path to the located apps/web project.json.
            data (dict): Parsed JSON content of the project.json.
        
        Raises:
            FileNotFoundError: If no candidate project.json can be found by find_web_project_json().
            json.JSONDecodeError: If the located file is not valid JSON.
            OSError: If the file cannot be opened.
        """
        cls.project_json_path = find_web_project_json()
        with open(cls.project_json_path, "r", encoding="utf-8") as f:
            cls.data = json.load(f)

    def test_top_level_keys_and_basic_types(self):
        data = self.data
        # Required keys
        for key in ["name", "$schema", "projectType", "sourceRoot", "tags", "targets"]:
            self.assertIn(key, data, f"Missing required top-level key: {key}")

        # Basic values
        self.assertEqual(data["name"], "web", "Project 'name' should be 'web'")
        self.assertIsInstance(data["$schema"], str)
        self.assertTrue(data["$schema"].endswith("project-schema.json"), "The $schema value should end with 'project-schema.json'")
        self.assertEqual(data["projectType"], "application")
        self.assertEqual(data["sourceRoot"], "apps/web")
        self.assertIsInstance(data["tags"], list)

        # $schema should reference nx's project schema
        self.assertIn("nx/schemas/project-schema.json", data["$schema"])

    def test_build_target_configuration(self):
        """
        Verify the `build` target in project.json is correctly configured for the web app.
        
        Asserts:
        - The build executor is "@nx/next:build".
        - `outputs` exists and includes "{options.outputPath}".
        - `defaultConfiguration` is "production".
        - `options.outputPath` equals "dist/apps/web".
        - `configurations` contains "development" and "production" with:
          - development.outputPath == "dist/apps/web-development"
          - production.outputPath == "dist/apps/web-production"
        """
        build = self.data["targets"]["build"]
        # Executor and basic settings
        self.assertEqual(build.get("executor"), "@nx/next:build")
        self.assertIn("outputs", build)
        self.assertIn("{options.outputPath}", build["outputs"], "outputs should include '{options.outputPath}'")
        self.assertEqual(build.get("defaultConfiguration"), "production")

        # Options
        options = build.get("options") or {}
        self.assertEqual(options.get("outputPath"), "dist/apps/web")

        # Configurations
        configs = build.get("configurations") or {}
        self.assertIn("development", configs)
        self.assertIn("production", configs)

        dev = configs["development"]
        prod = configs["production"]
        self.assertEqual(dev.get("outputPath"), "dist/apps/web-development")
        self.assertEqual(prod.get("outputPath"), "dist/apps/web-production")

    def test_serve_target_configuration(self):
        serve = self.data["targets"]["serve"]
        self.assertEqual(serve.get("executor"), "@nx/next:server")
        self.assertEqual(serve.get("defaultConfiguration"), "development")

        options = serve.get("options") or {}
        self.assertEqual(options.get("buildTarget"), "web:build")
        self.assertIs(options.get("dev"), True)

        configs = serve.get("configurations") or {}
        self.assertIn("development", configs)
        self.assertIn("production", configs)

        dev = configs["development"]
        self.assertEqual(dev.get("buildTarget"), "web:build:development")
        self.assertIs(dev.get("dev"), True)

        prod = configs["production"]
        self.assertEqual(prod.get("buildTarget"), "web:build:production")
        self.assertIs(prod.get("dev"), False)

    def test_lint_target_configuration(self):
        lint = self.data["targets"]["lint"]
        self.assertEqual(lint.get("executor"), "@nx/linter:eslint")

        self.assertIn("outputs", lint)
        self.assertIn("{options.outputFile}", lint["outputs"], "outputs should include '{options.outputFile}'")

        options = lint.get("options") or {}
        patterns = options.get("lintFilePatterns") or []
        self.assertTrue(any(p == "apps/web/**/*.{ts,tsx,js,jsx}" for p in patterns),
                        "lintFilePatterns should include 'apps/web/**/*.{ts,tsx,js,jsx}'")

    def test_no_empty_targets(self):
        # Ensure target sections contain content and aren't empty dicts
        """
        Verify that the "build", "serve", and "lint" targets exist in the project.json, are mappings (dicts), and are not empty.
        
        This test asserts each required target is present under `targets`, has type `dict`, and contains at least one key (i.e., is not an empty dictionary).
        """
        targets = self.data["targets"]
        for key in ["build", "serve", "lint"]:
            self.assertIn(key, targets, f"Missing target: {key}")
            self.assertIsInstance(targets[key], dict)
            self.assertTrue(len(targets[key]) > 0, f"Target '{key}' should not be empty")

    def test_json_is_valid_and_not_extraordinary_large(self):
        # Sanity checks for validity and size (guardrails)
        self.assertTrue(isinstance(self.data, dict))
        # Guardrail to avoid accidental massive files
        size_bytes = os.path.getsize(self.project_json_path)
        self.assertLess(size_bytes, 1024 * 1024, "project.json should be under 1MB")

    def test_required_relationships(self):
        """
        Relationship checks:
        - build.outputs references {options.outputPath}, and options.outputPath exists
        - serve.options.buildTarget references 'web:build', and build target exists
        """
        build = self.data["targets"]["build"]
        # {options.outputPath} present and options.outputPath defined
        outputs = build.get("outputs") or []
        self.assertIn("{options.outputPath}", outputs)
        self.assertIn("options", build)
        self.assertIn("outputPath", build["options"])

        serve = self.data["targets"]["serve"]
        self.assertIn("options", serve)
        self.assertEqual(serve["options"].get("buildTarget"), "web:build")
        self.assertIn("build", self.data["targets"], "serve references build target that must exist")


if __name__ == "__main__":
    unittest.main()