import * as BABYLON from '@babylonjs/core';

const STATE = {
  NONE: -1,
  ROTATE: 0,
  ZOOM: 1,
  PAN: 2,
  ROLL: 3
} as const;
type State = typeof STATE[keyof typeof STATE];

const MOUSEEVENTBUTTON = {
  LEFT: 0,
  WHEEL: 1,
  RIGHT: 2
};

const EPS: number = 0.000001;

export class CustomCameraInput<TCamera extends BABYLON.TargetCamera> implements BABYLON.ICameraInput<TCamera> {
  enabled: boolean = true;
  noPreventDefault = false;
  noRotate: boolean = false;
  noZoom: boolean = false;
  noPan: boolean = false;
  noRoll: boolean = false;

  rotateSpeed: number = 1.0;
  zoomSpeed: number = 1.2;
  panSpeed: number = 0.3;
  rollSpeed: number = 1.0;

  minDistance: number = 0.1;
  maxDistance: number = Infinity

  frustum: number | undefined;
  zoom: number = 1.0;
  target: BABYLON.Vector3 = BABYLON.Vector3.Zero();

  camera: BABYLON.Nullable<TCamera> = null;
  private canvas: HTMLCanvasElement | null = null;
  private canvasObserver: MutationObserver | undefined;

  private screen: {
    left: number, top: number, width: number, height: number
  } = {
    left: NaN, top: NaN, width: NaN, height: NaN
  };

  keys: string[] = ['A', 'S', 'Shift', 'Control'];

  private moveCurr: BABYLON.Vector2 = BABYLON.Vector2.Zero();
  private movePrev: BABYLON.Vector2 = BABYLON.Vector2.Zero();
  private zoomStart: BABYLON.Vector2 = BABYLON.Vector2.Zero();
  private zoomEnd: BABYLON.Vector2 = BABYLON.Vector2.Zero();
  private panStart: BABYLON.Vector2 = BABYLON.Vector2.Zero();
  private panEnd: BABYLON.Vector2 = BABYLON.Vector2.Zero();
  private rollStart: BABYLON.Vector2 = BABYLON.Vector2.Zero();
  private rollEnd: BABYLON.Vector2 = BABYLON.Vector2.Zero();
  private state: State = STATE.NONE;
  private keyState: State = STATE.NONE;
  private eye: BABYLON.Vector3 = BABYLON.Vector3.Zero();

  // interface BABYLON.ICameraInput

  getClassName (): string {
    return 'CustomCameraInput';
  }

  getSimpleName (): string {
    return 'custom';
  }

  attachControl (noPreventDefault?: boolean | undefined): void {
    if (noPreventDefault !== undefined) {
      this.noPreventDefault = noPreventDefault;
    }
    if (this.camera === null) return;
    const canvas = this.camera.getEngine().getRenderingCanvas();
    if (canvas === null || canvas === undefined) return;

    this.canvas = canvas;
    this.onContextMenu = this.onContextMenu.bind(this);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.onMouseWheel = this.onMouseWheel.bind(this);
    this.canvas.addEventListener('wheel', this.onMouseWheel);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.canvas.ownerDocument.addEventListener('pointermove', this.onPointerMove);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.canvas.ownerDocument.addEventListener('pointerup', this.onPointerUp);
    this.onKeyDown = this.onKeyDown.bind(this);
    window.addEventListener('keydown', this.onKeyDown);
    this.onKeyUp = this.onKeyUp.bind(this);
    window.addEventListener('keyup', this.onKeyUp);

    this.onResize = this.onResize.bind(this);
    this.canvasObserver = new MutationObserver(() => { this.onResize(); });
    this.canvasObserver.observe(this.canvas, {
      attributes: true,
      attributeFilter: ['width']
    });

    this.zoom = this.camera.position.subtract(this.camera.target).length();
    this.target = this.camera.target.clone();
    this.onResize();
  }

  detachControl (): void {
    if (this.canvas === null) return;
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('wheel', this.onMouseWheel);
    this.canvas.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    this.canvasObserver?.disconnect();
  }

  checkInputs (): void {
    this.update();
  }

  // checkInputs utilities

