/**
 * Agent library — core types & runner skeleton.
 * Not yet wired into the main app flow.
 */

export type Tool = {
  name: string;
  run: (input: any) => Promise<any>;
};

export type AgentConfig = {
  tools: Record<string, Tool>;
  complete: (
    prompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => Promise<string>;
  maxSteps?: number;
};

/**
 * Minimal runner loop — safe placeholder until you integrate ADK/Vertex.
 */
export async function runAgent(task: string, cfg: AgentConfig) {
  const history = [{ role: 'user', content: task }];
  const response = await cfg.complete(task, history);
  return [...history, { role: 'assistant', content: response }];
}
