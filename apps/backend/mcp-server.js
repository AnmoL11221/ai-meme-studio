#!/usr/bin/env node

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);

    if (message.method === 'initialize') {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'ai-meme-studio',
            version: '1.0.0'
          }
        }
      }));
    } else if (message.method === 'tools/list') {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        result: {
          tools: [
            {
              name: 'generateMeme',
              description: 'Generate an AI meme from a concept and description.',
              inputSchema: {
                type: 'object',
                properties: {
                  concept: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['concept', 'description']
              }
            },
            {
              name: 'createMemeFromTemplate',
              description: 'Create a meme from a template with custom text.',
              inputSchema: {
                type: 'object',
                properties: {
                  templateId: { type: 'string' },
                  topText: { type: 'string' },
                  bottomText: { type: 'string' },
                  customText: { type: 'string' }
                },
                required: ['templateId']
              }
            },
            {
              name: 'listTemplates',
              description: 'List available meme templates.',
              inputSchema: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  sort: { type: 'string' }
                }
              }
            }
          ]
        }
      }));
    } else if (message.method === 'tools/call') {
      const { name, arguments: args } = message.params;

      try {
        const response = await fetch(`http://localhost:3001/mcp/invoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: name, arguments: args })
        });

        const result = await response.json();

        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          result: { content: [{ type: 'text', text: JSON.stringify(result) }] }
        }));
      } catch (error) {
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          error: { code: -32603, message: error.message }
        }));
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
}); 