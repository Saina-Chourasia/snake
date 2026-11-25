let cv = document.getElementById("c");
let cx = cv.getContext("2d");
let dp = window.devicePixelRatio || 1;

let ww, hh, sz, cols, rows, ox, oy, barH;
let lt = 0;
let dt = 0;
let acc = 0;
let ms = 150;

let scr = "title";

let trn = [];
let dir = { x: 1, y: 0 };
let buf = [];

let pts = 0;
let best = 0;
let dist = 0;
let lastNm = "";
let pax = null;
let flash = "";
let flashAt = 0;
let rushAt = 0;

let mx = -1;
let my = -1;
let hoverId = null;
let pressId = null;
let btns = [];

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

  if (scr !== "crash") seed();
}

function seed() {
  buf = [];
  dir = { x: 1, y: 0 };
  pts = 0;
  dist = 0;
  lastNm = "";
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

function startRun() {
  seed();
  acc = 0;
  lt = performance.now();
  scr = "game";
  hoverId = null;
  pressId = null;
}

function doPause() {
  if (scr !== "game") return;
  scr = "pause";
  hoverId = null;
  pressId = null;
}

function doResume() {
  if (scr !== "pause") return;
  acc = 0;
  lt = performance.now();
  scr = "game";
  hoverId = null;
  pressId = null;
}

function doRestart() {
  startRun();
}

function doQuit() {
  scr = "title";
  hoverId = null;
  pressId = null;
}

function crash() {
  if (pts > best) best = pts;
  scr = "crash";
  hoverId = null;
  pressId = null;
}

function move() {
  if (buf.length) dir = buf.shift();
  if (!pax) spawn();

  let hd = trn[0];
  let nx = hd.x + dir.x;
  let ny = hd.y + dir.y;

  if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
    crash();
    return;
  }

  for (let i = 0; i < trn.length - 1; i++) {
    if (trn[i].x === nx && trn[i].y === ny) {
      crash();
      return;
    }
  }

  let got = pax && pax.x === nx && pax.y === ny;

  trn.unshift({ x: nx, y: ny });
  dist++;

  if (got) {
    pts++;
    lastNm = pax.nm;
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

  if (scr === "game") {
    while (acc >= ms && scr === "game") {
      move();
      acc -= ms;
    }
  }

  paint(t);
  requestAnimationFrame(loop);
}

function paint(now) {
  btns = [];

  if (scr === "title") {
    paintTitle(now);
  } else if (scr === "game") {
    paintGame(now);
  } else if (scr === "pause") {
    paintGame(now);
    paintPause(now);
  } else if (scr === "crash") {
    paintCrash(now);
  }

  drawBtns();
}

function paintTitle(now) {
  cx.fillStyle = "#f4e4c1";
  cx.fillRect(0, 0, ww, hh);

  mapDoodle();

  let lg = ww < 768 ? 44 : 76;
  let ty = hh * 0.24;

  cx.textAlign = "center";
  cx.textBaseline = "middle";

  cx.font = "900 " + lg + "px ui-monospace, monospace";

  cx.fillStyle = "rgba(209,58,42,.55)";
  cx.fillText("SNAKE", ww / 2 + 3, ty + 3);

  cx.fillStyle = "#241d17";
  cx.fillText("SNAKE", ww / 2, ty);

  cx.font = "600 " + (ww < 768 ? 11 : 13) + "px ui-monospace, monospace";
  cx.fillStyle = "rgba(36,29,23,.62)";
  cx.fillText("the last commute", ww / 2, ty + lg * 0.72);

  let bw = Math.min(560, ww * 0.92);
  let bh = ww < 768 ? 46 : 54;
  let bx = (ww - bw) / 2;
  let by = hh * 0.42;

  cx.fillStyle = "#19130d";
  rrect(bx, by, bw, bh, 8);
  cx.fill();

  cx.strokeStyle = "#241d17";
  cx.lineWidth = 2;
  rrect(bx, by, bw, bh, 8);
  cx.stroke();

  let msg = "BEST COMMUTE: " + best + " PASSENGERS · 11:47 PM";
  let fs = ww < 768 ? 13 : 16;

  cx.font = "700 " + fs + "px ui-monospace, monospace";

  while (cx.measureText(msg).width > bw - 28 && fs > 9) {
    fs--;
    cx.font = "700 " + fs + "px ui-monospace, monospace";
  }

  cx.fillStyle = "#e8a23d";
  cx.fillText(msg, ww / 2, by + bh / 2 + 1);

  let sw = Math.min(260, ww * 0.72);
  let sh = 54;

  addBtn(
    "start",
    "START",
    (ww - sw) / 2,
    hh * 0.58,
    sw,
    sh,
    startRun,
    true,
    18,
  );

  cx.font = "600 " + (ww < 768 ? 11 : 12) + "px ui-monospace, monospace";
  cx.fillStyle = "rgba(36,29,23,.58)";
  cx.fillText("ENTER starts · SPACE pauses", ww / 2, hh * 0.58 + sh + 32);
}

function paintGame(now) {
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

  if (scr === "game") {
    let mob = ww < 768;
    let bw = 40;
    let bh = mob ? 36 : 30;
    let bx = ww - bw - 10;
    let by = (barH - bh) / 2;

    addBtn("pause", "II", bx, by, bw, bh, doPause, false, 12);
  }
}

function paintPause(now) {
  cx.fillStyle = "rgba(22,17,12,.38)";
  cx.fillRect(0, 0, ww, hh);

  if (trn.length) {
    let hd = trn[0];
    let hx = ox + hd.x * sz + sz / 2;
    let hy = oy + hd.y * sz;

    cx.fillStyle = "#f4e4c1";
    cx.font = "700 12px ui-monospace, monospace";
    cx.textAlign = "left";
    cx.textBaseline = "alphabetic";
    cx.fillText("zzz", hx + sz * 0.35, hy - sz * 0.18);
  }

  let cw = Math.min(320, ww * 0.9);
  let ch = 264;
  let cxp = (ww - cw) / 2;
  let cyp = Math.max(60, (hh - ch) / 2);

  panel(cxp, cyp, cw, ch);

  cx.fillStyle = "#241d17";
  cx.font = "900 24px ui-monospace, monospace";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText("SERVICE HELD", ww / 2, cyp + 52);

  let bw = Math.min(240, cw - 50);
  let bx = (ww - bw) / 2;
  let by = cyp + 92;

  addBtn("resume", "RESUME", bx, by, bw, 44, doResume, false, 14);
  addBtn("restart", "RESTART", bx, by + 58, bw, 44, doRestart, false, 14);
  addBtn("quit", "QUIT", bx, by + 116, bw, 44, doQuit, false, 14);
}

function paintCrash(now) {
  cx.fillStyle = "#f4e4c1";
  cx.fillRect(0, 0, ww, hh);

  cx.fillStyle = "rgba(40,30,20,0.05)";

  for (let y = 18; y < hh; y += 26) {
    cx.fillRect(0, y, ww, 1);
  }

  let mob = ww < 768;
  let cw = Math.min(600, ww * 0.94);
  let ch = mob ? 430 : 390;
  let x = (ww - cw) / 2;
  let y = Math.max(40, (hh - ch) / 2);

  panel(x, y, cw, ch);

  cx.textAlign = "center";
  cx.textBaseline = "middle";

  cx.fillStyle = "#241d17";
  cx.font = "700 " + (mob ? 11 : 13) + "px ui-monospace, monospace";
  cx.fillText("TRANSIT AUTHORITY", ww / 2, y + 34);

  cx.fillStyle = "rgba(36,29,23,.28)";
  cx.fillRect(x + 36, y + 52, cw - 72, 1);

  cx.font = "600 " + (mob ? 14 : 17) + "px ui-monospace, monospace";
  cx.fillText("We apologize for the disruption", ww / 2, y + 88);
  cx.fillText("to your evening.", ww / 2, y + 112);

  let sx = x + (mob ? 24 : 56);
  let sy = y + 162;

  cx.textAlign = "left";
  cx.font = "700 " + (mob ? 12 : 14) + "px ui-monospace, monospace";
  cx.fillStyle = "#241d17";

  cx.fillText("PASSENGERS CARRIED  " + pts, sx, sy);
  cx.fillText("COMMUTE LENGTH  " + dist + " SECTIONS", sx, sy + 28);
  cx.fillText("CAUSE OF DELAY  DRIVER ERROR", sx, sy + 56);
  cx.fillText("LAST PASSENGER", sx, sy + 94);

  let nm = lastNm || "no passengers";

  if (mob && nm.length > 18) nm = nm.slice(0, 17) + "...";
  if (!mob && nm.length > 26) nm = nm.slice(0, 25) + "...";

  let nx = sx + (mob ? 112 : 158);

  cx.fillStyle = "#d13a2a";
  cx.fillText(nm, nx, sy + 94);

  let tw = cx.measureText(nm).width;

  cx.strokeStyle = "#d13a2a";
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(nx, sy + 94);
  cx.lineTo(nx + tw, sy + 94);
  cx.stroke();

  let bw = Math.min(280, cw * 0.82);

  addBtn(
    "retry",
    "RESTORE SERVICE",
    (ww - bw) / 2,
    y + ch - 74,
    bw,
    48,
    startRun,
    true,
    15,
  );
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

    speedo(ww - 150, 20, lvl);

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

    speedo(ww - 190, barH / 2, lvl);
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

function mapDoodle() {
  cx.save();
  cx.globalAlpha = 0.16;
  cx.lineWidth = 4;

  cx.strokeStyle = "#241d17";
  cx.beginPath();
  cx.moveTo(ww * 0.08, hh * 0.22);
  cx.lineTo(ww * 0.32, hh * 0.22);
  cx.lineTo(ww * 0.46, hh * 0.36);
  cx.lineTo(ww * 0.72, hh * 0.36);
  cx.stroke();

  cx.strokeStyle = "#d13a2a";
  cx.beginPath();
  cx.moveTo(ww * 0.16, hh * 0.72);
  cx.lineTo(ww * 0.38, hh * 0.58);
  cx.lineTo(ww * 0.62, hh * 0.58);
  cx.lineTo(ww * 0.86, hh * 0.72);
  cx.stroke();

  cx.fillStyle = "#241d17";

  let a = [
    [0.08, 0.22],
    [0.32, 0.22],
    [0.46, 0.36],
    [0.72, 0.36],
    [0.16, 0.72],
    [0.38, 0.58],
    [0.62, 0.58],
    [0.86, 0.72],
  ];

  for (let i = 0; i < a.length; i++) {
    cx.beginPath();
    cx.arc(ww * a[i][0], hh * a[i][1], 4, 0, 6.283);
    cx.fill();
  }

  cx.restore();
}

function panel(x, y, w, h) {
  cx.fillStyle = "rgba(247,236,216,.97)";
  cx.strokeStyle = "#241d17";
  cx.lineWidth = 2;

  rrect(x, y, w, h, 10);
  cx.fill();
  cx.stroke();
}

function addBtn(id, label, x, y, w, h, fn, red, fs) {
  btns.push({
    id: id,
    label: label,
    x: x,
    y: y,
    w: w,
    h: h,
    fn: fn,
    red: red,
    fs: fs,
  });
}

function drawBtns() {
  for (let i = 0; i < btns.length; i++) {
    drawBtn(btns[i]);
  }
}

function drawBtn(b) {
  let hov = hoverId === b.id;
  let dn = pressId === b.id;
  let y = b.y + (dn ? 2 : 0);

  cx.fillStyle = hov ? "rgba(209,58,42,.22)" : "rgba(36,29,23,.12)";
  rrect(b.x + 3, y + 4, b.w, b.h, 8);
  cx.fill();

  cx.fillStyle = b.red ? "#d13a2a" : "#f7ecd8";
  cx.strokeStyle = hov ? "#d13a2a" : "#241d17";
  cx.lineWidth = 2;

  rrect(b.x, y, b.w, b.h, 8);
  cx.fill();
  cx.stroke();

  cx.fillStyle = b.red ? "#f4e4c1" : "#241d17";
  cx.font = "800 " + (b.fs || 16) + "px ui-monospace, monospace";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText(b.label, b.x + b.w / 2, y + b.h / 2 + 1);
}

function findBtn(x, y) {
  for (let i = btns.length - 1; i >= 0; i--) {
    let b = btns[i];

    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }

  return null;
}

function ptr(e) {
  let r = cv.getBoundingClientRect();
  mx = e.clientX - r.left;
  my = e.clientY - r.top;
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

cv.addEventListener("pointermove", function (e) {
  ptr(e);

  let b = findBtn(mx, my);

  hoverId = b ? b.id : null;
  cv.style.cursor = b ? "pointer" : "default";
});

cv.addEventListener("pointerdown", function (e) {
  ptr(e);

  let b = findBtn(mx, my);

  pressId = b ? b.id : null;

  if (b) e.preventDefault();
});

cv.addEventListener("pointerup", function (e) {
  ptr(e);

  let b = findBtn(mx, my);

  if (b && pressId === b.id && b.fn) b.fn();

  pressId = null;
});

cv.addEventListener("pointerleave", function () {
  mx = -1;
  my = -1;
  hoverId = null;
  pressId = null;
  cv.style.cursor = "default";
});

window.addEventListener("keydown", function (e) {
  let k = e.key;

  if (e.repeat && (k === " " || k === "Enter")) return;

  if (k === "Enter") {
    if (scr === "title" || scr === "crash") startRun();
    e.preventDefault();
    return;
  }

  if (k === " ") {
    if (scr === "game") doPause();
    else if (scr === "pause") doResume();
    e.preventDefault();
    return;
  }

  if (scr !== "game") return;

  let key = k.toLowerCase();

  if (key === "arrowup" || key === "w") {
    turn(0, -1);
    e.preventDefault();
    return;
  }

  if (key === "arrowdown" || key === "s") {
    turn(0, 1);
    e.preventDefault();
    return;
  }

  if (key === "arrowleft" || key === "a") {
    turn(-1, 0);
    e.preventDefault();
    return;
  }

  if (key === "arrowright" || key === "d") {
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
