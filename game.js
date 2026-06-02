// ==========================================================================
// SPACE INVADERS - PREMIUM ARCADE VERSION
// ==========================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variables de estado del juego
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let level = 1;
let enemySpeed = 2;

// Configuración de niveles de dificultad
let currentDifficulty = 'normal';
const difficultySettings = {
    easy: {
        lives: 5,
        initialEnemySpeed: 1.3,
        enemyShootChance: 0.005,
        scoreMultiplier: 1,
        speedIncrement: 0.3
    },
    normal: {
        lives: 3,
        initialEnemySpeed: 2.0,
        enemyShootChance: 0.008,
        scoreMultiplier: 1.5,
        speedIncrement: 0.45
    },
    hard: {
        lives: 2,
        initialEnemySpeed: 3.0,
        enemyShootChance: 0.013,
        scoreMultiplier: 2.5,
        speedIncrement: 0.6
    },
    nightmare: {
        lives: 1,
        initialEnemySpeed: 4.2,
        enemyShootChance: 0.022,
        scoreMultiplier: 4,
        speedIncrement: 0.8
    }
};

// ==========================================================================
// SINTETIZADOR DE AUDIO RETRO (Web Audio API)
// ==========================================================================
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playLaserSound() {
    try {
        const audio = getAudioContext();
        const osc = audio.createOscillator();
        const gain = audio.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, audio.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audio.currentTime + 0.12);

        gain.gain.setValueAtTime(0.12, audio.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audio.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start();
        osc.stop(audio.currentTime + 0.12);
    } catch (e) {
        console.warn("Web Audio API error:", e);
    }
}

function playExplosionSound() {
    try {
        const audio = getAudioContext();
        const bufferSize = audio.sampleRate * 0.25; // 0.25 segundos
        const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Ruido blanco
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audio.createBufferSource();
        noise.buffer = buffer;

        const filter = audio.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, audio.currentTime);
        filter.frequency.exponentialRampToValueAtTime(20, audio.currentTime + 0.25);

        const gain = audio.createGain();
        gain.gain.setValueAtTime(0.25, audio.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audio.currentTime + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);

        noise.start();
        noise.stop(audio.currentTime + 0.25);
    } catch (e) {
        console.warn("Web Audio API error:", e);
    }
}

function playLevelUpSound() {
    try {
        const audio = getAudioContext();
        const now = audio.currentTime;
        
        // Pequeño arpegio ascendente
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        notes.forEach((freq, idx) => {
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);
            
            gain.gain.setValueAtTime(0.12, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.08 + 0.15);
            
            osc.connect(gain);
            gain.connect(audio.destination);
            
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.2);
        });
    } catch (e) {
        console.warn("Web Audio API error:", e);
    }
}

function playGameOverSound(won) {
    try {
        const audio = getAudioContext();
        const now = audio.currentTime;
        
        if (won) {
            // Fanfarria feliz victoriosa
            const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = audio.createOscillator();
                const gain = audio.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                
                gain.gain.setValueAtTime(0.08, now + idx * 0.12);
                gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.12 + 0.25);
                
                osc.connect(gain);
                gain.connect(audio.destination);
                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.3);
            });
        } else {
            // Notas tristes descendentes disonantes
            const notes = [311.13, 293.66, 277.18, 220.00]; // Eb4, D4, Db4, A3
            notes.forEach((freq, idx) => {
                const osc = audio.createOscillator();
                const gain = audio.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.16);
                
                gain.gain.setValueAtTime(0.12, now + idx * 0.16);
                gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.16 + 0.35);
                
                osc.connect(gain);
                gain.connect(audio.destination);
                osc.start(now + idx * 0.16);
                osc.stop(now + idx * 0.16 + 0.45);
            });
        }
    } catch (e) {
        console.warn("Web Audio API error:", e);
    }
}

// ==========================================================================
// DEFINICIÓN DEL JUGADOR (NAVE NAVEGACIÓN VECTORIAL)
// ==========================================================================
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 44,
    height: 40,
    speed: 6.5,
    dx: 0,
    color: '#00ff88'
};

// ==========================================================================
// ESTRUCTURA DE COMPONENTES
// ==========================================================================
let bullets = [];
const Bullet = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 16;
    this.speed = 8.5;
    this.color = '#00ffff'; // Azul cian neón para disparos del jugador
};

let enemies = [];
let enemyBullets = [];

