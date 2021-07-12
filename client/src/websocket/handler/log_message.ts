import { sendSuccess } from '../client_command';

export function handleLogMessage (websocket: WebSocket, commandID: Uint8Array, message: string): void {
  console.log(message);
  sendSuccess(websocket, commandID, 'success');
}
