import * as PB from '../../protobuf/server';
import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';

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
  for (let i = 0; i < viewer.guiCustom.__controllers.length; i++) {
    const controller = viewer.guiCustom.__controllers[i];
    if (controller.property === upperedUUID) {
      controller.remove();
      sendSuccess(websocket, commandID, 'success');
      return;
    }
  }

  if (!(upperedUUID in viewer.folderUUIDmap)) {
    sendFailure(websocket, commandID, 'control not found');
    return;
  }
  const folderName = viewer.folderUUIDmap[upperedUUID];
  if (!(folderName in viewer.guiCustom.__folders)) {
    sendFailure(websocket, commandID, 'control not found');
    return;
  }
  const folder = viewer.guiCustom.__folders[folderName];
  viewer.guiCustom.removeFolder(folder);

  sendSuccess(websocket, commandID, 'success');
}
