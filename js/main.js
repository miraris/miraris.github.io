const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

const chunk = (arr, size) => {
  const temparray = [];

  for (let i = 0, j = arr.length; i < j; i += size) {
    temparray.push(arr.slice(i, i + size));
  }
  return temparray;
};

const findMax = (arr) => {
  let mX = arr[0][0];
  let mY = arr[0][1];

  const len = arr.length;
  for (let i = 1; i < len; i++) {
    const v = arr[i][0];
    const w = arr[i][1];

    mX = v > mX ? v : mX;
    mY = w > mY ? w : mY;
  }

  return [mX, mY];
};

const API_URL = 'http://api.lineart.localhost';
const getImage = () => fetch(API_URL).then(res => res.json());

class Sketcher {
  constructor(image) {
    const data = JSON.parse(image);

    this.data = data;
    this.cur = 0;
    this.coords = [];
    this.max = 0;
    this.lightness = 50;
  }

  clear() {
    this.cur = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  resize() {
    const mins = findMax(this.data);
    const offLeft = this.size.width / 2 - mins[0] / 2;
    const offTop = this.size.height / 2 - mins[1] / 2;

    return chunk(this.data.map(arr => [arr[0] + offLeft, arr[1] + offTop]), this.data.length / 500);
  }

  setSize(size) {
    this.size = size;
    this.coords = this.resize();
    this.max = this.coords.length;
  }

  /**
   * There's a ~~bug~~ feature here, if draw method gets called multiple times
   * it'll speed up the sketch since we're in a loop already
   * and the method *will* get called multiple times, due to browser resizing
   */
  draw() {
    if (this.cur >= this.max) return;

    const pieces = this.coords[this.cur];

    for (let i = 0; i < pieces.length; i++) {
      const value = pieces[i];
      const h = (value[0] / canvas.width) * 360;
      const s = 100 - value[1] / canvas.height;

      ctx.fillStyle = `hsla(${h}, ${s}%, ${this.lightness}%, 0.4)`;
      ctx.fillRect(value[0], value[1], 1, 1);
    }

    this.cur++;
    requestAnimationFrame(() => this.draw());
  }
}

const resizeCanvas = (sketcher) => {
  const size = { width: window.innerWidth, height: window.innerHeight };
  canvas.width = size.width;
  canvas.height = size.height;

  sketcher.setSize(size);
  sketcher.clear();
  sketcher.draw();
};

getImage().then((res) => {
  const image = res[0].data;
  const sketcher = new Sketcher(image);
  const evt = new CustomEvent('customResize', { detail: sketcher });

  window.addEventListener('customResize', e => resizeCanvas(e.detail));
  window.addEventListener('resize', () => window.dispatchEvent(evt));

  resizeCanvas(sketcher);
});
