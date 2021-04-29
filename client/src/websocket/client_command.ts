import * as PB from "../protobuf/client_pb.js";

export function sendSuccess(websocket: WebSocket, command_id: Uint8Array, message: string): void {
    let result_success = new PB.Result();
    result_success.setSuccess(message);

    let command = new PB.ClientCommand();
    command.setResult(result_success);
    command.setUuid(command_id);

    websocket.send(command.serializeBinary());
}

export function sendFailure(websocket: WebSocket, command_id: Uint8Array, message: string): void {
    let result_failure = new PB.Result();
    result_failure.setFailure(message);

    let command = new PB.ClientCommand();
    command.setResult(result_failure);
    command.setUuid(command_id);

    websocket.send(command.serializeBinary());
}

export function sendImage(websocket: WebSocket, command_id: Uint8Array, blob: Blob): Promise<void> {
    return new Promise(function (resolve: () => void, reject: (reason?: any) => void) {
        blob.arrayBuffer().then(
            function (buffer: ArrayBuffer): void {
                let image = new PB.Image();
                image.setData(new Uint8Array(buffer));

                let command = new PB.ClientCommand();
                command.setImage(image);
                command.setUuid(command_id);

                websocket.send(command.serializeBinary());
                resolve();
            },
            function (reason: any): void {
                reject(reason);
            }
        )
    })
}

export function sendControlChanged(websocket: WebSocket, command_id: Uint8Array, value: number | boolean | string) {
    let changed = new PB.ControlChanged();
    switch (typeof (value)) {
        case "boolean":
            changed.setBoolean(value);
            break;
        case "number":
            changed.setNumber(value);
            break;
        case "string":
            changed.setText(value);
            break;
        default:
            console.error("unexpected type:" + typeof (value));
            break;
    }
    let command = new PB.ClientCommand();
    command.setControlChanged(changed);
    command.setUuid(command_id);
    websocket.send(command.serializeBinary());
}
