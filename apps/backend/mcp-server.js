#!/usr/bin/env node

import readline from 'readline';
import fetch from 'node-fetch';

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

        if (name === 'generateMeme' && result.url) {
          try {
            const imageResponse = await fetch(result.url);
            
            if (!imageResponse.ok) {
              throw new Error(`Image not found: ${imageResponse.status} ${imageResponse.statusText}`);
            }
            
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            const mimeType = imageResponse.headers.get('content-type') || 'image/png';
            
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: message.id,
              result: { 
                content: [
                  { 
                    type: 'text', 
                    text: `🎭 Meme Generated Successfully!\n\n**Concept:** ${result.concept || 'N/A'}\n**Text:** ${result.customText || 'N/A'}\n**Status:** ${result.status}\n\nHere's your meme:` 
                  },
                  { 
                    type: 'image', 
                    image: {
                      data: base64Image,
                      mimeType: mimeType
                    }
                  },
                  {
                    type: 'text',
                    text: `\n**Suggested Captions:**\n${(result.captions || []).map((caption, i) => `${i + 1}. ${caption}`).join('\n')}`
                  }
                ] 
              }
            }));
          } catch (imageError) {
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: message.id,
              result: { 
                content: [
                  { 
                    type: 'text', 
                    text: `🎭 Meme Generated Successfully!\n\n**Concept:** ${result.concept || 'N/A'}\n**Text:** ${result.customText || 'N/A'}\n**Status:** ${result.status}\n\n**Image URL:** ${result.url}\n\n**Note:** The image was generated but couldn't be displayed directly. You can view it at the URL above.\n\n**Suggested Captions:**\n${(result.captions || []).map((caption, i) => `${i + 1}. ${caption}`).join('\n')}` 
                  }
                ] 
              }
            }));
          }
        } else if (name === 'createMemeFromTemplate' && result.url) {
          try {
            const imageResponse = await fetch(result.url);
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            const mimeType = imageResponse.headers.get('content-type') || 'image/png';
            
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: message.id,
              result: { 
                content: [
                  { 
                    type: 'text', 
                    text: `🎨 Template Meme Created!\n\n**Template ID:** ${result.templateId}\n**Top Text:** ${result.topText || 'N/A'}\n**Bottom Text:** ${result.bottomText || 'N/A'}\n**Custom Text:** ${result.customText || 'N/A'}\n\nHere's your meme:` 
                  },
                  { 
                    type: 'image', 
                    image: {
                      data: base64Image,
                      mimeType: mimeType
                    }
                  }
                ] 
              }
            }));
          } catch (imageError) {
            console.log(JSON.stringify({
              jsonrpc: '2.0',
              id: message.id,
              result: { 
                content: [
                  { 
                    type: 'text', 
                    text: `🎨 Template Meme Created!\n\n**Template ID:** ${result.templateId}\n**Top Text:** ${result.topText || 'N/A'}\n**Bottom Text:** ${result.bottomText || 'N/A'}\n**Custom Text:** ${result.customText || 'N/A'}\n\n**Image URL:** ${result.url}` 
                  }
                ] 
              }
            }));
          }
        } else {
          console.log(JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
          }));
        }
      } catch (error) {
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: message.id,
          error: { code: -32603, message: error.message }
        }));
      }
    }
  } catch (error) {
    console.error('MCP Server Error:', error);
  }
}); 