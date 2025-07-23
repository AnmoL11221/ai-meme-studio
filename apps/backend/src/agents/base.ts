import { AIAgent, AgentRole } from '@ai-meme-studio/shared-types';

export abstract class BaseAIAgent implements AIAgent {
  public readonly name: string;
  public readonly role: AgentRole;

  constructor(name: string, role: AgentRole) {
    this.name = name;
    this.role = role;
  }

  abstract execute(input: any): Promise<any>;

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected logError(error: Error): void {
    console.error(`[${this.name}] Error:`, error.message);
  }
} 