  private rotateCamera () {
    if (this.camera === null) return;
    const moveDirection = new BABYLON.Vector3(
      this.moveCurr.x - this.movePrev.x,
      this.moveCurr.y - this.movePrev.y,
      0
    );
    let angle = moveDirection.length();
    if (angle) {
      this.target.subtractToRef(this.camera.position, this.eye);

      const eyeDirection = this.eye.clone();
      eyeDirection.normalize();
      const objectUpDirection = this.camera.upVector.clone();
      objectUpDirection.normalize();
      const objectSidewaysDirection = objectUpDirection.cross(eyeDirection);
      objectSidewaysDirection.normalize();

      objectUpDirection.scaleInPlace(this.moveCurr.y - this.movePrev.y);
      objectSidewaysDirection.scaleInPlace(this.moveCurr.x - this.movePrev.x);

      objectUpDirection.addToRef(objectSidewaysDirection, moveDirection);
      const axis = moveDirection.cross(eyeDirection).normalize();

      angle *= this.rotateSpeed;
      const quaternion = BABYLON.Quaternion.RotationAxis(axis, angle).normalize();

      this.eye.applyRotationQuaternionInPlace(quaternion);

      if (!this.noRoll) {
        this.camera.upVector = this.camera.upVector.normalizeToNew()
          .applyRotationQuaternion(quaternion).normalizeToNew();
      }

      this.movePrev.copyFrom(this.moveCurr);
    }
  }

  private zoomCamera () {
    if (this.camera === null) return;
    const factor = 1.0 + (this.zoomEnd.y - this.zoomStart.y) * this.zoomSpeed;
    if (factor !== 1.0 && factor > 0.0) {
      this.zoom /= factor;
      this.eye.normalize().scaleInPlace(this.zoom);
      this.updateCameraFrustum();
    }
    this.zoomStart.copyFrom(this.zoomEnd);
  }

  private panCamera () {
    if (this.camera === null) return;
    const mouseChange = this.panEnd.subtract(this.panStart);

    if (mouseChange.lengthSquared()) {
      mouseChange.scaleInPlace(this.eye.length() * this.panSpeed);
      const pan = this.eye.cross(this.camera.upVector).normalize()
        .scaleInPlace(mouseChange.x);
      pan.addInPlace(this.camera.upVector.scale(mouseChange.y));

      this.target.addInPlace(pan);
      this.panStart.copyFrom(this.panEnd);
    }
  }

  private rollCamera () {
    if (this.camera === null) return;
    const angle0 = Math.atan2(this.rollStart.y, this.rollStart.x);
    const angle1 = Math.atan2(this.rollEnd.y, this.rollEnd.x);
    const delta = angle0 - angle1;
    if (delta) {
      const angle = delta * this.rollSpeed;
      const eyeDirection = this.eye.clone();
      eyeDirection.normalize();

      const q = BABYLON.Quaternion.RotationAxis(eyeDirection, angle);

      this.camera.upVector.applyRotationQuaternionInPlace(q);
    }
    this.rollStart.copyFrom(this.rollEnd);
  }

  private checkDistances () {
    if (this.noZoom && this.noPan) return;
    if (this.camera === null) return;
    if (this.eye.lengthSquared() > this.maxDistance * this.maxDistance) {
      this.target.subtractToRef(this.eye.clone().normalize().scale(this.maxDistance), this.camera.position);
      this.zoomStart.copyFrom(this.zoomEnd);
    }
    if (this.eye.lengthSquared() < this.minDistance * this.minDistance) {
      this.target.subtractToRef(this.eye.clone().normalize().scale(this.maxDistance), this.camera.position);
      this.zoomStart.copyFrom(this.zoomEnd);
    }
  }

