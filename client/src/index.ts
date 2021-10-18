import './style.css';

import { connectWebSocket } from './websocket/websocket';
import { PointCloudViewer } from './viewer';
import { getWebsocketURL } from './websocket/configure';

window.addEventListener('load', () => { init(); });

async function init () {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const viewer = new PointCloudViewer(container);

  getWebsocketURL().then((url:string) => {
    connectWebSocket(viewer, url);
  });
}
