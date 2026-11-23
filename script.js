let cv = document.getElementById("c");
let cx = cv.getContext("2d");
let dp = window.devicePixelRatio || 1;

let ww, hh, sz, cols, rows, ox, oy;
let lt = 0;
let dt = 0;
let acc = 0;
let ms = 135;

let trn = [];
let dir = { x: 1, y: 0 };
let buf = [];

function fit() {
  dp = window.devicePixelRatio || 1;
  ww = window.innerWidth;
  hh = window.innerHeight;
  cv.width = ww * dp;
  cv.height = hh * dp;
  cv.style.width = ww + "px";
  cv.style.height = hh + "px";
  cx.setTransform(dp, 0, 0, dp, 0, 0);

  sz = ww < 768 ? Math.floor(ww / 18) : 24;
  cols = Math.floor(ww / sz);
  rows = Math.floor(hh / sz);
  ox = Math.floor((ww - cols * sz) / 2);
  oy = Math.floor((hh - rows * sz) / 2);

  seed();
}

function seed() {
  buf = [];
  dir = { x: 1, y: 0 };

  let sy = Math.floor(rows / 2);
  let sx = Math.floor(cols / 4);

  if (sx + 2 >= cols) sx = cols - 3;
  if (sx < 0) sx = 0;
  if (sy < 0) sy = 0;
  if (sy >= rows) sy = rows - 1;

  trn = [
    { x: sx + 2, y: sy },
    { x: sx + 1, y: sy },
    { x: sx, y: sy },
  ];
}

function turn(x, y) {
  let last = buf.length ? buf[buf.length - 1] : dir;

  if (last.x === x && last.y === y) return;
  if (last.x === -x && last.y === -y) return;

  if (buf.length < 3) buf.push({ x: x, y: y });
}

function move() {
  if (buf.length) dir = buf.shift();

  let hd = trn[0];
  let nx = hd.x + dir.x;
  let ny = hd.y + dir.y;

  if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return;

  trn.unshift({ x: nx, y: ny });
  trn.pop();
}

function loop(t) {
  dt = t - lt;
  lt = t;

  if (dt > 250) dt = 250;

  acc += dt;

  while (acc >= ms) {
    move();
    acc -= ms;
  }

  paint();
  requestAnimationFrame(loop);
}

function paint() {
  cx.fillStyle = "#f4e4c1";
  cx.fillRect(0, 0, ww, hh);

  cx.fillStyle = "rgba(40,30,20,0.08)";

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let px = ox + i * sz + sz / 2;
      let py = oy + j * sz + sz / 2;
      cx.beginPath();
      cx.arc(px, py, 1.2, 0, 6.283);
      cx.fill();
    }
  }

  cx.strokeStyle = "rgba(40,30,20,0.15)";
  cx.lineWidth = 1.5;
  cx.strokeRect(ox, oy, cols * sz, rows * sz);

  cx.fillStyle = "#241d17";

  for (let i = trn.length - 1; i >= 0; i--) {
    let p = trn[i];
    let x = ox + p.x * sz;
    let y = oy + p.y * sz;
    let pad = Math.max(2, sz * 0.12);

    rrect(x + pad, y + pad, sz - pad * 2, sz - pad * 2, Math.min(7, sz * 0.28));
    cx.fill();
  }
}

function rrect(x, y, w, h, r) {
  if (r > w / 2) r = w / 2;
  if (r > h / 2) r = h / 2;

  cx.beginPath();
  cx.moveTo(x + r, y);
  cx.arcTo(x + w, y, x + w, y + h, r);
  cx.arcTo(x + w, y + h, x, y + h, r);
  cx.arcTo(x, y + h, x, y, r);
  cx.arcTo(x, y, x + w, y, r);
  cx.closePath();
}

window.addEventListener("keydown", function (e) {
  let k = e.key.toLowerCase();

  if (k === "arrowup" || k === "w") {
    turn(0, -1);
    e.preventDefault();
    return;
  }

  if (k === "arrowdown" || k === "s") {
    turn(0, 1);
    e.preventDefault();
    return;
  }

  if (k === "arrowleft" || k === "a") {
    turn(-1, 0);
    e.preventDefault();
    return;
  }

  if (k === "arrowright" || k === "d") {
    turn(1, 0);
    e.preventDefault();
    return;
  }
});

window.addEventListener("resize", fit);

window.addEventListener("load", function () {
  fit();
  lt = performance.now();
  requestAnimationFrame(loop);
});

