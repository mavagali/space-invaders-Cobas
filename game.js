// ============================================
// SPACE INVADERS - JUEGO COMPLETO
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variables de estado del juego
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let level = 1;
let enemySpeed = 2;

// ============================================
// DEFINICIÓN DEL JUGADOR (NAVE)
// ============================================
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 6,
    dx: 0,
    color: '#00ff00'
};

// ============================================
// DISPAROS DEL JUGADOR
// ============================================
let bullets = [];
const Bullet = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 15;
    this.speed = 7;
    this.color = '#ffff00';
};

// ============================================
// ENEMIGOS
// ============================================
let enemies = [];
let enemyBullets = [];

const Enemy = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 35;
    this.height = 30;
    this.color = '#ff0000';
    this.speed = enemySpeed;
    this.direction = 1;
    this.shootChance = 0.01;
};

const EnemyBullet = function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 12;
    this.speed = 5;
    this.color = '#ff4444';
};

// ============================================
// INICIALIZACIÓN DE ENEMIGOS
// ============================================
function initEnemies() {
    enemies = [];
    const rows = 3;
    const cols = 5;
    const spacing = 80;
    const startX = 60;
    const startY = 40;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            enemies.push(new Enemy(startX + j * spacing, startY + i * spacing));
        }
    }
}

// ============================================
// CONTROLES DEL TECLADO
// ============================================
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Disparar con espacio
    if (e.key === ' ' && gameRunning && !gamePaused) {
        e.preventDefault();
        shootBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ============================================
// FUNCIONES DE DISPARO
// ============================================
function shootBullet() {
    bullets.push(new Bullet(player.x + player.width / 2 - 2.5, player.y));
}

function enemyShoot(x, y) {
    enemyBullets.push(new EnemyBullet(x, y));
}

// ============================================
// ACTUALIZACIÓN DEL JUEGO
// ============================================
function updatePlayer() {
    // Movimiento horizontal
    if (keys['ArrowLeft'] || keys['a']) {
        player.dx = -player.speed;
    } else if (keys['ArrowRight'] || keys['d']) {
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

        // Cambiar dirección si toca los bordes
        if (enemies[i].x <= 0 || enemies[i].x + enemies[i].width >= canvas.width) {
            changeDirection = true;
        }

        // Los enemigos disparan aleatoriamente
        if (Math.random() < enemies[i].shootChance) {
            enemyShoot(enemies[i].x + enemies[i].width / 2, enemies[i].y + enemies[i].height);
        }

        // Si un enemigo toca el fondo, game over
        if (enemies[i].y + enemies[i].height > canvas.height - 60) {
            endGame(false);
        }
    }

    if (changeDirection) {
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].direction *= -1;
            enemies[i].y += 30;
        }
    }
}

// ============================================
// DETECCIÓN DE COLISIONES
// ============================================
function checkCollisions() {
    // Colisión: disparos del jugador con enemigos
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (
                bullets[i].x < enemies[j].x + enemies[j].width &&
                bullets[i].x + bullets[i].width > enemies[j].x &&
                bullets[i].y < enemies[j].y + enemies[j].height &&
                bullets[i].y + bullets[i].height > enemies[j].y
            ) {
                score += 10;
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                break;
            }
        }
    }

    // Colisión: disparos de enemigos con jugador
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (
            enemyBullets[i].x < player.x + player.width &&
            enemyBullets[i].x + enemyBullets[i].width > player.x &&
            enemyBullets[i].y < player.y + player.height &&
            enemyBullets[i].y + enemyBullets[i].height > player.y
        ) {
            lives--;
            enemyBullets.splice(i, 1);

            if (lives <= 0) {
                endGame(false);
            }
            break;
        }
    }

    // Verificar si todos los enemigos fueron eliminados
    if (enemies.length === 0) {
        levelUp();
    }
}

// ============================================
// DIBUJO
// ============================================
function drawPlayer() {
    // Nave del jugador (triángulo)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Brillo
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawBullets() {
    // Disparos del jugador
    ctx.fillStyle = '#ffff00';
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }

    // Disparos de enemigos
    ctx.fillStyle = '#ff4444';
    for (let bullet of enemyBullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Ojos del enemigo
        ctx.fillStyle = 'white';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
        ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 5, 5, 5);
    }
}

function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid opcional
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
}

// ============================================
// ACTUALIZACIÓN DE UI
// ============================================
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

// ============================================
// FIN DE JUEGO Y NIVELES
// ============================================
function levelUp() {
    level++;
    enemySpeed += 0.5;
    initEnemies();
    
    for (let enemy of enemies) {
        enemy.speed = enemySpeed;
        enemy.shootChance = 0.01 + (level * 0.005);
    }
}

function endGame(won) {
    gameRunning = false;
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverMessage = document.getElementById('gameOverMessage');

    if (won) {
        gameOverTitle.textContent = '¡GANASTE!';
        gameOverMessage.textContent = `¡Felicidades! Alcanzaste el nivel ${level}.\nPuntuación: ${score}`;
    } else {
        gameOverTitle.textContent = 'GAME OVER';
        gameOverMessage.textContent = `Puntuación final: ${score}\nNivel alcanzado: ${level}`;
    }

    gameOverScreen.classList.remove('hidden');
}

// ============================================
// LOOP PRINCIPAL DEL JUEGO
// ============================================
function gameLoop() {
    drawBackground();

    if (gameRunning && !gamePaused) {
        updatePlayer();
        updateBullets();
        updateEnemies();
        checkCollisions();
    }

    drawBullets();
    drawEnemies();
    drawPlayer();
    updateUI();

    requestAnimationFrame(gameLoop);
}

// ============================================
// CONTROLES DE BOTONES
// ============================================
document.getElementById('startBtn').addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        score = 0;
        lives = 3;
        level = 1;
        enemySpeed = 2;
        bullets = [];
        enemyBullets = [];
        initEnemies();
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.getElementById('pauseBtn').textContent = gamePaused ? 'Reanudar' : 'Pausar';
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = 3;
    level = 1;
    enemySpeed = 2;
    bullets = [];
    enemyBullets = [];
    initEnemies();
    document.getElementById('gameOverScreen').classList.add('hidden');
});

// ============================================
// INICIAR EL JUEGO
// ============================================
console.log("🚀 Space Invaders - Presiona 'Iniciar Juego' para comenzar");
gameLoop();