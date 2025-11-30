import Cerebras from '@cerebras/cerebras_cloud_sdk/index.mjs';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatOptions {
    temperature?: number;
    maxTokens?: number;
}

class CerebrasLoadBalancer {
    private apiKeys: string[];
    private currentKeyIndex: number = 0;

    constructor() {
        this.apiKeys = [
            process.env.CEREBRAS_API_KEY_1,
            process.env.CEREBRAS_API_KEY_2,
            process.env.CEREBRAS_API_KEY_3,
            process.env.CEREBRAS_API_KEY_4,
            process.env.CEREBRAS_API_KEY_5,
            process.env.CEREBRAS_API_KEY_6,
            process.env.CEREBRAS_API_KEY_7,
            process.env.CEREBRAS_API_KEY_8,
        ].filter((key): key is string => typeof key === 'string' && key.startsWith('csk-'));
    }

    private getNextKey(): string {
        if (this.apiKeys.length === 0) {
            throw new Error('No valid Cerebras API keys found. Keys must start with "csk-"');
        }
        const key = this.apiKeys[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        return key;
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<string> {
        const apiKey = this.getNextKey();
        const client = new Cerebras({ apiKey });

        const formattedMessages = messages.map((msg) => {
            if (msg.role === 'system') return { role: 'system' as const, content: msg.content };
            if (msg.role === 'user') return { role: 'user' as const, content: msg.content };
            return { role: 'assistant' as const, content: msg.content };
        });

        const response = await client.chat.completions.create({
            messages: formattedMessages,
            model: 'qwen-3-235b-a22b-instruct-2507',
            stream: false,
            max_completion_tokens: options?.maxTokens || 4096,
            temperature: options?.temperature || 0.6,
            top_p: 0.95,
        });

        const completion = response as { choices: Array<{ message?: { content?: string } }> };
        return completion.choices[0]?.message?.content || '';
    }
}

export const cerebras = new CerebrasLoadBalancer();
