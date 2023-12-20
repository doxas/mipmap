import { Pane } from 'tweakpane';
import { ShaderProgram, WebGLUtility } from './webgl';

import * as vertexShaderSource from './shader/main.vert';
import * as fragmentShaderSource from './shader/main.frag';

export class Renderer {
  private parent: HTMLElement;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private console: HTMLElement;

  constructor(parent: HTMLElement) {
    this.parent = parent;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.console = document.querySelector('#console');
  }
  paneSetting(): void {
    const pane = new Pane();

    const generalFolder = pane.addFolder({title: 'general'});
    const creviceX = generalFolder.addBinding({'crevice-x': null}, 'crevice-x', {
      min: 0,
      max: 0.5,
    }).on('change', (v) => { return; });
  }
  init(): void {
  }
  update(): void {
  }
  render(): void {
  }
  fromFile(file: File): Promise<HTMLImageElement | HTMLCanvasElement | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const url = reader.result as string;
        const image = new Image();
        let rendered = null;
        image.addEventListener('load', () => {
          const img = image as HTMLImageElement;
          if (Renderer.isPower(img.naturalWidth) !== true || Renderer.isPower(img.naturalHeight) !== true) {
            const c = document.createElement('canvas');
            const cx = c.getContext('2d');
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;
            let width = 0;
            let height = 0;
            let counter = 0;
            while(true) {
              ++counter;
              const v = Math.pow(2, counter);
              if (width === 0) {
                if (nw < v) {
                  width = v;
                }
              }
              if (height === 0) {
                if (nh < v) {
                  height = v;
                }
              }
              if (width !== 0 && height !== 0) {
                break;
              }
            }
            c.width = width;
            c.height = height;
            cx.drawImage(image, 0, 0, width, height);
            rendered = c;
          }
          resolve(rendered);
        }, false);
        image.src = url;
      }, false);
      reader.readAsDataURL(file);
    });
  }
  eventSetting(): void {
  }
  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  export(): void {
  }

  static isPower(v: number): boolean {
    if (v === 0) {
      return false;
    } else {
      return (v & (v - 1)) === 0;
    }
  }
  static downloadJson(value): void {
    const isString = Object.prototype.toString.call(value) === '[object String]';
    const v = isString === true ? value : JSON.stringify(value, null, '  ');
    const blob = new Blob([v], {type: 'application\/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', 'mipmap.json');
    anchor.click();
    URL.revokeObjectURL(url);
  }
  static importJson(): Promise<any> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.addEventListener('change', () => {
        if (input.files[0] == null) {
          reject();
          return;
        }
        const file = input.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          const text = reader.result as string;
          resolve(JSON.parse(text));
        });
        reader.readAsText(file);
      }, false);
      input.click();
    });
  }

}
