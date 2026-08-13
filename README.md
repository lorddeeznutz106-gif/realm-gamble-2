# Realm Gamble

A pixel-art multiplayer RPG you can deploy on Railway's free tier. Gamble gold with other players, buy weapons, fight monsters, and sell loot.

## Features

- **Multiplayer hub** — See other players move around town in real time
- **Chat** — Talk to everyone in the realm
- **Gambling** — Challenge players to coin-flip bets
- **Weapon shop** — Buy better gear to fight harder monsters
- **Dungeon combat** — Battle slimes, goblins, skeletons, and dragons
- **Loot & merchant** — Sell drops for gold, heal at the clinic
- **Pixel graphics** — Lightweight canvas rendering, no heavy assets

## Local Development

```bash
npm install
npm start
```

Open http://localhost:3000 in two browser tabs to test multiplayer.

## Deploy to Railway (Free Tier)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Choose **Deploy from GitHub repo** and select this repository
4. Railway auto-detects Node.js — no extra config needed
5. Once deployed, open the generated URL and share it with friends!

Railway sets `PORT` automatically. The app uses a single Node process with in-memory state (perfect for the free tier).

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| Click buildings | Open shop, dungeon, gamble, etc. |
| Sidebar buttons | All game actions |
| Chat box | Talk to other players |

## Tips

- Start with 50 gold — gamble carefully!
- Buy an Iron Sword before tackling skeletons
- Sell loot at the merchant to fund better weapons
- Mini Dragons drop Dragon Scales worth 100g each

Have fun!
