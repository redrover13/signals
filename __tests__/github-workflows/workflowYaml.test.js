// Note: Assumes Jest-style testing (pnpm test), typical in Node repos.
// If your project uses Vitest, this suite should also run with minimal changes.
const fs = require('fs');
const path = require('path');
const { parseWorkflowYaml, validateBasicWorkflowShape, findStrayTopLevelStepsBlocks } = require('./workflowValidator');

describe('GitHub Workflow YAML - Structure and Content Validation', () => {
  let yamlContent;
  let workflow;

  beforeAll(() => {
    const samplePath = path.join(__dirname, 'workflowYaml.sample.yml');
    yamlContent = fs.readFileSync(samplePath, 'utf8');
    workflow = parseWorkflowYaml(yamlContent);
  });

  test('parses YAML successfully without syntax errors', () => {
    expect(workflow).toBeTruthy();
    expect(typeof workflow).toBe('object');
  });

  test('has required top-level fields and expected values', () => {
    expect(workflow.name).toBe('CI/CD Pipeline');
    expect(workflow.permissions).toBeTruthy();
    expect(workflow.permissions.contents).toBe('read');

    // triggers
    expect(workflow.on).toBeTruthy();
    expect(workflow.on.push).toBeTruthy();
    expect(workflow.on.push.branches).toEqual(expect.arrayContaining(['main', 'develop']));
    expect(workflow.on.pull_request).toBeTruthy();
    expect(workflow.on.pull_request.branches).toEqual(expect.arrayContaining(['main', 'develop']));
    expect('workflow_dispatch' in workflow.on).toBe(true);
  });

  test('concurrency group and cancel-in-progress are set correctly', () => {
    expect(workflow.concurrency).toBeTruthy();
    expect(workflow.concurrency.group).toContain('${{ github.workflow }}');
    expect(workflow.concurrency.group).toContain('${{ github.ref }}');
    expect(workflow.concurrency['cancel-in-progress']).toBe(true);
  });

  test('env includes critical variables with expected names', () => {
    const env = workflow.env || {};
    for (const key of ['NODE_VERSION', 'PNPM_VERSION', 'NX_CLOUD_ACCESS_TOKEN', 'NX_DAEMON', 'HUSKY']) {
      expect(key in env).toBe(true);
    }
    // spot-check likely values/types
    expect(env.NODE_VERSION).toBe(20);
    expect(env.PNPM_VERSION).toBe(9);
    expect(typeof env.NX_DAEMON).toBe('boolean');
  });

  test('setup job exists and is configured for ubuntu-latest with read permissions', () => {
    const setup = workflow.jobs && workflow.jobs.setup;
    expect(setup).toBeTruthy();
    expect(setup['runs-on']).toBe('ubuntu-latest');
    expect(setup.permissions && setup.permissions.contents).toBe('read');
    expect(setup.outputs).toBeTruthy();
    expect('affected-projects' in setup.outputs).toBe(true);
    expect('has-affected' in setup.outputs).toBe(true);
  });

  test('setup job has required steps (checkout, setup-node, pnpm setup, nx-set-shas, affected)', () => {
    const steps = workflow.jobs.setup.steps || [];
    const uses = s => s && typeof s.uses === 'string';
    const run = s => s && typeof s.run === 'string';

    expect(steps.some(s => uses(s) && s.uses.startsWith('actions/checkout@'))).toBe(true);
    expect(steps.some(s => uses(s) && s.uses.startsWith('actions/setup-node@'))).toBe(true);
    expect(steps.some(s => uses(s) && s.uses.startsWith('pnpm/action-setup@'))).toBe(true);
    expect(steps.some(s => uses(s) && s.uses.startsWith('nrwl/nx-set-shas@'))).toBe(true);
    expect(
      steps.some(s => s && s.id === 'affected' && /Determine affected projects/i.test(s.name) && s.shell === 'bash' && run(s))
    ).toBe(true);
  });

  test('basic shape validator reports no problems for expected fields', () => {
    const problems = validateBasicWorkflowShape(workflow);
    // The sample contains additional stray steps at root (invalid). The shape validator focuses on expected fields,
    // so it should not include errors for top-level steps (that is a separate check).
    expect(problems).toEqual([]);
  });

  test('flags presence of stray top-level steps blocks (invalid outside of jobs)', () => {
    const count = findStrayTopLevelStepsBlocks(workflow);
    // The provided snippet contains multiple top-level "steps" blocks.
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

describe('GitHub Workflow YAML - Failure scenarios', () => {
  test('invalid YAML content is rejected with a parse error', () => {
    const badYaml = "name: CI\non: [ push \n"; // malformed
    expect(() => parseWorkflowYaml(badYaml)).toThrow(/YAML parse error/i);
  });

  test('shape validator catches missing required blocks', () => {
    const minimal = { name: '', permissions: {}, on: {}, concurrency: {}, env: {}, jobs: {} };
    const problems = validateBasicWorkflowShape(minimal);
    expect(problems).toEqual(expect.arrayContaining([
      'Missing or invalid workflow.name',
      'Missing or invalid permissions.contents (expected read)',
      'Missing on.push.branches',
      'Missing on.pull_request.branches',
      'Missing on.workflow_dispatch',
      'Missing or invalid concurrency.group',
      'Missing or invalid concurrency.cancel-in-progress (expected true)',
      'Missing env.NODE_VERSION',
      'Missing env.PNPM_VERSION',
      'Missing env.NX_CLOUD_ACCESS_TOKEN',
      'Missing env.NX_DAEMON',
      'Missing env.HUSKY',
      'Missing jobs.setup',
    ]));
  });
});