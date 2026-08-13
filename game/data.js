const WEAPONS = [
  { id: 'dagger', name: 'Rusty Dagger', price: 10, damage: 5, color: '#8b7355' },
  { id: 'sword', name: 'Iron Sword', price: 50, damage: 12, color: '#a8a8a8' },
  { id: 'axe', name: 'Steel Axe', price: 120, damage: 20, color: '#6b8cae' },
  { id: 'crystal', name: 'Crystal Blade', price: 300, damage: 35, color: '#b57edc' },
];

const LOOT = [
  { id: 'slime_gel', name: 'Slime Gel', sellPrice: 5, color: '#44cc44' },
  { id: 'goblin_tooth', name: 'Goblin Tooth', sellPrice: 15, color: '#cccc44' },
  { id: 'bone', name: 'Ancient Bone', sellPrice: 25, color: '#eeeeee' },
  { id: 'dragon_scale', name: 'Dragon Scale', sellPrice: 100, color: '#ff4444' },
  { id: 'gold_nugget', name: 'Gold Nugget', sellPrice: 40, color: '#ffcc00' },
  { id: 'mystic_gem', name: 'Mystic Gem', sellPrice: 75, color: '#44ffff' },
];

const MONSTERS = [
  {
    id: 'slime',
    name: 'Green Slime',
    hp: 30,
    damage: 4,
    xp: 10,
    color: '#33aa33',
    loot: [{ item: 'slime_gel', chance: 0.8 }],
    goldDrop: [2, 8],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    hp: 55,
    damage: 8,
    xp: 25,
    color: '#558833',
    loot: [{ item: 'goblin_tooth', chance: 0.6 }, { item: 'gold_nugget', chance: 0.2 }],
    goldDrop: [5, 15],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    hp: 80,
    damage: 12,
    xp: 40,
    color: '#ccccaa',
    loot: [{ item: 'bone', chance: 0.7 }, { item: 'gold_nugget', chance: 0.3 }],
    goldDrop: [10, 25],
  },
  {
    id: 'dragon',
    name: 'Mini Dragon',
    hp: 150,
    damage: 20,
    xp: 100,
    color: '#cc3333',
    loot: [{ item: 'dragon_scale', chance: 0.5 }, { item: 'mystic_gem', chance: 0.25 }],
    goldDrop: [30, 80],
  },
];

const STARTING_GOLD = 50;
const MAX_HP = 100;

function getWeapon(id) {
  return WEAPONS.find((w) => w.id === id);
}

function getLoot(id) {
  return LOOT.find((l) => l.id === id);
}

function getMonster(id) {
  return MONSTERS.find((m) => m.id === id);
}

function pickRandomMonster() {
  const roll = Math.random();
  if (roll < 0.4) return getMonster('slime');
  if (roll < 0.7) return getMonster('goblin');
  if (roll < 0.9) return getMonster('skeleton');
  return getMonster('dragon');
}

function rollLoot(monster) {
  const drops = [];
  for (const entry of monster.loot) {
    if (Math.random() < entry.chance) {
      const item = getLoot(entry.item);
      if (item) drops.push({ ...item, qty: 1 });
    }
  }
  const [minG, maxG] = monster.goldDrop;
  const gold = minG + Math.floor(Math.random() * (maxG - minG + 1));
  return { drops, gold };
}

module.exports = {
  WEAPONS,
  LOOT,
  MONSTERS,
  STARTING_GOLD,
  MAX_HP,
  getWeapon,
  getLoot,
  getMonster,
  pickRandomMonster,
  rollLoot,
};
