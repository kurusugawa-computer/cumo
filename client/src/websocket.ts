import { PBServerCommand, PBPointCloud } from './protobuf/server_pb.js';
import { PBClientCommand, Result } from "./protobuf/client_pb.js";

import { PointCloudViewer } from "./viewer";

import * as THREE from "three";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";
import { Camera, Color, Sphere } from 'three';

import * as Base64 from "base64-js";

const WEBSOCKET_HOST = 'ws://127.0.0.1';
const WEBSOCKET_PORT = '8081';

export function connectWebSocket(viewer: PointCloudViewer) {
    const websocket = new WebSocket(WEBSOCKET_HOST + ':' + WEBSOCKET_PORT);
    websocket.onmessage = function (ev: MessageEvent) {
        let message = PBServerCommand.deserializeBinary(ev.data);
        try {
            let success_message = handleProtobuf(websocket, viewer, message);
            let result_success = new Result();
            result_success.setSuccess(success_message);
            console.log(message.getUuid_asU8());
            result_success.setUuid(message.getUuid_asU8());
            let command = new PBClientCommand();
            command.setResult(result_success);
            websocket.send(Base64.fromByteArray(command.serializeBinary()));
        } catch (e) {
            if (e instanceof Error) {
                let result_failure = new Result();
                result_failure.setFailure(e.message);
                result_failure.setUuid(message.getUuid_asU8())
                let command = new PBClientCommand();
                command.setResult(result_failure);
                websocket.send(Base64.fromByteArray(command.serializeBinary()));
            }
        }
    }
    websocket.onclose = function () {
        console.log("try to reconnecting");
        setTimeout(() => {
            connectWebSocket(viewer);
        }, 3000);
    }
}

function handleProtobuf(websocket: WebSocket, viewer: PointCloudViewer, message: PBServerCommand): string {
    const commandCase = PBServerCommand.CommandCase;
    switch (message.getCommandCase()) {
        case commandCase.LOG_MESSAGE:
            return handleLogMessage(websocket, message.getLogMessage());
        case commandCase.POINT_CLOUD:
            return handlePointCloud(message.getPointCloud(), viewer);
        default:
            throw new Error("message has not any command");
    }
}

function handleLogMessage(websocket: WebSocket, message: string): string {
    console.log(message);
    return "success";
}

function handlePointCloud(pb_pointcloud: PBPointCloud | undefined, viewer: PointCloudViewer): string {
    if (!pb_pointcloud) throw new Error("failure to get pointcloud");

    let pointcloud = new PCDLoader().parse(pb_pointcloud.getData_asU8().buffer, "test");
    if (pointcloud.material instanceof THREE.PointsMaterial) {
        pointcloud.material.vertexColors = false;
        pointcloud.material.color = new Color(0xffffff);
        pointcloud.material.size *= 1.2;
        pointcloud.material.needsUpdate = true;
    }
    if (pointcloud.geometry.boundingSphere) {
        console.log(pointcloud.geometry.boundingSphere);
        viewer.perspective_camera.lookAt(pointcloud.geometry.boundingSphere.center);
        const radius = pointcloud.geometry.boundingSphere.radius;
        const dist = radius / 2 / Math.tan(Math.PI * viewer.fov / 360);
        const p = viewer.perspective_camera.position.normalize().multiplyScalar(dist);
        viewer.perspective_camera.position.set(dist, 0, 0);
    }
    viewer.scene.add(pointcloud);
    return "success";
}
