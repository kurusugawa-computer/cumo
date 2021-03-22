import PBServerCommand from './protobuf/server_pb.js';

import { PointCloudViewer } from "./viewer";

import * as THREE from "three";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";
import { Camera, Color, Sphere } from 'three';

const WEBSOCKET_HOST = 'ws://127.0.0.1';
const WEBSOCKET_PORT = '8081';

export function connectWebSocket(viewer: PointCloudViewer) {
    const websocket = new WebSocket(WEBSOCKET_HOST + ':' + WEBSOCKET_PORT);
    websocket.onmessage = function (ev: MessageEvent) {
        let message = PBServerCommand.PBServerCommand.deserializeBinary(ev.data);
        if (message.hasLogMessage()) {
            console.log(message.getLogMessage());
        } else if (message.hasPointCloud()) {
            let pb_pointcloud = message.getPointCloud();
            if (pb_pointcloud) {
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
