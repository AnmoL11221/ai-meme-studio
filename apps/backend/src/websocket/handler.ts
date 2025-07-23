import { SocketStream } from '@fastify/websocket';
import { WebSocketManager } from './manager.js';
import { v4 as uuidv4 } from 'uuid';

const wsManager = new WebSocketManager();

export async function websocketHandler(connection: SocketStream) {
  const clientId = uuidv4();
  wsManager.addClient(clientId, connection);
}

export { wsManager }; 