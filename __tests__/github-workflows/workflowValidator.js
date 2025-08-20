const yaml = require('yaml');

/**
 * Parse YAML workflow content into a JavaScript value.
 *
 * Safely parses the provided YAML string and returns the resulting JS representation.
 * If the YAML contains parse errors an Error is thrown whose message summarizes the
 * problems and whose `details` property contains the original yaml.Document errors.
 *
 * @param {string} content - YAML document text to parse.
 * @returns {*} The parsed JavaScript representation of the YAML (typically an object).
 * @throws {Error} If the YAML is invalid; the thrown error includes a `details` array of parse errors.
 */
function parseWorkflowYaml(content) {
  const doc = yaml.parseDocument(content);
  if (doc.errors && doc.errors.length) {
    const err = new Error('YAML parse error: ' + doc.errors.map(e => e.message).join('; '));
    err.details = doc.errors;
    throw err;
  }
  return doc.toJSON();
}

/**
 * Validate that a workflow object conforms to the project's expected basic GitHub Actions shape.
 *
 * Performs structural checks and returns a list of human-readable problems found. An empty array
 * indicates the workflow meets the validator's basic expectations.
 *
 * Checks include (non-exhaustive): presence and non-empty workflow.name; top-level permissions.contents === 'read';
 * required triggers under `on` (push.branches array, pull_request.branches array, workflow_dispatch present);
 * concurrency block with a group containing `${{ github.workflow }}` and `cancel-in-progress: true`;
 * presence of required environment keys (NODE_VERSION, PNPM_VERSION, NX_CLOUD_ACCESS_TOKEN, NX_DAEMON, HUSKY);
 * a jobs.setup job with `runs-on: ubuntu-latest`, permissions.contents === 'read', outputs containing
 * `affected-projects` and `has-affected`, and required setup steps (checkout, setup-node, pnpm/action-setup,
 * nrwl/nx-set-shas, and an "Determine affected projects" bash step with id `affected`).
 *
 * @param {object} workflow - Parsed workflow object to validate.
 * @return {string[]} Array of problem messages; empty if no problems were found.
 */
function validateBasicWorkflowShape(workflow) {
  const problems = [];

  // Basic required top-level keys
  if (!workflow || typeof workflow !== 'object') {
    problems.push('Workflow is not an object');
    return problems;
  }

  // name
  if (typeof workflow.name !== 'string' || !workflow.name.trim()) {
    problems.push('Missing or invalid workflow.name');
  }

  // permissions.contents
  if (!workflow.permissions || workflow.permissions.contents !== 'read') {
    problems.push('Missing or invalid permissions.contents (expected read)');
  }

  // on: push, pull_request, workflow_dispatch
  if (!workflow.on || typeof workflow.on !== 'object') {
    problems.push('Missing on block');
  } else {
    if (!workflow.on.push || !Array.isArray(workflow.on.push.branches)) {
      problems.push('Missing on.push.branches');
    }
    if (!workflow.on.pull_request || !Array.isArray(workflow.on.pull_request.branches)) {
      problems.push('Missing on.pull_request.branches');
    }
    if (!('workflow_dispatch' in workflow.on)) {
      problems.push('Missing on.workflow_dispatch');
    }
  }

  // concurrency
  if (!workflow.concurrency || typeof workflow.concurrency !== 'object') {
    problems.push('Missing concurrency block');
  } else {
    if (typeof workflow.concurrency.group !== 'string' || !workflow.concurrency.group.includes('${{ github.workflow }}')) {
      problems.push('Missing or invalid concurrency.group');
    }
    if (workflow.concurrency['cancel-in-progress'] !== true) {
      problems.push('Missing or invalid concurrency.cancel-in-progress (expected true)');
    }
  }

  // env
  const expectedEnv = ['NODE_VERSION', 'PNPM_VERSION', 'NX_CLOUD_ACCESS_TOKEN', 'NX_DAEMON', 'HUSKY'];
  if (!workflow.env || typeof workflow.env !== 'object') {
    problems.push('Missing env block');
  } else {
    for (const key of expectedEnv) {
      if (!(key in workflow.env)) {
        problems.push(`Missing env.${key}`);
      }
    }
  }

  // jobs
  if (!workflow.jobs || typeof workflow.jobs !== 'object') {
    problems.push('Missing jobs block');
  } else {
    // Check "setup" job as described in the snippet
    const setup = workflow.jobs.setup;
    if (!setup || typeof setup !== 'object') {
      problems.push('Missing jobs.setup');
    } else {
      // runs-on ubuntu-latest
      if (setup['runs-on'] !== 'ubuntu-latest') {
        problems.push('jobs.setup.runs-on should be ubuntu-latest');
      }
      // permissions.contents read
      if (!setup.permissions || setup.permissions.contents !== 'read') {
        problems.push('jobs.setup.permissions.contents should be read');
      }
      // outputs placeholders
      if (!setup.outputs || !('affected-projects' in setup.outputs) || !('has-affected' in setup.outputs)) {
        problems.push('jobs.setup.outputs should include affected-projects and has-affected');
      }
      // steps list must include critical actions from the snippet
      if (!Array.isArray(setup.steps)) {
        problems.push('jobs.setup.steps missing or not an array');
      } else {
        const uses = s => s && typeof s.uses === 'string';
        const run = s => s && typeof s.run === 'string';

        const hasCheckout = setup.steps.some(s => uses(s) && s.uses.startsWith('actions/checkout@'));
        const hasSetupNode = setup.steps.some(s => uses(s) && s.uses.startsWith('actions/setup-node@'));
        const hasPnpmSetup = setup.steps.some(s => uses(s) && s.uses.startsWith('pnpm/action-setup@'));
        const hasNxSetShas = setup.steps.some(s => uses(s) && s.uses.startsWith('nrwl/nx-set-shas@'));
        const hasAffectedStep = setup.steps.some(s => s && s.id === 'affected' && s.name && /Determine affected projects/i.test(s.name) && s.shell === 'bash' && run(s));

        if (!hasCheckout) problems.push('jobs.setup.steps missing actions/checkout');
        if (!hasSetupNode) problems.push('jobs.setup.steps missing actions/setup-node');
        if (!hasPnpmSetup) problems.push('jobs.setup.steps missing pnpm/action-setup');
        if (!hasNxSetShas) problems.push('jobs.setup.steps missing nrwl/nx-set-shas');
        if (!hasAffectedStep) problems.push('jobs.setup.steps missing "Determine affected projects" bash run step');
      }
    }
  }

  return problems;
}

/**
 * Count top-level "steps" keys in a workflow object (stray root-level steps not under any job).
 *
 * Performs a shallow check of the workflow object and returns the number of top-level
 * "steps" properties found (0 or 1). This flags invalid GitHub Actions workflows that
 * place `steps` at the root instead of within a job.
 *
 * @param {object} workflow - Parsed workflow object (e.g., result of YAML parse).
 * @return {number} The count of stray top-level `steps` blocks (0 or 1).
 */
function findStrayTopLevelStepsBlocks(workflow) {
  let count = 0;
  if (workflow && typeof workflow === 'object') {
    // Any steps at top-level?
    if ('steps' in workflow) count++;
    // Also check for duplicated/stray keys by shallow scan – if something created multiple steps-like keys,
    // typical YAML parser will collapse duplicates, but we still flag a single top-level occurrence as invalid.
  }
  return count;
}

module.exports = {
  parseWorkflowYaml,
  validateBasicWorkflowShape,
  findStrayTopLevelStepsBlocks,
};