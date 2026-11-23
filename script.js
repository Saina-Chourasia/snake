let cv = document.getElementById("c");
let cx = cv.getContext("2d");
let dp = window.devicePixelRatio || 1;

let ww, hh, sz, cols, rows, ox, oy, barH;
let lt = 0;
let dt = 0;
let acc = 0;
let ms = 150;

let trn = [];
let dir = { x: 1, y: 0 };
let buf = [];

let pts = 0;
let pax = null;
let flash = "";
let flashAt = 0;
let rushAt = 0;

let folks = [
  "Margaret",
  "Dave with the soup",
  "a guy holding a lamp",
  "two raccoons in a trench coat",
  "Pearl",
  "night shift nurse",
  "man with one shoe",
  "quiet saxophonist",
  "lady with 12 bags",
  "Gary",
  "someone's grandma",
  "pigeon in a hat",
  "off-duty conductor",
  "boy with a flashlight",
  "woman reading a map upside down",
  "the soup guy's brother",
  "insomniac",
  "person humming elevator music",
  "guy who knows a guy",
  "cloud in a raincoat",
];

function fit() {
  dp = window.devicePixelRatio || 1;
  ww = window.innerWidth;
  hh = window.innerHeight;
  cv.width = ww * dp;
  cv.height = hh * dp;
  cv.style.width = ww + "px";
  cv.style.height = hh + "px";
  cx.setTransform(dp, 0, 0, dp, 0, 0);

  barH = ww < 768 ? 64 : 48;
  sz = ww < 768 ? Math.floor(ww / 18) : 24;

  cols = Math.floor(ww / sz);
  rows = Math.floor((hh - barH) / sz);

  if (cols < 8) cols = 8;
  if (rows < 6) rows = 6;

  ox = Math.floor((ww - cols * sz) / 2);
  oy = barH + Math.floor((hh - barH - rows * sz) / 2);

  seed();
}

function seed() {
  buf = [];
  dir = { x: 1, y: 0 };
  pts = 0;
  ms = 150;
  flash = "";
  flashAt = 0;
  rushAt = 0;
  pax = null;

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

  spawn();
}

function spawn() {
  if (!cols || !rows || trn.length >= cols * rows) {
    pax = null;
    return;
  }

  let x, y, ok;

  do {
    x = (Math.random() * cols) | 0;
    y = (Math.random() * rows) | 0;
    ok = true;

    for (let i = 0; i < trn.length; i++) {
      if (trn[i].x === x && trn[i].y === y) {
        ok = false;
        break;
      }
    }
  } while (!ok);

  pax = {
    x: x,
    y: y,
    nm: folks[(Math.random() * folks.length) | 0],
  };
}

function turn(x, y) {
  let last = buf.length ? buf[buf.length - 1] : dir;

  if (last.x === x && last.y === y) return;
  if (last.x === -x && last.y === -y) return;

  if (buf.length < 3) buf.push({ x: x, y: y });
}

function move() {
  if (buf.length) dir = buf.shift();
  if (!pax) spawn();

  let hd = trn[0];
  let nx = hd.x + dir.x;
  let ny = hd.y + dir.y;

  if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return;

  for (let i = 0; i < trn.length - 1; i++) {
    if (trn[i].x === nx && trn[i].y === ny) return;
  }

  let got = pax && pax.x === nx && pax.y === ny;

  trn.unshift({ x: nx, y: ny });

  if (got) {
    pts++;
    flash = pax.nm + " boarded";
    flashAt = performance.now();

    let lvl = Math.floor(pts / 5);

    if (pts % 5 === 0) rushAt = performance.now();

    ms = Math.max(70, 150 - Math.min(8, lvl) * 12);

    spawn();
  } else {
    trn.pop();
  }
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

  paint(t);
  requestAnimationFrame(loop);
}

function paint(now) {
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

  drawPax(now);
  drawTrain();
  hud(now);
  stamp(now);
}

function drawPax(now) {
  if (!pax) return;

  let x = ox + pax.x * sz + sz / 2;
  let y = oy + pax.y * sz + sz / 2;
  let pulse = 1 + Math.sin(now / 170) * 0.12;

  cx.fillStyle = "rgba(209,58,42,.16)";
  cx.beginPath();
  cx.arc(x, y + sz * 0.08, sz * 0.3 * pulse, 0, 6.283);
  cx.fill();

  cx.fillStyle = "#241d17";
  cx.fillRect(x - sz * 0.3, y - sz * 0.46, sz * 0.6, sz * 0.22);
  cx.fillRect(x - 1, y - sz * 0.24, 2, sz * 0.36);

  cx.fillStyle = "#f4e4c1";
  cx.fillRect(x - sz * 0.22, y - sz * 0.41, sz * 0.44, sz * 0.12);

  cx.fillStyle = "#d13a2a";
  cx.beginPath();
  cx.arc(x, y + sz * 0.08, Math.max(2, sz * 0.13), 0, 6.283);
  cx.fill();
}

function drawTrain() {
  for (let i = trn.length - 1; i >= 0; i--) {
    let p = trn[i];
    let x = ox + p.x * sz;
    let y = oy + p.y * sz;
    let pad = Math.max(2, sz * 0.1);
    let inner = sz - pad * 2;

    cx.fillStyle = "#241d17";
    rrect(x + pad, y + pad, inner, inner, Math.min(7, sz * 0.26));
    cx.fill();

    if (i === 0) {
      engine(x, y);
    } else {
      car(p, i, x, y);
    }
  }
}

