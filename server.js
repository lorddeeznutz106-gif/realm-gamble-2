const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const {
  WEAPONS,
  LOOT,
  STARTING_GOLD,
  MAX_HP,
  getWeapon,
  getLoot,
  pickRandomMonster,
  rollLoot,
} = require('./game/data');
const { sendBroadcast } = require('./itexmo-app/client');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e6 });

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/unisms/test', async (req, res) => {
  const { network, recipient, sender, message } = req.body || {};
  const apiCode = String(process.env.ITEXMO_API_CODE || '').trim();
  const clientId = String(process.env.ITEXMO_CLIENT_ID || '').trim();
  const email = String(process.env.ITEXMO_EMAIL || '').trim();
  const password = String(process.env.ITEXMO_PASSWORD || '').trim();
  const cleanNetwork = String(network || '').toLowerCase();
  const cleanRecipient = String(recipient || '').trim();
  const cleanSender = String(sender || '').trim();
  const cleanMessage = String(message || '').trim();

  if (!['tnt', 'smart'].includes(cleanNetwork)) {
    return res.status(400).json({ ok: false, error: 'Choose TNT or Smart.' });
  }
  if (!/^\+?[0-9]{10,15}$/.test(cleanRecipient.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ ok: false, error: 'Enter a valid recipient mobile number.' });
  }
  if (!cleanMessage || cleanMessage.length > 480) {
    return res.status(400).json({ ok: false, error: 'Message must be between 1 and 480 characters.' });
  }

  if (process.env.MOCK_ITEXMO !== 'true' && (!apiCode || !clientId || !email || !password)) {
    return res.status(400).json({ ok: false, error: 'Configure ITEXMO_API_CODE, ITEXMO_CLIENT_ID, ITEXMO_EMAIL, and ITEXMO_PASSWORD on the server.' });
  }

  const phoneDigits = cleanRecipient.replace(/[\s-]/g, '');
  try {
    const result = await sendBroadcast({
      credentials: { apiCode, clientId, email, password },
      recipient: phoneDigits,
      message: cleanMessage,
      sender: cleanSender,
      mock: process.env.MOCK_ITEXMO === 'true',
    });
    return res.status(result.ok ? 200 : 502).json(result);
  } catch (error) {
    const message = error.name === 'AbortError' ? 'iTexMo request timed out.' : 'Could not reach the iTexMo API.';
    return res.status(502).json({ ok: false, error: message });
  }
});

const players = new Map();
const pendingGambles = new Map();

const COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8', '#55efc4', '#74b9ff'];

function createPlayer(id, name) {
  return {
    id,
    name: name.slice(0, 16),
    x: 200 + Math.random() * 400,
    y: 200 + Math.random() * 200,
    gold: STARTING_GOLD,
    hp: MAX_HP,
    maxHp: MAX_HP,
    weapon: null,
    inventory: [],
    kills: 0,
    wins: 0,
    losses: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    inCombat: false,
    combatMonster: null,
    lastAttack: 0,
    environment: 'town',
  };
}

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    x: p.x,
    y: p.y,
    gold: p.gold,
    hp: p.hp,
    maxHp: p.maxHp,
    weapon: p.weapon,
    color: p.color,
    kills: p.kills,
    wins: p.wins,
    inCombat: p.inCombat,
    environment: p.environment,
  };
}

function emitPlayersForSocket(socket) {
  const p = players.get(socket.id);
  if (!p) return;
  const roomPlayers = [...players.values()]
    .filter((other) => other.environment === p.environment)
    .map(publicPlayer);
  socket.emit('players', roomPlayers);
}

function broadcastPlayers() {
  for (const socket of io.sockets.sockets.values()) {
    emitPlayersForSocket(socket);
  }
}

function addToInventory(player, itemId, qty = 1) {
  const existing = player.inventory.find((i) => i.id === itemId);
  if (existing) existing.qty += qty;
  else {
    const loot = getLoot(itemId);
    if (loot) player.inventory.push({ id: itemId, name: loot.name, sellPrice: loot.sellPrice, qty });
  }
}

