# Game Suggestions To-Do

Backlog de juegos propuestos por `game-planner`. Estado: `pending` | `accepted` | `rejected` | `implemented`.

<!-- El agente hace append al final. Nunca reordena ni borra entradas existentes. -->

## Implemented Games (referencia)

| Juego     | Spec                         | Ruta               | Categoría |
| --------- | ---------------------------- | ------------------ | --------- |
| Asteroids | `specs/05-asteroids-game.md` | `/games/asteroids` | Shooter   |
| Tetris    | `specs/07-tetris-game.md`    | `/games/tetris`    | Puzzle    |
| Arkanoid  | `specs/08-arkanoid-game.md`  | `/games/arkanoid`  | Action    |
| Snake     | `specs/09-snake-game.md`     | `/games/snake`     | Arcade    |

---

## Suggested Games

| #   | ID      | Juego          | Categoría         | Estado    |
| --- | ------- | -------------- | ----------------- | --------- |
| 1   | spec-10 | Space Invaders | Shooter           | `pending` |
| 2   | spec-11 | Space Shooter  | Shooter / Action  | `pending` |
| 3   | spec-12 | Galaga         | Shooter / Action  | `pending` |
| 4   | spec-13 | Geometry Wars  | Shooter / Action  | `pending` |
| 5   | spec-14 | Centipede      | Shooter / Action  | `pending` |
| 6   | spec-15 | R-Type         | Shooter / Action  | `pending` |
| 7   | spec-16 | 2048           | Puzzle            | `pending` |
| 8   | spec-17 | Minesweeper    | Puzzle / Strategy | `pending` |
| 9   | spec-18 | Sokoban        | Puzzle            | `pending` |
| 10  | spec-19 | Lights Out     | Puzzle / Logic    | `pending` |
| 11  | spec-20 | Connect Four   | Strategy          | `pending` |
| 12  | spec-21 | Frogger        | Platformer        | `pending` |
| 13  | spec-22 | Pac-Man        | Platformer        | `pending` |
| 14  | spec-23 | Donkey Kong    | Platformer        | `pending` |
| 15  | spec-24 | BoulderDash    | Platformer        | `pending` |
| 16  | spec-25 | Pitfall!       | Platformer        | `pending` |
| 17  | spec-26 | Outrun         | Racing            | `pending` |
| 18  | spec-27 | Micro Machines | Racing            | `pending` |
| 19  | spec-28 | Track & Field  | Sports            | `pending` |
| 20  | spec-29 | Pong           | Sports            | `pending` |
| 21  | spec-30 | Dig Dug        | Other             | `pending` |

---

## Space Invaders — spec-10

- **Estado:** `pending`
- **Categoría:** Shooter
- **Descripción:** Juego de disparos arcade clásico donde el jugador destruye oleadas de alienígenas que avanzan hacia abajo.
- **Mecánica principal:** Movimiento horizontal + disparo vertical. Enemigos aceleran al reducirse. Escudos degradables. Puntaje escalonado por fila.
- **Por qué encaja:** Icónico del arcade clásico, complementa el catálogo y tiene sistema de puntajes escalonado ideal para el leaderboard.

## Space Shooter — spec-11

- **Estado:** `pending`
- **Categoría:** Shooter / Action
- **Descripción:** Nave vertical que destruye oleadas de enemigos en scroll infinito.
- **Mecánica principal:** Disparo continuo, esquivar balas enemigas, power-ups de armas.
- **Por qué encaja:** Mecánica arcade clásica, sesiones cortas, score fácil de comparar.

## Galaga — spec-12

- **Estado:** `pending`
- **Categoría:** Shooter / Action
- **Descripción:** Clon del clásico arcade con enemigos en formación que atacan en patrones.
- **Mecánica principal:** Disparar formaciones enemigas, evitar capturas de nave, doble nave.
- **Por qué encaja:** Icónico, competitivo por score, sesiones de 2-5 min perfectas para leaderboard.

## Geometry Wars — spec-13

- **Estado:** `pending`
- **Categoría:** Shooter / Action
- **Descripción:** Twin-stick shooter con enemigos geométricos en arena cerrada.
- **Mecánica principal:** Movimiento independiente del disparo, multiplicador de score por racha.
- **Por qué encaja:** Alta rejugabilidad, scores exponenciales que premian habilidad sostenida.

## Centipede — spec-14

- **Estado:** `pending`
- **Categoría:** Shooter / Action
- **Descripción:** Dispara al ciempiés que desciende sorteando hongos en el campo.
- **Mecánica principal:** Segmentar el ciempiés con disparos, destruir hongos para control del campo.
- **Por qué encaja:** Dificultad creciente natural, diferente a los juegos ya implementados.

## R-Type — spec-15

- **Estado:** `pending`
- **Categoría:** Shooter / Action
- **Descripción:** Shoot-em-up horizontal con jefes y sistema de carga de disparo.
- **Mecánica principal:** Carga de láser, módulo Force adherible a la nave, patrones de jefes.
- **Por qué encaja:** Aporta variante horizontal al catálogo, skill ceiling alto para competición.

## 2048 — spec-16

- **Estado:** `pending`
- **Categoría:** Puzzle
- **Descripción:** Desliza tiles numéricos para combinarlos y alcanzar el tile 2048.
- **Mecánica principal:** Movimientos en 4 direcciones fusionan tiles iguales duplicando su valor.
- **Por qué encaja:** Score incremental + manejable en canvas/grid, ideal para tabla de líderes.

## Minesweeper — spec-17

