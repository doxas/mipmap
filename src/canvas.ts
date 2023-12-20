import { Pane } from 'tweakpane';
import { ShaderProgram, WebGLUtility } from './webgl';

import * as vertexShaderSource from './shader/main.vert';
import * as fragmentShaderSource from './shader/main.frag';

const SQUARE_MAX_POWER = 11;
const SQUARE_MAX_LENGTH = Math.pow(2, SQUARE_MAX_POWER);

export class Renderer {
  private parent: HTMLElement;
  private canvas: HTMLCanvasElement;
  private context: WebGLRenderingContext;
  private console: HTMLElement;
  private sourceImage: HTMLImageElement;
  private renderedCanvas: HTMLCanvasElement;
  private power: number;
  private program: ShaderProgram;
  private texture: WebGLTexture;

  private previewScale: number;
  private uTextureBias: number;

  constructor(parent: HTMLElement) {
    this.parent = parent;
    this.canvas = document.querySelector('#webgl');
    this.context = this.canvas.getContext('webgl2');
    this.console = document.querySelector('#console');
    this.power = 0;

    this.previewScale = 0.5;
    this.uTextureBias = 0.0;

    this.eventSetting();
    this.paneSetting();
    this.init();
  }
  eventSetting(): void {
    const body = document.body;
    body.addEventListener('dragover', (evt) => {
      evt.preventDefault();
    }, false);
    body.addEventListener('drop', async (evt) => {
      evt.preventDefault();
      const files = evt.dataTransfer.files;
      if (files.length === 0) {
        return;
      }
      await this.fromFile(files[0]);
      this.update();
    }, false);
  }
  paneSetting(): void {
    const pane = new Pane();

    const generalFolder = pane.addFolder({title: 'general'});
    const scale = generalFolder.addBinding({'scale': this.previewScale}, 'scale', {
      min: 0.5,
      max: 4.0,
    }).on('change', (v) => {
      this.previewScale = v.value;
      this.transform();
    });
    const bias = generalFolder.addBinding({'bias': this.uTextureBias}, 'bias', {
      min: -100.0,
      max: 100.0,
    }).on('change', (v) => {
      this.uTextureBias = v.value;
      this.render();
    });
  }
  transform(): void {
    const s = this.canvas.height;
    const h = window.innerHeight;
    let translate = 0;
    if (s > h) {
      translate = (s - h) * (0.5 / this.previewScale);
    }
    this.canvas.style.transform = `scale(${this.previewScale}) translate(0px, -${translate}px)`;
  }
  init(): void {
    const gl = this.context;
    const position = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];
    const indices = [0, 2, 1, 1, 2, 3];
    const vbo = [WebGLUtility.createVbo(gl, position)];
    const ibo = WebGLUtility.createIbo(gl, indices);

    const option = {
      vertexShaderSource: vertexShaderSource.default,
      fragmentShaderSource: fragmentShaderSource.default,
      attribute: [
        'position',
      ],
      stride: [
        2,
      ],
      uniform: [
        'textureUnit',
        'textureBias',
      ],
      type: [
        'uniform1i',
        'uniform1f',
      ],
    };
    this.program = new ShaderProgram(gl, option);
    this.program.use();
    this.program.setAttribute(vbo, ibo);
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
  }
  update(): void {
    if (this.sourceImage == null) {return;}
    const gl = this.context;

    if (this.texture != null) {
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.deleteTexture(this.texture);
      this.texture = null;
    }
    this.texture = WebGLUtility.createTexture(gl, this.renderedCanvas);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // generate mipmap
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    for (let i = 1; i <= this.power; ++i) {
      const size = this.renderedCanvas.width / Math.pow(2, i);
      c.width = c.height = size;
      console.log(size);
      ctx.drawImage(this.renderedCanvas, 0, 0, size, size);
      gl.texImage2D(gl.TEXTURE_2D, i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    }

    this.resize();
    this.render();
  }
  resize(): void {
    if (this.power > 0) {
      const size = Math.pow(2, this.power);
      this.canvas.width = size;
      this.canvas.height = size;
    }
    this.transform();
  }
  render(): void {
    const gl = this.context;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.program.setUniform([
      0,
      this.uTextureBias,
    ]);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
  fromFile(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const url = reader.result as string;
        this.sourceImage = new Image();
        this.sourceImage.addEventListener('load', () => {
          const img = this.sourceImage as HTMLImageElement;
          const c = document.createElement('canvas');
          const cx = c.getContext('2d');
          const nw = img.naturalWidth;
          const nh = img.naturalHeight;
          let width = 0;
          let height = 0;
          let counter = 0;
          while (true) {
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
          // convert to square, less than equal SQUARE_MAX_LENGTH
          const m = Math.min(Math.max(width, height), SQUARE_MAX_LENGTH);
          c.width = m;
          c.height = m;
          cx.drawImage(this.sourceImage, 0, 0, m, m);
          this.renderedCanvas = c;
          if (m === SQUARE_MAX_LENGTH) {
            this.power = SQUARE_MAX_POWER;
          } else {
            this.power = counter;
          }
          resolve(this.renderedCanvas);
        }, false);
        this.sourceImage.src = url;
      }, false);
      reader.readAsDataURL(file);
    });
  }

  static isPower(v: number): boolean {
    if (v === 0) {
      return false;
    } else {
      return (v & (v - 1)) === 0;
    }
  }
}
