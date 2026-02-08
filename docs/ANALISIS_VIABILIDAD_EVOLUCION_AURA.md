# Análisis de viabilidad — Evolución Aura (propuestas visuales)

Valoración técnica de las propuestas "Descripción visual — CatripPlayer (Evolución Aura)" respecto a la arquitectura actual (Electron, menú local en `src/ui/`, scripts inyectados en `client-header.js` y overlay desde `main.ts`).

---

## Conclusión general: **Sí, son viables**

Las propuestas encajan con el stack actual. La mayoría son ampliaciones de CSS (gradientes, blur, animaciones) y algo de JavaScript en el menú (paralaje, stagger, iluminación ambiental). Solo requieren definir bien el alcance del **Buscador Aura** y el flujo del **morphing de logo** (ver detalles abajo).

---

## 1. Ventana principal

- **Dimensiones y marco:** ya existen (890×600, 400×300, con/sin marco). Sin cambios.
- **Modo Aura / Isla Flotante:** es una evolución del modo sin marco actual. La barra inyectada (`client-header.js`) se rediseña como “píldora” centrada con blur y expansión al hover. **Viabilidad: alta.**

---

## 2. Menú de aplicación (nativo)

- Solo describe la organización actual (Servicios, Ajustes, Developer, Ayuda). **Ningún cambio técnico necesario.**

---

## 3. Pantalla de selección (Menú Aura)

### 3.1 Atmósfera dinámica

- **Mesh gradient:** fondo con varias “esferas” de color (azul #2563eb, púrpura #7c3aed, rosa #db2777) se puede hacer con varios `radial-gradient` superpuestos en el `body` o un contenedor. Si se quiere que sea “animado”, se puede dar movimiento suave con `@keyframes` (posición, opacidad o tamaño de los gradientes). **Viabilidad: alta.**
- **Iluminación ambiental (resplandor según tarjeta en hover):** al hacer hover sobre una tarjeta, el fondo reacciona con el color del servicio. Implementación posible: en `mouseenter`/`mouseleave` de cada tarjeta, actualizar una variable CSS en `body` (p. ej. `--ambient-color` y `--ambient-x`, `--ambient-y`) y un pseudo-elemento o capa con un `radial-gradient` grande y semi-transparente. **Viabilidad: alta.**

### 3.2 Tarjetas de servicio

- **Cristal esmerilado:** `backdrop-filter: blur(12px)` en la tarjeta con fondo semi-transparente (ya usamos blur en loader). **Viabilidad: alta.**
- **Paralaje del logo (±5 px respecto al ratón):** en cada tarjeta, escuchar `mousemove`, calcular el vector desde el centro de la tarjeta al cursor, limitar a ±5 px y aplicar `transform: translate(x, y)` al `img` del logo. **Viabilidad: alta.**
- **Inner glow al hover:** en `.service:hover` (o pseudo-elemento) usar `box-shadow: inset 0 0 …` con el color del servicio. **Viabilidad: alta.**
- **Stagger (cascada al cargar):** al pintar las tarjetas, asignar a cada una `animation-delay: calc(0.05s * index)` y una animación de entrada (opacity + translate). **Viabilidad: alta.**
- **Badge "Último":** ya implementado. Sin cambios.

---

## 4. Buscador Aura (Ctrl+F)

- **Propuesta:** buscador minimalista con desenfoque de fondo 20 px.
- **Opciones de alcance:**
  - **A)** Búsqueda en la **página actual** (find-in-page en el contenido embebido): Electron tiene `webContents.findInPage()`. Se registraría Ctrl+F en main, se mostraría un overlay (en el menú local o inyectado en la página remota) con input y blur 20 px, y se llamaría a `findInPage` con el texto. **Viabilidad: alta.**
  - **B)** Búsqueda entre **servicios** (filtrar la cuadrícula por nombre): overlay o barra en el menú que filtre la lista de servicios. **Viabilidad: alta.**
- Falta definir si es (A), (B) o ambos. En cualquier caso, **es viable.**

---

## 5. Transiciones y loader

### 5.1 Morphing de logo

- **Idea:** el logo de la tarjeta se desplaza y escala hasta el centro y se convierte en el icono del cargador.
- **Limitación:** al hacer `loadURL(service.url)`, el documento del menú se sustituye por la nueva página, así que cualquier animación que ocurra *después* de la navegación no puede seguir en el menú.
- **Enfoque viable:** hacer el morph **solo en el menú**, *antes* de cargar la URL:
  1. Al hacer clic: animar el logo de la tarjeta (posición y escala) hasta el centro de la ventana (p. ej. 250–350 ms).
  2. Al terminar la animación: llamar a `loadURL` y mostrar el overlay de carga en la **nueva** página (como ahora), sin morph allí.
- Así se evita el corte brusco en el menú; en la página remota el loader sigue siendo el actual (ripple + logo). **Viabilidad: alta** con ese flujo.

### 5.2 Ripple Loader 2.0

- **Partículas que se disuelven:** añadir al loader actual varios elementos (divs o spans) con animación de salida desde el centro + opacidad a 0, o un pequeño SVG/CSS con partículas. **Viabilidad: alta.**

---

## 6. Modo sin marco (Isla Flotante)

- **Píldora flotante:** la barra actual (ancho completo) se sustituye por un bloque con `max-width`, centrado, `border-radius` grande (p. ej. 999px) y `backdrop-filter: blur()` con fondo ~60 % opacidad.
- **Expandir al acercar el cursor:** con CSS (p. ej. `:hover`) o JS, aumentar el ancho de la píldora al hacer hover y mostrar el botón × (o revelarlo con opacidad/scale). Área de clic y hover rojo ya existen; solo cambia el contenedor.
- El script inyectado (`client-header.js`) se reescribe para generar esta estructura en lugar de la barra a ancho completo. **Viabilidad: alta.**

---

## 7. Resumen de estilos

- La tabla propuesta (color acento, fondo, texto, borde) es coherente con el sistema actual y con las nuevas variables (mesh gradient, etc.). **Sin impedimentos.**

---

## Priorización sugerida

| Prioridad | Item | Esfuerzo |
|-----------|------|----------|
| Alta | Mesh gradient + iluminación ambiental (§3.1) | Medio |
| Alta | Tarjetas: blur, inner glow, stagger (§3.2) | Bajo |
| Alta | Isla Flotante (§6) | Medio |
| Media | Paralaje del logo (§3.2) | Bajo |
| Media | Morphing de logo antes de loadURL (§5.1) | Medio |
| Media | Ripple 2.0 con partículas (§5.2) | Bajo–medio |
| Media | Buscador Aura (§4) | Medio (definir alcance) |

---

## Conclusión

- **¿Son viables las propuestas?** **Sí.** No exigen cambiar de tecnología ni de arquitectura.
- **Recomendación:** implementar primero mesh gradient, tarjetas (blur, inner glow, stagger) e Isla Flotante; después paralaje, morphing del logo y Ripple 2.0; y por último el Buscador Aura una vez definido si es find-in-page, filtro de servicios o ambos.
