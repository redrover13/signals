import { gcpAuth } from './gcp-auth';

describe('gcpAuth', () => {
  it('should work', () => {
    expect(gcpAuth()).toEqual('gcp-auth');
  });
});
