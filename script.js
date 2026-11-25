let cv = document.getElementById("c");
let cx = cv.getContext("2d");
let dp = window.devicePixelRatio || 1;

let ww, hh, sz, cols, rows, ox, oy, barH;
let pw = 0;
let ph = 0;
let lt = 0;
let dt = 0;
let acc = 0;
let ms = 150;
let base = 150;

let scr = "title";
let setFrom = "title";
let notice = "";
let deadAt = 0;
let shakeAt = -9999;

let trn = [];
let dir = { x: 1, y: 0 };
let buf = [];

let pts = 0;
let dist = 0;
let lastNm = "";
let pax = null;
let flash = "";
let flashAt = 0;
let rushAt = 0;
let toast = "";
let toastAt = 0;
let bits = [];

let mx = -1;
let my = -1;
let hoverId = null;
let pressId = null;
let btns = [];
let vx = 0;
let vy = 0;
let vk = 1;

let tx = 0;
let ty = 0;
let swOn = false;
let ac = null;

let mem = {
  bestScore: 0,
  bestLength: 0,
  totalRides: 0,
  totalPassengers: 0,
  manifest: [],
  set: {
    snd: true,
    ctl: "keys",
    spd: "normal",
  },
  run: {
    on: false,
    pts: 0,
    dist: 0,
    nm: "",
  },
};

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
  pw = ww;
  ph = hh;

  cv.width = Math.round(ww * dp);
  cv.height = Math.round(hh * dp);
  cv.style.width = ww + "px";
  cv.style.height = hh + "px";
  cx.setTransform(dp, 0, 0, dp, 0, 0);

  let mob = ww < 768;

  barH = mob ? 64 : 48;

  let room = hh - barH - 10;

  sz = mob ? Math.min(28, Math.max(14, Math.floor(ww / 18))) : 24;

  if (Math.floor(ww / sz) < 10) sz = Math.max(10, Math.floor(ww / 10));
  if (Math.floor(room / sz) < 8) sz = Math.max(10, Math.floor(room / 8));

  cols = Math.max(6, Math.floor(ww / sz));
  rows = Math.max(6, Math.floor(room / sz));

  ox = Math.floor((ww - cols * sz) / 2);
  oy = barH + Math.floor((room - rows * sz) / 2);

  if (ox < 0) ox = 0;
  if (oy < barH) oy = barH;

  for (let i = 0; i < trn.length; i++) {
    trn[i].x = Math.min(cols - 1, Math.max(0, trn[i].x));
    trn[i].y = Math.min(rows - 1, Math.max(0, trn[i].y));
  }

  if (pax) {
    pax.x = Math.min(cols - 1, pax.x);
    pax.y = Math.min(rows - 1, pax.y);
  }
}

function seed() {
  buf = [];
  dir = { x: 1, y: 0 };
  pts = 0;
  dist = 0;
  lastNm = "";
  base = baseMs();
  ms = base;
  flash = "";
  flashAt = 0;
  rushAt = 0;
  toast = "";
  toastAt = 0;
  bits = [];
  pax = null;

  let sy = Math.floor(rows / 2);
  let sx = Math.max(0, Math.min(cols - 3, Math.floor(cols / 4)));

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

  let x,
    y,
    ok,
    tries = 0;

  do {
    x = (Math.random() * cols) | 0;
    y = (Math.random() * rows) | 0;
    ok = true;
    tries++;

    for (let i = 0; i < trn.length; i++) {
      if (trn[i].x === x && trn[i].y === y) {
        ok = false;
        break;
      }
    }
  } while (!ok && tries < 400);

  if (!ok) {
    for (let j = 0; j < rows && !ok; j++) {
      for (let i = 0; i < cols; i++) {
        let free = true;

        for (let k = 0; k < trn.length; k++) {
          if (trn[k].x === i && trn[k].y === j) {
            free = false;
            break;
          }
        }

        if (free) {
          x = i;
          y = j;
          ok = true;
          break;
        }
      }
    }
  }

  if (!ok) {
    pax = null;
    return;
  }

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

function baseMs() {
  if (mem.set.spd === "calm") return 175;
  if (mem.set.spd === "rush") return 125;
  return 150;
}

function audio() {
  if (!mem.set.snd) return null;

  if (!ac) {
    try {
      let AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    } catch (e) {
      ac = null;
    }
  }

  if (ac && ac.state === "suspended") {
    try {
      ac.resume();
    } catch (e) {}
  }

  return ac;
}

function note(a, f, t, d, kind, vol, to) {
  let o = a.createOscillator();
  let g = a.createGain();

  o.type = kind || "sine";
  o.frequency.setValueAtTime(f, t);

  if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);

  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + d + 0.03);
}

