// Pixel art renderer for Realm Gamble
const Renderer = (() => {
  const TILE = 4; // pixel scale

  function drawPixelRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  function drawPlayer(ctx, x, y, color, name, isSelf) {
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

  function drawHub(ctx, buildings) {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 440);
    grad.addColorStop(0, '#1a1a4e');
    grad.addColorStop(1, '#2d4a3e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 440);

    // Ground tiles
    for (let tx = 0; tx < 800; tx += 16) {
      for (let ty = 300; ty < 440; ty += 16) {
        const shade = ((tx + ty) / 16) % 2 === 0 ? '#3a6b35' : '#2d5530';
        drawPixelRect(ctx, tx, ty, 16, 16, shade);
      }
    }

    // Path
    for (let px = 0; px < 800; px += 16) {
      drawPixelRect(ctx, px, 340, 16, 16, '#8b7355');
    }

    // Buildings
    for (const b of buildings) {
      drawBuilding(ctx, b.x, b.y, b.w, b.h, b.color, b.label);
    }

    // Decorative pixels (trees, rocks)
    const decor = [
      [60, 360, '#225522'], [720, 370, '#225522'], [400, 380, '#555'],
      [150, 365, '#334433'], [650, 355, '#334433'],
    ];
    for (const [dx, dy, c] of decor) {
      drawPixelRect(ctx, dx, dy, 8, 16, '#4a3728');
      drawPixelRect(ctx, dx - 4, dy - 8, 16, 12, c);
    }

    // Title sign
    drawPixelRect(ctx, 310, 60, 180, 40, '#533483');
    ctx.fillStyle = '#e94560';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('TOWN SQUARE', 400, 86);
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
