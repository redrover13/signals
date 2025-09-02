/**
 * @fileoverview Search module for the routes component
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
import { escapeRegExp } from 'lodash-es';
import { z } from "zod";

// Input validation schema for search requests
const searchRequestSchema = z.object({
  tool: z.literal("semantic-code-search"),
  query: z.string()
    .min(1, "Query is required")
    .max(200, "Query too long")
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, "Query contains invalid characters"),
  repoOwner: z.string().optional(),
  repoName: z.string().optional(),
});

interface SearchRequest {
  tool: string | undefined;
  query: string | undefined;
  repoOwner?: string;
  repoName?: string;
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

export async function searchRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/semantic-code-search',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const body = request.body as SearchRequest;

        // Validate request body
        const parseResult = searchRequestSchema.safeParse(body);
        if (!parseResult.success) {
          return reply.status(400).send({
            error: parseResult.error.errors.map(e => e.message).join(', ')
          });
        }

        if (!body.tool || body.tool !== 'semantic-code-search') {
          return reply.status(400).send({
            error: "Invalid tool. Expected 'semantic-code-search'"
          });
        }

        const results = await performSemanticSearch(body.query);

        const response: SearchResponse = {
          query: body.query!,
          results,
          totalMatches: results.length,
        };

        return reply.send(response);
      } catch (error: any) {
        fastify.log.error('Search error:', error);
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

  // Terms related to CI/CD
  const ciTerms = [
    'ci', 'continuous integration', 'continuous deployment', 'pipeline', 'workflow',
    'github actions', 'build', 'deploy', 'test', 'lint', 'cloud build', 'docker',
    'container', 'terraform', 'infrastructure', 'deployment', 'automation', 'devops'
  ];

  // If query is about CI or common, search in workflows
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
  ciTerms: string[]
): Promise<SearchResult | null> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const matches: string[] = [];
    let relevance = 0;

    const safeQuery = escapeRegExp(query);
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
          const trimmed = lines[j].trim();
          if (trimmed && !relevantLines.includes(trimmed)) {
            relevantLines.push(trimmed);
          }
        }
      }
    }

    if (relevance > 0) {
      const uniqueMatches = Array.from(new Set(matches));
      return {
        file: path.relative(process.cwd(), filePath),
        content: relevantLines.slice(0, 5).join('\n'),
        relevance,
        matches: uniqueMatches,
      };
    }
    return null;
  } catch {
    return null;
  }
}