function breath(a, t, d, vol, f1, f2) {
  let len = Math.max(1, Math.floor(a.sampleRate * d));
  let b = a.createBuffer(1, len, a.sampleRate);
  let ch = b.getChannelData(0);

  for (let i = 0; i < len; i++) {
    ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }

  let s = a.createBufferSource();
  let g = a.createGain();
  let bp = a.createBiquadFilter();

  s.buffer = b;
  bp.type = "bandpass";
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(f1, t);
  bp.frequency.exponentialRampToValueAtTime(f2, t + d);

  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + d * 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);

  s.connect(bp);
  bp.connect(g);
  g.connect(a.destination);
  s.start(t);
  s.stop(t + d + 0.02);
}

function ding() {
  let a = audio();
  if (!a) return;

  let t = a.currentTime;

  note(a, 987.77, t, 0.17, "sine", 0.16);
  note(a, 1318.51, t + 0.085, 0.24, "sine", 0.13);
}

function clk() {
  let a = audio();
  if (!a) return;

  let t = a.currentTime;
  let lvl = Math.min(8, Math.floor(pts / 5));

  note(a, 1250 + lvl * 60, t, 0.035, "square", 0.022 + lvl * 0.002);
}

function thunk() {
  let a = audio();
  if (!a) return;

  let t = a.currentTime;

  note(a, 180, t, 0.18, "square", 0.1, 90);
  breath(a, t, 0.16, 0.05, 1800, 400);
  note(a, 880, t + 0.12, 0.07, "square", 0.05);
  note(a, 880, t + 0.22, 0.07, "square", 0.05);
}

function horn() {
  let a = audio();
  if (!a) return;

  let t = a.currentTime;

  note(a, 110, t, 0.55, "sawtooth", 0.07);
  note(a, 146.83, t + 0.02, 0.5, "sine", 0.06);
}

function sigh() {
  let a = audio();
  if (!a) return;

  let t = a.currentTime;

  note(a, 430, t, 1.05, "sine", 0.16, 115);
  note(a, 216, t + 0.05, 0.9, "triangle", 0.05, 70);
  breath(a, t + 0.04, 1.0, 0.07, 1100, 260);
}

function stubs(gx, gy) {
  let x = ox + gx * sz + sz / 2;
  let y = oy + gy * sz + sz / 2;

  for (let i = 0; i < 12; i++) {
    let a = Math.random() * 6.283;
    let sp = 40 + Math.random() * 90;

    bits.push({
      x: x,
      y: y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 45,
      r: Math.random() * 6.283,
      vr: (Math.random() - 0.5) * 9,
      t: 0,
      life: 0.55 + Math.random() * 0.45,
    });
  }
}

function updBits(s) {
  for (let i = bits.length - 1; i >= 0; i--) {
    let b = bits[i];

    b.t += s;

    if (b.t >= b.life) {
      bits.splice(i, 1);
      continue;
    }

    b.vy += 230 * s;
    b.x += b.vx * s;
    b.y += b.vy * s;
    b.r += b.vr * s;
  }
}

