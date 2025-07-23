import { SocketStream } from '@fastify/websocket';
import { WebSocketEvent } from '@ai-meme-studio/shared-types';

export async function websocketHandler(connection: SocketStream) {
  const { socket } = connection;
  
  console.log('WebSocket client connected');
  
  socket.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);
      
      if (data.type === 'subscribe' && data.memeId) {
        console.log(`Client subscribed to meme updates: ${data.memeId}`);
        
        const response: WebSocketEvent = {
          type: 'progress',
          memeId: data.memeId,
          status: 'pending' as any,
          step: 1,
          data: {}
        };
        
        socket.send(JSON.stringify(response));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  socket.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  socket.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
} 