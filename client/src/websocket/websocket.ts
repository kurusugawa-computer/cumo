import * as PB from '../protobuf/server_pb.js';

import { PointCloudViewer } from '../viewer';
import { sendFailure } from './client_command';

import { handleAddControl } from './handler/add_control';
import { handleAddObject } from './handler/add_object';
import { handleScreenCapture } from './handler/capture_screen';
import { handleLogMessage } from './handler/log_message';
import { handleRemoveControl } from './handler/remove_control';
import { handleRemoveObject } from './handler/remove_object';
import { handleSetCamera } from './handler/set_camera';
import { handleSetKeyEvent } from './handler/set_key_event';

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
  const commandID = message.getUuid();
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
    case commandCase.SET_KEY_EVENT_HANDLER:
      handleSetKeyEvent(websocket, commandID, viewer, message.getSetKeyEventHandler());
      break;
    case commandCase.REMOVE_OBJECT:
      handleRemoveObject(websocket, commandID, viewer, message.getRemoveObject());
      break;
    case commandCase.REMOVE_CUSTOM_CONTROL:
      handleRemoveControl(websocket, commandID, viewer, message.getRemoveCustomControl());
      break;
    default:
      sendFailure(websocket, commandID, 'message has not any command');
      break;
  }
}