  private update () {
    if (this.camera === null) return;
    if (!this.enabled) return;
    const oldQuaternion = this.camera.absoluteRotation.clone();
    this.target.subtractToRef(this.camera.position, this.eye);
    const eyeDirection = this.eye.clone();
    eyeDirection.normalize();
    const objectOldUpDirection = this.camera.upVector.clone();
    const objectUpDirection = this.camera.upVector.clone();
    objectUpDirection.normalize();

    if (1 - Math.abs(BABYLON.Vector3.Dot(eyeDirection, objectUpDirection)) < EPS) {
      // use screen up direction
      objectUpDirection.set(0, 1, 0);
      objectUpDirection.applyRotationQuaternionInPlace(this.camera.rotationQuaternion);
      this.camera.upVector.copyFrom(objectUpDirection);
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

    this.target.subtractToRef(this.eye, this.camera.position);

    this.checkDistances();

    if (this.noRoll) {
      this.camera.upVector.copyFrom(objectOldUpDirection);
    }

    this.camera.setTarget(this.target);

    // limit rotation around this.object.up
    if (this.noRoll && 1 - Math.abs(BABYLON.Vector3.Dot(eyeDirection, this.camera.upVector)) < 0.1) {
      const q = this.camera.absoluteRotation.clone();
      q.multiplyInPlace(oldQuaternion.invert());

      const rotationAxis = new BABYLON.Vector3(q.x, q.y, q.z);
      const up = this.camera.upVector.clone().normalize();
      // project rotation axis onto up vector
      const d = BABYLON.Vector3.Dot(rotationAxis, up);
      rotationAxis.copyFrom(up).scaleInPlace(d);

      const twist = new BABYLON.Quaternion(rotationAxis.x, rotationAxis.y, rotationAxis.z, q.w);
      twist.normalize();

      BABYLON.Quaternion.RotationAxis(rotationAxis, 0);
      // angle between q and twist
      const sidewayAngle = 2 * Math.acos(
        Math.abs(
          Math.max(-1, Math.min(1, BABYLON.Quaternion.Dot(q.normalizeToNew(), twist)))
        )
      );

      if (sidewayAngle > Math.PI * 0.1) {
        this.eye.applyRotationQuaternionInPlace(twist.invert());
        this.target.subtractToRef(this.eye, this.camera.position);
        this.camera.setTarget(this.target);
      }
    }
  }

  // utilities

  setRoll (rad: number, up: BABYLON.Vector3) {
    if (this.camera === null) return;
    this.camera.upVector.copyFrom(up);
    this.camera.setTarget(this.target);

    this.camera.position.subtractToRef(this.target, this.eye);
    const eyeDirection = this.eye.clone().normalize();
    const quaternion = BABYLON.Quaternion.RotationAxis(eyeDirection, rad);

    this.eye.applyRotationQuaternionInPlace(quaternion);
    this.camera.upVector.applyRotationQuaternionInPlace(quaternion);
  }

  updateCameraFrustum (): [number, number] {
    if (this.camera === null) return [-1, -1];
    const eyeLength = this.camera.position.subtract(this.camera.target).length();
    const f = this.frustum
      ? this.frustum * this.zoom
      : 2 * eyeLength * Math.tan(this.camera.fov / 2);
    switch (this.camera.fovMode) {
      case BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED:
      {
        const aspect = this.screen.height / this.screen.width;
        this.camera.orthoLeft = f / -2;
        this.camera.orthoRight = f / 2;
        this.camera.orthoTop = f * aspect / 2;
        this.camera.orthoBottom = f * aspect / -2;
        return [f, f * aspect];
      }
      case BABYLON.Camera.FOVMODE_VERTICAL_FIXED:
      {
        const aspect = this.screen.width / this.screen.height;
        this.camera.orthoLeft = f * aspect / -2;
        this.camera.orthoRight = f * aspect / 2;
        this.camera.orthoTop = f / 2;
        this.camera.orthoBottom = f / -2;
        return [f * aspect, f];
      }
      default:
        console.warn('CustomCameraInput: unsupported camera fovMode');
        return [-1, -1];
    }
  }

  private getMouseOnScreen (pageX: number, pageY: number, dst: BABYLON.Vector2): BABYLON.Vector2 {
    return dst.set(
      (pageX - this.screen.left) / this.screen.width,
      (pageY - this.screen.top) / this.screen.height
    );
  }

  private getMouseOnCircle (pageX: number, pageY: number, dst: BABYLON.Vector2): BABYLON.Vector2 {
    return dst.set(
      ((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
      ((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width)
    );
  }

  // event handlers

  private onResize (): void {
    if (this.canvas === null) return;
    if (this.camera === null) return;
    const box = this.canvas.getBoundingClientRect();
    const d = this.canvas.ownerDocument.documentElement;

    //   (distance from *origin* to *left edge of viewport*)
    // + (distance from *left edge of viewport* to *left edge of canvas*)
    // - (width of left border)
    this.screen.left = window.scrollX + box.left - d.clientLeft;

    this.screen.top = window.scrollY + box.top - d.clientTop;
    this.screen.width = box.width;
    this.screen.height = box.height;

    this.updateCameraFrustum();
  }

  private onPointerDown (event: PointerEvent): void {
    if (!this.enabled) return;
    switch (event.pointerType) {
      case 'mouse':
      case 'pen':
        this.onMouseDown(event);
        break;
      default:
        break;
    }
  }

  private onPointerMove (event: PointerEvent): void {
    if (!this.enabled) return;
    switch (event.pointerType) {
      case 'mouse':
      case 'pen':
        this.onMouseMove(event);
        break;
      default:
        break;
    }
  }

  private onPointerUp (event: PointerEvent): void {
    if (!this.enabled) return;
    switch (event.pointerType) {
      case 'mouse':
      case 'pen':
        this.onMouseUp(event);
        break;
      default:
        break;
    }
  }

  private onKeyDown (event: KeyboardEvent): void {
    if (!this.enabled) return;

    window.removeEventListener('keydown', this.onKeyDown);

    if (this.keyState !== STATE.NONE) return;

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

  private onKeyUp (event: KeyboardEvent): void {
    if (!this.enabled) return;
    this.keyState = STATE.NONE;
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onMouseDown (event: MouseEvent): void {
    if (this.canvas === null) return;
    if (!this.noPreventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.state === STATE.NONE) {
      switch (event.button) {
        case MOUSEEVENTBUTTON.LEFT:
          this.state = STATE.ROTATE;
          break;
        case MOUSEEVENTBUTTON.WHEEL:
          this.state = STATE.ZOOM;
          break;
        case MOUSEEVENTBUTTON.RIGHT:
          this.state = STATE.PAN;
          break;
        default:
          this.state = STATE.NONE;
          break;
      }
    }

    const state = this.keyState === STATE.NONE ? this.state : this.keyState;
    if (state === STATE.ROTATE && !this.noRotate) {
      this.getMouseOnCircle(event.pageX, event.pageY, this.moveCurr);
      this.movePrev.copyFrom(this.moveCurr);
    } else if (state === STATE.ZOOM && !this.noZoom) {
      this.getMouseOnScreen(event.pageX, event.pageY, this.zoomStart);
      this.zoomEnd.copyFrom(this.zoomStart);
    } else if (state === STATE.PAN && !this.noPan) {
      this.getMouseOnScreen(event.pageX, event.pageY, this.panStart);
      this.panEnd.copyFrom(this.panStart);
    } else if (state === STATE.ROLL && !this.noRoll) {
      this.getMouseOnCircle(event.pageX, event.pageY, this.rollStart);
      this.rollEnd.copyFrom(this.rollStart);
    }

    this.canvas.ownerDocument.addEventListener('pointermove', this.onPointerMove);
    this.canvas.ownerDocument.addEventListener('pointerup', this.onPointerUp);
  }

  private onMouseMove (event: MouseEvent): void {
    if (!this.enabled) return;
    if (!this.noPreventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
    const state = (this.keyState === STATE.NONE) ? this.state : this.keyState;

    if (state === STATE.ROTATE && !this.noRotate) {
      this.movePrev.copyFrom(this.moveCurr);
      this.getMouseOnCircle(event.pageX, event.pageY, this.moveCurr);
    } else if (state === STATE.ZOOM && !this.noZoom) {
      this.getMouseOnScreen(event.pageX, event.pageY, this.zoomEnd);
    } else if (state === STATE.PAN && !this.noPan) {
      this.getMouseOnScreen(event.pageX, event.pageY, this.panEnd);
    } else if (state === STATE.ROLL && !this.noRoll) {
      this.getMouseOnCircle(event.pageX, event.pageY, this.rollEnd);
    }
  }

  private onMouseUp (event: MouseEvent): void {
    if (this.canvas === null) return;
    if (!this.enabled) return;
    event.preventDefault();
    event.stopPropagation();
    this.state = STATE.NONE;
    this.canvas.ownerDocument.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.ownerDocument.removeEventListener('pointerup', this.onPointerUp);
  }

  private onMouseWheel (event: WheelEvent): void {
    if (!this.enabled) return;
    if (this.noZoom) return;
    if (!this.noPreventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }
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
  }

  onContextMenu (event: MouseEvent): void {
    if (!this.enabled) return;
    if (!this.noPreventDefault) event.preventDefault();
  }
}
