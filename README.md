# 🚀 Space Invaders - Juego Arcade Mejorado

Un juego clásico de Space Invaders desarrollado con HTML5 Canvas y JavaScript vanilla. ¡Defiende tu planeta de la invasión alienígena!

## 🎮 Características Principales

### ✨ Mejoras Implementadas

- **Nave del Jugador Mejorada**: Nave triangular con efectos visuales (brillo verde)
- **Sistema de Enemigos**: 
  - Movimiento coordinado de enemigos con cambio de dirección
  - Los enemigos descienden al cambiar de dirección
  - Disparan proyectiles aleatorios hacia el jugador
  
- **Sistema de Combate**:
  - Dispara con la barra espaciadora
  - Detección de colisiones precisas
  - Enemigos eliminados = +10 puntos
  
- **Progresión de Dificultad**:
  - Cada nivel completado aumenta la velocidad de enemigos
  - Los enemigos disparan más frecuentemente con cada nivel
  - Aumenta el desafío progresivamente
  
- **Sistema de Vidas**: 
  - Comienza con 3 vidas
  - Pierdes una vida al ser golpeado por un disparo enemigo
  - Game Over cuando se acabas las vidas o los enemigos llegan al fondo
  
- **Interfaz Mejorada**:
  - Panel de información en tiempo real (puntuación, vidas, nivel)
  - Botones de Control (Iniciar, Pausar, Reanudar)
  - Pantalla de Game Over elegante con animaciones
  - Tema arcade retro con colores neón
  
- **Controles**:
  - ⬅️ **Flecha Izquierda / A**: Mover a la izquierda
  - ➡️ **Flecha Derecha / D**: Mover a la derecha
  - 🔫 **Espacio**: Disparar

## 🛠️ Estructura del Proyecto

```
space-invaders-Cobas/
├── index.html      # Estructura HTML del juego
├── game.js         # Lógica completa del juego
├── style.css       # Estilos visuales
└── README.md       # Este archivo
```

## 🚀 Cómo Jugar

1. Abre `index.html` en tu navegador
2. Haz clic en el botón "Iniciar Juego"
3. Usa las flechas para moverte
4. Presiona la barra espaciadora para disparar
5. Elimina todos los enemigos para pasar al siguiente nivel
6. ¡Intenta conseguir la máxima puntuación!

## 📊 Sistema de Puntuación

| Acción | Puntos |
|--------|--------|
| Eliminar un enemigo | +10 |

## 🎯 Objetivos

- ✅ Implementar sistema completo de enemigos
- ✅ Detección de colisiones precisa
- ✅ Progresión de niveles
- ✅ Sistema de vidas
- ✅ Interfaz visual mejorada
- ✅ Efectos visuales arcade

## 💡 Posibles Mejoras Futuras

- [ ] Sonidos y música de fondo
- [ ] Power-ups (escudo, disparo rápido, etc.)
- [ ] Jefe final en cada nivel
- [ ] Tabla de puntuaciones guardada en localStorage
- [ ] Partículas y explosiones
- [ ] Modos de juego adicionales (arcade clásico, infinito, desafío)
- [ ] Efectos de pantalla verde de arcade

## 🎨 Paleta de Colores

- **Principal**: Verde neón (#00ff00)
- **Secundario**: Amarillo (#ffff00)
- **Enemigos**: Rojo (#ff0000)
- **Fondo**: Negro (#000000)

## 📱 Responsive

El juego se adapta a diferentes tamaños de pantalla manteniendo la experiencia de juego.

---

¡Diviértete jugando! 🎮✨