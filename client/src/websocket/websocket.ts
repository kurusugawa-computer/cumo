import * as PB from '../protobuf/server_pb.js';

import { PointCloudViewer } from '../viewer';
import { sendFailure } from './client_command';

import { handleAddControl } from './handler/add_control.js';
import { handleAddObject } from './handler/add_object';
import { handleScreenCapture } from './handler/capture_screen.js';
import { handleLogMessage } from './handler/log_message';
import { handleSetCamera } from './handler/set_camera.js';

export function connectWebSocket (viewer: PointCloudViewer, url: string) {
  const websocket = new WebSocket(url);
  websocket.onmessage = function (ev: MessageEvent) {
    const message = PB.ServerCommand.deserializeBinary(ev.data);
    handleProtobuf(websocket, viewer, message);
  };
  websocket.onclose = function () {
    console.log('try to reconnecting');
    setTimeout(() => {
      connectWebSocket(viewer, url);
    }, 3000);
  };
}

function handleProtobuf (websocket: WebSocket, viewer: PointCloudViewer, message: PB.ServerCommand) {
  const commandCase = PB.ServerCommand.CommandCase;
  const commandID = message.getUuid_asU8();
  switch (message.getCommandCase()) {
    case commandCase.LOG_MESSAGE:
      handleLogMessage(websocket, commandID, message.getLogMessage());
      break;
    case commandCase.CAPTURE_SCREEN:
      handleScreenCapture(websocket, commandID, viewer);
      break;
    case commandCase.ADD_CUSTOM_CONTROL:
      handleAddControl(websocket, commandID, viewer, message.getAddCustomControl());
      break;
    case commandCase.SET_CAMERA:
      handleSetCamera(websocket, commandID, viewer, message.getSetCamera());
      break;
    case commandCase.ADD_OBJECT:
      handleAddObject(websocket, commandID, viewer, message.getAddObject());
      break;
    default:
      sendFailure(websocket, message.getUuid_asU8(), 'message has not any command');
      break;
  }
}
