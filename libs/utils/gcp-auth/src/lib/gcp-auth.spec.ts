import { gcpAuth } from "./gcp-auth.js"';

describe('gcpAuth', () => {
  it('should work', () => {
    expect(gcpAuth()).toEqual('gcp-auth');
  });
});
