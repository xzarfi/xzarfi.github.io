# Chivalry 2 Combat Trainer

A browser-based combat training game that replicates Chivalry 2's mouse control scheme for practicing your combat skills while waiting for servers to come back up.

## How to Play

1. Open `index.html` in your web browser
2. The game will start automatically
3. Use the mouse controls to attack training dummies
4. Practice different attack types and combos

## Controls

### Mouse Controls (Chivalry 2 Style)
- **Left Mouse Button (LMB)** → Slash (Main attack)
- **Scroll Wheel Down** → Overhead (Vertical attack)
- **Mouse Button 4 (MB4) - Back Thumb** → Feint (Cancel attack)
- **Mouse Button 5 (MB5) - Front Thumb** → Stab (Thrust attack)

### Movement
- **W** → Move forward
- **A** → Move left
- **S** → Move backward
- **D** → Move right

## Game Features

### Combat System
- **Stamina Management**: Each attack costs stamina
- **Attack Recovery**: Cooldown between attacks
- **Feint System**: Cancel attacks with MB5
- **Directional Attacks**: Aim with mouse, attack in that direction
- **Different Damage Types**: Each attack type has different damage values

### Training Dummies
- **Wooden Dummy**: Basic training target
- **Metal Dummy**: More durable target
- **Stone Dummy**: Hardest target to destroy
- **Auto-Respawn**: Dummies respawn after 3 seconds when destroyed

### Visual Effects
- **Weapon Trails**: Visual feedback for attacks
- **Damage Numbers**: Shows damage dealt
- **Screen Shake**: Impact feedback
- **Attack Indicators**: Shows current attack type
- **Health/Stamina Bars**: Real-time status display

## Attack Types & Stats

| Attack | Damage | Stamina Cost | Range | Angle |
|--------|--------|--------------|-------|-------|
| Slash | 25 | 15 | 120 | ±45° |
| Overhead | 35 | 25 | 110 | ±30° |
| Stab | 30 | 20 | 100 | ±15° |
| Feint | 0 | 5 | - | - |

## Tips for Practice

1. **Master the Feint**: Use MB5 to cancel attacks and bait opponents
2. **Learn Attack Angles**: Each attack has different directional coverage
3. **Manage Stamina**: Don't spam attacks, let stamina regenerate
4. **Practice Movement**: Use WASD to position yourself for optimal attacks
5. **Aim Carefully**: Mouse position determines attack direction

## Technical Details

- Built with vanilla JavaScript and HTML5 Canvas
- No external dependencies required
- Runs entirely in the browser
- Responsive design with medieval-themed UI

## File Structure

```
chivtrainer/
├── index.html      # Main game page
├── style.css       # Game styling and effects
├── game.js         # Game logic and mechanics
└── README.md       # This file
```

Enjoy practicing your Chivalry 2 combat skills! 🗡️⚔️
