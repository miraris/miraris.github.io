// maybe do sth with this too later, like use it for some kind of scaling
const range = 60 + Math.floor(Math.random() * Math.floor(180));
const links = document.getElementsByClassName('link');

for (let i = 0; i < links.length; i++) {
  const el = links[i];
  el.style.color = `hsl(${range + range / (i + 2)}, 100%, 20%)`;
}

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

const API_URL = 'https://api.miraris.moe';
const getImage = () => fetch(API_URL).then(res => res.json());

class Sketcher {
  constructor(image) {
    const data = JSON.parse(image);

    this.data = data;
    this.coords = [];
    this.state = {
      current: 0,
      max: 0,
      lightness: 50,
      opacity: 0.4,
    };
  }

  clear() {
    this.state.current = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  resize() {
    const {
      size: { width, height },
    } = this.state;
    this.state.maxs = findMax(this.data);

    const offLeft = width / 2 - this.state.maxs[0] / 2;
    const offTop = height / 2 - this.state.maxs[1] / 2;

    return chunk(this.data.map(arr => [arr[0] + offLeft, arr[1] + offTop]), this.data.length / 500);
  }

  setSize(size) {
    this.state.size = size;
    this.coords = this.resize();
    this.state.max = this.coords.length;
  }

  /**
   * There's a ~~bug~~ feature here, if draw method gets called multiple times
   * it'll speed up the sketch since we're in a loop already
   * and the method *will* get called multiple times, due to browser resizing
   * TODO: use generators instead
   */
  draw() {
    if (this.state.current >= this.state.max) return;

    const { current, size, lightness, opacity } = this.state;
    const pieces = this.coords[current];

    for (let i = 0; i < pieces.length; i++) {
      const value = pieces[i];
      const color = {
        h: value[0] / this.state.maxs[0] * range, // intentionally broken 8)
        s: 100 - (value[1] / size.height) * 100,
        l: lightness,
      };

      ctx.fillStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${opacity})`;
      ctx.fillRect(value[0], value[1], 1, 1);
    }

    this.state.current++;
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
