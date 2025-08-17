class ChivalryCombatGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Logical world dimensions (keep all drawing in these units)
        this.W = 1200;
        this.H = 800;
        // Ensure canvas is sized & transform applied before first draw
        if (window.fitCanvas) window.fitCanvas();
        // (Optional) react to size changes if you need to re-layout anything
        window.addEventListener('canvas:resized', (e) => {
            // e.detail has cssW/cssH/scale if you need them
            // Example: this.layoutHUD(e.detail);
        });
        this.healthFill = document.getElementById('healthFill');
        this.staminaFill = document.getElementById('staminaFill');
        this.healthText = document.querySelector('.health-text');
        this.staminaText = document.querySelector('.stamina-text');
        this.attackIndicator = document.getElementById('attackIndicator');
        this.killsDisplay = document.getElementById('killsDisplay');
        this.deathsDisplay = document.getElementById('deathsDisplay');
        this.kdDisplay = document.getElementById('kdDisplay');

        // Game state
        this.gameState = {
            health: 200,
            stamina: 100,
            currentAttack: null,
            attackCooldown: 0,
            isAttacking: false,
            attackType: null,
            mouseX: 0,
            mouseY: 0,
            keys: {},
            playerPos: { x: 600, y: 600 }, // Start on ground level
            playerVelocity: { x: 0, y: 0 },
            playerSpeed: 3,
            weaponAngle: 0,
            weaponLength: 80,
            lastAttackTime: 0,
            attackDuration: 500,
            recoveryTime: 300,
            feintTime: 200,
            isFeinting: false,
            feintStartTime: 0,
            isBlocking: false,
            blockStartTime: 0,
            blockAngle: 0,
            lastHitTime: 0,
            hitStun: 0,
            attackSwingProgress: 0,
            attackSwingDirection: 1,
            isDead: false,
            deathTime: 0,
            respawnTime: 3000,
            kills: 0,
            deaths: 0,
            gameStarted: false, // New: track if game has started
            respawnInvulnerability: 0, // New: invulnerability after respawn
            comboCount: 0, // New: combo system
            lastComboTime: 0, // New: combo timing
            comboWindow: 2000 // New: combo window in ms
        };

        // Combat system - Realistic Chivalry 2 values
        this.combatSystem = {
            slashDamage: 85,
            stabDamage: 95,
            overheadDamage: 105,
            staminaCost: {
                slash: 25,
                stab: 30,
                overhead: 35,
                feint: 10,
                block: 15
            },
            attackRanges: {
                slash: 120,
                stab: 100,
                overhead: 110
            },
            attackAngles: {
                slash: { start: -45, end: 45 },
                stab: { start: -15, end: 15 },
                overhead: { start: -30, end: 30 }
            },
            blockAngles: {
                slash: { start: -60, end: 60 },
                stab: { start: -30, end: 30 },
                overhead: { start: -45, end: 45 }
            },
            swingAnimations: {
                slash: { duration: 500, arc: 180 },
                stab: { duration: 400, arc: 30 },
                overhead: { duration: 600, arc: 120 }
            }
        };

        // Visual effects
        this.effects = {
            weaponTrails: [],
            combatEffects: [],
            deathEffects: [],
            screenShake: 0
        };

        // AI Player
        this.aiPlayer = {
            x: 800,
            y: 600, // Start on ground level
            health: 150,
            isAlive: true,
            speed: 2,
            targetPos: { x: 800, y: 600 },
            lastMoveTime: 0,
            moveInterval: 2000,
            weaponAngle: 0,
            weaponLength: 50, // Shorter weapon
            isAttacking: false,
            attackType: null,
            lastAttackTime: 0,
            attackCooldown: 2000,
            stamina: 100,
            attackRange: 80,
            isInAttackRange: false,
            isBlocking: false,
            blockStartTime: 0,
            blockAngle: 0,
            lastHitTime: 0,
            hitStun: 0,
            attackSwingProgress: 0,
            attackSwingDirection: 1,
            isDead: false,
            deathTime: 0,
            respawnTime: 3000,
            respawnInvulnerability: 0, // New: invulnerability after respawn
            lastRespawnTime: 0 // New: track last respawn time
        };

        this.setupEventListeners();
        this.setupStartButton();
        this.gameLoop();
    }

    setupEventListeners() {
        // Mouse controls
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                this.handleSlash();
            } else if (e.button === 2) { // Right mouse button
                this.handleBlock();
            } else if (e.button === 3) { // MB4 (Back thumb)
                this.handleFeint();
            } else if (e.button === 4) { // MB5 (Front thumb)
                this.handleStab();
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 2) { // Right mouse button
                this.stopBlock();
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY > 0) { // Scroll down only
                this.handleOverhead();
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const xCSS = e.clientX - rect.left;
            const yCSS = e.clientY - rect.top;
            if (window.CanvasScaler) {
                this.gameState.mouseX = window.CanvasScaler.toLogicalX(xCSS);
                this.gameState.mouseY = window.CanvasScaler.toLogicalY(yCSS);
            } else {
                this.gameState.mouseX = xCSS;
                this.gameState.mouseY = yCSS;
            }
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.gameState.keys[e.key.toLowerCase()] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.gameState.keys[e.key.toLowerCase()] = false;
        });

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupStartButton() {
        // Create start button
        const startButton = document.createElement('button');
        startButton.id = 'startButton';
        startButton.textContent = 'START TRAINING';
        startButton.className = 'start-button';
        startButton.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 40px;
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(45deg, #FF6B35, #F7931E);
            color: white;
            border: 3px solid #FF4500;
            border-radius: 10px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 8px 16px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;

        startButton.addEventListener('mouseenter', () => {
            startButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
            startButton.style.boxShadow = '0 12px 24px rgba(0,0,0,0.4)';
        });

        startButton.addEventListener('mouseleave', () => {
            startButton.style.transform = 'translate(-50%, -50%) scale(1)';
            startButton.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
        });

        startButton.addEventListener('click', () => {
            this.startGame();
        });

        document.body.appendChild(startButton);
    }

    startGame() {
        this.gameState.gameStarted = true;
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.remove();
        }

        // Reset positions to ground level
        this.gameState.playerPos = { x: 600, y: 600 };
        this.aiPlayer.x = 800;
        this.aiPlayer.y = 600;
        this.aiPlayer.targetPos = { x: 800, y: 600 };

        // Reset stats
        this.gameState.health = 150;
        this.gameState.stamina = 100;
        this.aiPlayer.health = 150;
        this.aiPlayer.stamina = 100;
        this.gameState.kills = 0;
        this.gameState.deaths = 0;
        this.gameState.comboCount = 0;
        this.updateHUD();

        // Add restart button
        this.addRestartButton();
    }

    addRestartButton() {
        const restartButton = document.createElement('button');
        restartButton.id = 'restartButton';
        restartButton.textContent = 'RESTART';
        restartButton.className = 'restart-button';
        restartButton.style.cssText = `
            position: absolute;
            bottom: 24px;
            right: 24px;
            padding: 12px 28px;
            font-size: 18px;
            font-weight: bold;
            background: linear-gradient(45deg, #DC143C, #FF4500);
            color: white;
            border: 2px solid #8B0000;
            border-radius: 10px;
            cursor: pointer;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            transition: all 0.3s ease;
        `;

        restartButton.addEventListener('mouseenter', () => {
            restartButton.style.transform = 'scale(1.1)';
            restartButton.style.boxShadow = '0 8px 16px rgba(0,0,0,0.35)';
        });

        restartButton.addEventListener('mouseleave', () => {
            restartButton.style.transform = 'scale(1)';
            restartButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        });

        restartButton.addEventListener('click', () => {
            this.restartGame();
        });

        // Append to .canvas-wrap instead of body
        const canvasWrap = document.querySelector('.canvas-wrap');
        if (canvasWrap) {
            canvasWrap.appendChild(restartButton);
        } else {
            document.body.appendChild(restartButton);
        }
    }

    restartGame() {
        // Reset game state
        this.gameState.gameStarted = false;
        this.gameState.health = 150;
        this.gameState.stamina = 100;
        this.gameState.kills = 0;
        this.gameState.deaths = 0;
        this.gameState.comboCount = 0;
        this.gameState.isDead = false;

        // Reset AI
        this.aiPlayer.health = 150;
        this.aiPlayer.stamina = 100;
        this.aiPlayer.isAlive = true;
        this.aiPlayer.isDead = false;
        this.aiPlayer.speed = 2;
        this.aiPlayer.attackCooldown = 2000;
        this.aiPlayer.attackRange = 80;

        // Remove restart button
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            restartButton.remove();
        }

        // Show start screen again
        this.setupStartButton();
        this.updateHUD();
    }

    handleSlash() {
        if (this.canPerformAttack()) {
            this.performAttack('slash');
        }
    }



    handleOverhead() {
        if (this.canPerformAttack()) {
            this.performAttack('overhead');
        }
    }

    handleStab() {
        if (this.canPerformAttack()) {
            this.performAttack('stab');
        }
    }

    handleBlock() {
        if (this.gameState.stamina >= this.combatSystem.staminaCost.block && !this.gameState.isAttacking) {
            this.gameState.isBlocking = true;
            this.gameState.blockStartTime = Date.now();
            this.gameState.blockAngle = this.gameState.weaponAngle;
            this.showAttackIndicator('Blocking');
            this.addScreenShake(1);
        }
    }

    stopBlock() {
        this.gameState.isBlocking = false;
        this.showAttackIndicator('Ready');
    }

    handleFeint() {
        if (this.gameState.stamina >= this.combatSystem.staminaCost.feint && !this.gameState.isAttacking) {
            this.gameState.isFeinting = true;
            this.gameState.feintStartTime = Date.now();
            this.gameState.stamina -= this.combatSystem.staminaCost.feint;
            this.updateHUD();
            this.showAttackIndicator('Feinting');
            this.addScreenShake(2);
        }
    }

    canPerformAttack() {
        return !this.gameState.isAttacking &&
            this.gameState.stamina >= 10 &&
            Date.now() - this.gameState.lastAttackTime > this.gameState.recoveryTime;
    }

    performAttack(attackType) {
        if (this.gameState.isFeinting) {
            // Feint cancels the attack
            this.gameState.isFeinting = false;
            this.showAttackIndicator('Feint!');
            return;
        }

        this.gameState.isAttacking = true;
        this.gameState.attackType = attackType;
        this.gameState.lastAttackTime = Date.now();
        this.gameState.attackSwingProgress = 0;
        this.gameState.attackSwingDirection = 1;
        this.gameState.stamina -= this.combatSystem.staminaCost[attackType];

        this.showAttackIndicator(this.getAttackName(attackType));
        this.addWeaponTrail();
        this.addScreenShake(3);

        // Check for hits
        this.checkHits(attackType);

        setTimeout(() => {
            this.gameState.isAttacking = false;
            this.gameState.attackType = null;
            this.showAttackIndicator('Ready');
        }, this.gameState.attackDuration);

        this.updateHUD();
    }

    getAttackName(attackType) {
        const names = {
            slash: 'Slash',
            overhead: 'Overhead',
            stab: 'Stab'
        };
        return names[attackType] || 'Attack';
    }

    checkHits(attackType) {
        const playerPos = this.gameState.playerPos;
        const mousePos = { x: this.gameState.mouseX, y: this.gameState.mouseY };
        const attackRange = this.combatSystem.attackRanges[attackType];
        const attackAngles = this.combatSystem.attackAngles[attackType];

        // Calculate attack direction
        const attackDirection = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);

        // Check if AI player is hit
        if (this.aiPlayer.isAlive && this.aiPlayer.respawnInvulnerability <= 0) {
            const distance = Math.sqrt(
                Math.pow(this.aiPlayer.x - playerPos.x, 2) +
                Math.pow(this.aiPlayer.y - playerPos.y, 2)
            );

            if (distance <= attackRange) {
                const angleToAI = Math.atan2(this.aiPlayer.y - playerPos.y, this.aiPlayer.x - playerPos.x);
                const angleDiff = Math.abs(angleToAI - attackDirection) * (180 / Math.PI);

                if (angleDiff <= attackAngles.end) {
                    // Check if AI is blocking
                    if (this.aiPlayer.isBlocking) {
                        const blockAngles = this.combatSystem.blockAngles[attackType];
                        const angleToPlayer = Math.atan2(playerPos.y - this.aiPlayer.y, playerPos.x - this.aiPlayer.x);
                        const blockAngleDiff = Math.abs(angleToPlayer - this.aiPlayer.blockAngle) * (180 / Math.PI);

                        if (blockAngleDiff <= blockAngles.end) {
                            this.blockedAttack(attackType, 'ai');
                        } else {
                            this.hitAI(attackType);
                        }
                    } else {
                        this.hitAI(attackType);
                    }
                }
            }
        }
    }

    hitAI(attackType) {
        const currentTime = Date.now();
        const damage = this.combatSystem[attackType + 'Damage'];

        // Combo system
        if (currentTime - this.gameState.lastComboTime < this.gameState.comboWindow) {
            this.gameState.comboCount++;
            const comboBonus = Math.min(this.gameState.comboCount * 5, 20); // Max 20 bonus damage
            const totalDamage = damage + comboBonus;
            this.aiPlayer.health -= totalDamage;

            // Show combo effect
            this.addCombatEffect(this.aiPlayer.x, this.aiPlayer.y, totalDamage, 'combo');
        } else {
            this.gameState.comboCount = 1;
            this.aiPlayer.health -= damage;
            this.addCombatEffect(this.aiPlayer.x, this.aiPlayer.y, damage, 'hit');
        }

        this.gameState.lastComboTime = currentTime;
        this.aiPlayer.lastHitTime = currentTime;
        this.aiPlayer.hitStun = 300;

        if (this.aiPlayer.health <= 0) {
            this.aiPlayer.isDead = true;
            this.aiPlayer.deathTime = currentTime;
            this.aiPlayer.isAlive = false;
            this.aiPlayer.health = 0;
            this.gameState.kills++;
            this.addDeathEffect(this.aiPlayer.x, this.aiPlayer.y, 'ai');
        }

        // Respawn AI after respawn time with proper spacing
        setTimeout(() => {
            this.respawnAI();
        }, this.aiPlayer.respawnTime);
    }

    respawnAI() {
        // Find a safe respawn position away from player
        const playerPos = this.gameState.playerPos;
        let respawnX, respawnY;

        // Try different respawn positions
        const respawnPositions = [
            { x: 100, y: 600 },   // Left side
            { x: 1100, y: 600 },  // Right side
            { x: 600, y: 100 },   // Top
            { x: 600, y: 700 }    // Bottom
        ];

        for (let pos of respawnPositions) {
            const distance = Math.sqrt(
                Math.pow(pos.x - playerPos.x, 2) +
                Math.pow(pos.y - playerPos.y, 2)
            );

            if (distance > 200) { // Minimum safe distance
                respawnX = pos.x;
                respawnY = pos.y;
                break;
            }
        }

        // If no safe position found, use default
        if (!respawnX) {
            respawnX = 100;
            respawnY = 600;
        }

        this.aiPlayer.health = 150;
        this.aiPlayer.isAlive = true;
        this.aiPlayer.isDead = false;
        this.aiPlayer.x = respawnX;
        this.aiPlayer.y = respawnY;
        this.aiPlayer.targetPos = { x: respawnX, y: respawnY };
        this.aiPlayer.lastRespawnTime = Date.now();
        this.aiPlayer.respawnInvulnerability = 2000; // 2 seconds of invulnerability

        // Increase AI difficulty based on player kills
        const difficultyLevel = Math.floor(this.gameState.kills / 5) + 1;
        this.aiPlayer.speed = Math.min(2 + difficultyLevel * 0.5, 4);
        this.aiPlayer.attackCooldown = Math.max(2000 - difficultyLevel * 200, 800);
        this.aiPlayer.attackRange = Math.min(80 + difficultyLevel * 10, 120);
    }

    respawnPlayer() {
        // Find a safe respawn position away from AI
        const aiPos = { x: this.aiPlayer.x, y: this.aiPlayer.y };
        let respawnX, respawnY;

        // Try different respawn positions
        const respawnPositions = [
            { x: 100, y: 600 },   // Left side
            { x: 1100, y: 600 },  // Right side
            { x: 600, y: 100 },   // Top
            { x: 600, y: 700 }    // Bottom
        ];

        for (let pos of respawnPositions) {
            const distance = Math.sqrt(
                Math.pow(pos.x - aiPos.x, 2) +
                Math.pow(pos.y - aiPos.y, 2)
            );

            if (distance > 200) { // Minimum safe distance
                respawnX = pos.x;
                respawnY = pos.y;
                break;
            }
        }

        // If no safe position found, use default
        if (!respawnX) {
            respawnX = 100;
            respawnY = 600;
        }

        this.gameState.isDead = false;
        this.gameState.health = 150;
        this.gameState.stamina = 100;
        this.gameState.playerPos.x = respawnX;
        this.gameState.playerPos.y = respawnY;
        this.gameState.respawnInvulnerability = 2000; // 2 seconds of invulnerability
        this.updateHUD();
    }

    blockedAttack(attackType, target) {
        if (target === 'ai') {
            this.aiPlayer.stamina -= this.combatSystem.staminaCost.block;
            this.addCombatEffect(this.aiPlayer.x, this.aiPlayer.y, 0, 'block');
            this.addScreenShake(2);
        } else {
            this.gameState.stamina -= this.combatSystem.staminaCost.block;
            this.gameState.lastHitTime = Date.now();
            this.gameState.hitStun = 200;
            this.addCombatEffect(this.gameState.playerPos.x, this.gameState.playerPos.y, 0, 'block');
            this.addScreenShake(2);
            this.updateHUD();
        }
    }

    addWeaponTrail() {
        const trail = {
            x: this.gameState.playerPos.x,
            y: this.gameState.playerPos.y,
            angle: this.gameState.weaponAngle,
            type: this.gameState.attackType,
            startTime: Date.now()
        };
        this.effects.weaponTrails.push(trail);
    }

    addCombatEffect(x, y, damage, type = 'hit') {
        const effect = {
            x: x,
            y: y,
            damage: damage,
            type: type,
            startTime: Date.now()
        };
        this.effects.combatEffects.push(effect);
    }

    addDeathEffect(x, y, target) {
        const effect = {
            x: x,
            y: y,
            target: target,
            startTime: Date.now()
        };
        this.effects.deathEffects.push(effect);
    }

    addScreenShake(intensity) {
        this.effects.screenShake = intensity;
    }

    updatePlayerMovement() {
        const keys = this.gameState.keys;
        let dx = 0;
        let dy = 0;

        if (keys['w']) dy -= this.gameState.playerSpeed;
        if (keys['s']) dy += this.gameState.playerSpeed;
        if (keys['a']) dx -= this.gameState.playerSpeed;
        if (keys['d']) dx += this.gameState.playerSpeed;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.gameState.playerPos.x += dx;
        this.gameState.playerPos.y += dy;

        // Keep player in bounds
        this.gameState.playerPos.x = Math.max(50, Math.min(this.W - 50, this.gameState.playerPos.x));
        this.gameState.playerPos.y = Math.max(50 + this.H*0.6, Math.min(this.H - 50, this.gameState.playerPos.y));

        // Update weapon angle
        this.gameState.weaponAngle = Math.atan2(
            this.gameState.mouseY - this.gameState.playerPos.y,
            this.gameState.mouseX - this.gameState.playerPos.x
        );

        // Update AI movement
        this.updateAIMovement();
    }

    updateAIMovement() {
        if (!this.aiPlayer.isAlive) return;

        // If player is dead or invulnerable, AI idles (does not track or attack)
        if (this.gameState.isDead || this.gameState.respawnInvulnerability > 0) {
            // Idle: stand still, don't attack, don't track
            this.aiPlayer.targetPos = { x: this.aiPlayer.x, y: this.aiPlayer.y };
            // Optionally: add patrol or random walk here
            return;
        }

        const currentTime = Date.now();
        const distanceToPlayer = Math.sqrt(
            Math.pow(this.gameState.playerPos.x - this.aiPlayer.x, 2) +
            Math.pow(this.gameState.playerPos.y - this.aiPlayer.y, 2)
        );

        // Check if in attack range
        this.aiPlayer.isInAttackRange = distanceToPlayer <= this.aiPlayer.attackRange;

        if (this.aiPlayer.isInAttackRange) {
            // Stop moving and attack if in range
            this.aiPlayer.targetPos = { x: this.aiPlayer.x, y: this.aiPlayer.y };

            // Attack if cooldown is ready
            if (currentTime - this.aiPlayer.lastAttackTime > this.aiPlayer.attackCooldown &&
                this.aiPlayer.stamina >= 25) {
                this.performAIAttack();
            }

            // Enhanced blocking behavior
            if (this.gameState.isAttacking) {
                const blockChance = this.aiPlayer.stamina > 50 ? 0.6 : 0.3;
                if (Math.random() < blockChance && this.aiPlayer.stamina >= 15) {
                    this.performAIBlock();
                }
            }

            // Feint detection and counter
            if (this.gameState.isFeinting && Math.random() < 0.4) {
                this.performAIAttack(); // Counter-attack during feint
            }
        } else {
            // Move towards player if not in range
            this.aiPlayer.targetPos = {
                x: this.gameState.playerPos.x,
                y: this.gameState.playerPos.y
            };
        }

        // Move towards target
        const dx = this.aiPlayer.targetPos.x - this.aiPlayer.x;
        const dy = this.aiPlayer.targetPos.y - this.aiPlayer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.aiPlayer.x += (dx / distance) * this.aiPlayer.speed;
            this.aiPlayer.y += (dy / distance) * this.aiPlayer.speed;
        }

        // Update AI weapon angle to face player
        this.aiPlayer.weaponAngle = Math.atan2(
            this.gameState.playerPos.y - this.aiPlayer.y,
            this.gameState.playerPos.x - this.aiPlayer.x
        );
    }

    performAIAttack() {
        if (this.aiPlayer.isAttacking) return;

        this.aiPlayer.isAttacking = true;
        this.aiPlayer.lastAttackTime = Date.now();
        this.aiPlayer.attackSwingProgress = 0;
        this.aiPlayer.attackSwingDirection = 1;
        this.aiPlayer.stamina -= 25;

        // Random attack type
        const attackTypes = ['slash', 'stab', 'overhead'];
        this.aiPlayer.attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];

        // Check if player is hit
        this.checkAIAttackHit();

        // Reset attack state after duration
        setTimeout(() => {
            this.aiPlayer.isAttacking = false;
            this.aiPlayer.attackType = null;
        }, 600);
    }

    performAIBlock() {
        if (this.aiPlayer.isBlocking) return;

        this.aiPlayer.isBlocking = true;
        this.aiPlayer.blockStartTime = Date.now();
        this.aiPlayer.blockAngle = this.aiPlayer.weaponAngle;

        // Stop blocking after a short time
        setTimeout(() => {
            this.aiPlayer.isBlocking = false;
        }, 1000);
    }

    checkAIAttackHit() {
        const distance = Math.sqrt(
            Math.pow(this.gameState.playerPos.x - this.aiPlayer.x, 2) +
            Math.pow(this.gameState.playerPos.y - this.aiPlayer.y, 2)
        );

        if (distance <= this.aiPlayer.attackRange && this.gameState.respawnInvulnerability <= 0) {
            // Check if player is blocking
            if (this.gameState.isBlocking) {
                const blockAngles = this.combatSystem.blockAngles[this.aiPlayer.attackType];
                const angleToAI = Math.atan2(this.aiPlayer.y - this.gameState.playerPos.y, this.aiPlayer.x - this.gameState.playerPos.x);
                const blockAngleDiff = Math.abs(angleToAI - this.gameState.blockAngle) * (180 / Math.PI);

                if (blockAngleDiff <= blockAngles.end) {
                    this.blockedAttack(this.aiPlayer.attackType, 'player');
                } else {
                    this.hitPlayer(this.aiPlayer.attackType);
                }
            } else {
                this.hitPlayer(this.aiPlayer.attackType);
            }
        }
    }

    hitPlayer(attackType) {
        const damage = this.combatSystem[attackType + 'Damage'];
        this.gameState.health -= damage;
        this.gameState.lastHitTime = Date.now();
        this.gameState.hitStun = 300;

        // Add combat effect on player
        this.addCombatEffect(this.gameState.playerPos.x, this.gameState.playerPos.y, damage, 'hit');
        this.addScreenShake(2);

        if (this.gameState.health <= 0) {
            this.gameState.isDead = true;
            this.gameState.deathTime = Date.now();
            this.gameState.health = 0;
            this.gameState.deaths++;
            this.addDeathEffect(this.gameState.playerPos.x, this.gameState.playerPos.y, 'player');
        }

        this.updateHUD();
    }

    updateStamina() {
        // Realistic Chivalry 2 stamina regen
        if (this.gameState.stamina < 100) {
            this.gameState.stamina += 0.3; // Slower regen
            if (this.gameState.stamina > 100) {
                this.gameState.stamina = 100;
            }
            this.updateHUD();
        }

        // Block stamina drain
        if (this.gameState.isBlocking) {
            this.gameState.stamina -= 0.5;
            if (this.gameState.stamina < 0) {
                this.gameState.stamina = 0;
                this.stopBlock();
            }
            this.updateHUD();
        }

        // Update AI stamina
        if (this.aiPlayer.stamina < 100) {
            this.aiPlayer.stamina += 0.3;
            if (this.aiPlayer.stamina > 100) {
                this.aiPlayer.stamina = 100;
            }
        }

        // AI block stamina drain
        if (this.aiPlayer.isBlocking) {
            this.aiPlayer.stamina -= 0.5;
            if (this.aiPlayer.stamina < 0) {
                this.aiPlayer.stamina = 0;
                this.aiPlayer.isBlocking = false;
            }
        }
    }

    updateHUD() {
        const healthPercent = (this.gameState.health / 150) * 100;
        const staminaPercent = this.gameState.stamina;

        this.healthFill.style.width = healthPercent + '%';
        this.staminaFill.style.width = staminaPercent + '%';
        this.healthText.textContent = Math.round(this.gameState.health);
        this.staminaText.textContent = Math.round(this.gameState.stamina);
        this.killsDisplay.textContent = this.gameState.kills;
        this.deathsDisplay.textContent = this.gameState.deaths;

        // Update combo display
        if (this.gameState.comboCount > 1) {
            this.showAttackIndicator(`COMBO x${this.gameState.comboCount}!`);
        }

        // Calculate K/D ratio (avoid division by zero)
        let kd = this.gameState.deaths > 0
            ? Math.floor((this.gameState.kills / this.gameState.deaths) * 10) / 10
            : this.gameState.kills;
        this.kdDisplay.textContent = kd.toFixed(1);

        // Update difficulty display
        const difficultyLevel = Math.floor(this.gameState.kills / 5) + 1;
        const difficultyElement = document.getElementById('difficultyDisplay');
        const difficultyContainer = document.getElementById('difficultyContainer');

        if (difficultyElement && difficultyContainer) {
            difficultyElement.textContent = difficultyLevel;
        }
    }

    showAttackIndicator(text) {
        this.attackIndicator.textContent = text;
        this.attackIndicator.className = 'attack-indicator';

        if (text.includes('Slash')) {
            this.attackIndicator.classList.add('slashing');
        } else if (text.includes('Stab')) {
            this.attackIndicator.classList.add('stabbing');
        } else if (text.includes('Overhead')) {
            this.attackIndicator.classList.add('overhead');
        } else if (text.includes('Feint')) {
            this.attackIndicator.classList.add('feinting');
        } else if (text.includes('Block')) {
            this.attackIndicator.classList.add('blocking');
        }
    }

    updateEffects() {
        const currentTime = Date.now();

        // Update weapon trails
        this.effects.weaponTrails = this.effects.weaponTrails.filter(trail =>
            currentTime - trail.startTime < 300
        );

        // Update combat effects
        this.effects.combatEffects = this.effects.combatEffects.filter(effect =>
            currentTime - effect.startTime < 500
        );

        // Update death effects
        this.effects.deathEffects = this.effects.deathEffects.filter(effect =>
            currentTime - effect.startTime < 2000
        );

        // Update screen shake
        if (this.effects.screenShake > 0) {
            this.effects.screenShake -= 0.5;
            if (this.effects.screenShake < 0) this.effects.screenShake = 0;
        }

        // Update feint state
        if (this.gameState.isFeinting && currentTime - this.gameState.feintStartTime > this.gameState.feintTime) {
            this.gameState.isFeinting = false;
            this.showAttackIndicator('Ready');
        }

        // Update hit stun
        if (this.gameState.hitStun > 0) {
            this.gameState.hitStun -= 16; // 60fps
            if (this.gameState.hitStun < 0) this.gameState.hitStun = 0;
        }

        if (this.aiPlayer.hitStun > 0) {
            this.aiPlayer.hitStun -= 16;
            if (this.aiPlayer.hitStun < 0) this.aiPlayer.hitStun = 0;
        }

        // Update attack swing animations
        if (this.gameState.isAttacking) {
            const swingAnim = this.combatSystem.swingAnimations[this.gameState.attackType];
            this.gameState.attackSwingProgress += (16 / swingAnim.duration) * 100;
            if (this.gameState.attackSwingProgress > 100) {
                this.gameState.attackSwingProgress = 100;
            }
        }

        if (this.aiPlayer.isAttacking) {
            const swingAnim = this.combatSystem.swingAnimations[this.aiPlayer.attackType];
            this.aiPlayer.attackSwingProgress += (16 / swingAnim.duration) * 100;
            if (this.aiPlayer.attackSwingProgress > 100) {
                this.aiPlayer.attackSwingProgress = 100;
            }
        }

        // Handle player respawn
        if (this.gameState.isDead && currentTime - this.gameState.deathTime > this.gameState.respawnTime) {
            this.respawnPlayer();
        }

        // Update invulnerability timers
        if (this.gameState.respawnInvulnerability > 0) {
            this.gameState.respawnInvulnerability -= 16;
            if (this.gameState.respawnInvulnerability < 0) this.gameState.respawnInvulnerability = 0;
        }

        if (this.aiPlayer.respawnInvulnerability > 0) {
            this.aiPlayer.respawnInvulnerability -= 16;
            if (this.aiPlayer.respawnInvulnerability < 0) this.aiPlayer.respawnInvulnerability = 0;
        }

        // Reset combo if window expired
        if (this.gameState.comboCount > 0 && currentTime - this.gameState.lastComboTime > this.gameState.comboWindow) {
            this.gameState.comboCount = 0;
            this.showAttackIndicator('Ready');
        }
    }

    render() {
        // Clear in device pixels with identity transform, then restore
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        // Apply screen shake
        if (this.effects.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.effects.screenShake;
            const shakeY = (Math.random() - 0.5) * this.effects.screenShake;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
        }

        // Draw background elements
        this.drawBackground();

        if (this.gameState.gameStarted) {
            // Draw AI player
            this.drawAIPlayer();

            // Draw player
            this.drawPlayer();

            // Draw weapon trails
            this.drawWeaponTrails();

            // Draw combat effects
            this.drawCombatEffects();

            // Draw death effects
            this.drawDeathEffects();
        } else {
            // Draw start screen
            this.drawStartScreen();
        }

        // Restore canvas if screen shake was applied
        if (this.effects.screenShake > 0) {
            this.ctx.restore();
        }
    }

    drawStartScreen() {
        // Draw title with epic styling
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#FF4500';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('CHIVALRY 2', this.W / 2, 200);

        this.ctx.fillStyle = '#F7931E';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('COMBAT TRAINER', this.W / 2, 250);

        // Draw subtitle
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText('Master the Art of Medieval Combat', this.W / 2, 300);

        // Draw training features
        this.ctx.fillStyle = '#E0E0E0';
        this.ctx.font = '18px Arial';
        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'left';

        const features = [
            '⚔️  Realistic Chivalry 2 Combat Mechanics',
            '🛡️  Advanced Blocking & Parrying System',
            '⚡  Stamina Management & Feinting',
            '🎯  Precision Attack Angles & Timing',
            '🏆  Progressive AI Difficulty',
            '📊  Real-time Combat Statistics'
        ];

        features.forEach((feature, index) => {
            this.ctx.fillText(feature, 100, 380 + index * 30);
        });

        // Draw epic background warriors
        this.drawBackgroundWarriors();

        // Reset text alignment
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 0;
    }

    drawBackgroundWarriors() {
        // Draw stylized warrior silhouettes in background
        this.ctx.fillStyle = 'rgba(255, 107, 53, 0.1)';

        // Left warrior
        this.ctx.fillRect(50, 450, 20, 80);
        this.ctx.fillRect(45, 430, 30, 20);
        this.ctx.fillRect(40, 440, 40, 8);

        // Right warrior
        this.ctx.fillRect(1130, 450, 20, 80);
        this.ctx.fillRect(1125, 430, 30, 20);
        this.ctx.fillRect(1120, 440, 40, 8);
    }

    drawBackground() {
        // Draw sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.H * 0.6);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#98D8E8');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.W, this.H * 0.6);

        // Draw distant mountains
        this.drawMountains();

        // Draw ground with texture
        const groundGradient = this.ctx.createLinearGradient(0, this.H * 0.6, 0, this.H);
        groundGradient.addColorStop(0, '#90EE90');
        groundGradient.addColorStop(1, '#7CCD7C');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.H * 0.6, this.W, this.H * 0.4);

        // Draw palm trees
        this.drawPalmTrees();

        // Draw decorative rocks
        this.drawRocks();

        // Draw clouds
        this.drawClouds();
    }

    drawMountains() {
        this.ctx.fillStyle = '#6B8E23';
        for (let i = 0; i < 3; i++) {
            const x = 200 + i * 300;
            const y = this.H * 0.6;
            const width = 200;
            const height = 150;

            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + width * 0.5, y - height);
            this.ctx.lineTo(x + width, y);
            this.ctx.closePath();
            this.ctx.fill();

            // Add mountain shadow
            this.ctx.fillStyle = '#556B2F';
            this.ctx.beginPath();
            this.ctx.moveTo(x + width * 0.5, y - height);
            this.ctx.lineTo(x + width * 0.7, y - height * 0.7);
            this.ctx.lineTo(x + width, y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = '#6B8E23';
        }
    }

    drawPalmTrees() {
        const treePositions = [
            { x: 150, y: this.H * 0.7 },
            { x: 350, y: this.H * 0.75 },
            { x: 850, y: this.H * 0.72 },
            { x: 1050, y: this.H * 0.78 }
        ];

        treePositions.forEach(tree => {
            // Draw trunk
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(tree.x - 8, tree.y, 16, 80);

            // Draw trunk shadow
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(tree.x - 6, tree.y + 2, 12, 76);

            // Draw palm leaves
            this.ctx.fillStyle = '#228B22';
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const leafLength = 60;
                const leafWidth = 8;

                this.ctx.save();
                this.ctx.translate(tree.x, tree.y);
                this.ctx.rotate(angle);

                // Leaf shadow
                this.ctx.fillStyle = '#006400';
                this.ctx.fillRect(0, -leafWidth / 2, leafLength, leafWidth);

                // Leaf
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(2, -leafWidth / 2, leafLength - 2, leafWidth);

                this.ctx.restore();
            }

            // Draw coconuts
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.arc(tree.x, tree.y - 10, 6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawRocks() {
        const rockPositions = [
            { x: 100, y: this.H * 0.8 },
            { x: 250, y: this.H * 0.85 },
            { x: 900, y: this.H * 0.82 },
            { x: 1100, y: this.H * 0.88 }
        ];

        rockPositions.forEach(rock => {
            // Rock shadow
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(rock.x - 15, rock.y + 20, 30, 10);

            // Rock
            this.ctx.fillStyle = '#696969';
            this.ctx.beginPath();
            this.ctx.arc(rock.x, rock.y, 20, 0, Math.PI * 2);
            this.ctx.fill();

            // Rock highlight
            this.ctx.fillStyle = '#A9A9A9';
            this.ctx.beginPath();
            this.ctx.arc(rock.x - 5, rock.y - 5, 8, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawClouds() {
        const clouds = [
            { x: 100, y: 80, size: 40 },
            { x: 400, y: 120, size: 60 },
            { x: 700, y: 90, size: 50 },
            { x: 1000, y: 110, size: 45 }
        ];

        clouds.forEach(cloud => {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.7, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(cloud.x - cloud.size * 0.7, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.arc(cloud.x, cloud.y - cloud.size * 0.5, cloud.size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawAIPlayer() {
        if (!this.aiPlayer.isAlive) {
            // Draw dead AI with enhanced visuals
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.fillRect(this.aiPlayer.x - 22, this.aiPlayer.y + 40, 44, 12);

            // Draw fallen body
            this.ctx.fillStyle = '#8B0000';
            this.ctx.fillRect(this.aiPlayer.x - 20, this.aiPlayer.y - 40, 40, 80);
            this.ctx.strokeStyle = '#4B0000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(this.aiPlayer.x - 20, this.aiPlayer.y - 40, 40, 80);

            // Draw defeated text with glow
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FF0000';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText('DEFEATED', this.aiPlayer.x, this.aiPlayer.y + 60);
            this.ctx.shadowBlur = 0;
            return;
        }

        // Apply invulnerability effect
        if (this.aiPlayer.respawnInvulnerability > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        }

        // Draw AI shadow with blur effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(this.aiPlayer.x - 20, this.aiPlayer.y + 30, 40, 12);

        // Draw AI armor with metallic effect
        const aiBodyGradient = this.ctx.createLinearGradient(this.aiPlayer.x - 15, this.aiPlayer.y - 20, this.aiPlayer.x + 15, this.aiPlayer.y + 20);
        aiBodyGradient.addColorStop(0, '#8B0000');
        aiBodyGradient.addColorStop(0.5, '#DC143C');
        aiBodyGradient.addColorStop(1, '#4B0000');
        this.ctx.fillStyle = aiBodyGradient;
        this.ctx.fillRect(this.aiPlayer.x - 15, this.aiPlayer.y - 20, 30, 40);

        // Draw armor highlights
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(this.aiPlayer.x - 12, this.aiPlayer.y - 18, 24, 15);

        // Draw armor outline
        this.ctx.strokeStyle = '#4B0000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.aiPlayer.x - 15, this.aiPlayer.y - 20, 30, 40);

        // Draw AI head with realistic skin tone
        const aiHeadGradient = this.ctx.createRadialGradient(this.aiPlayer.x, this.aiPlayer.y - 30, 0, this.aiPlayer.x, this.aiPlayer.y - 30, 12);
        aiHeadGradient.addColorStop(0, '#f4a460');
        aiHeadGradient.addColorStop(1, '#d2691e');
        this.ctx.fillStyle = aiHeadGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.aiPlayer.x, this.aiPlayer.y - 30, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw head outline
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw eyes (angry red)
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(this.aiPlayer.x - 4, this.aiPlayer.y - 32, 2, 0, Math.PI * 2);
        this.ctx.arc(this.aiPlayer.x + 4, this.aiPlayer.y - 32, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw AI weapon with enhanced visuals
        if (this.aiPlayer.isAttacking) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 6;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 12;
        } else {
            this.ctx.strokeStyle = '#8b4513';
            this.ctx.lineWidth = 4;
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }

        const aiWeaponEndX = this.aiPlayer.x + Math.cos(this.aiPlayer.weaponAngle) * this.aiPlayer.weaponLength;
        const aiWeaponEndY = this.aiPlayer.y + Math.sin(this.aiPlayer.weaponAngle) * this.aiPlayer.weaponLength;

        // Draw weapon handle
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.aiPlayer.x, this.aiPlayer.y);
        this.ctx.lineTo(this.aiPlayer.x + Math.cos(this.aiPlayer.weaponAngle) * 15, this.aiPlayer.y + Math.sin(this.aiPlayer.weaponAngle) * 15);
        this.ctx.stroke();

        // Draw weapon blade
        if (this.aiPlayer.isAttacking) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 6;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 12;
        } else {
            this.ctx.strokeStyle = '#c0c0c0';
            this.ctx.lineWidth = 4;
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.aiPlayer.x + Math.cos(this.aiPlayer.weaponAngle) * 15, this.aiPlayer.y + Math.sin(this.aiPlayer.weaponAngle) * 15);
        this.ctx.lineTo(aiWeaponEndX, aiWeaponEndY);
        this.ctx.stroke();

        // Draw AI weapon tip
        this.ctx.fillStyle = this.aiPlayer.isAttacking ? '#ff0000' : '#ffffff';
        this.ctx.shadowColor = this.aiPlayer.isAttacking ? '#ff0000' : '#ffffff';
        this.ctx.shadowBlur = this.aiPlayer.isAttacking ? 10 : 3;
        this.ctx.beginPath();
        this.ctx.arc(aiWeaponEndX, aiWeaponEndY, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        // Draw enhanced health bar with glow
        const healthPercent = this.aiPlayer.health / 150;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.aiPlayer.x - 25, this.aiPlayer.y - 70, 50, 10);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.aiPlayer.x - 25, this.aiPlayer.y - 70, 50, 10);

        // Health bar gradient
        const healthGradient = this.ctx.createLinearGradient(this.aiPlayer.x - 23, this.aiPlayer.y - 68, this.aiPlayer.x + 23, this.aiPlayer.y - 68);
        if (healthPercent > 0.6) {
            healthGradient.addColorStop(0, '#00FF00');
            healthGradient.addColorStop(1, '#32CD32');
        } else if (healthPercent > 0.3) {
            healthGradient.addColorStop(0, '#FFFF00');
            healthGradient.addColorStop(1, '#FFD700');
        } else {
            healthGradient.addColorStop(0, '#FF0000');
            healthGradient.addColorStop(1, '#DC143C');
        }

        this.ctx.fillStyle = healthGradient;
        this.ctx.fillRect(this.aiPlayer.x - 23, this.aiPlayer.y - 68, 46 * healthPercent, 6);

        // Draw AI label with glow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(this.aiPlayer.x - 30, this.aiPlayer.y + 35, 60, 18);
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText('ENEMY', this.aiPlayer.x, this.aiPlayer.y + 47);
        this.ctx.shadowBlur = 0;

        // Restore invulnerability effect
        if (this.aiPlayer.respawnInvulnerability > 0) {
            this.ctx.restore();
        }
    }

    drawPlayer() {
        const pos = this.gameState.playerPos;

        // Don't draw if dead
        if (this.gameState.isDead) return;

        // Apply invulnerability effect
        if (this.gameState.respawnInvulnerability > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        }

        // Apply hit stun effect
        if (this.gameState.hitStun > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.7;
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(pos.x - 25, pos.y - 25, 50, 50);
            this.ctx.restore();
        }

        // Draw player shadow with blur effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(pos.x - 20, pos.y + 30, 40, 12);

        // Draw player armor/body with metallic effect
        const bodyGradient = this.ctx.createLinearGradient(pos.x - 15, pos.y - 20, pos.x + 15, pos.y + 20);
        bodyGradient.addColorStop(0, '#4169e1');
        bodyGradient.addColorStop(0.5, '#5a7bd8');
        bodyGradient.addColorStop(1, '#2c3e50');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fillRect(pos.x - 15, pos.y - 20, 30, 40);

        // Draw armor highlights
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(pos.x - 12, pos.y - 18, 24, 15);

        // Draw armor outline
        this.ctx.strokeStyle = '#1a1a2e';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(pos.x - 15, pos.y - 20, 30, 40);

        // Draw player head with realistic skin tone
        const headGradient = this.ctx.createRadialGradient(pos.x, pos.y - 30, 0, pos.x, pos.y - 30, 12);
        headGradient.addColorStop(0, '#f4a460');
        headGradient.addColorStop(1, '#d2691e');
        this.ctx.fillStyle = headGradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y - 30, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw head outline
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw eyes
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(pos.x - 4, pos.y - 32, 2, 0, Math.PI * 2);
        this.ctx.arc(pos.x + 4, pos.y - 32, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Calculate weapon angle with swing animation
        let weaponAngle = this.gameState.weaponAngle;
        if (this.gameState.isAttacking) {
            const swingAnim = this.combatSystem.swingAnimations[this.gameState.attackType];
            const swingOffset = (this.gameState.attackSwingProgress / 100) * (swingAnim.arc * Math.PI / 180);
            weaponAngle += swingOffset * this.gameState.attackSwingDirection;
        }

        // Draw weapon with enhanced visuals and glow
        if (this.gameState.isAttacking) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 8;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 15;
        } else if (this.gameState.isBlocking) {
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 6;
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.strokeStyle = '#8b4513';
            this.ctx.lineWidth = 5;
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }

        const weaponEndX = pos.x + Math.cos(weaponAngle) * this.gameState.weaponLength;
        const weaponEndY = pos.y + Math.sin(weaponAngle) * this.gameState.weaponLength;

        // Draw weapon handle
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(pos.x + Math.cos(weaponAngle) * 20, pos.y + Math.sin(weaponAngle) * 20);
        this.ctx.stroke();

        // Draw weapon blade
        if (this.gameState.isAttacking) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 8;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 15;
        } else if (this.gameState.isBlocking) {
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 6;
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.strokeStyle = '#c0c0c0';
            this.ctx.lineWidth = 5;
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(pos.x + Math.cos(weaponAngle) * 20, pos.y + Math.sin(weaponAngle) * 20);
        this.ctx.lineTo(weaponEndX, weaponEndY);
        this.ctx.stroke();

        // Draw weapon tip with glow effect
        this.ctx.fillStyle = this.gameState.isAttacking ? '#ff0000' : this.gameState.isBlocking ? '#00ff00' : '#ffffff';
        this.ctx.shadowColor = this.gameState.isAttacking ? '#ff0000' : this.gameState.isBlocking ? '#00ff00' : '#ffffff';
        this.ctx.shadowBlur = this.gameState.isAttacking ? 12 : this.gameState.isBlocking ? 8 : 5;
        this.ctx.beginPath();
        this.ctx.arc(weaponEndX, weaponEndY, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        // Restore invulnerability effect
        if (this.gameState.respawnInvulnerability > 0) {
            this.ctx.restore();
        }
    }

    drawWeaponTrails() {
        this.effects.weaponTrails.forEach(trail => {
            const alpha = 1 - ((Date.now() - trail.startTime) / 300);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 2;

            const trailEndX = trail.x + Math.cos(trail.angle) * this.gameState.weaponLength;
            const trailEndY = trail.y + Math.sin(trail.angle) * this.gameState.weaponLength;

            this.ctx.beginPath();
            this.ctx.moveTo(trail.x, trail.y);
            this.ctx.lineTo(trailEndX, trailEndY);
            this.ctx.stroke();
        });
    }

    drawCombatEffects() {
        this.effects.combatEffects.forEach(effect => {
            const alpha = 1 - ((Date.now() - effect.startTime) / 500);
            const scale = 1 + ((Date.now() - effect.startTime) / 500);

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(effect.x, effect.y);
            this.ctx.scale(scale, scale);

            if (effect.type === 'hit') {
                // Draw damage number with glow effect
                this.ctx.fillStyle = '#ff0000';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 8;
                this.ctx.fillText(effect.damage.toString(), 0, -25);

                // Draw enhanced hit effect
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
                this.ctx.stroke();

                // Draw inner hit effect
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (effect.type === 'block') {
                // Draw block effect
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#00ff00';
                this.ctx.shadowBlur = 8;
                this.ctx.fillText('BLOCKED!', 0, -20);

                // Draw block effect circles
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 4;
                this.ctx.shadowColor = '#00ff00';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (effect.type === 'combo') {
                // Draw combo effect
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 12;
                this.ctx.fillText(`COMBO! ${effect.damage}`, 0, -30);

                // Draw combo stars
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.fillText('⭐', -20, 10);
                this.ctx.fillText('⭐', 0, 10);
                this.ctx.fillText('⭐', 20, 10);

                // Draw combo rings
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 3;
                this.ctx.shadowColor = '#FFD700';
                this.ctx.shadowBlur = 8;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    drawDeathEffects() {
        this.effects.deathEffects.forEach(effect => {
            const alpha = 1 - ((Date.now() - effect.startTime) / 2000);
            const scale = 1 + ((Date.now() - effect.startTime) / 2000) * 2;

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.translate(effect.x, effect.y);
            this.ctx.scale(scale, scale);

            if (effect.target === 'player') {
                // Draw epic death effect for player
                this.ctx.fillStyle = '#FF0000';
                this.ctx.font = 'bold 32px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#FF0000';
                this.ctx.shadowBlur = 15;
                this.ctx.fillText('YOU DIED!', 0, -40);

                // Draw death skull
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 48px Arial';
                this.ctx.fillText('💀', 0, 20);

                // Draw respawn timer
                const timeLeft = Math.max(0, (this.gameState.respawnTime - (Date.now() - effect.startTime)) / 1000);
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillText(`Respawn in ${timeLeft.toFixed(1)}s`, 0, 60);
            } else {
                // Draw kill effect for AI
                this.ctx.fillStyle = '#00FF00';
                this.ctx.font = 'bold 28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#00FF00';
                this.ctx.shadowBlur = 12;
                this.ctx.fillText('ENEMY SLAIN!', 0, -30);

                // Draw sword emoji
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 36px Arial';
                this.ctx.fillText('⚔️', 0, 15);

                // Draw +1 kill
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.font = 'bold 18px Arial';
                this.ctx.fillText('+1 KILL', 0, 45);
            }

            this.ctx.restore();
        });
    }

    gameLoop() {
        if (this.gameState.gameStarted) {
            this.updatePlayerMovement();
            this.updateStamina();
            this.updateEffects();
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new ChivalryCombatGame();
});
