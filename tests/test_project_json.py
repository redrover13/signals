import json
import os
import copy
import pathlib
import typing as t

# Testing library and framework:
# Using pytest-style tests (function-based, test_ prefix) without new dependencies.
# These tests align with common Python testing conventions found in many repos.

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
# Prefer apps/web/project.json but allow override via env for flexibility in CI.
DEFAULT_PROJECT_JSON = os.environ.get("WEB_PROJECT_JSON_PATH", "apps/web/project.json")

def load_json(path: str) -> t.Dict[str, t.Any]:
    """Load JSON from the given path with a clear error if missing or invalid."""
    full = REPO_ROOT / path
    if not full.exists():
        raise FileNotFoundError(f"project.json not found at expected path: {full}")
    try:
        with full.open("r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise AssertionError(f"Invalid JSON in {full}: {e}") from e

def validate_core(cfg: dict) -> None:
    assert isinstance(cfg, dict), "Top-level config must be a JSON object"
    assert cfg.get("name") == "web", f'Expected name "web", got: {cfg.get("name")}'
    schema = cfg.get("$schema")
    assert isinstance(schema, str) and schema.endswith("nx/schemas/project-schema.json"), \
        f'Expected $schema to reference nx project-schema.json, got: {schema}'
    assert cfg.get("projectType") == "application", f'Expected projectType "application", got: {cfg.get("projectType")}'
    assert cfg.get("name") == PROJECT_NAME, f'Expected name "{PROJECT_NAME}", got: {cfg.get("name")}'
    schema = cfg.get("$schema")
    assert isinstance(schema, str) and schema.endswith("nx/schemas/project-schema.json"), \
        f'Expected $schema to reference nx project-schema.json, got: {schema}'
    assert cfg.get("projectType") == "application", f'Expected projectType "application", got: {cfg.get("projectType")}'
    assert cfg.get("sourceRoot") == f"apps/{PROJECT_NAME}", f'Expected sourceRoot "apps/{PROJECT_NAME}", got: {cfg.get("sourceRoot")}'
    tags = cfg.get("tags")
    assert isinstance(tags, list), f"tags should be an array, got: {type(tags).__name__}"

def validate_build_target(build: dict) -> None:
    assert build.get("executor") == "@nx/next:build", f'build.executor must be "@nx/next:build", got: {build.get("executor")}'
    outputs = build.get("outputs")
    assert isinstance(outputs, list) and "{options.outputPath}" in outputs, \
        f'build.outputs must include "{{options.outputPath}}", got: {outputs}'
    assert build.get("defaultConfiguration") == "production", \
        f'build.defaultConfiguration must be "production", got: {build.get("defaultConfiguration")}'
    options = build.get("options")
    assert isinstance(options, dict), "build.options must be an object"
    assert options.get("outputPath") == "dist/apps/web", \
        f'build.options.outputPath must be "dist/apps/web", got: {options.get("outputPath")}'
    conf = build.get("configurations")
    assert isinstance(conf, dict), "build.configurations must be an object"
    dev = conf.get("development", {})
    prod = conf.get("production", {})
    assert dev.get("outputPath") == "dist/apps/web-development", \
        f'development.outputPath must be "dist/apps/web-development", got: {dev.get("outputPath")}'
    assert prod.get("outputPath") == "dist/apps/web-production", \
        f'production.outputPath must be "dist/apps/web-production", got: {prod.get("outputPath")}'

def validate_serve_target(serve: dict) -> None:
    assert serve.get("executor") == "@nx/next:server", f'serve.executor must be "@nx/next:server", got: {serve.get("executor")}'
    assert serve.get("defaultConfiguration") == "development", \
        f'serve.defaultConfiguration must be "development", got: {serve.get("defaultConfiguration")}'
    options = serve.get("options")
    assert isinstance(options, dict), "serve.options must be an object"
    assert options.get("buildTarget") == "web:build", f'options.buildTarget must be "web:build", got: {options.get("buildTarget")}'
    assert options.get("dev") is True, f'options.dev must be true, got: {options.get("dev")}'
    conf = serve.get("configurations")
    assert isinstance(conf, dict), "serve.configurations must be an object"
    dev = conf.get("development", {})
    prod = conf.get("production", {})
    assert dev.get("buildTarget") == "web:build:development", \
        f'development.buildTarget must be "web:build:development", got: {dev.get("buildTarget")}'
    assert dev.get("dev") is True, f'development.dev must be true, got: {dev.get("dev")}'
    assert prod.get("buildTarget") == "web:build:production", \
        f'production.buildTarget must be "web:build:production", got: {prod.get("buildTarget")}'
    assert prod.get("dev") is False, f'production.dev must be false, got: {prod.get("dev")}'

def validate_lint_target(lint: dict) -> None:
    assert lint.get("executor") == "@nx/linter:eslint", \
        f'lint.executor must be "@nx/linter:eslint", got: {lint.get("executor")}'
    outputs = lint.get("outputs")
    assert isinstance(outputs, list) and "{options.outputFile}" in outputs, \
        f'lint.outputs must include "{{options.outputFile}}", got: {outputs}'
    options = lint.get("options")
    assert isinstance(options, dict), "lint.options must be an object"
    patterns = options.get("lintFilePatterns")
    assert isinstance(patterns, list) and any(p == "apps/web/**/*.{ts,tsx,js,jsx}" for p in patterns), \
    assert isinstance(patterns, list) and any(p == LINT_FILE_PATTERN for p in patterns), \
        f'lint.options.lintFilePatterns must include "{LINT_FILE_PATTERN}", got: {patterns}'

def validate_targets(cfg: dict) -> None:
    targets = cfg.get("targets")
    assert isinstance(targets, dict), "targets must be an object"
    for key in ("build", "serve", "lint"):
        assert key in targets, f'missing required target: "{key}"'
    validate_build_target(targets["build"])
    validate_serve_target(targets["serve"])
    validate_lint_target(targets["lint"])

def test_project_json_exists_and_is_valid_json():
    path = os.environ.get("WEB_PROJECT_JSON_PATH", DEFAULT_PROJECT_JSON)
    full = REPO_ROOT / path
    assert full.exists(), f"Expected JSON file at {full}, but it does not exist"
    # Ensure it's valid JSON
    with full.open("r", encoding="utf-8") as f:
        json.load(f)

def test_project_json_core_and_targets_structure():
    cfg = load_json(os.environ.get("WEB_PROJECT_JSON_PATH", DEFAULT_PROJECT_JSON))
    validate_core(cfg)
    validate_targets(cfg)

def test_build_output_paths_are_consistent():
    cfg = load_json(os.environ.get("WEB_PROJECT_JSON_PATH", DEFAULT_PROJECT_JSON))
    targets = cfg["targets"]
    build = targets["build"]
    base_out = build["options"]["outputPath"]
    dev_out = build["configurations"]["development"]["outputPath"]
    prod_out = build["configurations"]["production"]["outputPath"]
    # Ensure base path is a prefix of env-specific outputs (convention in provided diff)
    assert base_out.startswith("dist/apps/web"), f"Unexpected base outputPath: {base_out}"
    assert dev_out.startswith("dist/apps/web-"), f"Unexpected dev outputPath: {dev_out}"
    assert prod_out.startswith("dist/apps/web-"), f"Unexpected prod outputPath: {prod_out}"
    assert dev_out != prod_out, "Dev and prod outputPath should differ"

def test_serve_dev_and_prod_flags_and_targets():
    cfg = load_json(os.environ.get("WEB_PROJECT_JSON_PATH", DEFAULT_PROJECT_JSON))
    serve = cfg["targets"]["serve"]
    dev = serve["configurations"]["development"]
    prod = serve["configurations"]["production"]
    assert dev["dev"] is True, "dev configuration should enable dev mode"
    assert prod["dev"] is False, "prod configuration should disable prod mode"
    # Ensure build targets chain to the build target with appropriate configuration
    assert dev["buildTarget"].endswith(":development"), "serve.development must use build:development"
    assert prod["buildTarget"].endswith(":production"), "serve.production must use build:production"

def test_lint_patterns_include_ts_tsx_js_jsx_under_apps_web():
    cfg = load_json(os.environ.get("WEB_PROJECT_JSON_PATH", DEFAULT_PROJECT_JSON))
    patterns = cfg["targets"]["lint"]["options"]["lintFilePatterns"]
    want = "apps/web/**/*.{ts,tsx,js,jsx}"
    assert any(p == want for p in patterns), f"Expected lint patterns to include: {want}, got: {patterns}"

# Negative and edge case validations by mutating a loaded, valid config in-memory.

def test_missing_build_target_fails_validation():
    cfg = load_json(os.environ.get("WEB_PROJECT_JSON_PATH", DEFAULT_PROJECT_JSON))
    bad = copy.deepcopy(cfg)
    bad["targets"].pop("build", None)
    try:
        validate_targets(bad)
        raise AssertionError("Expected validation to fail when build target is missing")
    except AssertionError as e:
        assert 'missing required target: "build"' in str(e)

def test_wrong_executor_values_are_caught():
    cfg = load_json(os.environ.get("WEB_PROJECT_JSON_PATH", DEFAULT_PROJECT_JSON))
    bad_build = copy.deepcopy(cfg)
    bad_build["targets"]["build"]["executor"] = "wrong:executor"
    try:
        validate_build_target(bad_build["targets"]["build"])
        raise AssertionError("Expected build executor validation to fail")
    except AssertionError as e:
        assert "@nx/next:build" in str(e)

    bad_serve = copy.deepcopy(cfg)
    bad_serve["targets"]["serve"]["executor"] = "wrong:executor"
    try:
        validate_serve_target(bad_serve["targets"]["serve"])
        raise AssertionError("Expected serve executor validation to fail")
    except AssertionError as e:
        assert "@nx/next:server" in str(e)