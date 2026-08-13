const socket = io();
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let self = null;
let players = [];
let weapons = [];
let keys = {};
let inCombat = false;
let combatMonster = null;

const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const nameInput = document.getElementById('name-input');
const joinBtn = document.getElementById('join-btn');

// --- JOIN ---
joinBtn.addEventListener('click', joinGame);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinGame(); });

function joinGame() {
  const name = nameInput.value.trim() || `Hero${Math.floor(Math.random() * 999)}`;
  socket.emit('join', name);
}

// --- SOCKET EVENTS ---
socket.on('init', (data) => {
  self = data.self;
  weapons = data.weapons;
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  updateHUD();
  renderShop();
  showPanel('actions');
  gameLoop();
});

socket.on('players', (list) => {
  players = list.map((p) => {
    if (self && p.id === self.id) {
      return { ...p, x: self.x, y: self.y, hp: self.hp, gold: self.gold, weapon: self.weapon, inventory: self.inventory };
    }
    return p;
  });
  document.getElementById('online-count').textContent = `👥 ${list.length} online`;
  updateGambleTargets();
});

socket.on('playerMoved', ({ id, x, y }) => {
  const p = players.find((pl) => pl.id === id);
  if (p) { p.x = x; p.y = y; }
  if (self && self.id === id) {
    self.x = x;
    self.y = y;
  }
});

socket.on('selfUpdate', (data) => {
  self = data;
  const index = players.findIndex((p) => p.id === self.id);
  if (index >= 0) {
    players[index] = { ...players[index], ...self };
  }
  updateHUD();
  renderInventory();
});

socket.on('chat', (msg) => {
  addChatMessage(msg);
});

socket.on('toast', (text) => showToast(text));

socket.on('gambleInvite', ({ offerId, from, amount }) => {
  const div = document.createElement('div');
  div.className = 'gamble-invite';
  div.innerHTML = `${from} bets <b>${amount}g</b>! `;
  const accept = document.createElement('button');
  accept.className = 'accept';
  accept.textContent = 'Accept';
  accept.onclick = () => {
    socket.emit('gambleResponse', { offerId, accept: true });
    div.remove();
  };
  const decline = document.createElement('button');
  decline.className = 'decline';
  decline.textContent = 'Decline';
  decline.onclick = () => {
    socket.emit('gambleResponse', { offerId, accept: false });
    div.remove();
  };
  div.appendChild(accept);
  div.appendChild(decline);
  document.getElementById('gamble-invites').appendChild(div);
  showToast(`${from} wants to gamble ${amount}g!`);
});

socket.on('gambleResult', ({ message }) => {
  addChatMessage({ type: 'gamble', text: message });
  showToast(message);
});

socket.on('combatStart', ({ monster, playerHp }) => {
  inCombat = true;
  combatMonster = monster;
  self.hp = playerHp;
  showPanel('combat');
  updateCombatUI();
  addCombatLog(`A wild ${monster.name} appears!`);
});

socket.on('combatUpdate', ({ monster, playerHp, log }) => {
  combatMonster = monster;
  self.hp = playerHp;
  updateCombatUI();
  log.forEach(addCombatLog);
});

socket.on('combatEnd', ({ victory, fled, monster, gold, drops, lostGold, self: updated, log }) => {
  inCombat = false;
  combatMonster = null;
  if (updated) self = updated;
  updateHUD();
  log.forEach(addCombatLog);
  if (victory) {
    showToast(`Victory! +${gold}g`);
    setTimeout(() => showPanel('actions'), 2000);
  } else if (fled) {
    showToast(`Fled! -${lostGold}g`);
    setTimeout(() => showPanel('actions'), 1500);
  } else {
    showToast(`Defeated! -${lostGold}g`);
    setTimeout(() => showPanel('actions'), 2000);
  }
});

// --- HUD ---
function updateHUD() {
  if (!self) return;
  document.getElementById('player-name').textContent = self.name;
  document.getElementById('player-hp').textContent = `❤️ ${self.hp}/${self.maxHp}`;
  document.getElementById('player-gold').textContent = `💰 ${self.gold}g`;
  const w = weapons.find((wp) => wp.id === self.weapon);
  document.getElementById('player-weapon').textContent = w ? `🗡️ ${w.name}` : '🤜 Fists';
  document.getElementById('player-stats').textContent = `⚔️ ${self.kills} kills · 🎲 ${self.wins}W/${self.losses}L`;
}

// --- PANELS ---
function showPanel(name) {
  ['actions', 'shop', 'merchant', 'gamble', 'combat'].forEach((p) => {
    document.getElementById(`panel-${p}`).classList.toggle('hidden', p !== name);
  });
}

document.querySelectorAll('.back-btn').forEach((btn) => {
  btn.addEventListener('click', () => showPanel(btn.dataset.back));
});

document.querySelectorAll('.action-btn[data-action]').forEach((btn) => {
  btn.addEventListener('click', () => handleAction(btn.dataset.action));
});

function handleAction(action) {
  if (!self || self.inCombat) return;
  switch (action) {
    case 'dungeon':
      socket.emit('enterDungeon');
      break;
    case 'shop':
      renderShop();
      showPanel('shop');
      break;
    case 'merchant':
      renderInventory();
      showPanel('merchant');
      break;
    case 'gamble':
      updateGambleTargets();
      showPanel('gamble');
      break;
    case 'heal':
      socket.emit('heal');
      break;
  }
}