const Enemy = function(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 38;
    this.height = 32;
    this.type = type; // 0, 1, 2 para diferentes diseños
    this.color = type === 0 ? '#ff0055' : (type === 1 ? '#ffcc00' : '#00ffff');
    this.speed = enemySpeed;
    this.direction = 1;
    this.shootChance = difficultySettings[currentDifficulty].enemyShootChance;
};

const EnemyBullet = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 14;
    this.speed = 4.5;
    this.color = '#ff0055'; // Rosa neón/Rojo para disparos enemigos
};

// OVNI de bonificación
let ufo = null;
const ufoChance = 0.0007; // Baja probabilidad por fotograma

// ==========================================================================
// BÚNKERES (ESCUDOS DEFENSA PIXELADOS)
// ==========================================================================
let bunkers = [];

function initBunkers() {
    bunkers = [];
    const numBunkers = 4;
    const bunkerWidth = 60;
    const startY = canvas.height - 120;
    // Espaciado uniforme para los 4 bunkers
    const spacing = (canvas.width - numBunkers * bunkerWidth) / (numBunkers + 1);

    for (let b = 0; b < numBunkers; b++) {
        const bx = spacing + b * (bunkerWidth + spacing);
        // Construimos un bunker a base de bloques pequeños (de 6x6 píxeles)
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 10; col++) {
                // Hacer forma de cúpula vaciando esquinas superiores y el arco central inferior
                if ((row === 0 && (col === 0 || col === 1 || col === 8 || col === 9)) ||
                    (row === 4 && col > 2 && col < 7) ||
                    (row === 3 && col > 3 && col < 6)) {
                    continue;
                }
                bunkers.push({
                    x: bx + col * 6,
                    y: startY + row * 6,
                    width: 6,
                    height: 6,
                    color: '#00ff88'
                });
            }
        }
    }
}

// ==========================================================================
// EFECTO DE ESTRELLAS DE FONDO (STARFIELD PARALLAX)
// ==========================================================================
let stars = [];

function initStars() {
    stars = [];
    const count = 70;
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 1.2 + 0.2
        });
    }
}

function updateStars() {
    for (let star of stars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    }
}

function drawStars() {
    ctx.fillStyle = '#ffffff';
    for (let star of stars) {
        ctx.save();
        ctx.globalAlpha = star.speed / 1.4; // Estrellas lentas más tenues (profundidad)
        ctx.fillRect(star.x, star.y, star.size, star.size);
        ctx.restore();
    }
}

// ==========================================================================
// SISTEMA DE PARTÍCULAS (EXPLOSIONES DE NEÓN)
// ==========================================================================
let particles = [];

const Particle = function(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 1;
    this.speedX = (Math.random() - 0.5) * 7;
    this.speedY = (Math.random() - 0.5) * 7;
    this.color = color;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.015;
};

Particle.prototype.update = function() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.decay;
};

Particle.prototype.draw = function() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

function createExplosion(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (let p of particles) {
        p.draw();
    }
}

// ==========================================================================
// SISTEMA DE VIBRACIÓN DE PANTALLA (SCREEN SHAKE)
// ==========================================================================
let shakeDuration = 0;
let shakeIntensity = 0;

function triggerShake(duration, intensity) {
    shakeDuration = duration;
    shakeIntensity = intensity;
}

// ==========================================================================
// INICIALIZACIÓN DE ENEMIGOS
// ==========================================================================
function initEnemies() {
    enemies = [];
    const rows = 4; // 4 filas para más desafío
    const cols = 6; // 6 columnas
    const spacingX = 75;
    const spacingY = 55;
    const startX = 100;
    const startY = 60;

    for (let i = 0; i < rows; i++) {
        // Asignamos tipo de enemigo según la fila para variedad visual
        const type = i % 3;
        for (let j = 0; j < cols; j++) {
            enemies.push(new Enemy(startX + j * spacingX, startY + i * spacingY, type));
        }
    }
}