function getWeaponDamage(player) {
  if (!player.weapon) return 3;
  const w = getWeapon(player.weapon);
  return w ? w.damage : 3;
}

function systemMessage(text) {
  io.emit('chat', { type: 'system', text, time: Date.now() });
}

io.on('connection', (socket) => {
  socket.on('join', (name) => {
    if (players.has(socket.id)) return;
    const player = createPlayer(socket.id, name || 'Hero');
    players.set(socket.id, player);
    socket.emit('init', {
      self: serializeSelf(player),
      weapons: WEAPONS,
      loot: LOOT,
    });
    broadcastPlayers();
    systemMessage(`${player.name} entered the realm!`);
  });

  socket.on('setEnvironment', (environment) => {
    const p = players.get(socket.id);
    const valid = ['town', 'dungeon', 'shop', 'merchant', 'gamble', 'healer'];
    if (!p || !valid.includes(environment)) return;
    p.environment = environment;
    p.x = 180 + Math.random() * 420;
    p.y = 180 + Math.random() * 150;
    socket.emit('selfUpdate', serializeSelf(p));
    broadcastPlayers();
  });

  socket.on('move', ({ x, y }) => {
    const p = players.get(socket.id);
    if (!p || p.inCombat) return;
    p.x = Math.max(20, Math.min(780, x));
    p.y = Math.max(20, Math.min(420, y));
    socket.broadcast.emit('playerMoved', { id: socket.id, x: p.x, y: p.y });
  });

  socket.on('chat', (text) => {
    const p = players.get(socket.id);
    if (!p || !text?.trim()) return;
    io.emit('chat', {
      type: 'player',
      name: p.name,
      text: text.trim().slice(0, 120),
      color: p.color,
      time: Date.now(),
    });
  });

  // --- GAMBLING ---
  socket.on('gambleOffer', ({ targetId, amount }) => {
    const challenger = players.get(socket.id);
    const target = players.get(targetId);
    if (!challenger || !target || targetId === socket.id) return;
    amount = Math.floor(Number(amount));
    if (amount < 5 || amount > challenger.gold || amount > target.gold) {
      socket.emit('toast', 'Invalid bet amount!');
      return;
    }
    if (target.inCombat || challenger.inCombat) {
      socket.emit('toast', 'Cannot gamble during combat!');
      return;
    }
    const offerId = `${socket.id}-${Date.now()}`;
    pendingGambles.set(offerId, { challengerId: socket.id, targetId, amount });
    io.to(targetId).emit('gambleInvite', {
      offerId,
      from: challenger.name,
      fromId: socket.id,
      amount,
    });
    socket.emit('toast', `Gamble offer sent to ${target.name}!`);
  });

  socket.on('gambleResponse', ({ offerId, accept }) => {
    const offer = pendingGambles.get(offerId);
    if (!offer) return;
    pendingGambles.delete(offerId);
    const challenger = players.get(offer.challengerId);
    const target = players.get(offer.targetId);
    if (!challenger || !target) return;

    if (!accept) {
      io.to(offer.challengerId).emit('toast', `${target.name} declined the gamble.`);
      return;
    }

    const amount = offer.amount;
    if (amount > challenger.gold || amount > target.gold) {
      io.to(offer.challengerId).emit('toast', 'Someone cannot afford the bet anymore.');
      io.to(offer.targetId).emit('toast', 'Someone cannot afford the bet anymore.');
      return;
    }

    const challengerWins = Math.random() < 0.5;
    if (challengerWins) {
      challenger.gold += amount;
      target.gold -= amount;
      challenger.wins++;
      target.losses++;
      io.emit('gambleResult', {
        winner: challenger.name,
        loser: target.name,
        amount,
        message: `${challenger.name} won ${amount}g from ${target.name}! 🎲`,
      });
    } else {
      target.gold += amount;
      challenger.gold -= amount;
      target.wins++;
      challenger.losses++;
      io.emit('gambleResult', {
        winner: target.name,
        loser: challenger.name,
        amount,
        message: `${target.name} won ${amount}g from ${challenger.name}! 🎲`,
      });
    }
    io.to(offer.challengerId).emit('selfUpdate', serializeSelf(challenger));
    io.to(offer.targetId).emit('selfUpdate', serializeSelf(target));
    broadcastPlayers();
  });

  socket.on('slotMachine', ({ bet }) => {
    const p = players.get(socket.id);
    if (!p || p.inCombat) return;

    const amount = Math.max(10, Math.min(100, Math.floor(Number(bet) || 10)));
    if (amount < 10 || amount > 100) {
      socket.emit('toast', 'Bet must be between 10g and 100g.');
      return;
    }
    if (p.gold < amount) {
      socket.emit('toast', 'Not enough gold for this slot bet.');
      return;
    }

    const SLOT_SYMBOLS = [
      { emoji: '🍋', weight: 120, multiplier: 1.5 },
      { emoji: '🍒', weight: 80, multiplier: 2 },
      { emoji: '🍊', weight: 45, multiplier: 2.5 },
      { emoji: '⭐', weight: 20, multiplier: 4 },
      { emoji: '💰', weight: 8, multiplier: 6 },
    ];

    const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    const pickWeightedSymbol = () => {
      let roll = Math.random() * totalWeight;
      for (const slot of SLOT_SYMBOLS) {
        roll -= slot.weight;
        if (roll <= 0) return slot.emoji;
      }
      return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1].emoji;
    };

    const reels = Array.from({ length: 3 }, () => pickWeightedSymbol());
    const win = reels.every((symbol) => symbol === reels[0]);
    
    let payout = 0;
    if (win) {
      const winSymbol = SLOT_SYMBOLS.find(s => s.emoji === reels[0]);
      payout = winSymbol ? Math.round(amount * winSymbol.multiplier) : amount;
    }

    p.gold -= amount;
    if (win) p.gold += payout;

    socket.emit('slotResult', { reels, win, payout, bet: amount });
    socket.emit('selfUpdate', serializeSelf(p));
    socket.emit('toast', win ? `JACKPOT! ${reels.join(' ')} won +${payout}g` : `No match — lost ${amount}g`);
    broadcastPlayers();
  });

  // --- SHOP ---
  socket.on('buyWeapon', (weaponId) => {
    const p = players.get(socket.id);
    const weapon = getWeapon(weaponId);
    if (!p || !weapon || p.inCombat) return;
    if (p.gold < weapon.price) {
      socket.emit('toast', 'Not enough gold!');
      return;
    }
    p.gold -= weapon.price;
    p.weapon = weapon.id;
    socket.emit('selfUpdate', serializeSelf(p));
    socket.emit('toast', `Bought ${weapon.name}!`);
    broadcastPlayers();
    systemMessage(`${p.name} bought a ${weapon.name}!`);
  });

  // --- COMBAT ---
  socket.on('enterDungeon', () => {
    const p = players.get(socket.id);
    if (!p || p.inCombat) return;
    const monsterTemplate = pickRandomMonster();
    p.inCombat = true;
    p.combatMonster = {
      ...monsterTemplate,
      hp: monsterTemplate.hp,
      maxHp: monsterTemplate.hp,
    };
    socket.emit('combatStart', {
      monster: p.combatMonster,
      playerHp: p.hp,
    });
    broadcastPlayers();
  });

  socket.on('attackMonster', () => {
    const p = players.get(socket.id);
    if (!p || !p.inCombat || !p.combatMonster) return;
    const now = Date.now();
    if (now - p.lastAttack < 600) return;
    p.lastAttack = now;

    const dmg = getWeaponDamage(p) + Math.floor(Math.random() * 5);
    p.combatMonster.hp -= dmg;

    let log = [`You hit ${p.combatMonster.name} for ${dmg} dmg!`];

    if (p.combatMonster.hp <= 0) {
      const { drops, gold } = rollLoot(p.combatMonster);
      p.gold += gold;
      p.kills++;
      for (const drop of drops) addToInventory(p, drop.id, drop.qty);
      p.inCombat = false;
      const defeated = p.combatMonster;
      p.combatMonster = null;

      socket.emit('combatEnd', {
        victory: true,
        monster: defeated.name,
        gold,
        drops,
        self: serializeSelf(p),
        log: [...log, `Victory! +${gold}g`, drops.length ? `Loot: ${drops.map((d) => d.name).join(', ')}` : 'No loot dropped.'],
      });
      broadcastPlayers();
      systemMessage(`${p.name} defeated a ${defeated.name}!`);
      return;
    }

    const monsterDmg = p.combatMonster.damage + Math.floor(Math.random() * 4);
    p.hp = Math.max(0, p.hp - monsterDmg);
    log.push(`${p.combatMonster.name} hits you for ${monsterDmg}!`);

    if (p.hp <= 0) {
      const lostGold = Math.min(p.gold, Math.floor(p.gold * 0.1));
      p.gold -= lostGold;
      p.hp = p.maxHp;
      p.inCombat = false;
      p.combatMonster = null;
      socket.emit('combatEnd', {
        victory: false,
        lostGold,
        self: serializeSelf(p),
        log: [...log, `You were defeated! Lost ${lostGold}g. Revived in town.`],
      });
      broadcastPlayers();
      return;
    }

    socket.emit('combatUpdate', {
      monster: p.combatMonster,
      playerHp: p.hp,
      log,
    });
  });

  socket.on('fleeCombat', () => {
    const p = players.get(socket.id);
    if (!p || !p.inCombat) return;
    const penalty = Math.min(p.gold, 5);
    p.gold -= penalty;
    p.inCombat = false;
    p.combatMonster = null;
    socket.emit('combatEnd', {
      victory: false,
      fled: true,
      lostGold: penalty,
      self: serializeSelf(p),
      log: [`You fled! Lost ${penalty}g.`],
    });
    broadcastPlayers();
  });

  // --- MERCHANT ---
  socket.on('sellItem', (itemId) => {
    const p = players.get(socket.id);
    if (!p || p.inCombat) return;
    const idx = p.inventory.findIndex((i) => i.id === itemId);
    if (idx === -1) return;
    const item = p.inventory[idx];
    p.gold += item.sellPrice;
    item.qty--;
    if (item.qty <= 0) p.inventory.splice(idx, 1);
    socket.emit('selfUpdate', serializeSelf(p));
    socket.emit('toast', `Sold ${item.name} for ${item.sellPrice}g!`);
    broadcastPlayers();
  });

  socket.on('sellAll', () => {
    const p = players.get(socket.id);
    if (!p || p.inCombat || p.inventory.length === 0) return;
    let total = 0;
    for (const item of p.inventory) total += item.sellPrice * item.qty;
    p.gold += total;
    p.inventory = [];
    socket.emit('selfUpdate', serializeSelf(p));
    socket.emit('toast', `Sold all loot for ${total}g!`);
    broadcastPlayers();
  });

  socket.on('heal', () => {
    const p = players.get(socket.id);
    if (!p || p.inCombat) return;
    const cost = 15;
    if (p.gold < cost) {
      socket.emit('toast', 'Need 15g to heal!');
      return;
    }
    if (p.hp >= p.maxHp) {
      socket.emit('toast', 'Already at full HP!');
      return;
    }
    p.gold -= cost;
    p.hp = p.maxHp;
    socket.emit('selfUpdate', serializeSelf(p));
    socket.emit('toast', 'Fully healed!');
    broadcastPlayers();
  });

  socket.on('disconnect', () => {
    const p = players.get(socket.id);
    if (p) {
      systemMessage(`${p.name} left the realm.`);
      players.delete(socket.id);
      broadcastPlayers();
    }
    for (const [key, offer] of pendingGambles) {
      if (offer.challengerId === socket.id || offer.targetId === socket.id) {
        pendingGambles.delete(key);
      }
    }
  });
});

function serializeSelf(p) {
  return {
    id: p.id,
    name: p.name,
    x: p.x,
    y: p.y,
    gold: p.gold,
    hp: p.hp,
    maxHp: p.maxHp,
    weapon: p.weapon,
    inventory: p.inventory,
    kills: p.kills,
    wins: p.wins,
    losses: p.losses,
    color: p.color,
    inCombat: p.inCombat,
    environment: p.environment,
  };
}

server.listen(PORT, () => {
  console.log(`Realm Gamble running on port ${PORT}`);
});
