/**
 * @fileoverview search module for the routes component
 *
 * This file is part of the Dulce de Saigon F&B Data Platform.
 * Contains implementation for TypeScript functionality.
 *
 * @author Dulce de Saigon Engineering
 * @copyright Copyright (c) 2025 Dulce de Saigon
 * @license MIT
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

interface SearchRequest {
  tool: string;
  query: string;
}

interface SearchResult {
  file: string;
  content: string;
  relevance: number;
  matches: string[];
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalMatches: number;
}

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/semantic-code-search',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const body = request.body as SearchRequest;

        if (!body.tool || body.tool !== 'semantic-code-search') {
          return reply.status(400).send({
            error: "Invalid tool. Expected 'semantic-code-search'",
          });
        }

        if (!body.query) {
          return reply.status(400).send({
            error: 'Query parameter is required',
          });
        }

        const results = await performSemanticSearch(body.query);

        const response: SearchResponse = {
          query: body.query,
          results,
          totalMatches: results.length,
        };

        return reply.send(response);
      } catch (_error: any) {
        fastify.log.error('Search error:', _error);
        return reply.status(500).send({
          error: 'Internal server error during search',
        });
      }
    },
  );
}

async function performSemanticSearch(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const repoRoot = process.cwd();

  const ciTerms = [
    'ci',
    'continuous integration',
    'continuous deployment',
    'pipeline',
    'workflow',
    'github actions',
    'build',
    'deploy',
    'test',
    'lint',
    'cloud build',
    'docker',
    'container',
    'terraform',
    'infrastructure',
    'deployment',
    'automation',
    'devops',
  ];

  if (query.toLowerCase().includes('ci') || query.toLowerCase().includes('common')) {
    const workflowsDir = path.join(repoRoot, '.github/workflows');
    if (fs.existsSync(workflowsDir)) {
      const files = fs.readdirSync(workflowsDir);
      for (const file of files) {
        if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          const filePath = path.join(workflowsDir, file);
          const result = await searchInFile(filePath, query, ciTerms);
          if (result) {
            results.push(result);
          }
        }
      }
    }
  }

  results.sort((a, b) => b.relevance - a.relevance);

  return results.slice(0, 10);
}

async function searchInFile(
  filePath: string,
  query: string,
  ciTerms: string[],
): Promise<SearchResult | null> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const matches: string[] = [];
    let relevance = 0;

    const safeQuery = _.escapeRegExp(query);
    const queryRegex = new RegExp(safeQuery, 'gi');
    const queryMatches = content.match(queryRegex);
    if (queryMatches) {
      relevance += queryMatches.length * 10;
      matches.push(...queryMatches);
    }

    for (const term of ciTerms) {
      const termRegex = new RegExp(term, 'gi');
      const termMatches = content.match(termRegex);
      if (termMatches) {
        relevance += termMatches.length * 2;
      }
    }

    const relevantLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (queryRegex.test(line) || ciTerms.some((term) => new RegExp(term, 'i').test(line))) {
        const contextStart = Math.max(0, i - 1);
        const contextEnd = Math.min(lines.length - 1, i + 1);

        for (let j = contextStart; j <= contextEnd; j++) {
          if (!relevantLines.includes(lines[j].trim()) && lines[j].trim()) {
            relevantLines.push(lines[j].trim());
          }
        }
      }
    }

    if (relevance > 0) {
      const uniqueMatches = matches.filter((match, index) => matches.indexOf(match) === index);

      return {
        file: path.relative(process.cwd(), filePath),
        content: relevantLines.slice(0, 5).join('\n'),
        relevance,
        matches: uniqueMatches,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}
