import fs from 'fs';
import csvParse from 'csv-parse/sync';

export function parseManualCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return csvParse.parse(content, { columns: true });
}

export function validateManualData(data: Record<string, unknown>[], schema: string[]): boolean {
  return data.every((row) =>
    schema.every((field) => Object.prototype.hasOwnProperty.call(row, field)),
  );
}