// --- SHOP ---
function renderShop() {
  const list = document.getElementById('shop-list');
  list.innerHTML = '';
  for (const w of weapons) {
    const btn = document.createElement('button');
    btn.className = 'shop-item';
    const owned = self?.weapon === w.id ? ' ✓' : '';
    btn.innerHTML = `<span>${w.name}${owned}</span><span class="price">${w.price}g · ${w.damage} dmg</span>`;
    btn.onclick = () => socket.emit('buyWeapon', w.id);
    list.appendChild(btn);
  }
}

// --- INVENTORY ---
function renderInventory() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = '';
  if (!self?.inventory?.length) {
    list.innerHTML = '<p class="panel-desc">No loot yet. Fight monsters!</p>';
    return;
  }
  for (const item of self.inventory) {
    const btn = document.createElement('button');
    btn.className = 'inv-item';
    btn.innerHTML = `<span>${item.name} x${item.qty}</span><span class="price">${item.sellPrice}g</span>`;
    btn.onclick = () => socket.emit('sellItem', item.id);
    list.appendChild(btn);
  }
}

document.getElementById('sell-all-btn').addEventListener('click', () => socket.emit('sellAll'));

// --- GAMBLE ---
function updateGambleTargets() {
  const sel = document.getElementById('gamble-target');
  sel.innerHTML = '';
  const others = players.filter((p) => p.id !== self?.id);
  if (!others.length) {
    sel.innerHTML = '<option>No other players online</option>';
    return;
  }
  for (const p of others) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.gold}g)`;
    sel.appendChild(opt);
  }
}

document.getElementById('gamble-send').addEventListener('click', () => {
  const targetId = document.getElementById('gamble-target').value;
  const amount = Number(document.getElementById('gamble-amount').value);
  if (!targetId || !amount) return;
  socket.emit('gambleOffer', { targetId, amount });
});

// --- COMBAT UI ---
function updateCombatUI() {
  if (!combatMonster) return;
  document.getElementById('combat-info').innerHTML =
    `<b>${combatMonster.name}</b><br>HP: ${Math.max(0, combatMonster.hp)}/${combatMonster.maxHp}<br>Your HP: ${self.hp}/${self.maxHp}`;
}

function addCombatLog(text) {
  const log = document.getElementById('combat-log');
  const p = document.createElement('p');
  p.textContent = text;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

document.getElementById('attack-btn').addEventListener('click', () => socket.emit('attackMonster'));
document.getElementById('flee-btn').addEventListener('click', () => socket.emit('fleeCombat'));

// --- CHAT ---
const chatInput = document.getElementById('chat-input');
document.getElementById('chat-send').addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;
  socket.emit('chat', text);
  chatInput.value = '';
}

function addChatMessage(msg) {
  const div = document.createElement('div');
  div.className = `chat-msg ${msg.type || 'player'}`;
  if (msg.type === 'system') div.textContent = `* ${msg.text}`;
  else if (msg.type === 'gamble') div.textContent = `🎲 ${msg.text}`;
  else div.innerHTML = `<span style="color:${msg.color}">${msg.name}:</span> ${msg.text}`;
  const container = document.getElementById('chat-messages');
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// --- TOAST ---
function showToast(text) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// --- MOVEMENT ---
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

const SPEED = 3;
let lastMoveEmit = 0;

function handleMovement() {
  if (!self || self.inCombat) return;
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= SPEED;
  if (keys['s'] || keys['arrowdown']) dy += SPEED;
  if (keys['a'] || keys['arrowleft']) dx -= SPEED;
  if (keys['d'] || keys['arrowright']) dx += SPEED;
  if (dx === 0 && dy === 0) return;

  self.x = Math.max(20, Math.min(780, self.x + dx));
  self.y = Math.max(20, Math.min(420, self.y + dy));

  const me = players.find((p) => p.id === self.id);
  if (me) {
    me.x = self.x;
    me.y = self.y;
  }

  const now = Date.now();
  if (now - lastMoveEmit > 50) {
    socket.emit('move', { x: self.x, y: self.y });
    lastMoveEmit = now;
  }
}

// --- RENDER LOOP ---
function gameLoop() {
  handleMovement();
  ctx.clearRect(0, 0, 800, 440);

  if (inCombat && combatMonster) {
    Renderer.drawCombatArena(ctx);
    Renderer.drawMonster(ctx, 500, 180, combatMonster.color, combatMonster.name, combatMonster.hp, combatMonster.maxHp);
    if (self) Renderer.drawPlayer(ctx, 200, 200, self.color, self.name, true);
  } else {
    Renderer.drawHub(ctx, Renderer.BUILDINGS);
    const renderPlayers = players.filter((p) => p.id !== self?.id);
    if (self) renderPlayers.push(self);
    for (const p of renderPlayers) {
      Renderer.drawPlayer(ctx, p.x, p.y, p.color, p.name, p.id === self?.id);
    }
  }

  requestAnimationFrame(gameLoop);
}

// --- BUILDING CLICK (walk near + click canvas) ---
canvas.addEventListener('click', (e) => {
  if (!self || self.inCombat) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  for (const b of Renderer.BUILDINGS) {
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y - 16 && my <= b.y + b.h + 16) {
      const label = b.label;
      if (label === 'GAMBLE') handleAction('gamble');
      else if (label === 'SHOP') handleAction('shop');
      else if (label === 'DUNGEON') handleAction('dungeon');
      else if (label === 'MERCHANT') handleAction('merchant');
      else if (label === 'HEALER') handleAction('heal');
      return;
    }
  }
});
