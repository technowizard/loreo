import type { Options } from 'csv-parse/sync';
import { parse } from 'csv-parse/sync';

export function parseCsv(content: string, options?: Options): string[][] {
  return parse(content, {
    trim: true,
    skip_empty_lines: true,
    relax_quotes: true,
    ...options
  });
}

export function parseToObjects(content: string): Record<string, string>[] {
  const records = parse(content, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
    relax_quotes: true
  }) as Record<string, string>[];
  return records;
}

export function parseLine(line: string): string[] {
  const result = parse(line, {
    trim: true,
    relax_quotes: true
  });
  return (result[0] as string[]) || [];
}

export function getColumns(content: string): string[] {
  const records = parse(content, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
    to: 1
  }) as Record<string, string>[];

  if (records.length === 0) {
    return [];
  }
  return Object.keys(records[0] || {});
}
