import { buildTools } from "./build-tools.js"';

describe('buildTools', () => {
  it('should work', () => {
    expect(buildTools()).toEqual('build-tools');
  });
});
