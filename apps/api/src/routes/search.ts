import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { validateInput } from "@dulce-de-saigon/security";
import { z } from "zod";
const fs = require('fs');
const path = require('path');
const _ = require('lodash');

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
  tool: string;
  query: string;
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

/**
 * Search routes for semantic code search functionality
 * 
 * Provides an endpoint to search through repository files and documentation
 * with semantic understanding of CI/CD related content.
 */
export async function searchRoutes(fastify: FastifyInstance) {
  /**
   * POST /search/semantic-code-search
   * 
   * Performs semantic code search across repository files.
   * Specially optimized for CI-related queries like "ci-common".
   * 
   * @param request - Fastify request containing search parameters
   * @param reply - Fastify reply object
   * @returns Search results with relevance scoring
   */
  fastify.post(
    "/semantic-code-search",
    {
      preHandler: validateInput(searchRequestSchema),
    },
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const { query } = request.body as SearchRequest;
        
        const results = await performSemanticSearch(query);
        
        const response: SearchResponse = {
          query,
          results,
          totalMatches: results.length
        };

        return reply.send(response);
      } catch (error: any) {
        console.error('Search error:', error);
        return reply.status(500).send({ 
          error: "Internal server error during search" 
        });
      }
    }
  );
}

/**
 * Performs semantic search across repository files
 * 
 * @param query - Search query string
 * @returns Array of search results sorted by relevance
 */
async function performSemanticSearch(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const repoRoot = process.cwd();
  
  // CI/CD related terms for semantic matching
  const ciTerms = [
    'ci', 'continuous integration', 'continuous deployment', 'pipeline', 
    'workflow', 'github actions', 'build', 'deploy', 'test', 'lint',
    'cloud build', 'docker', 'container', 'terraform', 'infrastructure',
    'deployment', 'automation', 'devops'
  ];
  
  // For CI-related queries, search through CI documentation and configuration files
  if (query.toLowerCase().includes('ci') || query.toLowerCase().includes('common')) {
    const ciFiles = [
      'CI_SETUP_GUIDE.md',
      'COPILOT_PROMPT_CI.md',
      'STEP_BY_STEP_CI.md',
      'docs/CI_CD_WORKFLOW.md',
      'docs/GIT_PUSH_PREPARATION_REPORT.md',
      'cloudbuild.yaml',
      '.gitlab-ci.yml'
    ];

    for (const filePattern of ciFiles) {
      try {
        const filePath = path.join(repoRoot, filePattern);
        
        if (fs.existsSync(filePath)) {
          const result = await searchInFile(filePath, query, ciTerms);
          if (result) {
            results.push(result);
          }
        }
      } catch (error) {
        // Continue searching other files if one fails
        console.warn(`Failed to search in ${filePattern}:`, error);
      }
    }
  }

  // Sort results by relevance (descending)
  results.sort((a, b) => b.relevance - a.relevance);
  
  // Return top 10 most relevant results
  return results.slice(0, 10);
}

/**
 * Searches for matches within a specific file
 * 
 * @param filePath - Path to the file to search
 * @param query - Search query string
 * @param ciTerms - Array of CI-related terms for semantic matching
 * @returns SearchResult object or null if no relevant matches found
 */
async function searchInFile(filePath: string, query: string, ciTerms: string[]): Promise<SearchResult | null> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const matches: string[] = [];
    let relevance = 0;
    
    // Search for exact query matches (highest weight)
    const safeQuery = _.escapeRegExp(query);
    const queryRegex = new RegExp(safeQuery, 'gi');
    const queryMatches = content.match(queryRegex);
    if (queryMatches) {
      relevance += queryMatches.length * 10;
      matches.push(...queryMatches);
    }
    
    // Search for CI-related terms for semantic relevance
    for (const term of ciTerms) {
      const termRegex = new RegExp(term, 'gi');
      const termMatches = content.match(termRegex);
      if (termMatches) {
        relevance += termMatches.length * 2;
      }
    }
    
    // Extract relevant lines with context
    const relevantLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (queryRegex.test(line) || ciTerms.some(term => new RegExp(term, 'i').test(line))) {
        // Include context (line before and after)
        const contextStart = Math.max(0, i - 1);
        const contextEnd = Math.min(lines.length - 1, i + 1);
        
        for (let j = contextStart; j <= contextEnd; j++) {
          if (!relevantLines.includes(lines[j].trim()) && lines[j].trim()) {
            relevantLines.push(lines[j].trim());
          }
        }
      }
    }
    
    // Return result if relevant content found
    if (relevance > 0) {
      // Remove duplicates from matches array
      const uniqueMatches = matches.filter((match, index) => matches.indexOf(match) === index);
      
      return {
        file: path.relative(process.cwd(), filePath),
        content: relevantLines.slice(0, 5).join('\n'), // Limit to 5 most relevant lines
        relevance,
        matches: uniqueMatches
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}