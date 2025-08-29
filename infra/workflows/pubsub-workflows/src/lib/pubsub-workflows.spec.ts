import { pubsubWorkflows } from './pubsub-workflows';

describe('pubsubWorkflows', () => {
  it('should work', () => {
    expect(pubsubWorkflows()).toEqual('pubsub-workflows');
  });
});
