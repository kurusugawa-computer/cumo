import * as DAT from 'dat.gui';
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
  const gui = viewer.UUIDToGUI[upperedUUID];
  if (gui instanceof DAT.GUIController) {
    gui.remove();
  } else if (gui instanceof DAT.GUI) {
    viewer.guiCustom.removeFolder(gui);
  } else {
    sendFailure(websocket, commandID, 'failure to get control');
    return;
  }
  delete viewer.UUIDToGUI[upperedUUID];
  sendSuccess(websocket, commandID, 'success');
}