// ==========================================================================
// CONTROLES DEL TECLADO
// ==========================================================================
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Evitar que el espacio desplace la página y disparar
    if (e.key === ' ' && gameRunning && !gamePaused) {
        e.preventDefault();
        shootBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ==========================================================================
// FUNCIONES DE DISPARO
// ==========================================================================
function shootBullet() {
    // Limitar la cantidad máxima de balas del jugador en pantalla para evitar spam (máx 3)
    if (bullets.length < 3) {
        bullets.push(new Bullet(player.x + player.width / 2 - 2, player.y));
        playLaserSound();
    }
}

function enemyShoot(x, y) {
    enemyBullets.push(new EnemyBullet(x, y));
}

// ==========================================================================
// ACTUALIZACIÓN DEL JUEGO
// ==========================================================================
function updatePlayer() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.dx = -player.speed;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.dx = player.speed;
    } else {
        player.dx = 0;
    }

    player.x += player.dx;

    // Mantener el jugador dentro del canvas
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function updateBullets() {
    // Actualizar disparos del jugador
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;

        // Eliminar disparos fuera de pantalla
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }

    // Actualizar disparos de enemigos
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;

        // Eliminar disparos fuera de pantalla
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    let changeDirection = false;

    for (let i = 0; i < enemies.length; i++) {
        enemies[i].x += enemies[i].speed * enemies[i].direction;

        // Cambiar dirección si toca los bordes laterales
        if (enemies[i].x <= 10 || enemies[i].x + enemies[i].width >= canvas.width - 10) {
            changeDirection = true;
        }

        // Los enemigos disparan aleatoriamente
        if (Math.random() < enemies[i].shootChance) {
            enemyShoot(enemies[i].x + enemies[i].width / 2, enemies[i].y + enemies[i].height);
        }

        // Si un enemigo llega a la altura de los búnkeres/jugador, es fin de partida
        if (enemies[i].y + enemies[i].height > canvas.height - 110) {
            endGame(false);
        }
    }

    if (changeDirection) {
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].direction *= -1;
            enemies[i].y += 24; // Descenso
        }
    }
}

function updateUFO() {
    if (ufo === null) {
        if (Math.random() < ufoChance && gameRunning && !gamePaused) {
            // Decidir aleatoriamente dirección de salida
            const direction = Math.random() < 0.5 ? 1 : -1;
            ufo = {
                x: direction === 1 ? -60 : canvas.width + 10,
                y: 35,
                width: 48,
                height: 20,
                speed: 3 * direction,
                color: '#ff00ff', // Rosa brillante neón
                points: Math.floor(Math.random() * 3 + 1) * 50 // 50, 100 o 150 puntos
            };
        }
    } else {
        ufo.x += ufo.speed;
        // Limpiar si sale de la pantalla
        if ((ufo.speed > 0 && ufo.x > canvas.width + 10) || (ufo.speed < 0 && ufo.x < -60)) {
            ufo = null;
        }
    }
}

// ==========================================================================
// DETECCIÓN DE COLISIONES COMPLETA
// ==========================================================================
function checkCollisions() {
    // 1. Colisión: disparos del jugador con enemigos comunes
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y
            ) {
                score += Math.round(10 * difficultySettings[currentDifficulty].scoreMultiplier);
                createExplosion(enemies[j].x + enemies[j].width / 2, enemies[j].y + enemies[j].height / 2, enemies[j].color, 15);
                playExplosionSound();
                triggerShake(8, 3);
                
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                break;
            }
        }
    }

    // 2. Colisión: disparos del jugador con el OVNI
    if (ufo && bullets.length > 0) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (
                bullets[i].x < ufo.x + ufo.width &&
                bullets[i].x + bullets[i].width > ufo.x &&
                bullets[i].y < ufo.y + ufo.height &&
                bullets[i].y + bullets[i].height > ufo.y
            ) {
                score += Math.round(ufo.points * difficultySettings[currentDifficulty].scoreMultiplier);
                createExplosion(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2, ufo.color, 30);
                playExplosionSound();
                // Efecto de cámara lenta y gran sacudida
                triggerShake(20, 7);
                
                bullets.splice(i, 1);
                ufo = null;
                break;
            }
        }
    }

    // 3. Colisión: disparos de enemigos con el jugador
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (
            enemyBullets[i].x < player.x + player.width &&
            enemyBullets[i].x + enemyBullets[i].width > player.x &&
            enemyBullets[i].y < player.y + player.height &&
            enemyBullets[i].y + enemyBullets[i].height > player.y
        ) {
            lives--;
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, player.color, 35);
            playExplosionSound();
            triggerShake(25, 9);
            
            enemyBullets.splice(i, 1);
            
            // Limpiar todos los disparos enemigos de la pantalla para darle respiro al reaparecer
            enemyBullets = [];

            if (lives <= 0) {
                endGame(false);
            }
            break;
        }
    }

    // 4. Colisiones con los búnkeres destructibles (Bielas de defensa)
    // Disparos del jugador con los búnkeres
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = bunkers.length - 1; j >= 0; j--) {
            if (
                bullets[i].x < bunkers[j].x + bunkers[j].width &&
                bullets[i].x + bullets[i].width > bunkers[j].x &&
                bullets[i].y < bunkers[j].y + bunkers[j].height &&
                bullets[i].y + bullets[i].height > bunkers[j].y
            ) {
                // Pequeña explosión de partículas verde
                createExplosion(bunkers[j].x + 3, bunkers[j].y + 3, '#00ff88', 3);
                bunkers.splice(j, 1);
                bullets.splice(i, 1);
                break;
            }
        }
    }

    // Disparos de enemigos con los búnkeres
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        for (let j = bunkers.length - 1; j >= 0; j--) {
            if (
                enemyBullets[i].x < bunkers[j].x + bunkers[j].width &&
                enemyBullets[i].x + enemyBullets[i].width > bunkers[j].x &&
                enemyBullets[i].y < bunkers[j].y + bunkers[j].height &&
                enemyBullets[i].y + enemyBullets[i].height > bunkers[j].y
            ) {
                createExplosion(bunkers[j].x + 3, bunkers[j].y + 3, '#00ff88', 3);
                bunkers.splice(j, 1);
                enemyBullets.splice(i, 1);
                break;
            }
        }
    }

    // Verificar si todos los enemigos de la oleada fueron eliminados
    if (enemies.length === 0) {
        levelUp();
    }
}

