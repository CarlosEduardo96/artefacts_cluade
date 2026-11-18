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

## Scrum Poker: estimación de historias de usuario

Aplicación para que un equipo Scrum vote la dificultad de cada historia de usuario con cartas Fibonacci, hecha como un canvas de diseño en Claude.

- **App en línea:** https://claude.ai/artifact/VCpdyFMNKdDWqBZ96RHcJy
- **Archivos:** [`scrum-poker/`](scrum-poker/)

### Cómo funciona

| Rol | Qué puede hacer |
|---|---|
| Administrador | Crea la sesión (genera un folio), elige el tiempo de votación por historia (1, 2, 3, 5 o 10 min), carga el archivo de historias (*Historia de usuario / Folio*), ve las votaciones realizadas, las borra y descarga el reporte. |
| Participante | Entra con su nombre y el folio de la sesión, y vota con las cartas 1, 2, 3, 5, 8, 13, 21 o «?». |

- Cuando todos votan, o se acaba el tiempo, aparece una ventana con la media, la puntuación más votada y la dificultad final.
- Si todos votan «?», la historia queda pospuesta y se pasa a la siguiente.
- El progreso se guarda en el navegador.
- El reporte se descarga como `.csv` (separado por «;»), que Excel abre directamente.
- Los archivos `.csv` se leen tal cual. Con un `.xlsx` se cargan historias de ejemplo.
- Los demás participantes (Ana, Luis y Marta) son simulados.

### Archivos

- `scrum-poker/canvas.json`: índice del canvas.
- `scrum-poker/Main.dc.html`: la app completa (panel del administrador, inicio de sesión, votación, resultados y reporte).

Igual que Mini Kids, se usa dentro del canvas de Claude, no abriendo el archivo directamente en el navegador.
