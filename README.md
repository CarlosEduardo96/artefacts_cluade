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

## Recorrido del camión: lector de Excel con registros GPS

Página que lee un Excel (`.xlsx`) o CSV con los registros GPS de un camión y muestra dónde se paró, si cada parada fue normal o brusca, y el trayecto de origen a destino con su tiempo.

- **Archivos:** [recorrido-camion](recorrido-camion/)

### Cómo funciona

- Al abrir solo aparece el botón para cargar el archivo (también se puede arrastrar).
- El archivo se lee en el navegador de quien lo carga: no se sube ni se guarda en ningún lado.
- Con el archivo cargado se muestra:

| Sección | Qué muestra |
|---|---|
| Resumen | Camión, origen y destino con hora de salida y llegada, tiempo de origen a destino, tiempo en movimiento, distancia y velocidad máxima. |
| Mapa | Trazo del recorrido sobre el mapa de calles de OpenStreetMap, con el origen, el destino y las paradas numeradas (verde normal, rojo brusca). Al pasar el cursor o tocar una parada se ven su hora, duración y frenado. Si el mapa de calles no se puede cargar, el trayecto se dibuja sin fondo y los nombres de ciudades no se enciman. Debajo, el botón «Ver las paradas en Google Maps» abre una pestaña nueva con el origen, cada parada en orden y el destino, por sus coordenadas (con más de 9 paradas se parte en tramos, porque Google Maps admite pocos puntos por enlace, y el botón «Abrir todos los tramos» los abre todos de un clic). Fuera del artefacto, «Descargar recorrido completo para Google My Maps» baja un `.kml` con el trazo GPS real, el origen, todas las paradas y el destino, para importarlo en un solo mapa. |
| Velocidad | Km/h a lo largo del viaje, con franjas en las paradas. Las etiquetas se ajustan al ancho y no se cortan. |
| Paradas | Tabla con hora, lugar, duración, frenado (m/s²), tipo y un enlace para ver cada parada en Google Maps. |

- Si el archivo trae varios camiones, se elige uno en una lista.
- Las columnas se reconocen solas: latitud, longitud, fecha y hora (juntas o separadas), velocidad, camión o placa, ciudad y eventos. Si alguna no se detecta, se elige en «Columnas del archivo».
- Acepta CSV separado por comas, punto y coma o tabulador, decimales con coma y fechas `dd/mm/aaaa`.

### Criterios

- **Parada:** 3 km/h o menos durante al menos 1 minuto (5 km/h si la velocidad se calcula con el GPS). No cuentan la espera antes de salir ni al llegar.
- **Parada brusca:** la velocidad cae 3 m/s² o más en los 2 minutos previos, o la columna de eventos marca un frenado brusco. Si los registros vienen cada más de 15 segundos, la página avisa que un frenado brusco puede verse como normal.
- **Salida y llegada:** el primer momento en que el camión se mueve y el último en que se detiene.
- **Mapa de calles:** la página prueba cargar OpenStreetMap (con Leaflet). Funciona abierta desde GitHub Pages o como archivo en la computadora, con internet. En el artefacto de claude.ai el visor bloquea las imágenes de otros sitios, así que ahí el trayecto se dibuja sin fondo y las paradas se abren en Google Maps desde la tabla.

### Archivos

- `recorrido-camion/index.html`: la página. Carga `d3` y Leaflet desde cdnjs, así que necesita internet. Con GitHub Pages activado en este repositorio, queda en `https://carloseduardo96.github.io/artefacts_cluade/recorrido-camion/` con el mapa de calles.
- `recorrido-camion/recorrido-del-camion-sin-internet.html`: la misma página con `d3` incluido; se abre con doble clic y funciona sin conexión (sin conexión, el mapa va sin fondo de calles).
- `recorrido-camion/ejemplos/ruta.xlsx` y `ruta.csv`: datos inventados para probar un viaje de Ciudad de México a Querétaro con tres paradas. El `.xlsx` trae dos camiones y una columna de eventos (con una parada brusca); el `.csv` trae un solo camión, separado por «;» y con decimales con coma.

A diferencia de los anteriores, esta página se abre directamente en el navegador.