// ==========================================================================
// DIBUJO DE LOS ELEMENTOS EN PANTALLA
// ==========================================================================
function drawPlayer() {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#00ff88';
    
    // Dibujar alas exteriores (verde brillante neón)
    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y + 5);
    ctx.lineTo(player.x + player.width, player.y + player.height - 5);
    ctx.lineTo(player.x + player.width * 0.85, player.y + player.height);
    ctx.lineTo(player.x + player.width * 0.15, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height - 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dibujar fuselaje central / cabina (azul cian brillante)
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width * 0.65, player.y + player.height * 0.5);
    ctx.lineTo(player.x + player.width * 0.5, player.y + player.height * 0.7);
    ctx.lineTo(player.x + player.width * 0.35, player.y + player.height * 0.5);
    ctx.closePath();
    ctx.fill();

    // Cañones en los extremos de las alas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 2, player.y + player.height - 18, 4, 12);
    ctx.fillRect(player.x + player.width - 6, player.y + player.height - 18, 4, 12);

    // Animación de propulsión de fuego
    if (gameRunning && !gamePaused) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ff6600';
        ctx.fillStyle = Math.random() < 0.5 ? '#ff3300' : '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2 - 5, player.y + player.height);
        ctx.lineTo(player.x + player.width / 2 + 5, player.y + player.height);
        ctx.lineTo(player.x + player.width / 2, player.y + player.height + 10 + Math.random() * 8);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawBullets() {
    // Balas del jugador (Luz cian brillante)
    ctx.save();
    ctx.shadowBlur = 10;
    for (let bullet of bullets) {
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    ctx.restore();

    // Balas enemigas (Luz rosa neón destructiva)
    ctx.save();
    ctx.shadowBlur = 10;
    for (let bullet of enemyBullets) {
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    ctx.restore();
}

function drawEnemies() {
    ctx.save();
    
    // Animación basada en el tiempo para mover garras y tentáculos
    const animOffset = Math.sin(Date.now() / 150) > 0;

    for (let enemy of enemies) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        const x = enemy.x;
        const y = enemy.y;
        const w = enemy.width;
        const h = enemy.height;

        ctx.beginPath();
        if (enemy.type === 0) {
            // Diseño alien "Cangrejo" con garras animadas
            ctx.moveTo(x + w * 0.3, y);
            ctx.lineTo(x + w * 0.7, y);
            ctx.lineTo(x + w * 0.9, y + h * 0.3);
            ctx.lineTo(x + w, y + h * 0.6);
            
            if (animOffset) {
                // Garras hacia abajo
                ctx.lineTo(x + w * 0.8, y + h * 0.8);
                ctx.lineTo(x + w * 0.9, y + h);
                ctx.lineTo(x + w * 0.7, y + h * 0.8);
                ctx.lineTo(x + w * 0.6, y + h * 0.8);
                ctx.lineTo(x + w * 0.5, y + h * 0.9);
                ctx.lineTo(x + w * 0.4, y + h * 0.8);
                ctx.lineTo(x + w * 0.3, y + h * 0.8);
                ctx.lineTo(x + w * 0.1, y + h);
                ctx.lineTo(x + w * 0.2, y + h * 0.8);
            } else {
                // Garras hacia fuera
                ctx.lineTo(x + w * 0.85, y + h * 0.6);
                ctx.lineTo(x + w * 0.95, y + h * 0.8);
                ctx.lineTo(x + w * 0.75, y + h * 0.75);
                ctx.lineTo(x + w * 0.55, y + h * 0.85);
                ctx.lineTo(x + w * 0.45, y + h * 0.85);
                ctx.lineTo(x + w * 0.25, y + h * 0.75);
                ctx.lineTo(x + w * 0.05, y + h * 0.8);
                ctx.lineTo(x + w * 0.15, y + h * 0.6);
            }
            ctx.lineTo(x, y + h * 0.6);
            ctx.lineTo(x + w * 0.1, y + h * 0.3);
        } else if (enemy.type === 1) {
            // Diseño alien "Calamar" con tentáculos wiggling
            ctx.moveTo(x + w * 0.5, y);
            ctx.lineTo(x + w * 0.8, y + h * 0.3);
            ctx.lineTo(x + w * 0.9, y + h * 0.6);
            
            if (animOffset) {
                ctx.lineTo(x + w * 0.75, y + h);
                ctx.lineTo(x + w * 0.6, y + h * 0.75);
                ctx.lineTo(x + w * 0.5, y + h * 0.95);
                ctx.lineTo(x + w * 0.4, y + h * 0.75);
                ctx.lineTo(x + w * 0.25, y + h);
            } else {
                ctx.lineTo(x + w * 0.85, y + h * 0.95);
                ctx.lineTo(x + w * 0.65, y + h * 0.8);
                ctx.lineTo(x + w * 0.5, y + h * 0.85);
                ctx.lineTo(x + w * 0.35, y + h * 0.8);
                ctx.lineTo(x + w * 0.15, y + h * 0.95);
            }
            ctx.lineTo(x + w * 0.1, y + h * 0.6);
            ctx.lineTo(x + w * 0.2, y + h * 0.3);
        } else {
            // Diseño alien "Pulpo/Espacial"
            ctx.moveTo(x + w * 0.25, y);
            ctx.lineTo(x + w * 0.75, y);
            ctx.lineTo(x + w * 0.95, y + h * 0.4);
            ctx.lineTo(x + w * 0.8, y + h * 0.7);
            
            if (animOffset) {
                ctx.lineTo(x + w, y + h * 0.95);
                ctx.lineTo(x + w * 0.7, y + h * 0.75);
                ctx.lineTo(x + w * 0.5, y + h * 0.9);
                ctx.lineTo(x + w * 0.3, y + h * 0.75);
                ctx.lineTo(x, y + h * 0.95);
            } else {
                ctx.lineTo(x + w * 0.85, y + h * 0.8);
                ctx.lineTo(x + w * 0.65, y + h * 0.95);
                ctx.lineTo(x + w * 0.5, y + h * 0.75);
                ctx.lineTo(x + w * 0.35, y + h * 0.95);
                ctx.lineTo(x + w * 0.15, y + h * 0.8);
            }
            ctx.lineTo(x + w * 0.05, y + h * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ojos de núcleo brillante
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        ctx.fillRect(x + w * 0.3, y + h * 0.32, 4, 4);
        ctx.fillRect(x + w * 0.6, y + h * 0.32, 4, 4);
        
        ctx.restore();
    }
    ctx.restore();
}

function drawUFO() {
    if (ufo) {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = ufo.color;
        ctx.fillStyle = ufo.color;
        
        // Dibujo de platillo volante
        ctx.beginPath();
        ctx.ellipse(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2, ufo.width / 2, ufo.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabina superior brillante (Azul neón)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(ufo.x + ufo.width / 2, ufo.y + ufo.height / 3, ufo.width / 4, Math.PI, 0);
        ctx.fill();
        
        ctx.restore();
    }
}

function drawBunkers() {
    ctx.save();
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ff88';
    ctx.fillStyle = '#00ff88';
    for (let block of bunkers) {
        ctx.fillRect(block.x, block.y, block.width, block.height);
    }
    ctx.restore();
}

function drawBackground() {
    ctx.fillStyle = '#030107'; // Fondo morado muy oscuro
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStars();

    // Líneas retro grid de vector en el fondo (opcional y sutil)
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
}

// ==========================================================================
// ACTUALIZACIÓN DE INTERFAZ (HUD)
// ==========================================================================
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

// ==========================================================================
// EVENTOS DE SUBIDA DE NIVEL Y FIN DE PARTIDA
// ==========================================================================
function levelUp() {
    level++;
    const settings = difficultySettings[currentDifficulty];
    enemySpeed += settings.speedIncrement;
    initEnemies();
    initBunkers(); // Regenerar escudos en cada nuevo nivel
    playLevelUpSound();

    // Aumentar la probabilidad de disparo de los enemigos progresivamente
    for (let enemy of enemies) {
        enemy.speed = enemySpeed;
        enemy.shootChance = settings.enemyShootChance + (level * 0.004);
    }
}

function endGame(won) {
    gameRunning = false;
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverMessage = document.getElementById('gameOverMessage');

    playGameOverSound(won);

    if (won) {
        gameOverTitle.textContent = '¡VICTORIA!';
        gameOverMessage.innerHTML = `¡Has defendido la galaxia!<br>Puntuación Final: <span style="color:#00ffff">${score}</span><br>Nivel Superado: <span style="color:#ff00ff">${level}</span>`;
    } else {
        gameOverTitle.textContent = 'GAME OVER';
        gameOverMessage.innerHTML = `Los invasores conquistaron la Tierra.<br>Puntuación Final: <span style="color:#00ffff">${score}</span><br>Nivel de Invasión: <span style="color:#ff00ff">${level}</span>`;
    }

    gameOverScreen.classList.remove('hidden');
}

// ==========================================================================
// LOOP DE JUEGO (GAME LOOP)
// ==========================================================================
function gameLoop() {
    ctx.save();
    
    // Aplicar vibración de pantalla si está activo
    if (shakeDuration > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeDuration--;
    }

    drawBackground();

    if (gameRunning && !gamePaused) {
        updateStars();
        updatePlayer();
        updateBullets();
        updateEnemies();
        updateUFO();
        updateParticles();
        checkCollisions();
    }

    drawBunkers();
    drawBullets();
    drawEnemies();
    drawUFO();
    drawPlayer();
    drawParticles();
    
    ctx.restore(); // Restaurar traducción de vibración
    
    updateUI();

    requestAnimationFrame(gameLoop);
}

// ==========================================================================
// MANEJADORES DE INTERACCIÓN DE BOTONES
// ==========================================================================

// Manejo de la selección de dificultad
document.querySelectorAll('.diff-opt').forEach(button => {
    button.addEventListener('click', (e) => {
        if (!gameRunning) {
            // Quitar clase activa de todos
            document.querySelectorAll('.diff-opt').forEach(btn => btn.classList.remove('active'));
            // Añadir clase activa al seleccionado
            e.target.classList.add('active');
            currentDifficulty = e.target.getAttribute('data-diff');
        }
    });
});

document.getElementById('startBtn').addEventListener('click', () => {
    // Iniciar contexto de audio tras gesto del usuario
    getAudioContext();

    if (!gameRunning) {
        const settings = difficultySettings[currentDifficulty];
        gameRunning = true;
        gamePaused = false;
        score = 0;
        lives = settings.lives;
        level = 1;
        enemySpeed = settings.initialEnemySpeed;
        bullets = [];
        enemyBullets = [];
        particles = [];
        ufo = null;
        initEnemies();
        initBunkers();
        initStars();
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    getAudioContext();
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.getElementById('pauseBtn').textContent = gamePaused ? 'Reanudar' : 'Pausar';
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    getAudioContext();
    const settings = difficultySettings[currentDifficulty];
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = settings.lives;
    level = 1;
    enemySpeed = settings.initialEnemySpeed;
    bullets = [];
    enemyBullets = [];
    particles = [];
    ufo = null;
    initEnemies();
    initBunkers();
    initStars();
    document.getElementById('gameOverScreen').classList.add('hidden');
});

// ==========================================================================
// INICIO AUTOMÁTICO
// ==========================================================================
initStars(); // Precargar estrellas de fondo para animación del menú
gameLoop();
console.log("🚀 Space Invaders Premium - Inicia el juego para disparar láseres sintetizados.");