function engine(x, y) {
  let pd = Math.max(2, sz * 0.1);
  let fw, fh, wx, wy;

  if (dir.x !== 0) {
    fw = Math.max(3, sz * 0.18);
    fh = Math.max(5, sz * 0.46);
    wx = dir.x > 0 ? x + sz - pd - fw - 1 : x + pd + 1;
    wy = y + (sz - fh) / 2;
  } else {
    fw = Math.max(5, sz * 0.46);
    fh = Math.max(3, sz * 0.18);
    wx = x + (sz - fw) / 2;
    wy = dir.y > 0 ? y + sz - pd - fh - 1 : y + pd + 1;
  }

  cx.fillStyle = "#f4e4c1";
  rrect(wx, wy, fw, fh, 2);
  cx.fill();

  cx.fillStyle = "#d13a2a";

  let bar = Math.max(2, sz * 0.08);

  if (dir.x !== 0) {
    cx.fillRect(
      dir.x > 0 ? x + sz - pd - bar : x + pd,
      y + sz * 0.3,
      bar,
      sz * 0.4,
    );
  } else {
    cx.fillRect(
      x + sz * 0.3,
      dir.y > 0 ? y + sz - pd - bar : y + pd,
      sz * 0.4,
      bar,
    );
  }
}

function car(p, i, x, y) {
  let prev = trn[i - 1];
  let horiz = p.x !== prev.x;
  let ws = Math.max(3, sz * 0.22);
  let off = 0.26;

  if (horiz) {
    win(x + sz * off - ws / 2, y + (sz - ws) / 2, ws);
    win(x + sz * (1 - off) - ws / 2, y + (sz - ws) / 2, ws);
  } else {
    win(x + (sz - ws) / 2, y + sz * off - ws / 2, ws);
    win(x + (sz - ws) / 2, y + sz * (1 - off) - ws / 2, ws);
  }
}

function win(x, y, s) {
  cx.fillStyle = "#f4e4c1";
  rrect(x, y, s, s, Math.min(2, s * 0.3));
  cx.fill();

  face(x + s / 2, y + s / 2, Math.max(1, s * 0.3));
}

function face(x, y, r) {
  cx.fillStyle = "#241d17";
  cx.beginPath();
  cx.arc(x, y + r * 0.25, r, 0, 6.283);
  cx.fill();

  if (r > 1.2) {
    cx.fillStyle = "#f4e4c1";

    let er = r * 0.24;

    cx.beginPath();
    cx.arc(x - r * 0.35, y, er, 0, 6.283);
    cx.fill();

    cx.beginPath();
    cx.arc(x + r * 0.35, y, er, 0, 6.283);
    cx.fill();
  }
}

function hud(now) {
  let mob = ww < 768;

  cx.fillStyle = "rgba(244,228,193,.93)";
  cx.fillRect(0, 0, ww, barH);

  cx.strokeStyle = "rgba(36,29,23,.35)";
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(0, barH);
  cx.lineTo(ww, barH);
  cx.stroke();

  let lvl = Math.min(8, Math.floor(pts / 5));
  let fs = mob ? 12 : 14;

  cx.fillStyle = "#241d17";
  cx.textBaseline = "middle";
  cx.font = "700 " + fs + "px ui-monospace, monospace";

  if (mob) {
    cx.textAlign = "left";
    cx.fillText("SCORE " + pts, 12, 20);
    cx.fillText("PAX " + pts, 12, 46);

    speedo(ww - 88, 20, lvl);

    if (now - flashAt < 1300 && flash) {
      let msg = flash;

      if (msg.length > 24) msg = msg.slice(0, 23) + "...";

      cx.textAlign = "right";
      cx.fillStyle = "#d13a2a";
      cx.fillText(msg, ww - 12, 46);
    }
  } else {
    cx.textAlign = "left";
    cx.fillText("SCORE " + pts, 16, barH / 2);
    cx.fillText("PAX " + pts, 130, barH / 2);

    if (now - flashAt < 1300 && flash) {
      let msg = flash;

      if (msg.length > 42) msg = msg.slice(0, 41) + "...";

      cx.textAlign = "center";
      cx.fillStyle = "#d13a2a";
      cx.fillText(msg, ww / 2, barH / 2);
    }

    speedo(ww - 100, barH / 2, lvl);
  }
}

function speedo(x, y, lvl) {
  cx.textAlign = "right";
  cx.fillStyle = "#241d17";
  cx.fillText("SPD", x - 10, y);

  let bw = ww < 768 ? 5 : 6;
  let gap = 3;

  for (let i = 0; i < 8; i++) {
    cx.fillStyle = i < lvl ? "#d13a2a" : "rgba(36,29,23,.22)";
    cx.fillRect(x + i * (bw + gap), y - 5, bw, 10);
  }
}

function stamp(now) {
  if (!rushAt) return;

  let age = now - rushAt;

  if (age > 900) return;

  let s = age < 130 ? 1.8 - (age / 130) * 0.8 : 1;
  let a = age > 700 ? 1 - (age - 700) / 200 : 1;

  cx.save();
  cx.translate(ww / 2, hh * 0.34);
  cx.rotate(-0.12);
  cx.scale(s, s);
  cx.globalAlpha = a;

  let w = ww < 768 ? 150 : 190;
  let h = ww < 768 ? 44 : 54;

  cx.fillStyle = "rgba(209,58,42,.08)";
  cx.strokeStyle = "#d13a2a";
  cx.lineWidth = 3;

  rrect(-w / 2, -h / 2, w, h, 8);
  cx.fill();
  cx.stroke();

  cx.fillStyle = "#d13a2a";
  cx.font = "900 " + (ww < 768 ? 18 : 24) + "px ui-monospace, monospace";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText("RUSH HOUR", 0, 1);

  cx.restore();
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
