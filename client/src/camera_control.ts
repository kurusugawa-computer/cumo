import * as THREE from 'three';

const STATE = {
  NONE: -1,
  ROTATE: 0,
  ZOOM: 1,
  PAN: 2,
  ROLL: 3
} as const;
type State = typeof STATE[keyof typeof STATE];

const EPS: number = 0.000001;
const changeEvent = { type: 'change' };
const startEvent = { type: 'start' };
const endEvent = { type: 'end' };

export class CustomCameraControls extends THREE.EventDispatcher {
  object: THREE.Camera;
  domElement: HTMLCanvasElement;

  enabled: boolean = true;

  screen: {left: number, top: number, width: number, height: number} = { left: NaN, top: NaN, width: NaN, height: NaN };

  rotateSpeed:number = 1.0;
  zoomSpeed: number = 1.2;
  panSpeed: number = 0.3;
  rollSpeed: number = 1.0;

  noRotate: boolean = false;
  noZoom: boolean = false;
  noPan: boolean = false;
  noRoll: boolean = false;

  readonly staticMoving = true;

  minDistance: number = 0.1;
  maxDistance: number = Infinity

  keys: string[] = ['A', 'S', 'Shift', 'Control'];

  mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  };

  target: THREE.Vector3 = new THREE.Vector3();
  lastPosition: THREE.Vector3 = new THREE.Vector3();
  lastZoom:number = 1;
  state: State = STATE.NONE;
  keyState: State = STATE.NONE;
  eye: THREE.Vector3 = new THREE.Vector3();
  movePrev: THREE.Vector2 = new THREE.Vector2();
  moveCurr: THREE.Vector2 = new THREE.Vector2();
  lastAxis: THREE.Vector3 = new THREE.Vector3();
  lastAngle: number = 0;
  zoomStart: THREE.Vector2 = new THREE.Vector2();
  zoomEnd: THREE.Vector2 = new THREE.Vector2();
  panStart: THREE.Vector2 = new THREE.Vector2();
  panEnd: THREE.Vector2 = new THREE.Vector2();
  rollStart: THREE.Vector2 = new THREE.Vector2();
  rollEnd: THREE.Vector2 = new THREE.Vector2();

  constructor (object: THREE.Camera, domElement: HTMLCanvasElement) {
    super();
    this.object = object;
    this.domElement = domElement;

    this.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.domElement.addEventListener('wheel', this.onMouseWheel);
    this.domElement.ownerDocument.addEventListener('pointermove', this.onPointerMove);
    this.domElement.ownerDocument.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.handleResize();
    this.update();
  }

  handleResize = () => {
    const box = this.domElement.getBoundingClientRect();
    const d = this.domElement.ownerDocument.documentElement;
    this.screen.left = box.left + window.pageXOffset - d.clientLeft;
    this.screen.top = box.top + window.pageYOffset - d.clientTop;
    this.screen.width = box.width;
    this.screen.height = box.height;
  }

  switchCamera = (camera: THREE.Camera) => {
    const oldCamera = this.object;
    this.object = camera;

    this.object.up.copy(oldCamera.up);
    this.object.position.copy(oldCamera.position);

    if (isPerspectiveCamera(this.object) && isPerspectiveCamera(oldCamera)) {
      this.object.zoom = oldCamera.zoom;
    }
  }

  setRoll = (rad: number, up: THREE.Vector3) => {
    this.object.up.copy(up);
    this.object.lookAt(this.target);

    this.eye.subVectors(this.object.position, this.target);

    const eyeDirection = new THREE.Vector3();
    eyeDirection.copy(this.eye).normalize();

    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(eyeDirection, rad);

    this.eye.applyQuaternion(quaternion);
    this.object.up.applyQuaternion(quaternion);
  }

  getMouseOnScreen = (pageX: number, pageY: number, dst: THREE.Vector2) => {
    dst.set(
      (pageX - this.screen.left) / this.screen.width,
      (pageY - this.screen.top) / this.screen.height
    );
  }

  getMouseOnCircle = (pageX: number, pageY: number, dst: THREE.Vector2) => {
    dst.set(
      ((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
      ((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width)
    );
  }

  rotateCamera = () => {
    const quaternion = new THREE.Quaternion();
    const moveDirection = new THREE.Vector3(
      this.moveCurr.x - this.movePrev.x,
      this.moveCurr.y - this.movePrev.y,
      0
    );
    let angle: number = moveDirection.length();
    if (angle) {
      const axis = new THREE.Vector3();
      const eyeDirection = new THREE.Vector3();
      const objectUpDirection = new THREE.Vector3();
      const objectSidewaysDirection = new THREE.Vector3();

      this.eye.copy(this.object.position).sub(this.target);
      eyeDirection.copy(this.eye).normalize();
      objectUpDirection.copy(this.object.up).normalize();

      objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

      objectUpDirection.setLength(this.moveCurr.y - this.movePrev.y);
      objectSidewaysDirection.setLength(this.moveCurr.x - this.movePrev.x);

      moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));
      axis.crossVectors(moveDirection, this.eye).normalize();

      angle *= this.rotateSpeed;
      quaternion.setFromAxisAngle(axis, angle);

      this.eye.applyQuaternion(quaternion);

      if (!this.noRoll) {
        this.object.up.applyQuaternion(quaternion);
      }

      this.movePrev.copy(this.moveCurr);
    }
  }

  zoomCamera = () => {
    const factor = 1.0 + (this.zoomEnd.y - this.zoomStart.y) * this.zoomSpeed;
    if (factor !== 1.0 && factor > 0.0) {
      if (isPerspectiveCamera(this.object)) {
        this.eye.multiplyScalar(factor);
      } else if (isOrthographicCamera(this.object)) {
        this.object.zoom /= factor;
        this.object.updateProjectionMatrix();
      } else {
        console.warn('CustomCameraControls: Unsupported camera type');
      }
    }
    this.zoomStart.copy(this.zoomEnd);
  }

  panCamera = () => {
    const mouseChange = new THREE.Vector2();
    const objectUp = new THREE.Vector3();
    const pan = new THREE.Vector3();

    mouseChange.copy(this.panEnd).sub(this.panStart);

    if (mouseChange.lengthSq()) {
      if (isOrthographicCamera(this.object)) {
        const scaleX = (this.object.right - this.object.left) / this.object.zoom / this.domElement.clientWidth;
        const scaleY = (this.object.top - this.object.bottom) / this.object.zoom / this.domElement.clientWidth;

        mouseChange.x *= scaleX;
        mouseChange.y *= scaleY;
      }

      mouseChange.multiplyScalar(this.eye.length() * this.panSpeed);

      pan.copy(this.eye).cross(this.object.up).setLength(mouseChange.x);
      pan.add(objectUp.copy(this.object.up).setLength(mouseChange.y));

      this.object.position.add(pan);
      this.target.add(pan);
      this.panStart.copy(this.panEnd);
    }
  }

  rollCamera = () => {
    const quaternion = new THREE.Quaternion();
    const angle0 = Math.atan2(this.rollStart.y, this.rollStart.x);
    const angle1 = Math.atan2(this.rollEnd.y, this.rollEnd.x);

    const delta = angle0 - angle1;
    if (delta) {
      const angle = delta * this.rollSpeed;
      const eyeDirection = new THREE.Vector3();
      eyeDirection.copy(this.eye).normalize();

      quaternion.setFromAxisAngle(eyeDirection, angle);

      this.eye.applyQuaternion(quaternion);
      this.object.up.applyQuaternion(quaternion);
    }

    this.rollStart.copy(this.rollEnd);
  }

  checkDistances = () => {
    if (this.noZoom && this.noPan) return;

    if (this.eye.lengthSq() > this.maxDistance * this.maxDistance) {
      this.object.position.addVectors(this.target, this.eye.setLength(this.maxDistance));
      this.zoomStart.copy(this.zoomEnd);
    }
    if (this.eye.lengthSq() < this.minDistance * this.minDistance) {
      this.object.position.addVectors(this.target, this.eye.setLength(this.minDistance));
      this.zoomStart.copy(this.zoomEnd);
    }
  }

  update = () => {
    this.eye.subVectors(this.object.position, this.target);
    const oldQuaternion = new THREE.Quaternion();
    oldQuaternion.copy(this.object.quaternion);

    const eyeDirection = new THREE.Vector3();
    eyeDirection.copy(this.eye).normalize();
    const objectOldUpDirection = new THREE.Vector3();
    objectOldUpDirection.copy(this.object.up);
    const objectUpDirection = new THREE.Vector3();
    objectUpDirection.copy(this.object.up).normalize();

    if (1 - Math.abs(eyeDirection.dot(objectUpDirection)) < EPS) {
      // use screen up direction
      objectUpDirection.set(0, 1, 0);
      objectUpDirection.applyQuaternion(this.object.quaternion);
      this.object.up.copy(objectUpDirection);
    }

    if (!this.noRotate) {
      this.rotateCamera();
    }
    if (!this.noZoom) {
      this.zoomCamera();
    }
    if (!this.noPan) {
      this.panCamera();
    }
    if (!this.noRoll) {
      this.rollCamera();
    }

    this.object.position.addVectors(this.target, this.eye);

    if (isPerspectiveCamera(this.object)) {
      this.checkDistances();
      this.object.lookAt(this.target);
      if (this.lastPosition.distanceToSquared(this.object.position) > EPS) {
        this.dispatchEvent(changeEvent);
        this.lastPosition.copy(this.object.position);
      }
    } else if (isOrthographicCamera(this.object)) {
      this.object.lookAt(this.target);
      if (this.lastPosition.distanceToSquared(this.object.position) > EPS || this.lastZoom !== this.object.zoom) {
        this.dispatchEvent(changeEvent);
        this.lastPosition.copy(this.object.position);
        this.lastZoom = this.object.zoom;
      }
    } else {
      console.warn('CustomCameraControls: Unsupported camera type');
    }

    if (this.noRoll) {
      this.object.up.copy(objectOldUpDirection);
    }

    // limit rotation around this.object.up
    if (this.noRoll && 1 - Math.abs(eyeDirection.dot(this.object.up)) < 0.1) {
      const quaternion = new THREE.Quaternion();
      quaternion.copy(this.object.quaternion);
      quaternion.multiplyQuaternions(quaternion, oldQuaternion.invert());

      const rotationAxis = new THREE.Vector3(quaternion.x, quaternion.y, quaternion.z);
      rotationAxis.projectOnVector(this.object.up);
      const twist = new THREE.Quaternion(rotationAxis.x, rotationAxis.y, rotationAxis.z, quaternion.w);
      twist.normalize();

      quaternion.setFromAxisAngle(rotationAxis, 0);
      const sidewayAngle = quaternion.angleTo(twist);

      const cancelQuaternion = new THREE.Quaternion();
      cancelQuaternion.copy(twist).invert();

      if (sidewayAngle > Math.PI * 0.1) {
        this.eye.applyQuaternion(cancelQuaternion);

        this.object.position.addVectors(this.target, this.eye);
        this.object.lookAt(this.target);
      }
    }
  }

  onPointerDown = (event: PointerEvent) => {
    if (this.enabled === false) return;
    switch (event.pointerType) {
      case 'mouse':
      case 'pen':
        this.onMouseDown(event);
        break;
      default:
        break;
    }
  }

  onPointerMove = (event: PointerEvent) => {
    if (this.enabled === false) return;
    switch (event.pointerType) {
      case 'mouse':
      case 'pen':
        this.onMouseMove(event);
        break;
      default:
        break;
    }
  }

  onPointerUp = (event: PointerEvent) => {
    if (this.enabled === false) return;
    switch (event.pointerType) {
      case 'mouse':
      case 'pen':
        this.onMouseUp(event);
        break;
      default:
        break;
    }
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (this.enabled === false) return;

    window.removeEventListener('keydown', this.onKeyDown);

    if (this.keyState !== STATE.NONE) {
      return;
    }

    if (event.key === this.keys[STATE.ROTATE] && !this.noRotate) {
      this.keyState = STATE.ROTATE;
    } else if (event.key === this.keys[STATE.ZOOM] && !this.noZoom) {
      this.keyState = STATE.ZOOM;
    } else if (event.key === this.keys[STATE.PAN] && !this.noPan) {
      this.keyState = STATE.PAN;
    } else if (event.key === this.keys[STATE.ROLL] && !this.noRoll) {
      this.keyState = STATE.ROLL;
    }
  }

  onKeyUp = (event: KeyboardEvent) => {
    if (this.enabled === false) {
      return;
    }
    this.keyState = STATE.NONE;
    window.addEventListener('keydown', this.onKeyDown);
  }

  onMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (this.state === STATE.NONE) {
      switch (event.button) {
        case this.mouseButtons.LEFT:
          this.state = STATE.ROTATE;
          break;
        case this.mouseButtons.MIDDLE:
          this.state = STATE.ZOOM;
          break;
        case this.mouseButtons.RIGHT:
          this.state = STATE.PAN;
          break;
        default:
          this.state = STATE.NONE;
          break;
      }
    }

    const state = this.keyState !== STATE.NONE ? this.keyState : this.state;

    if (state === STATE.ROTATE && !this.noRotate) {
      this.getMouseOnCircle(event.pageX, event.pageY, this.moveCurr);
      this.movePrev.copy(this.moveCurr);
    } else if (state === STATE.ZOOM && !this.noZoom) {
      this.getMouseOnScreen(event.pageX, event.pageY, this.zoomStart);
      this.zoomEnd.copy(this.zoomStart);
    } else if (state === STATE.PAN && !this.noPan) {
      this.getMouseOnScreen(event.pageX, event.pageY, this.panStart);
      this.panEnd.copy(this.panStart);
    } else if (state === STATE.ROLL && !this.noRoll) {
      this.getMouseOnCircle(event.pageX, event.pageY, this.rollStart);
      this.rollEnd.copy(this.rollStart);
    }

    this.domElement.ownerDocument.addEventListener('pointermove', this.onPointerMove);
    this.domElement.ownerDocument.addEventListener('pointerup', this.onPointerUp);

    this.dispatchEvent(startEvent);
  }

  onMouseMove = (event: MouseEvent) => {
    if (this.enabled === false) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const state = (this.keyState !== STATE.NONE) ? this.keyState : this.state;

    if (state === STATE.ROTATE && !this.noRotate) {
      this.movePrev.copy(this.moveCurr);
      this.getMouseOnCircle(event.pageX, event.pageY, this.moveCurr);
    } else if (state === STATE.ZOOM && !this.noZoom) {
      this.getMouseOnScreen(event.pageX, event.pageY, this.zoomEnd);
    } else if (state === STATE.PAN && !this.noPan) {
      this.getMouseOnScreen(event.pageX, event.pageY, this.panEnd);
    } else if (state === STATE.ROLL && !this.noRoll) {
      this.getMouseOnCircle(event.pageX, event.pageY, this.rollEnd);
    }
  }

  onMouseUp = (event: MouseEvent) => {
    if (this.enabled === false) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.state = STATE.NONE;
    this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
    this.dispatchEvent(endEvent);
  }

  onMouseWheel = (event:WheelEvent) => {
    if (this.enabled === false) {
      return;
    }
    if (this.noZoom === true) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    switch (event.deltaMode) {
      case WheelEvent.DOM_DELTA_PAGE:
        this.zoomStart.y -= event.deltaY * 0.025;
        break;
      case WheelEvent.DOM_DELTA_LINE:
        this.zoomStart.y -= event.deltaY * 0.01;
        break;
      default:
        console.assert(event.deltaMode === WheelEvent.DOM_DELTA_PIXEL);
        this.zoomStart.y -= event.deltaY * 0.00025;
        break;
    }
    this.dispatchEvent(startEvent);
    this.dispatchEvent(endEvent);
  }

  onContextMenu = (event: MouseEvent) => {
    if (this.enabled === false) {
      return;
    }
    event.preventDefault();
  }

  dispose = () => {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('wheel', this.onMouseWheel);
    this.domElement.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}

function isPerspectiveCamera (camera: THREE.Camera): camera is THREE.PerspectiveCamera {
  return (camera as any).isPerspectiveCamera;
}

function isOrthographicCamera (camera: THREE.Camera): camera is THREE.OrthographicCamera {
  return (camera as any).isOrthographicCamera;
}