function drawBits() {
  for (let i = 0; i < bits.length; i++) {
    let b = bits[i];

    cx.save();
    cx.translate(b.x, b.y);
    cx.rotate(b.r);
    cx.globalAlpha = Math.max(0, 1 - b.t / b.life);

    cx.fillStyle = "#f7ecd8";
    cx.fillRect(-4, -2.5, 8, 5);

    cx.strokeStyle = "#d13a2a";
    cx.lineWidth = 1;
    cx.strokeRect(-4, -2.5, 8, 5);

    cx.restore();
  }
}

function say(msg) {
  toast = msg;
  toastAt = performance.now();
}

function startRun() {
  seed();
  acc = 0;
  lt = performance.now();
  scr = "game";
  hoverId = null;
  pressId = null;
  notice = "";

  mem.totalRides++;
  mem.run = { on: true, pts: 0, dist: 0, nm: "" };
  save();
}

function doPause() {
  if (scr !== "game") return;

  scr = "pause";
  hoverId = null;
  pressId = null;

  horn();

  mem.run = { on: true, pts: pts, dist: dist, nm: lastNm };
  save();
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
  mem.run = { on: false, pts: pts, dist: dist, nm: lastNm };
  save();

  scr = "title";
  hoverId = null;
  pressId = null;
}

function openSet() {
  setFrom = scr;
  scr = "set";
  hoverId = null;
  pressId = null;
}

function closeSet() {
  scr = setFrom === "pause" ? "pause" : "title";
  hoverId = null;
  pressId = null;
}

function togSnd() {
  mem.set.snd = !mem.set.snd;
  save();

  if (mem.set.snd) ding();
}

function togCtl() {
  mem.set.ctl = mem.set.ctl === "keys" ? "swipe" : "keys";
  save();
}

function cycSpd() {
  if (mem.set.spd === "calm") mem.set.spd = "normal";
  else if (mem.set.spd === "normal") mem.set.spd = "rush";
  else mem.set.spd = "calm";

  save();
}

function crash() {
  if (pts > mem.bestScore) mem.bestScore = pts;
  if (trn.length > mem.bestLength) mem.bestLength = trn.length;

  mem.run = { on: false, pts: pts, dist: dist, nm: lastNm };
  save();

  sigh();

  deadAt = performance.now();
  shakeAt = deadAt;
  scr = "dying";
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
    let nm = pax.nm;
    let gx = pax.x;
    let gy = pax.y;

    pts++;
    lastNm = nm;
    flash = nm + " boarded";
    flashAt = performance.now();

    stubs(gx, gy);
    ding();

    mem.totalPassengers++;
    if (pts > mem.bestScore) mem.bestScore = pts;
    if (trn.length > mem.bestLength) mem.bestLength = trn.length;

    mem.manifest.push(nm);
    if (mem.manifest.length > 10) mem.manifest.shift();

    mem.run = { on: true, pts: pts, dist: dist, nm: lastNm };
    save();

    let lvl = Math.floor(pts / 5);

    if (pts % 5 === 0) {
      rushAt = performance.now();
      thunk();
    }

    if (pts === 10 || pts === 25 || pts === 50) {
      say(
        "The transit authority thanks you for your service. Please mind the gap.",
      );
    }

    ms = Math.max(70, base - Math.min(8, lvl) * 12);

    spawn();
  } else {
    trn.pop();
    clk();
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

  if (scr === "game" || scr === "dying") updBits(dt / 1000);

  if (scr === "dying" && t - deadAt >= 100) scr = "crash";

  paint(t);
  requestAnimationFrame(loop);
}

function paint(now) {
  btns = [];

  if (scr === "title") {
    paintTitle(now);
  } else if (scr === "game") {
    paintGame(now);
  } else if (scr === "dying") {
    let k = Math.max(0, 1 - (now - shakeAt) / 240);

    cx.save();
    cx.translate(
      (Math.random() * 2 - 1) * 2 * k,
      (Math.random() * 2 - 1) * 2 * k,
    );
    paintGame(now);
    cx.restore();
  } else if (scr === "pause") {
    paintGame(now);
    paintPause(now);
  } else if (scr === "crash") {
    paintCrash(now);
  } else if (scr === "set") {
    paintSet(now);
  }

  drawBtns();
}

