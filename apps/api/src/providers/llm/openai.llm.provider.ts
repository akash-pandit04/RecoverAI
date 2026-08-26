import { LLMProvider } from './llm.provider';
import { AgentContext, AgentRecommendation } from '../../recovery/agent/agent.types';
import OpenAI from 'openai';
import { SYSTEM_PROMPTS } from '../../config/prompt.config';

export class OpenAILLMProvider implements LLMProvider {
  private openai: any = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('[OpenAILLMProvider] OPENAI_API_KEY is missing. Provider will fail if called.');
    }
  }

  async recommendAction(context: AgentContext): Promise<AgentRecommendation> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured.');
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.RECOVERAI_AGENT_V1 },
        { role: 'user', content: JSON.stringify(context, null, 2) }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        recommended_action: parsed.recommended_action,
        confidence: parsed.confidence,
        reason: parsed.reason,
        customer_message: parsed.customer_message || null
      };
    } catch (e) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON format from OpenAI');
    }
  }
}
