export class Canvas2D {
  domElement: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  constructor () {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.domElement = canvas;
    const ctx = canvas.getContext('2d');
    if (ctx !== null) {
      this.ctx = ctx;
    } else {
      throw Error('cannot initialize canvas context');
    }
    window.addEventListener('resize', () => {
      this.domElement.width = window.innerWidth;
      this.domElement.height = window.innerHeight;
    });
  }
}
