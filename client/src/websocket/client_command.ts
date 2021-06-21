import * as PB from '../protobuf/client_pb.js';

export function sendSuccess (websocket: WebSocket, commandID: Uint8Array, message: string): void {
  const resultSuccess = new PB.Result();
  resultSuccess.setSuccess(message);

  const command = new PB.ClientCommand();
  command.setResult(resultSuccess);
  command.setUuid(commandID);

  websocket.send(command.serializeBinary());
}

export function sendFailure (websocket: WebSocket, commandID: Uint8Array, message: string): void {
  const resultFailure = new PB.Result();
  resultFailure.setFailure(message);

  const command = new PB.ClientCommand();
  command.setResult(resultFailure);
  command.setUuid(commandID);

  websocket.send(command.serializeBinary());
  console.error('error: ' + message);
}

export function sendImage (websocket: WebSocket, commandID: Uint8Array, blob: Blob): Promise<void> {
  return new Promise(function (resolve: () => void, reject: (reason?: any) => void) {
    blob.arrayBuffer().then(
      function (buffer: ArrayBuffer): void {
        const image = new PB.Image();
        image.setData(new Uint8Array(buffer));

        const command = new PB.ClientCommand();
        command.setImage(image);
        command.setUuid(commandID);

        websocket.send(command.serializeBinary());
        resolve();
      },
      function (reason: any): void {
        reject(reason);
      }
    );
  });
}

export function sendControlChanged (websocket: WebSocket, commandID: Uint8Array, value: number | boolean | string) {
  const changed = new PB.ControlChanged();
  switch (typeof (value)) {
    case 'boolean':
      changed.setBoolean(value);
      break;
    case 'number':
      changed.setNumber(value);
      break;
    case 'string':
      changed.setText(value);
      break;
    default:
      console.error('unexpected type:' + typeof (value));
      break;
  }
  const command = new PB.ClientCommand();
  command.setControlChanged(changed);
  command.setUuid(commandID);
  websocket.send(command.serializeBinary());
}
