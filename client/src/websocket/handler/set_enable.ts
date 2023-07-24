import { PointCloudViewer } from '../../viewer';
import { sendSuccess } from '../client_command';

export function handleSetEnable (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, enabled: boolean): void {
  viewer.enabled = enabled;
  viewer.cameraInput.enabled = enabled;
  if (enabled) {
    viewer.spinner.hide();
  } else {
    viewer.cameraInput.checkInputs();
    viewer.render();
    viewer.spinner.show();
  }
  sendSuccess(websocket, commandID, 'success');
}
