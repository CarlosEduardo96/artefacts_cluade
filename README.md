# Artefactos de Claude

## Mini Kids: juego para niños

Juego educativo en español para niños de kinder, hecho como un canvas de diseño en Claude.

- **Juego en línea:** https://claude.ai/artifact/CdVwbYqZsQ5RwpD8u7Dc84
- **Archivos:** [`mini-kids/`](mini-kids/)

### Mini juegos

| Juego | Qué hace |
|---|---|
| ¿Dónde está? | Se escucha el nombre de un animal y el niño lo toca entre tres tarjetas. |
| ¿Quién hace? | Se escucha un sonido ("Muuu") y el niño elige qué animal lo hace. |
| ¿Dónde vive? | El niño elige si el animal vive en la granja, la selva, la casa o el agua. |
| Números | Sumas, restas y multiplicaciones pequeñas, con animalitos para contar. |

Las preguntas se leen en voz alta (síntesis de voz del navegador, `es-MX`). Cada acierto gana una estrella.

### Archivos

- `mini-kids/canvas.json`: índice del canvas (tableros y posiciones).
- `mini-kids/Main.dc.html`: el juego completo (menú, mini juegos y pantalla final).
- `mini-kids/Animal.dc.html`: componente con los 11 dibujos de animales en SVG.

Los archivos `.dc.html` usan el formato de componentes del canvas de diseño de Claude y cargan `support.js` desde ese entorno, así que se ven y se juegan dentro del canvas, no abriéndolos directamente en el navegador.
