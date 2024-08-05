import { GUI } from 'lil-gui';
import { PointCloudViewer } from '../viewer';
import { DefaultUUID, GUIRegistry } from './util';

export class GUIManager {
  gui: GUI;
  guiCustom: GUI;
  guiRegistry: GUIRegistry

  customProperty: {[key: string]: any};

  constructor (private viewer: PointCloudViewer) {
    // コントロールのセットアップ
    this.gui = new GUI();

    const guiControl = this.gui.addFolder('control');
    const guiCamera = this.gui.addFolder('camera');
    this.guiCustom = this.gui.addFolder('custom');

    const guiRotateSpeed = guiControl
      .add(viewer.config.controls, 'rotateSpeed', 0, 10, 0.1)
      .onChange(() => { viewer.cameraInput.rotateSpeed = viewer.config.controls.rotateSpeed; });
    const guiZoomSpeed = guiControl
      .add(viewer.config.controls, 'zoomSpeed', 0, 10, 0.1)
      .onChange(() => { viewer.cameraInput.zoomSpeed = viewer.config.controls.zoomSpeed; });
    const guiPanSpeed = guiControl
      .add(viewer.config.controls, 'panSpeed', 0, 10, 0.1)
      .onChange(() => { viewer.cameraInput.panSpeed = viewer.config.controls.panSpeed; });

    const guiUsePerspective = guiCamera.add(viewer.config.camera, 'usePerspective')
      .name('perspective camera')
      .onChange((perspective: boolean) => viewer.switchCamera(perspective));

    // GUIの情報を登録
    this.guiRegistry = new GUIRegistry();
    this.guiRegistry.setFolder(DefaultUUID.CustomRoot, this.guiCustom);
    this.guiRegistry.setFolder(DefaultUUID.Root, this.gui);
    this.guiRegistry.setFolder(DefaultUUID.Controls, guiControl);
    this.guiRegistry.setFolder(DefaultUUID.Camera, guiCamera);
    this.guiRegistry.setController(DefaultUUID.RotateSpeed, guiRotateSpeed);
    this.guiRegistry.setController(DefaultUUID.ZoomSpeed, guiZoomSpeed);
    this.guiRegistry.setController(DefaultUUID.PanSpeed, guiPanSpeed);
    this.guiRegistry.setController(DefaultUUID.UsePerspective, guiUsePerspective);

    this.adjustControlPanelWidthFromContent();

    this.customProperty = {};
  }

  // ラベルが隠れないように画面の半分までGUIの横幅を広げる
  adjustControlPanelWidthFromContent () {
    // const labels = document.querySelectorAll<HTMLDivElement>('.dg .property-name').values();
    // let maxWidth = 0;
    // const ctx = document.createElement('canvas').getContext('2d');
    // if (ctx === null) return;
    // for (const l of labels) {
    //   ctx.font = window.getComputedStyle(l).font;
    //   const m = ctx.measureText(l.innerText);
    //   const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    //   maxWidth = Math.max(w, maxWidth);
    // }
    // const mainWidth = Math.ceil(maxWidth / 0.4);
    // const title = document.querySelector<HTMLLIElement>('.dg li.title');
    // const padding = (() => {
    //   if (title === null) return 20;
    //   const s = window.getComputedStyle(title);
    //   // computed length is always in the form '*px'
    //   return Number.parseFloat(s.paddingLeft) + Number.parseFloat(s.paddingRight);
    // })();
    // +1 for dat.gui bugs
    // sometimes the actual width will be 1px less than the passed value
    // this.gui.width = Math.max(this.gui.width, Math.min(mainWidth + padding + 1, window.innerWidth / 2)); TODO:
  }

  updateAll () {
    for (const [, gui] of this.guiRegistry.map) {
      switch (gui.type) {
        case 'folder': {
          break;
        }
        case 'controller': {
          gui.instance.updateDisplay();
          break;
        }
      }
    }
  }
}
