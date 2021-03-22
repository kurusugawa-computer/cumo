import './style.css';

import { connectWebSocket } from './websocket';
import { PointCloudViewer } from "./viewer";



window.addEventListener('load', () => { init(); });

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    let viewer = new PointCloudViewer(container);
    connectWebSocket(viewer);
}
