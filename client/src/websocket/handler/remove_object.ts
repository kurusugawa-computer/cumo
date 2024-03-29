import * as PB from '../../protobuf/server';

import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleRemoveObject (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, removeObject: PB.RemoveObject | undefined): void {
  if (removeObject === undefined) {
    sendFailure(websocket, commandID, 'failed to get add_object command');
    return;
  }
  switch (removeObject.Object) {
    case 'all':
      handleRemoveAll(websocket, commandID, viewer);
      break;
    case 'byUuid':
      handleRemoveByUUID(websocket, commandID, viewer, removeObject.byUuid);
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any object');
      break;
  }
}

function handleRemoveAll (websocket: WebSocket, commandID: string, viewer: PointCloudViewer) {
  while (viewer.scene.meshes[0]) {
    viewer.scene.meshes[0].dispose(false, true);
  }

  for (const overlay of viewer.overlays) {
    overlay.dispose();
  }
  viewer.overlays = [];

  viewer.linesets = [];

  sendSuccess(websocket, commandID, 'success');
}

function handleRemoveByUUID (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, uuid: string) {
  const normalizedUUID = uuid.toUpperCase();

  const babylonjsObject = viewer.scene.getNodeByName(normalizedUUID);
  if (babylonjsObject !== null) {
    babylonjsObject.dispose(false, true);
    sendSuccess(websocket, commandID, 'success');
    return;
  }

  for (let i = 0; i < viewer.overlays.length; i++) {
    const overlay = viewer.overlays[i];
    if (overlay.uuid === uuid.toUpperCase()) {
      overlay.dispose();
      viewer.overlays.splice(i, 1);
      sendSuccess(websocket, commandID, 'success');
      return;
    }
  }

  for (let i = 0; i < viewer.linesets.length; i++) {
    const lineset = viewer.linesets[i];
    if (lineset.UUID === normalizedUUID) {
      viewer.linesets.splice(i, 1);
      sendSuccess(websocket, commandID, 'success');
      return;
    }
  }
  sendFailure(websocket, commandID, 'object not found');
}