- **Estado:** `pending`
- **Categoría:** Puzzle / Strategy
- **Descripción:** Despeja un campo minado usando pistas numéricas sin detonar ninguna mina.
- **Mecánica principal:** Click para revelar celdas, flag para marcar minas; lógica deductiva pura.
- **Por qué encaja:** Score por tiempo completado + dificultad seleccionable encaja perfecto con leaderboard.

## Sokoban — spec-18

- **Estado:** `pending`
- **Categoría:** Puzzle
- **Descripción:** Empuja cajas hasta sus posiciones objetivo en un almacén laberíntico.
- **Mecánica principal:** Movimiento en grid, las cajas solo se pueden empujar (nunca jalar).
- **Por qué encaja:** Niveles con par de movimientos mínimos generan score competitivo único.

## Lights Out — spec-19

- **Estado:** `pending`
- **Categoría:** Puzzle / Logic
- **Descripción:** Apaga todas las luces de una grilla donde cada click alterna la celda y sus vecinas.
- **Mecánica principal:** Toggle en cascada requiere planificación algebraica para resolver en mínimos movimientos.
- **Por qué encaja:** Partidas cortas e intensas, score inversamente proporcional a movimientos usados.

## Connect Four — spec-20

- **Estado:** `pending`
- **Categoría:** Strategy
- **Descripción:** Conecta 4 fichas en línea antes que tu oponente en un tablero vertical de 6x7.
- **Mecánica principal:** Fichas caen por gravedad; gana quien alinee 4 horizontal, vertical o diagonal.
- **Por qué encaja:** Modo vs IA con dificultad escalable, score por victorias encaja con hall of fame.

## Frogger — spec-21

- **Estado:** `pending`
- **Categoría:** Platformer
- **Descripción:** Cruza calles y ríos peligrosos para llevar a tu rana a salvo.
- **Mecánica principal:** Movimiento en cuadrícula, timing de obstáculos y plataformas móviles.
- **Por qué encaja:** Clásico arcade de puntuación competitiva, perfecto para leaderboard.

## Pac-Man — spec-22

- **Estado:** `pending`
- **Categoría:** Platformer
- **Descripción:** Come todos los puntos del laberinto evitando fantasmas.
- **Mecánica principal:** Navegación de laberinto, power-ups, persecución por IA.
- **Por qué encaja:** Icono del arcade con score acumulativo ideal para competencia.

## Donkey Kong — spec-23

- **Estado:** `pending`
- **Categoría:** Platformer
- **Descripción:** Sube por andamios esquivando barriles para rescatar a la princesa.
- **Mecánica principal:** Plataformas verticales, saltar obstáculos, escaleras.
- **Por qué encaja:** Clásico de plataformas con dificultad progresiva y puntuación por nivel.

## BoulderDash — spec-24

- **Estado:** `pending`
- **Categoría:** Platformer
- **Descripción:** Excava cuevas, recoge diamantes y evita que las rocas te aplasten.
- **Mecánica principal:** Física de gravedad en cuadrícula, pathfinding y gestión de recursos.
- **Por qué encaja:** Puzzle-adventure de alta rejugabilidad con scores por eficiencia.

## Pitfall! — spec-25

- **Estado:** `pending`
- **Categoría:** Platformer
- **Descripción:** Explora la jungla recogiendo tesoros mientras evitas trampas y enemigos.
- **Mecánica principal:** Scroll lateral, saltos sobre obstáculos y enredaderas como plataformas.
- **Por qué encaja:** Aventura con timer y penalizaciones, ideal para ranking competitivo.

## Outrun — spec-26

- **Estado:** `pending`
- **Categoría:** Racing
- **Descripción:** Arcade de carreras en perspectiva third-person con scroll hacia el frente y bifurcaciones de ruta.
- **Mecánica principal:** Acelerar, frenar y esquivar tráfico en tramos cronometrados con checkpoints.
- **Por qué encaja:** Icono del arcade de los 80s, puntuación por distancia y tiempo — ideal para leaderboard.

## Micro Machines — spec-27

- **Estado:** `pending`
- **Categoría:** Racing
- **Descripción:** Carreras de autos en miniatura sobre superficies cotidianas vistas desde arriba.
- **Mecánica principal:** Top-down racing con físicas simplificadas, pistas irregulares y power-ups.
- **Por qué encaja:** Perspectiva 2D fácil de implementar en canvas, alta rejugabilidad y competencia por tiempo.

## Track & Field — spec-28

- **Estado:** `pending`
- **Categoría:** Sports
- **Descripción:** Compilado de pruebas olímpicas de atletismo al estilo arcade clásico de Konami.
- **Mecánica principal:** Pulsar teclas rítmicamente para velocidad + tecla de acción en el momento preciso.
- **Por qué encaja:** Múltiples mini-eventos = múltiples puntuaciones independientes para el leaderboard.

## Pong — spec-29

- **Estado:** `pending`
- **Categoría:** Sports
- **Descripción:** El clásico tenis de mesa digital — el primer videojuego arcade de masas.
- **Mecánica principal:** Mover paleta verticalmente para devolver la pelota y anotar puntos contra la CPU.
- **Por qué encaja:** Implementación mínima, reconocimiento universal, fundacional para cualquier Arcade Vault.

## Dig Dug — spec-30

- **Estado:** `pending`
- **Categoría:** Other
- **Descripción:** Excava túneles bajo tierra y elimina enemigos con una bomba de aire o aplastándolos con rocas.
- **Mecánica principal:** Desplazamiento en tierra, inflar enemigos hasta que explotan, usar gravedad de rocas.
- **Por qué encaja:** Mecánica única de excavación + scoring por profundidad, diferente a todo el catálogo actual.
