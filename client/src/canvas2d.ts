export class Canvas2D {
  domElement: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  constructor () {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    this.domElement = canvas;
    const ctx = canvas.getContext('2d');
    if (ctx !== null) {
      this.ctx = ctx;
    } else {
      throw Error('cannot initialize canvas context');
    }
    window.addEventListener('resize', () => {
      this.domElement.width = window.innerWidth * window.devicePixelRatio;
      this.domElement.height = window.innerHeight * window.devicePixelRatio;
    });
  }
}
