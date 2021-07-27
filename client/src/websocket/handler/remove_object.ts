import * as PB from '../../protobuf/server_pb.js';

import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleRemoveObject (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, removeObject: PB.RemoveObject | undefined): void {
  if (removeObject === undefined) {
    sendFailure(websocket, commandID, 'failed to get add_object command');
    return;
  }
  const objectCase = PB.RemoveObject.ObjectCase;
  switch (removeObject.getObjectCase()) {
    case objectCase.ALL:
      handleRemoveAll(websocket, commandID, viewer);
      break;
    case objectCase.BY_UUID:
      handleRemoveByUUID(websocket, commandID, viewer, removeObject.getByUuid());
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any object');
      break;
  }
}

function handleRemoveAll (websocket: WebSocket, commandID: string, viewer: PointCloudViewer) {
  for (let i = viewer.scene.children.length - 1; i >= 0; i--) {
    viewer.scene.remove(viewer.scene.children[i]);
  }

  for (const overlay of viewer.overlays) {
    overlay.dispose();
  }
  viewer.overlays = [];

  sendSuccess(websocket, commandID, 'success');
}

function handleRemoveByUUID (websocket: WebSocket, commandID: string, viewer: PointCloudViewer, uuid: string) {
  // scene.getObjectById もあるがthree.jsの外で作ったオブジェクトも統一的に扱えるようにUUIDを使う
  const threejsObject = viewer.scene.getObjectByProperty('uuid', uuid.toUpperCase());
  console.log(uuid, threejsObject);
  if (threejsObject !== undefined) {
    viewer.scene.remove(threejsObject);
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
  sendFailure(websocket, commandID, 'object not found');
}
