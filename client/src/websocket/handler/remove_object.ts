import * as PB from '../../protobuf/server_pb.js';

import { sendSuccess, sendFailure } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleRemoveObject (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer, removeObject: PB.RemoveObject | undefined): void {
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
      console.error('unimplemented');
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any object');
      break;
  }
}

export function handleRemoveAll (websocket: WebSocket, commandID: Uint8Array, viewer: PointCloudViewer) {
  for (let i = viewer.scene.children.length - 1; i >= 0; i--) {
    viewer.scene.remove(viewer.scene.children[i]);
  }

  for (const overlay of viewer.overlays) {
    overlay.dispose();
  }
  viewer.overlays = [];

  for (let i = viewer.guiCustom.__controllers.length - 1; i >= 0; i--) {
    viewer.guiCustom.__controllers[i].remove();
  }

  sendSuccess(websocket, commandID, 'success');
}
