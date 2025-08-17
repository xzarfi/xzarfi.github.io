# Chivalry 2 Combat Trainer

A browser-based 1v1 combat trainer that replicates Chivalry 2's mouse control scheme and combat mechanics for practicing your skills.

## How to Play

1. Open `index.html` in your web browser.
2. Click **START TRAINING** to begin.
3. Use the mouse and keyboard controls to fight the AI opponent.
4. Track your kills and deaths, and use the **RESTART** button to reset.

## Controls

### Mouse Controls (Chivalry 2 Style)
- **Left Mouse Button (LMB)** → Slash (Main attack)
- **Scroll Wheel Down** → Overhead (Vertical attack)
- **Mouse Button 4 (Back Thumb)** → Feint (Cancel attack)
- **Mouse Button 5 (Front Thumb)** → Stab (Thrust attack)
- **Right Mouse Button (RMB)** → Block

### Movement
- **W** → Move forward
- **A** → Move left
- **S** → Move backward
- **D** → Move right

## Game Features

- **1v1 AI Combat**: Fight against a moving, attacking, and blocking AI opponent.
- **Stamina & Health Management**: Attacks and blocks consume stamina; health and stamina bars are displayed.
- **Attack Types**: Slash, Stab, Overhead, Feint, and Block, each with unique damage, stamina cost, and angles.
- **Kill/Death Tracking**: See your kills and deaths during the session.
- **Respawn System**: Both you and the AI respawn after death.
- **Combo Counter**: Track consecutive hits within a time window.
- **Visual Effects**: Weapon trails, damage numbers, death effects, and screen shake.
- **Attack Indicators**: Shows your current attack state.
- **Start/Restart Buttons**: Start or reset your training session.

## Attack Types & Stats (as in code)

| Attack   | Damage | Stamina Cost | Range | Angle         |
|----------|--------|--------------|-------|--------------|
| Slash    | 85     | 25           | 120   | ±45°         |
| Overhead | 105    | 35           | 110   | ±30°         |
| Stab     | 95     | 30           | 100   | ±15°         |
| Feint    | 0      | 10           | -     | -            |
| Block    | 0      | 15           | -     | ±60° (slash) |

## Tips for Practice

1. **Master the Feint**: Use MB4 to cancel attacks and bait the AI.
2. **Learn Attack Angles**: Each attack has different directional coverage.
3. **Manage Stamina**: Don't spam attacks; let stamina regenerate.
4. **Practice Movement**: Use WASD to position yourself.
5. **Watch the AI**: The AI will attack, block, and reposition.

## Technical Details

- Built with vanilla JavaScript and HTML5 Canvas.
- No external dependencies required.
- Runs entirely in the browser.
- Responsive design with medieval-themed UI.

## File Structure

```
chivtrainer/
├── index.html      # Main game page
├── style.css       # Game styling and effects
├── game.js         # Game logic and mechanics
└── README.md       # This file
```

Enjoy practicing your Chivalry 2 combat skills! 🗡️⚔️
