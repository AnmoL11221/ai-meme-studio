import { FastifyInstance } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { WebSocketEvent } from '@ai-meme-studio/shared-types';

interface ClientConnection {
  socket: SocketStream['socket'];
  subscribedMemes: Set<string>;
}

export class WebSocketManager {
  private clients: Map<string, ClientConnection> = new Map();
  private fastify?: FastifyInstance;

  initialize(fastify: FastifyInstance): void {
    this.fastify = fastify;
  }

  addClient(clientId: string, connection: SocketStream): void {
    const client: ClientConnection = {
      socket: connection.socket,
      subscribedMemes: new Set()
    };

    this.clients.set(clientId, client);

    connection.socket.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleMessage(clientId, data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    connection.socket.on('close', () => {
      this.clients.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    });

    connection.socket.on('error', (error: Error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.clients.delete(clientId);
    });

    console.log(`Client ${clientId} connected`);
  }

  private handleMessage(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (data.type === 'subscribe' && data.memeId) {
      client.subscribedMemes.add(data.memeId);
      console.log(`Client ${clientId} subscribed to meme ${data.memeId}`);
      
      this.sendToClient(clientId, {
        type: 'progress',
        memeId: data.memeId,
        status: 'pending' as any,
        step: 1
      });
    }

    if (data.type === 'unsubscribe' && data.memeId) {
      client.subscribedMemes.delete(data.memeId);
      console.log(`Client ${clientId} unsubscribed from meme ${data.memeId}`);
    }
  }

  broadcastToMeme(memeId: string, event: WebSocketEvent): void {
    this.clients.forEach((client, clientId) => {
      if (client.subscribedMemes.has(memeId)) {
        this.sendToClient(clientId, event);
      }
    });
  }

  private sendToClient(clientId: string, event: WebSocketEvent): void {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === 1) {
      try {
        client.socket.send(JSON.stringify(event));
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  broadcast(event: WebSocketEvent): void {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, event);
    });
  }

  getConnectedClients(): number {
    return this.clients.size;
  }
} 