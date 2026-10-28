import './style.css';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreLabel = document.querySelector('#score');
const bestLabel = document.querySelector('#best');
const overlay = document.querySelector('#overlay');
const startButton = document.querySelector('#start');
const pauseButton = document.querySelector('#pause');
const W = 480, H = 560;
let mode = 'ready', elapsed = 0, last = 0, spawn = 0, best = 0;
let obstacles = [], keys = new Set();
let player = { x: W / 2, y: H - 56, radius: 12 };
let target = null;
try { best = Math.max(0, Number(localStorage.getItem('neon-dodge-best')) || 0); } catch {}
bestLabel.textContent = String(best).padStart(4, '0');

function panel(status, title, description, button) {
  document.querySelector('#status').textContent = status;
  document.querySelector('#title').textContent = title;
  document.querySelector('#description').textContent = description;
  startButton.textContent = button;
  overlay.hidden = false;
}
function start() {
  if (mode === 'paused') { mode = 'playing'; overlay.hidden = true; pauseButton.textContent = 'Pause'; return; }
  elapsed = 0; spawn = .5; obstacles = []; keys.clear(); target = null;
  player.x = W / 2; scoreLabel.textContent = '0000'; mode = 'playing';
  overlay.hidden = true; pauseButton.disabled = false; pauseButton.textContent = 'Pause';
  document.querySelector('#announcement').textContent = 'Los geht’s! Weiche den pinken Hindernissen aus.';
}
function pause() {
  if (mode === 'paused') { start(); return; }
  if (mode !== 'playing') return;
  mode = 'paused'; keys.clear(); target = null; pauseButton.textContent = 'Weiter';
  panel('KURZ DURCHATMEN', 'Pause', 'Dein Lauf wartet auf dich.', 'Weiterspielen');
}
function end() {
  mode = 'over'; pauseButton.disabled = true;
  const score = Math.floor(elapsed * 10);
  best = Math.max(best, score); bestLabel.textContent = String(best).padStart(4, '0');
  try { localStorage.setItem('neon-dodge-best', String(best)); } catch {}
  panel('NOCH EINE RUNDE?', 'Neon erwischt.', `Dein Ergebnis: ${score} Punkte. Rekord: ${best}.`, 'Nochmal spielen ↗');
  document.querySelector('#announcement').textContent = `Spiel vorbei. ${score} Punkte.`;
}
startButton.addEventListener('click', start);
pauseButton.addEventListener('click', pause);
window.addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight',' ','Escape'].includes(e.key)) e.preventDefault();
  if (e.key === 'Escape') { pause(); return; }
  if (e.key === ' ' && e.target.tagName !== 'BUTTON') { if (mode === 'playing') pause(); else start(); return; }
  keys.add(e.key.toLowerCase());
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); if (mode === 'playing') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'playing') pause(); });
function pointer(e) {
  if (mode !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  target = Math.max(16, Math.min(W - 16, (e.clientX - rect.left) / rect.width * W));
}
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pointer(e); });
canvas.addEventListener('pointermove', e => { if (canvas.hasPointerCapture(e.pointerId)) pointer(e); });
canvas.addEventListener('pointerup', () => target = null);
canvas.addEventListener('pointercancel', () => target = null);

function update(dt) {
  elapsed += dt;
  const direction = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
  if (direction) { player.x += direction * 360 * dt; target = null; }
  else if (target !== null) player.x += Math.sign(target - player.x) * Math.min(Math.abs(target - player.x), 520 * dt);
  player.x = Math.max(16, Math.min(W - 16, player.x));
  spawn -= dt;
  if (spawn <= 0) {
    const size = 20 + Math.random() * 25;
    obstacles.push({x: 12 + Math.random() * (W - size - 24), y: -size, w: size, h: size, speed: 150 + Math.min(elapsed * 5, 250) + Math.random() * 50});
    spawn = Math.max(.19, .65 - elapsed * .008);
  }
  for (const o of obstacles) {
    o.y += o.speed * dt;
    const dx = player.x - Math.max(o.x, Math.min(player.x, o.x + o.w));
    const dy = player.y - Math.max(o.y, Math.min(player.y, o.y + o.h));
    if (dx * dx + dy * dy < player.radius * player.radius) { end(); return; }
  }
  obstacles = obstacles.filter(o => o.y < H + 50);
  scoreLabel.textContent = String(Math.floor(elapsed * 10)).padStart(4, '0');
}
function draw(time) {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#1a2941'; ctx.lineWidth = 1;
  const offset = (time * .018) % 40;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = offset; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (const o of obstacles) {
    ctx.shadowBlur = 18; ctx.shadowColor = '#ff578c'; ctx.fillStyle = '#ff578c22'; ctx.strokeStyle = '#ff578c'; ctx.lineWidth = 2;
    ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x, o.y, o.w, o.h);
  }
  ctx.shadowBlur = 22; ctx.shadowColor = '#55eed4'; ctx.fillStyle = '#55eed4';
  ctx.beginPath(); ctx.moveTo(player.x, player.y - 17); ctx.lineTo(player.x + 13, player.y + 12); ctx.lineTo(player.x, player.y + 6); ctx.lineTo(player.x - 13, player.y + 12); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
}
function frame(time) {
  const dt = Math.min((time - last) / 1000, .04); last = time;
  if (mode === 'playing') update(dt);
  draw(time); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
