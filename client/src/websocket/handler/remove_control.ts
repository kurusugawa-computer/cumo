import * as PB from '../../protobuf/server';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';
import { adjustControlPanelWidthFromContent } from './util';

export function handleRemoveControl (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  removeControl: PB.RemoveCustomControl | undefined
) {
  if (removeControl === undefined) {
    sendFailure(websocket, commandID, 'failure to get command');
    return;
  }
  switch (removeControl.Object) {
    case 'all':
      handleRemoveAll(websocket, commandID, viewer);
      break;
    case 'byUuid':
      handleRemoveByUUID(websocket, commandID, viewer, removeControl.byUuid);
      break;
    default:
      break;
  }
  adjustControlPanelWidthFromContent(viewer.gui);
}

function handleRemoveAll (websocket: WebSocket, commandID: string, viewer: PointCloudViewer) {
  for (let i = viewer.guiCustom.__controllers.length - 1; i >= 0; i--) {
    viewer.guiCustom.__controllers[i].remove();
  }
  for (const [, folder] of Object.entries(viewer.guiCustom.__folders)) {
    viewer.guiCustom.removeFolder(folder);
  }

  sendSuccess(websocket, commandID, 'success');
}

function handleRemoveByUUID (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, uuid: string) {
  const upperedUUID = uuid.toUpperCase();
  const gui = viewer.guiRegistry.get(upperedUUID);
  if (gui === undefined) {
    sendFailure(websocket, commandID, 'no such uuid');
    return;
  }
  switch (gui.type) {
    case 'folder':
      if (gui.instance.parent) {
        gui.instance.parent.removeFolder(gui.instance);
      } else { // root folder
        gui.instance.destroy();
      }
      break;
    case 'controller':
      gui.instance.remove();
      break;
    default:
      break;
  }
  viewer.guiRegistry.delete(upperedUUID);

  viewer.gui.updateDisplay();
  sendSuccess(websocket, commandID, 'success');
}
