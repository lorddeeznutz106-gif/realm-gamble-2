// Pixel art renderer for Realm Gamble
const Renderer = (() => {
  const TILE = 4; // pixel scale

  function drawPixelRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  function drawPlayer(ctx, x, y, color, name, isSelf, hp = 100, maxHp = 100) {
    const px = Math.floor(x);
    const py = Math.floor(y);

    // Shadow
    drawPixelRect(ctx, px + 4, py + 22, 16, 4, 'rgba(0,0,0,0.3)');

    // Body
    drawPixelRect(ctx, px + 6, py + 10, 12, 12, color);
    // Head
    drawPixelRect(ctx, px + 8, py + 2, 8, 8, '#ffdbac');
    // Eyes
    drawPixelRect(ctx, px + 9, py + 5, 2, 2, '#222');
    drawPixelRect(ctx, px + 13, py + 5, 2, 2, '#222');
    // Legs
    drawPixelRect(ctx, px + 7, py + 22, 4, 6, '#333');
    drawPixelRect(ctx, px + 13, py + 22, 4, 6, '#333');
    // Sword hint
    drawPixelRect(ctx, px + 18, py + 8, 2, 12, '#aaa');

    if (isSelf) {
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py, 22, 30);
    }

    ctx.fillStyle = isSelf ? '#ffcc00' : '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(name, px + 12, py - 4);

    const barWidth = 26;
    const barX = px + 1;
    const barY = py + 32;
    drawPixelRect(ctx, barX, barY, barWidth, 4, '#1a1a1a');
    drawPixelRect(ctx, barX, barY, Math.max(0, barWidth * (hp / Math.max(1, maxHp))), 4, hp > 0 ? '#44cc66' : '#ff4444');
  }

  function drawBuilding(ctx, x, y, w, h, color, label) {
    drawPixelRect(ctx, x, y, w, h, color);
    drawPixelRect(ctx, x + 4, y + 4, w - 8, h * 0.3, '#00000044');
    // Roof
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + w / 2, y - 16);
    ctx.lineTo(x + w + 4, y);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h + 12);
  }

  function drawMonster(ctx, x, y, color, name, hp, maxHp) {
    const px = Math.floor(x);
    const py = Math.floor(y);

    // Blob body
    drawPixelRect(ctx, px, py + 8, 48, 32, color);
    drawPixelRect(ctx, px + 8, py, 32, 16, color);
    // Eyes
    drawPixelRect(ctx, px + 12, py + 12, 8, 8, '#fff');
    drawPixelRect(ctx, px + 28, py + 12, 8, 8, '#fff');
    drawPixelRect(ctx, px + 14, py + 14, 4, 4, '#000');
    drawPixelRect(ctx, px + 30, py + 14, 4, 4, '#000');
    // Mouth
    drawPixelRect(ctx, px + 16, py + 28, 16, 4, '#000');

    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(name, px + 24, py - 8);

    // HP bar
    const barW = 48;
    drawPixelRect(ctx, px, py + 44, barW, 6, '#333');
    drawPixelRect(ctx, px, py + 44, barW * (hp / maxHp), 6, '#ff4444');
  }

  function drawHub(ctx, buildings, platforms = [], environment = 'town') {
    const sceneThemes = {
      town: { bg: '#1d2d3d', floor: '#514a45', panel: '#2e3b4a', accent: '#e94560', glow: '#8fd3ff', title: 'Town Square' },
      shop: { bg: '#2a1d4a', floor: '#4b4d5d', panel: '#43315d', accent: '#7ce0d3', glow: '#d9c27a', title: 'Armory' },
      gamble: { bg: '#3d1b1b', floor: '#5d4334', panel: '#6d3a2d', accent: '#ffd76a', glow: '#ff9a55', title: 'Casino' },
      dungeon: { bg: '#2b0d0a', floor: '#4f2f2a', panel: '#3d1a17', accent: '#ff5d73', glow: '#ff9686', title: 'Dungeon' },
      merchant: { bg: '#18363a', floor: '#446a62', panel: '#264b4a', accent: '#86f0ff', glow: '#f7d58a', title: 'Market' },
      healer: { bg: '#102d2c', floor: '#3f5f55', panel: '#21433b', accent: '#9dffad', glow: '#d7ffe8', title: 'Healer' },
    };

    const theme = sceneThemes[environment] || sceneThemes.town;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, 800, 440);

    const roomBorder = 18;
    ctx.fillStyle = theme.panel;
    ctx.fillRect(roomBorder, roomBorder, 800 - roomBorder * 2, 440 - roomBorder * 2);

    ctx.fillStyle = theme.floor;
    ctx.fillRect(0, 300, 800, 140);

    for (let x = 0; x < 800; x += 16) {
      for (let y = 300; y < 440; y += 16) {
        const dark = ((x + y) / 16) % 2 === 0 ? '#36312d' : '#4a403b';
        drawPixelRect(ctx, x, y, 16, 16, dark);
      }
    }

    for (const p of platforms) {
      drawPixelRect(ctx, p.x, p.y, p.w, p.h, '#51413b');
      for (let x = p.x; x < p.x + p.w; x += 10) {
        drawPixelRect(ctx, x, p.y, 5, 4, '#7a5f53');
      }
    }

    const roomGlow = theme.glow;
    if (environment === 'dungeon') {
      for (let x = 80; x <= 720; x += 120) {
        drawPixelRect(ctx, x, 250, 18, 60, '#241411');
        drawPixelRect(ctx, x + 4, 230, 10, 20, theme.accent);
      }
    }
    if (environment === 'gamble') {
      for (let x = 90; x <= 710; x += 110) {
        drawPixelRect(ctx, x, 250, 42, 32, '#d7ac33');
        drawPixelRect(ctx, x + 8, 230, 26, 18, '#f5d669');
      }
    }
    if (environment === 'shop') {
      for (let x = 110; x <= 690; x += 110) {
        drawPixelRect(ctx, x, 250, 32, 62, '#4d3a72');
        drawPixelRect(ctx, x + 8, 230, 16, 18, '#d9c27a');
      }
    }
    if (environment === 'merchant') {
      for (let x = 100; x <= 700; x += 120) {
        drawPixelRect(ctx, x, 260, 48, 40, '#6a985d');
        drawPixelRect(ctx, x + 12, 230, 22, 28, '#d5be74');
      }
    }
    if (environment === 'healer') {
      for (let x = 120; x <= 680; x += 120) {
        drawPixelRect(ctx, x, 255, 36, 58, '#24513d');
        drawPixelRect(ctx, x + 12, 235, 12, 18, '#dfffe8');
      }
    }

    ctx.fillStyle = theme.accent;
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${theme.title.toUpperCase()}`, 400, 48);

    ctx.strokeStyle = roomGlow;
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 80, 720, 220);

    if (environment === 'town') {
      for (const b of buildings) {
        drawBuilding(ctx, b.x, b.y, b.w, b.h, b.color, b.label);
      }
    }
  }

  function drawCombatArena(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 440);
    grad.addColorStop(0, '#2a0a0a');
    grad.addColorStop(1, '#1a0505');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 440);

    // Stone floor
    for (let tx = 0; tx < 800; tx += 20) {
      for (let ty = 200; ty < 440; ty += 20) {
        drawPixelRect(ctx, tx, ty, 20, 20, ((tx + ty) / 20) % 2 === 0 ? '#3a2a2a' : '#2a1a1a');
      }
    }

    ctx.fillStyle = '#e94560';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('⚔ DUNGEON ⚔', 400, 40);
  }

  const BUILDINGS = [
    { x: 40, y: 260, w: 80, h: 60, color: '#8b2035', label: 'GAMBLE' },
    { x: 180, y: 250, w: 90, h: 70, color: '#204080', label: 'SHOP' },
    { x: 340, y: 240, w: 100, h: 80, color: '#553380', label: 'DUNGEON' },
    { x: 520, y: 250, w: 90, h: 70, color: '#806020', label: 'MERCHANT' },
    { x: 660, y: 260, w: 80, h: 60, color: '#208060', label: 'HEALER' },
  ];

  return { drawPlayer, drawMonster, drawHub, drawCombatArena, BUILDINGS };
})();