function paintTitle(now) {
  cx.fillStyle = "#f4e4c1";
  cx.fillRect(0, 0, ww, hh);

  mapDoodle();

  let mob = ww < 768;
  let lg = mob ? 44 : 76;
  let ty = hh * 0.22;

  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.font = "900 " + lg + "px ui-monospace, monospace";

  cx.fillStyle = "rgba(209,58,42,.55)";
  cx.fillText("SNAKE", ww / 2 + 3, ty + 3);

  cx.fillStyle = "#241d17";
  cx.fillText("SNAKE", ww / 2, ty);

  cx.font = "600 " + (mob ? 11 : 13) + "px ui-monospace, monospace";
  cx.fillStyle = "rgba(36,29,23,.62)";
  cx.fillText("the last commute of the night", ww / 2, ty + lg * 0.72);

  let bw = Math.min(560, ww - 24);
  let bh = mob ? 46 : 54;
  let bx = (ww - bw) / 2;
  let by = hh * 0.38;

  cx.fillStyle = "#19130d";
  rrect(bx, by, bw, bh, 8);
  cx.fill();

  cx.strokeStyle = "#241d17";
  cx.lineWidth = 2;
  rrect(bx, by, bw, bh, 8);
  cx.stroke();

  let msg = "BEST COMMUTE: " + mem.bestScore + " PASSENGERS · 11:47 PM";
  let fs = mob ? 13 : 16;

  cx.font = "700 " + fs + "px ui-monospace, monospace";

  while (cx.measureText(msg).width > bw - 28 && fs > 9) {
    fs--;
    cx.font = "700 " + fs + "px ui-monospace, monospace";
  }

  cx.fillStyle = "#e8a23d";
  cx.fillText(msg, ww / 2, by + bh / 2 + 1);

  cx.font = "600 " + (mob ? 10 : 12) + "px ui-monospace, monospace";
  cx.fillStyle = "rgba(36,29,23,.6)";
  cx.fillText(
    "LIFETIME " +
      mem.totalRides +
      " RUNS · " +
      mem.totalPassengers +
      " PASSENGERS",
    ww / 2,
    by + bh + 24,
  );
  cx.fillText(
    "LONGEST TRAIN EVER ASSEMBLED " + mem.bestLength + " CARS",
    ww / 2,
    by + bh + 44,
  );

  let sw = Math.min(260, ww * 0.72);
  let sh = 54;
  let sy = Math.min(hh * 0.64, by + bh + 84);

  addBtn("start", "START", (ww - sw) / 2, sy, sw, sh, startRun, true, 18);
  addBtn("opts", "OPTS", ww - 84, 12, 68, 32, openSet, false, 12);

  let hint =
    mem.set.ctl === "swipe"
      ? "SWIPE steers · TAP pauses"
      : "ARROWS / WASD · SPACE pauses · ENTER departs";

  cx.font = "600 " + (mob ? 10 : 12) + "px ui-monospace, monospace";
  cx.fillStyle = "rgba(36,29,23,.58)";
  cx.fillText(hint, ww / 2, sy + sh + 28);

  if (hh >= 600) {
    let lines = [
      "PICK UP EVERY GLOWING PASSENGER",
      "EACH ONE COUPLES ANOTHER CAR",
      "WALLS AND YOUR OWN TRAIN END SERVICE",
    ];

    let gy = sy + sh + 54;
    let gw = Math.min(400, ww - 32);
    let gx = (ww - gw) / 2;

    cx.strokeStyle = "rgba(36,29,23,.5)";
    cx.lineWidth = 1.5;
    rrect(gx, gy, gw, 68, 6);
    cx.stroke();

    cx.font = "600 " + (mob ? 9 : 11) + "px ui-monospace, monospace";
    cx.fillStyle = "rgba(36,29,23,.7)";

    for (let i = 0; i < lines.length; i++) {
      cx.fillText(lines[i], ww / 2, gy + 18 + i * 18);
    }
  }

  noticeStamp();
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

  cx.strokeStyle = "rgba(40,30,20,0.18)";
  cx.lineWidth = 1.5;
  cx.strokeRect(ox, oy, cols * sz, rows * sz);

  drawPax(now);
  drawTrain();
  drawBits();
  hud(now);
  stamp(now);
  toastBar(now);

  if (scr === "game") {
    let mob = ww < 768;
    let bh = mob ? 26 : 30;
    let by = mob ? 8 : (barH - bh) / 2;

    addBtn("pause", "II", ww - 50, by, 40, bh, doPause, false, 12);
    addBtn(
      "snd",
      mem.set.snd ? "SND" : "MUTE",
      ww - 98,
      by,
      44,
      bh,
      togSnd,
      false,
      10,
    );
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

  frame(320, 356);

  panel(0, 0, 320, 356);

  cx.fillStyle = "#241d17";
  cx.font = "900 24px ui-monospace, monospace";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText("SERVICE HELD", 160, 46);

  cx.font = "600 11px ui-monospace, monospace";
  cx.fillStyle = "rgba(36,29,23,.6)";
  cx.fillText("the train idles at the platform", 160, 70);

  btnAt("resume", "RESUME", 40, 96, 240, 44, doResume, false, 14);
  btnAt("restart", "RESTART", 40, 154, 240, 44, doRestart, false, 14);
  btnAt("opts", "OPTIONS", 40, 212, 240, 44, openSet, false, 14);
  btnAt("quit", "QUIT", 40, 270, 240, 44, doQuit, false, 14);

  unframe();
}

function paintCrash(now) {
  cx.fillStyle = "#f4e4c1";
  cx.fillRect(0, 0, ww, hh);

  cx.fillStyle = "rgba(40,30,20,0.05)";

  for (let y = 18; y < hh; y += 26) {
    cx.fillRect(0, y, ww, 1);
  }

  let wide = ww >= 560;
  let cw = wide ? 640 : 340;
  let ch = wide ? 430 : 510;

  frame(cw, ch);
  panel(0, 0, cw, ch);

  cx.textAlign = "center";
  cx.textBaseline = "middle";

  cx.fillStyle = "#241d17";
  cx.font = "700 " + (wide ? 13 : 10) + "px ui-monospace, monospace";
  cx.fillText("TRANSIT AUTHORITY", cw / 2, 30);

  cx.font = "600 " + (wide ? 10 : 8) + "px ui-monospace, monospace";
  cx.fillStyle = "rgba(36,29,23,.55)";
  cx.fillText("OFFICE OF THE NIGHT CONDUCTOR", cw / 2, 46);

  cx.fillStyle = "rgba(36,29,23,.28)";
  cx.fillRect(30, 60, cw - 60, 1);

  cx.fillStyle = "#241d17";
  cx.font = "600 " + (wide ? 17 : 13) + "px ui-monospace, monospace";
  cx.fillText("We apologize for the disruption", cw / 2, 88);
  cx.fillText("to your evening.", cw / 2, 110);

  cx.font = "700 " + (wide ? 14 : 11) + "px ui-monospace, monospace";

  if (wide) {
    drawStats(40, 152, false);
    drawMan(360, 152, 240, false);
  } else {
    drawStats(22, 146, true);
    drawMan(22, 288, cw - 44, true);
  }

  let bw = wide ? 280 : 260;

  btnAt(
    "retry",
    "RESTORE SERVICE",
    (cw - bw) / 2,
    ch - 66,
    bw,
    48,
    startRun,
    true,
    15,
  );

  unframe();
}

function paintSet(now) {
  cx.fillStyle = "#f4e4c1";
  cx.fillRect(0, 0, ww, hh);

  cx.fillStyle = "rgba(40,30,20,0.05)";

  for (let y = 18; y < hh; y += 26) {
    cx.fillRect(0, y, ww, 1);
  }

  frame(360, 372);
  panel(0, 0, 360, 372);

  cx.fillStyle = "#241d17";
  cx.font = "900 24px ui-monospace, monospace";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText("SETTINGS", 180, 44);

  cx.font = "600 10px ui-monospace, monospace";
  cx.fillStyle = "rgba(36,29,23,.55)";
  cx.fillText("SAVED TO THIS DEVICE", 180, 66);

  btnAt(
    "snd",
    "SOUND: " + (mem.set.snd ? "ON" : "OFF"),
    28,
    92,
    304,
    44,
    togSnd,
    false,
    13,
  );
  btnAt(
    "ctl",
    "CONTROLS: " + (mem.set.ctl === "keys" ? "KEYS" : "SWIPE"),
    28,
    150,
    304,
    44,
    togCtl,
    false,
    13,
  );
  btnAt(
    "spd",
    "START SPEED: " + mem.set.spd.toUpperCase(),
    28,
    208,
    304,
    44,
    cycSpd,
    false,
    13,
  );
  btnAt("back", "BACK", 28, 274, 304, 44, closeSet, true, 14);

  unframe();
}

function drawStats(x, y, mob) {
  cx.textAlign = "left";
  cx.fillStyle = "#241d17";

  cx.fillText("PASSENGERS CARRIED  " + pts, x, y);
  cx.fillText("COMMUTE LENGTH  " + dist + " SECTIONS", x, y + 26);
  cx.fillText("CAUSE OF DELAY  DRIVER ERROR", x, y + 52);
  cx.fillText("SERVICE ENDED FOR", x, y + 88);

  let nm = lastNm || "no passengers";
  let room = mob ? 296 : 280;

  nm = ell(nm, room);

  cx.fillStyle = "#d13a2a";
  cx.fillText(nm, x, y + 112);

  let tw = cx.measureText(nm).width;

  cx.strokeStyle = "#d13a2a";
  cx.lineWidth = 2;
  cx.beginPath();
  cx.moveTo(x, y + 112);
  cx.lineTo(x + tw, y + 112);
  cx.stroke();
}

function drawMan(x, y, w, mob) {
  cx.textAlign = "left";
  cx.fillStyle = "#241d17";
  cx.fillText("PASSENGER MANIFEST", x, y);

  let man = mem.manifest.slice().reverse();

  if (!man.length) {
    cx.fillStyle = "rgba(36,29,23,.55)";
    cx.fillText("NOBODY BOARDED TONIGHT", x, y + 26);
    return;
  }

  let rowsN = Math.ceil(man.length / 2);
  let colW = w / 2;

  for (let i = 0; i < man.length; i++) {
    let col = i < rowsN ? 0 : 1;
    let row = i < rowsN ? i : i - rowsN;
    let nm = ell(man[i], colW - 10);
    let nx = x + col * colW;
    let ny = y + 26 + row * (mob ? 18 : 20);
    let hit = i === 0 && man[0] === lastNm;

    cx.fillStyle = hit ? "#d13a2a" : "rgba(36,29,23,.85)";
    cx.fillText(nm, nx, ny);

    if (hit) {
      let tw = cx.measureText(nm).width;

      cx.strokeStyle = "#d13a2a";
      cx.lineWidth = 1.5;
      cx.beginPath();
      cx.moveTo(nx, ny);
      cx.lineTo(nx + tw, ny);
      cx.stroke();
    }
  }
}

function noticeStamp() {
  if (!notice) return;

  cx.save();
  cx.translate(ww / 2, hh - 42);
  cx.rotate(-0.06);
  cx.globalAlpha = 0.92;

  cx.strokeStyle = "#d13a2a";
  cx.lineWidth = 2;

  let w = Math.min(300, ww - 30);

  rrect(-w / 2, -18, w, 36, 6);
  cx.stroke();

  cx.fillStyle = "#d13a2a";
  cx.font = "900 " + (ww < 768 ? 11 : 14) + "px ui-monospace, monospace";
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  cx.fillText(notice, 0, 1);

  cx.restore();
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

    if (i === 0) engine(x, y);
    else car(p, i, x, y);
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

    speedo(ww - 176, 20, lvl);

    if (now - flashAt < 1300 && flash) {
      cx.textAlign = "right";
      cx.fillStyle = "#d13a2a";
      cx.fillText(ell(flash, ww - 96), ww - 12, 46);
    }
  } else {
    cx.textAlign = "left";
    cx.fillText("SCORE " + pts, 16, barH / 2);
    cx.fillText("PAX " + pts, 130, barH / 2);

    if (now - flashAt < 1300 && flash) {
      cx.fillStyle = "#d13a2a";
      cx.fillText(ell(flash, Math.max(60, ww - 450)), 232, barH / 2);
    }

    speedo(ww - 200, barH / 2, lvl);
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
  cx.translate(ww / 2, oy + rows * sz * 0.3);
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

function toastBar(now) {
  if (!toast) return;

  let age = now - toastAt;

  if (age > 3800) {
    toast = "";
    return;
  }

  let mob = ww < 768;

  cx.font = "700 " + (mob ? 11 : 13) + "px ui-monospace, monospace";

  let bw = Math.min(520, ww - 24);
  let lines = wrap(toast, bw - 28);
  let bh = 22 + lines.length * (mob ? 15 : 18);
  let bx = (ww - bw) / 2;
  let slide = age < 220 ? (1 - age / 220) * 34 : 0;
  let by = hh - bh - 16 + slide;

  cx.save();
  cx.globalAlpha = age > 3400 ? Math.max(0, 1 - (age - 3400) / 400) : 1;

  cx.fillStyle = "rgba(247,236,216,.97)";
  cx.strokeStyle = "#241d17";
  cx.lineWidth = 2;

  rrect(bx, by, bw, bh, 8);
  cx.fill();
  cx.stroke();

  cx.fillStyle = "#d13a2a";
  cx.fillRect(bx + 10, by + 10, 4, bh - 20);

  cx.fillStyle = "#241d17";
  cx.textAlign = "left";
  cx.textBaseline = "middle";

  for (let i = 0; i < lines.length; i++) {
    cx.fillText(lines[i], bx + 24, by + 16 + i * (mob ? 15 : 18));
  }

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
  cx.fillStyle = "rgba(247,236,216,.98)";
  cx.strokeStyle = "#241d17";
  cx.lineWidth = 2;

  rrect(x, y, w, h, 10);
  cx.fill();
  cx.stroke();

  cx.strokeStyle = "rgba(36,29,23,.25)";
  cx.lineWidth = 1;
  rrect(x + 6, y + 6, w - 12, h - 12, 7);
  cx.stroke();
}

function frame(cw, ch) {
  vk = Math.min(1, (hh - 20) / ch, (ww - 12) / cw);
  vx = (ww - cw * vk) / 2;
  vy = (hh - ch * vk) / 2;

  cx.save();
  cx.translate(vx, vy);
  cx.scale(vk, vk);
}

function unframe() {
  cx.restore();
  vx = 0;
  vy = 0;
  vk = 1;
}

function btnAt(id, label, x, y, w, h, fn, red, fs) {
  addBtn(id, label, vx + x * vk, vy + y * vk, w * vk, h * vk, fn, red, fs * vk);
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
  cx.font = "800 " + Math.max(8, b.fs || 16) + "px ui-monospace, monospace";
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

function ell(s, max) {
  if (max <= 0) return "";
  if (cx.measureText(s).width <= max) return s;

  while (s.length > 1 && cx.measureText(s + "...").width > max) {
    s = s.slice(0, -1);
  }

  return s + "...";
}

function wrap(txt, max) {
  let words = txt.split(" ");
  let lines = [];
  let line = "";

  for (let i = 0; i < words.length; i++) {
    let t = line ? line + " " + words[i] : words[i];

    if (cx.measureText(t).width > max && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = t;
    }
  }

  if (line) lines.push(line);

  return lines;
}

function load() {
  let had = false;

  try {
    let raw = localStorage.getItem("snake");

    if (!raw) return had;

    let d = JSON.parse(raw);

    if (typeof d.bestScore === "number") mem.bestScore = d.bestScore;
    if (typeof d.bestLength === "number") mem.bestLength = d.bestLength;
    if (typeof d.totalRides === "number") mem.totalRides = d.totalRides;
    if (typeof d.totalPassengers === "number")
      mem.totalPassengers = d.totalPassengers;

    if (Array.isArray(d.manifest)) {
      let a = [];

      for (let i = 0; i < d.manifest.length; i++) {
        if (typeof d.manifest[i] === "string") a.push(d.manifest[i]);
      }

      mem.manifest = a.slice(-10);
    }

    if (d.set) {
      had = true;

      if (typeof d.set.snd === "boolean") mem.set.snd = d.set.snd;
      if (d.set.ctl === "keys" || d.set.ctl === "swipe")
        mem.set.ctl = d.set.ctl;
      if (
        d.set.spd === "calm" ||
        d.set.spd === "normal" ||
        d.set.spd === "rush"
      )
        mem.set.spd = d.set.spd;
    }

    if (d.run) {
      mem.run = {
        on: !!d.run.on,
        pts: d.run.pts | 0,
        dist: d.run.dist | 0,
        nm: typeof d.run.nm === "string" ? d.run.nm : "",
      };
    }
  } catch (e) {}

  return had;
}

function save() {
  try {
    localStorage.setItem("snake", JSON.stringify(mem));
  } catch (e) {}
}

function rrect(x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
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
  audio();
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

cv.addEventListener(
  "touchstart",
  function (e) {
    audio();

    let t = e.changedTouches[0];
    let r = cv.getBoundingClientRect();

    tx = t.clientX - r.left;
    ty = t.clientY - r.top;
    swOn = !findBtn(tx, ty);
  },
  { passive: true },
);

cv.addEventListener(
  "touchend",
  function (e) {
    if (!swOn) return;

    swOn = false;

    let t = e.changedTouches[0];
    let r = cv.getBoundingClientRect();
    let x = t.clientX - r.left;
    let y = t.clientY - r.top;

    if (findBtn(x, y) || findBtn(tx, ty)) return;
    if (scr !== "game") return;

    let dx = x - tx;
    let dy = y - ty;

    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) {
      if (mem.set.ctl === "swipe") doPause();
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
    else turn(0, dy > 0 ? 1 : -1);
  },
  { passive: true },
);

window.addEventListener("keydown", function (e) {
  let k = e.key;

  audio();

  if (e.repeat && (k === " " || k === "Enter")) return;

  if (scr === "set") {
    if (k === "Enter" || k === "Escape") {
      closeSet();
      e.preventDefault();
    }

    return;
  }

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

  if (k === "Escape") {
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

window.addEventListener("resize", function () {
  if (window.innerWidth === pw && window.innerHeight === ph) return;

  fit();

  if (scr === "game") doPause();
});

window.addEventListener("orientationchange", function () {
  setTimeout(function () {
    fit();
    if (scr === "game") doPause();
  }, 120);
});

window.addEventListener("blur", function () {
  if (scr === "game") doPause();
  save();
});

document.addEventListener("visibilitychange", function () {
  if (document.hidden) {
    if (scr === "game") doPause();
    save();
  }
});

window.addEventListener("pagehide", save);

window.addEventListener("load", function () {
  let had = load();

  if (!had && "ontouchstart" in window) mem.set.ctl = "swipe";

  if (mem.run && mem.run.on) {
    notice = "SERVICE WAS DISRUPTED · LAST RUN ENDED EARLY";
    mem.run.on = false;
    save();
  }

  fit();
  seed();

  lt = performance.now();
  requestAnimationFrame(loop);
});
