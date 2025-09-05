import { dbtModels } from "./dbt-models.js"';

describe('dbtModels', () => {
  it('should work', () => {
    expect(dbtModels()).toEqual('dbt-models');
  });
});
