const yaml = require('yaml');

/**
 * parseWorkflowYaml: Parses YAML content safely and returns JS object.
 * Throws on invalid YAML.
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
 * validateBasicWorkflowShape: Returns an array of strings describing problems found.
 * If empty array, the workflow meets our basic expectations.
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
 * findStrayTopLevelStepsBlocks: returns the count of top-level "steps" keys not under a job.
 * The GitHub Actions schema expects "steps" under a job; root-level steps are invalid.
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