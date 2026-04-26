# 🎮 FunPun FP-333 - Retro Gaming Console

A Nokia 3310-inspired retro gaming console featuring 29 classic and modern games with authentic LCD aesthetics and nostalgic gameplay.

## 🌟 Features

### Console Design
- **Authentic Nokia 3310 Replica**: Pixel-perfect recreation of the iconic phone design
- **Green LCD Display**: Classic monochrome screen with scanlines and vignette effects
- **Physical Controls**: D-pad, A/B action buttons, system buttons, and numeric keypad
- **LED Indicators**: Status LEDs that respond to game states
- **Responsive**: Works on desktop and mobile devices

### Game Collection (29 Games)

#### 🕹️ 2D Arcade Classics (OG★)
- **Snake** - The timeless classic with progressive speed
- **Pac-Man** - Eat dots, dodge ghosts
- **BrickBreaker** - Breakout-style brick destruction
- **Frogger** - Cross the road safely
- **Space Impact** - Shoot and dodge enemies
- **Tetris** - Arrange blocks and clear rows
- **Bounce** - Platform jumping adventure
- **Tic-Tac-Toe** - Beat the AI

#### 🧩 Puzzle & Brain Games
- **Sokoban** - Push boxes to goals
- **Sliding Puzzle** - Sort numbered tiles
- **Pipe Connect** - Connect color pairs
- **Water Flow** - Route pipes from source to drain
- **Light Path** - Guide light with mirrors
- **Memory Match** - Flip and match symbols
- **Number Match** - Match number pairs

#### ⚡ Skill & Action
- **Doodle Jump** - Endless jumping platformer
- **Endless Run** - Dodge obstacles while running
- **Rapid Roll** - Fall through gaps
- **Diamond Rush** - Collect gems, avoid traps
- **Knife Throw** - Precision knife throwing
- **Tap Reflex** - Fast reaction time game
- **Leaf Ball** - Physics-based ball bouncing
- **Shadow Escape** - Survive spreading darkness

#### 🏎️ 3D & Physics Games
- **Marble Maze** - Tilt maze with realistic physics
- **Hill Climb** - Fuel-based hill climbing racing
- **Pinball 3D** - Classic pinball with bumpers
- **Racing 3D** - Pseudo-3D road racing
- **Boulder Escape** - Dodge falling boulders
- **Labyrinth** - Navigate a tilting maze with holes

## 🎯 Game Features

### Progressive Difficulty
- Dynamic speed increases based on score
- Multiple difficulty levels (Easy, Medium, Hard)
- Adaptive AI for strategy games

### Persistence
- **High Score Tracking**: Best scores saved per game in localStorage
- **Filter System**: Browse by 2D/3D, genre, difficulty, or OG classics
- **Lives System**: Heart-based lives for arcade games

### Controls
- **Keyboard**: Arrow keys + Z/X or Space/Enter
- **Touch**: Tap on-screen controls
- **Gamepad Ready**: Full button and D-pad support

## 🚀 Deployment

### As Standalone HTML
The `funpun.html` file is completely self-contained:

```bash
# Simply open in browser or deploy to any static host
open public/funpun.html
```

### Integrated in React App
Already integrated at `/funpun` route via an `iframe` loading `public/funpun.html`. This ensures maximum performance and complete isolation of the game engines.

### Vercel Deployment
The game is automatically deployed with the main app:

```bash
# Deploy to Vercel
npm run build
vercel --prod
```

Access at: `https://your-domain.vercel.app/funpun`

## 🎨 Technical Highlights

### CSS Mastery
- **3D Effects**: Gradients, shadows, and depth for realistic console appearance
- **LCD Simulation**: Authentic pixel grid, scanlines, and color palette
- **Responsive Layout**: Adapts to different screen sizes
- **Smooth Animations**: Button presses, LED pulses, screen flashes

### JavaScript Engine
- **Canvas Rendering**: All games use HTML5 Canvas
- **Game State Management**: Clean separation between menu and gameplay
- **Input Abstraction**: Unified input system for keyboard, touch, and gamepad
- **Modular Game Engines**: Each game is self-contained and extensible

### Performance
- **60 FPS Gameplay**: Smooth requestAnimationFrame loops
- **Optimized Rendering**: Only draws what's necessary
- **Memory Efficient**: Proper cleanup on game exit
- **No Dependencies**: Pure vanilla JavaScript

## 📱 Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎮 How to Play

1. **Navigate**: Use arrow keys or D-pad to browse games
2. **Select**: Press A button, Enter, or tap to launch a game
3. **Filters**: Use number keys (1-8) or filter tabs to sort games
4. **In-Game**: Follow on-screen instructions for each game
5. **Pause/Exit**: Press B or Escape to return to menu

## 🛠️ Development

### Code Structure
```
funpun.html
├── CSS (Embedded)
│   ├── Nokia 3310 Console Design
│   ├── LCD Screen Simulation
│   ├── Menu System Styles
│   └── Game View Styles
└── JavaScript (Embedded)
    ├── Game Database (29 games)
    ├── State Management
    ├── Canvas Rendering Engine
    ├── Input System (Keyboard/Touch/Gamepad)
    ├── Menu System
    ├── Game Lifecycle Management
    └── Individual Game Engines (29 implementations)
```

### Adding New Games
1. Add game definition to `DB` array
2. Implement game engine in `ENG` object with `init()`, `start()`, and `key()` methods
3. Use provided canvas helpers: `cls()`, `px()`, `ci()`, `tx()`, etc.

### Extending Features
- Add new filters in filter bar
- Implement multiplayer for compatible games
- Add sound effects (Web Audio API)
- Integrate with leaderboards API

## 🏆 Credits

**Design Inspiration**: Nokia 3310 (2000)  
**Games Inspired By**: Classic mobile and arcade games  
**Built With**: ❤️ HTML5, CSS3, Vanilla JavaScript  
**Part Of**: Lumatha Social Platform

## 📄 License

Part of the Lumatha project. See main repository for license details.

---

**Tip**: For best experience, use keyboard controls for responsive gameplay!

🎮 **Start Playing**: [Open FunPun Console](/funpun)
