import * as PB from '../../protobuf/server';
import { PointCloudViewer } from '../../viewer';
import { sendFailure, sendSuccess } from '../client_command';
import { PropertyType } from './util';

export function handleSetProperty (
  websocket: WebSocket,
  commandID: string,
  viewer: PointCloudViewer,
  argument: PB.SetProperty | undefined
): void {
  if (!argument) {
    sendFailure(websocket, commandID, 'failure to get property');
    return;
  }
  const target = argument.target;
  let value: PropertyType;
  switch (argument.value) {
    case 'stringValue':
      value = argument.stringValue;
      break;
    case 'floatValue':
      value = argument.floatValue;
      break;
    case 'boolValue':
      value = argument.boolValue;
      break;
    case 'intValue':
      value = argument.intValue;
      break;
    default:
      sendFailure(websocket, commandID, 'unknown value type');
      return;
  }

  try {
    setPropertyToObject(target, viewer.config, value);
  } catch (e: any) {
    console.error(e);
    sendFailure(websocket, commandID, e.message);
    return;
  }

  sendSuccess(websocket, commandID, 'success');
  viewer.gui.updateDisplay();
}

function setPropertyToObject (target: string[], obj: any, value: PropertyType): void {
  if (target.length === 0) {
    throw new Error('target is empty');
  }
  const key = target[0];
  if (target.length === 1) { // パスの最後の要素
    if (key in obj) {
      // valueが代入可能かチェック
      if (typeof obj[key] !== typeof value) {
        throw new Error('value type mismatch');
      }
      obj[key] = value;
    } else {
      obj[key] = value;
    }
  } else {
    if (!(key in obj)) {
      obj[key] = {};
    }
    setPropertyToObject(target.slice(1), obj[key], value);
  }
}
