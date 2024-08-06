import * as PB from '../../protobuf/server';
import { sendSuccess } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleSetConfig (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  config: PB.SetConfig | undefined
) {
  if (!config) {
    throw new Error('failure to get config');
  }
  switch (config.Config) {
    case 'panSpeed':
      {
        const panSpeed = config.panSpeed;
        if (panSpeed) {
          viewer.cameraInput.panSpeed = panSpeed;
        }
      }
      break;
    case 'zoomSpeed':
      {
        const zoomSpeed = config.zoomSpeed;
        if (zoomSpeed) {
          viewer.cameraInput.zoomSpeed = zoomSpeed;
        }
      }
      break;
    case 'rotateSpeed':
      {
        const rotateSpeed = config.rotateSpeed;
        if (rotateSpeed) {
          viewer.cameraInput.rotateSpeed = rotateSpeed;
        }
      }
      break;
    case 'rollSpeed':
      {
        const rollSpeed = config.rollSpeed;
        if (rollSpeed) {
          viewer.cameraInput.rollSpeed = rollSpeed;
        }
      }
      break;
    default:
      throw new Error('unknown config');
  }
  viewer.gui.updateAll();
  sendSuccess(websocket, commandID, 'success');
}
