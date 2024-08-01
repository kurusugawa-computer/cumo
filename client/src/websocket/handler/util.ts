import * as BABYLON from '@babylonjs/core';
import { GUI } from 'dat.gui';
import { VecXYZf } from '../../protobuf/client';

export const DefaultUUID = {
  CustomRoot: '00000000-0000-0000-0000-000000000000',
  Root: '00000000-0000-0000-0000-000000000001',
  Controls: '00000000-0000-0000-0000-000000000002',
  Camera: '00000000-0000-0000-0000-000000000003',
  RotateSpeed: '00000000-0000-0000-0000-000000000101',
  ZoomSpeed: '00000000-0000-0000-0000-000000000102',
  PanSpeed: '00000000-0000-0000-0000-000000000103',
  UsePerspective: '00000000-0000-0000-0000-000000000201'
};

// ラベルが隠れないように画面の半分までGUIの横幅を広げる
export function adjustControlPanelWidthFromContent (gui: GUI) {
  const labels = document.querySelectorAll<HTMLDivElement>('.dg .property-name').values();
  let maxWidth = 0;
  const ctx = document.createElement('canvas').getContext('2d');
  if (ctx === null) return;
  for (const l of labels) {
    ctx.font = window.getComputedStyle(l).font;
    const m = ctx.measureText(l.innerText);
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    maxWidth = Math.max(w, maxWidth);
  }
  const mainWidth = Math.ceil(maxWidth / 0.4);
  const title = document.querySelector<HTMLLIElement>('.dg li.title');
  const padding = (() => {
    if (title === null) return 20;
    const s = window.getComputedStyle(title);
    // computed length is always in the form '*px'
    return Number.parseFloat(s.paddingLeft) + Number.parseFloat(s.paddingRight);
  })();
  // +1 for dat.gui bugs
  // sometimes the actual width will be 1px less than the passed value
  gui.width = Math.max(gui.width, Math.min(mainWidth + padding + 1, window.innerWidth / 2));
}

export function Vector32VecXYZf (v: BABYLON.Vector3): VecXYZf {
  return new VecXYZf({
    x: v.x,
    y: v.y,
    z: v.z
  });
}

export type PropertyType =
  number |
  string |
  boolean
