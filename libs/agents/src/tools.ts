import { query as bqQuery, insertRows } from "@dulce/gcp";
import { uploadString } from "@dulce/gcp";

export const tools = {
  "bq.query": {
    name: "bq.query",
    description: "Run a BigQuery SQL query. Input: { sql: string, params?: object }",
    run: async (input: any) => {
      const rows = await bqQuery(input.sql, input.params);
      return { rows };
    }
  },
  "bq.insert": {
    name: "bq.insert",
    description: "Insert rows into a BigQuery table. Input: { table: string, rows: any[] }",
    run: async (input: any) => {
      await insertRows(input.table, input.rows);
      return { ok: true };
    }
  },
  "storage.uploadString": {
    name: "storage.uploadString",
    description: "Upload a string to Cloud Storage. Input: { path: string, contents: string, contentType?: string }",
    run: async (input: any) => {
      const uri = await uploadString(input.path, input.contents, input.contentType);
      return { uri };
    }
  }
} as const;
export type DefaultToolName = keyof typeof tools;
