import { PointCloudViewer } from '../../viewer';
import { sendSuccess } from '../client_command';

export function handleSetEnable (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, enabled: boolean): void {
  viewer.enabled = enabled;
  viewer.controls.enabled = enabled;
  if (enabled) {
    viewer.spinner.hide();
  } else {
    viewer.controls.update();
    viewer.render();
    viewer.spinner.show();
  }
  sendSuccess(websocket, commandID, 'success');
}
