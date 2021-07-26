import html2canvas from 'html2canvas';
import { sendFailure, sendImage } from '../client_command';
import { PointCloudViewer } from '../../viewer';

export function handleScreenCapture (websocket: WebSocket, commandID: string, viewer: PointCloudViewer) {
  const divcanvas = viewer.getdiv;

  html2canvas(divcanvas).then((canvas) => {
    canvas.toBlob(
      function (blob: Blob | null): void {
        if (blob === null) {
          sendFailure(websocket, commandID, 'failed to generate blob');
        } else {
          sendImage(websocket, commandID, blob).catch(
            function (reason: any): void {
              sendFailure(websocket, commandID, 'failed to send image: ' + reason);
            }
          );
        }
      }
      , 'image/png');
  });
}
