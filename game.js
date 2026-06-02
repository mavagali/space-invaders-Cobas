{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh15000\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // 1. Configuraci\'f3n Inicial\
const canvas = document.getElementById('gameCanvas');\
const ctx = canvas.getContext('2d'); // Obtiene el contexto de dibujo del Canvas\
\
// Definimos las dimensiones del juego para que coincidan con los estilos y sean manejables (un grid)\
canvas.width = 600;\
canvas.height = 400;\
\
// --- VARIABLES DEL JUGADOR (PAC-MAN SIMPLIFICADO) ---\
const player = \{\
    x: 50,      // Posici\'f3n X inicial\
    y: 50,      // Posici\'f3n Y inicial\
    radius: 15, // Tama\'f1o del "Pac-Man"\
    color: 'yellow',\
    speed: 5,   // Velocidad de movimiento (p\'edxeles por frame)\
    dx: 0,      // Cambios en X (velocidad horizontal)\
    dy: 0       // Cambios en Y (velocidad vertical)\
\};\
\
// --- ESTADO DE TECLADO ---\
const keys = \{\}; // Objeto para rastrear qu\'e9 teclas est\'e1n presionadas\
\
/**\
 * Funci\'f3n que maneja los eventos de teclado.\
 */\
document.addEventListener('keydown', (event) => \{\
    keys[event.key] = true;\
\});\
\
document.addEventListener('keyup', (event) => \{\
    keys[event.key] = false;\
\});\
\
\
// 2. Funciones de Dibujo\
/**\
 * Dibuja el personaje en su posici\'f3n actual.\
 */\
function drawPlayer() \{\
    ctx.beginPath();\
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); // Dibuja un c\'edrculo completo\
    ctx.fillStyle = player.color;\
    ctx.fill();\
    ctx.closePath();\
\}\
\
/**\
 * Funci\'f3n que actualiza la posici\'f3n del personaje seg\'fan los controles de las teclas.\
 */\
function updatePlayer() \{\
    // Reiniciamos el movimiento inicial en cada frame\
    player.dx = 0;\
    player.dy = 0;\
\
    // Verificamos qu\'e9 teclas est\'e1n presionadas y establecemos la direcci\'f3n (dx, dy)\
    if (keys['ArrowRight']) \{\
        player.dx = player.speed * 1; // Mover a la derecha\
    \} else if (keys['ArrowLeft']) \{\
        player.dx = -player.speed * 1; // Mover a la izquierda\
    \} else if (keys['ArrowUp']) \{\
        player.dy = -player.speed * 1;  // Mover arriba\
    \} else if (keys['ArrowDown']) \{\
        player.dy = player.speed * 1;   // Mover abajo\
    \}\
\
    // Aplicamos el movimiento a las coordenadas X e Y\
    player.x += player.dx;\
    player.y += player.dy;\
\
    // L\'f3gica simple de colisi\'f3n con los bordes del canvas (mantener al jugador dentro)\
    if (player.x - player.radius < 0) \{\
        player.x = player.radius;\
    \} else if (player.x + player.radius > canvas.width) \{\
        player.x = canvas.width - player.radius;\
    \}\
    // ... (Se agregar\'edan comprobaciones para Y aqu\'ed)\
\}\
\
\
/**\
 * 3. El Bucle de Juego (Game Loop)\
 * Esta funci\'f3n se llama continuamente a alta velocidad (60 veces por segundo),\
 * lo cual es esencial para los juegos en tiempo real.\
 */\
function gameLoop() \{\
    // A) Limpiar el lienzo: Borra todo lo dibujado en el frame anterior\
    ctx.clearRect(0, 0, canvas.width, canvas.height);\
\
    // B) Actualizar la l\'f3gica (mover al jugador)\
    updatePlayer();\
\
    // C) Dibujar todos los elementos\
    drawPlayer();\
\
    // D) Solicitar que el navegador llame a gameLoop de nuevo en cuanto pueda (el "motor" del juego)\
    requestAnimationFrame(gameLoop);\
\}\
\
\
// 4. INICIAR EL JUEGO\
console.log("Juego iniciado! Usa las flechas para mover al personaje amarillo.");\
gameLoop(); // Llama a la funci\'f3n por primera vez para iniciar el bucle\
}