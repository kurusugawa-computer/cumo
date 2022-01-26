import { sendCameraPosition, sendCameraRotation, sendCameraTarget } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleCameraPosition (websocket: WebSocket, commandID: string, viewer: PointCloudViewer): void {
  sendCameraPosition(websocket, commandID, viewer.getCameraPosition());
}
export function handleCameraRotation (websocket: WebSocket, commandID: string, viewer: PointCloudViewer): void {
  sendCameraRotation(websocket, commandID, viewer.getCameraRotation().toVector3());
}
export function handleCameraTarget (websocket: WebSocket, commandID: string, viewer: PointCloudViewer): void {
  sendCameraTarget(websocket, commandID, viewer.getCameraTarget());
}
