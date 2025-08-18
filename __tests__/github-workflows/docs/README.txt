These tests parse and validate the GitHub Actions workflow YAML using the "yaml" npm package.
If your project does not currently depend on "yaml", add it as a dev dependency:
  pnpm add --save-dev yaml
Or
  npm install --save-dev yaml
The tests were written with Jest/Vitest-compatible syntax. If you use Vitest, they should run without changes.