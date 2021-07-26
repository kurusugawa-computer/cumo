import { sendSuccess } from '../client_command';

export function handleLogMessage (websocket: WebSocket, commandID: string, message: string): void {
  console.log(message);
  sendSuccess(websocket, commandID, 'success');
}
