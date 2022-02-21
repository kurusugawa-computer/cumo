import * as THREE from 'three';
export class Event {
  cameraEvent = new class {
    oldPosition: THREE.Vector3 = new THREE.Vector3();
    oldRotation: THREE.Euler = new THREE.Euler();
    onCameraMoved = new class {
      intervalId: number = -1;
      delayMillSec!: number;
      callback!: Function ;
    }();

    onCameraRotated = new class {
      intervalId: number = -1;
      delayMillSec!: number;
      callback!: Function ;
    }();
  }();

  constructor (
    cameraMovedDelayMs: number = 0.2,
    cameraMovedCallback: Function = () => console.log('camera moved'),
    cameraRotatedDelayMs: number = 0.2,
    cameraRotatedCallback: Function = () => console.log('camera rotated')) {
    const event_ = this.cameraEvent;
    event_.onCameraMoved.delayMillSec = cameraMovedDelayMs;
    event_.onCameraMoved.callback = cameraMovedCallback;
    event_.onCameraRotated.delayMillSec = cameraRotatedDelayMs;
    event_.onCameraRotated.callback = cameraRotatedCallback;
  }

  prepareEvent (camera:THREE.Camera) {
    this.cameraEvent.oldPosition = camera.position.clone();
    this.cameraEvent.oldRotation = camera.rotation.clone();
  }

  fireEvent (camera: THREE.Camera) {
    const event = this.cameraEvent;
    if (!camera.position.equals(event.oldPosition)) {
      clearTimeout(event.onCameraMoved.intervalId);
      event.onCameraMoved.intervalId = window.setTimeout(event.onCameraMoved.callback, event.onCameraMoved.delayMillSec * 1000);
    }

    if (!camera.rotation.equals(event.oldRotation)) {
      clearTimeout(event.onCameraRotated.intervalId);
      event.onCameraRotated.intervalId = window.setTimeout(event.onCameraRotated.callback, event.onCameraRotated.delayMillSec * 1000);
    }
  }
}
