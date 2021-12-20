import * as THREE from 'three';
import { Canvas2D } from './canvas2d';

export class Lineset {
  // positions: number[] // x,y,z,x,y,z,...
  // colors: number[] // r,g,b,r,g,b,...
  // indices: number[] // from,to,from,to,...
  colorsStr: string[] = [];
  UUID: string
  constructor (private positions: number[], private indices: number[], colors: number[], private widths: number[], uuid: string) {
    for (let i = 0; i + 2 < colors.length; i += 3) {
      const r = colors[i + 0];
      const g = colors[i + 1];
      const b = colors[i + 2];
      this.colorsStr[Math.floor(i / 3)] = 'rgb(' + r + ',' + g + ',' + b + ')';
    }
    this.UUID = uuid.toUpperCase();
  }

  render (canvas: Canvas2D, camera: THREE.Camera) {
    for (let i = 0; i * 2 + 1 < this.indices.length; i++) {
      const i0 = this.indices[i * 2 + 0];
      const i1 = this.indices[i * 2 + 1];

      const x0 = this.positions[i0 * 3 + 0];
      const y0 = this.positions[i0 * 3 + 1];
      const z0 = this.positions[i0 * 3 + 2];
      const x1 = this.positions[i1 * 3 + 0];
      const y1 = this.positions[i1 * 3 + 1];
      const z1 = this.positions[i1 * 3 + 2];

      const p0 = new THREE.Vector3(x0, y0, z0);
      const p1 = new THREE.Vector3(x1, y1, z1);
      p0.project(camera);
      p1.project(camera);

      const sx0 = (canvas.domElement.width / 2) * (p0.x + 1.0);
      const sy0 = (canvas.domElement.height / 2) * (-p0.y + 1.0);
      const sx1 = (canvas.domElement.width / 2) * (p1.x + 1.0);
      const sy1 = (canvas.domElement.height / 2) * (-p1.y + 1.0);

      canvas.ctx.save();

      canvas.ctx.beginPath();
      canvas.ctx.lineWidth = (i < this.widths.length) ? this.widths[i] : 1;
      canvas.ctx.strokeStyle = (i < this.colorsStr.length) ? this.colorsStr[i] : 'white';
      canvas.ctx.moveTo(sx0, sy0);
      canvas.ctx.lineTo(sx1, sy1);
      canvas.ctx.stroke();

      canvas.ctx.restore();
    }
  }
}
