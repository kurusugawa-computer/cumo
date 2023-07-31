/// <reference path="index.d.ts" />
import SPINNER_SVG from './spinner.svg?raw';

export class Spinner {
  __elem: HTMLDivElement
  constructor (private container: HTMLElement) {
    this.__elem = document.createElement('div');
    this.__elem.innerHTML = SPINNER_SVG;
    this.__elem.className = 'cumo-spinner';
    this.__elem.style.display = 'none';
    this.container.appendChild(this.__elem);
  }

  show () {
    this.__elem.style.display = 'initial';
  }

  hide () {
    this.__elem.style.display = 'none';
  }
}
