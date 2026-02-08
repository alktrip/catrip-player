# Análisis de viabilidad — Plan de mejora visual CatripPlayer

Valoración técnica del **Plan_Mejora_Visual_CatripPlayer.md** respecto a la arquitectura actual y la posibilidad de desarrollarlo sin romper la base existente.

---

## Conclusión general: **Sí, es viable**

El plan es **desarrollable** con la stack actual (Electron, HTML/CSS/JS en `src/ui/`, script inyectado en `client-header.js`, overlay inyectado desde `main.ts`). No exige cambios de arquitectura; las mejoras son sobre todo de presentación (CSS, estructura HTML, contenido inyectado) y algunas ampliaciones de datos (último servicio, nombre en barra). A continuación se detalla por bloque.

---

## 1. Sistema de diseño unificado (§2)

**Viabilidad: alta.**

- **Escala tipográfica:** aplicar en `index.css` (y en cualquier CSS inyectado). Variables CSS (`--font-title`, `--font-subtitle`, etc.) centralizan tamaños y pesos.
- **Color acento global:** variable `--accent` en `:root`; usarlo en bordes, focos, botones. Los colores por servicio (`service.color`) se mantienen en tarjetas y loader.
- **Requisito:** un único archivo de estilos (o variables) para el menú local; el overlay y la barra sin marco tienen sus propios estilos inyectados, habría que replicar o generar desde plantilla.

**Esfuerzo:** bajo. Solo CSS y, si se quiere, variables en un bloque `:root` compartido.

---

## 2. Mejoras del menú principal (§3)

### 3.1 Encabezado estructural

**Viabilidad: alta.**

- Añadir en `index.html` un bloque encima de `.services`: logo (por ejemplo `img` o SVG), título (h1) "Selecciona un servicio", subtítulo (p) "Accede rápidamente a tus plataformas favoritas".
- Estilos en `index.css` según la escala del §2 (p. ej. título 1.4rem/600, subtítulo 1.1rem/500).
- **Logo:** hace falta un recurso (SVG/PNG) de CatripPlayer en `src/ui/` (p. ej. `logo.svg`). Si no existe, se puede usar texto o icono temporal.

**Esfuerzo:** bajo. Solo HTML + CSS; el JS no necesita cambios para el encabezado.

### 3.2 Refinamiento de tarjetas

**Viabilidad: alta.**

- Cambios solo en `index.css` en `.service` y `.service:hover`:
  - Normal: `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.05)`, `box-shadow: 0 4px 14px rgba(0,0,0,0.4)`.
  - Hover: `transform: translateY(-4px)`, sombra más marcada, y un pseudo-elemento `::after` (o borde inferior) con `background` en el color del servicio (ya disponible como `service.color`; se puede aplicar por tarjeta con un atributo `data-color` o clase generada en `renderServices`).
- **Brillo inferior en color del servicio:** en JS, al crear la tarjeta, asignar `card.style.setProperty('--service-color', service.color)` y en CSS usar `var(--service-color)` en un `::after` o `border-bottom`.

**Esfuerzo:** bajo.

### 3.3 Indicador de último servicio

**Viabilidad: alta, con un pequeño cambio de datos.**

- El último servicio abierto se puede derivar de `options.lastOpenedPage` (main) o guardar explícitamente `options.lastUsedService` (nombre o URL) al cargar un servicio.
- En main: al hacer `loadURL(service.url)`, guardar en store `lastUsedService: service.name` (o la URL). Opcionalmente exponerlo por IPC (p. ej. `set-services` puede enviar también `lastUsedService`).
- En el renderer (`index.js`): al pintar las tarjetas, si `service.name === lastUsedService` (o coincide por URL), añadir clase `service--last` y, si se desea, un badge "Último" (span dentro de la tarjeta).
- Estilos: barra inferior (`border-bottom` o `::after` con `var(--service-color)`) o badge discreto.

**Esfuerzo:** bajo–medio. Un poco de lógica en main (guardar último servicio) y en el renderer (recibir dato y marcar tarjeta).

---

## 3. Optimización del loader (§4)

**Viabilidad: alta.**

- **Menú local (`index.css` + `index.js`):**
  - Duración del ripple: en `index.css` cambiar la animación a ~1.1s y suavizar la curva si se desea.
  - Fade-out del menú: antes de mostrar el loader, añadir al contenedor del menú (o `body`) una clase con `opacity: 0` y `transition: opacity 150ms`, luego mostrar el loader.
  - Blur de fondo: en el contenedor del loader, `backdrop-filter: blur(6px)` (y `background` semiopaco). Compatibilidad en Electron/Chromium es buena.

- **Overlay inyectado (páginas remotas):** el script en `main.ts` que inyecta `catrip-loader-overlay` construye el HTML/estilos como string. Ahí hay que:
  - Añadir al contenedor del overlay `backdrop-filter: blur(6px)` y la misma duración de animación (1.1s) en el keyframe inyectado.
  - Fade-in: se puede aplicar con una clase o `animation` en el propio overlay (opacity 0 → 1 en 150ms). No hay “fade-out del menú” en remoto porque el menú ya no está visible.

**Esfuerzo:** bajo. Solo ajustes de CSS y del string de script en main para el overlay.

---

## 4. Modo ventana sin marco (§5)

**Viabilidad: alta.**

- La barra se inyecta en **todas** las páginas (local y remotas) vía `client-header.js`, que se lee en main y se ejecuta en `dom-ready`. El contenido es HTML+CSS en un string; no hay dependencia de frameworks.

### 5.1 Rediseño barra superior

- Aumentar altura a 28–32 px: en el HTML inyectado, cambiar la clase de la barra (p. ej. `height: 28px` o `32px`).
- Fondo negro ~85% opacidad: `background: rgba(0,0,0,0.85)`.
- **Nombre del servicio centrado:** el main sabe qué URL está cargada y puede resolver el nombre del servicio (`currentServices` + URL actual). Hoy el script inyectado no recibe datos; hay dos opciones:
  - **A)** Main inyecta un script que recibe el nombre por argumento: por ejemplo `executeJavaScript(..., serviceName)` pasando el nombre del servicio actual (calculado en main a partir de `getURL()` y `currentServices`). El script inyectado crea un nodo de texto con ese nombre y lo centra en la barra.
  - **B)** Dejar la barra sin texto y solo mejorar altura, opacidad y botones; el nombre se podría añadir en una fase posterior.

Para “botones integrados” (p. ej. cerrar, quizá más adelante minimizar): mismo enfoque, seguir usando `-webkit-app-region: no-drag` en los botones y estilos inline o en el `<style>` inyectado.

### 5.2 Botón de salida

- Área de clic mayor: botón con `padding` y/o `min-width/min-height`.
- Hover con fondo rojo tenue: p. ej. `background: rgba(220,50,50,0.3)` en hover.
- Animación ligera: `transition: background 0.15s, color 0.15s`.

**Esfuerzo:** bajo para 5.2; medio si se implementa el nombre del servicio en la barra (calcular servicio actual en main y pasarlo al script inyectado).

---

## 5. Diálogos (§6)

**Viabilidad: media; implica algo más de trabajo.**

- **Estado actual:** “URL personalizada” usa `electron-prompt` (ventana nativa); “Acerca de” usa `dialog.showMessageBox`; “Restablecer ajustes” no tiene confirmación.
- **Objetivo del plan:** diálogos HTML propios para URL personalizada, confirmaciones e información contextual.

Para hacerlo:

- Los diálogos deben mostrarse **en el contexto de la ventana**: o bien como overlay en la misma página (por ejemplo en el menú local `index.html`), o bien en una ventana secundaria `BrowserWindow` modal.
- **Opción A — Overlay en menú local:**  
  - Solo tiene sentido para flujos que empiezan desde el menú (p. ej. “Abrir URL” desde el menú). Se añade un div fullscreen en `index.html` con formulario (input URL, Aceptar/Cancelar) y estilos. El menú muestra el diálogo y envía por IPC la URL al main; el main cierra el “diálogo” no nativo porque en realidad es la misma ventana.  
  - Problema: “URL personalizada” se invoca desde el **menú nativo** (main process). Hoy el main llama a `electron-prompt` y luego `loadURL`. Para un diálogo HTML, el main tendría que pedir al renderer que lo muestre (por ejemplo `mainWindow.webContents.send('show-dialog', 'custom-url')`) y solo cuando la ventana esté mostrando el menú local (file://). Si el usuario está en Netflix y usa “URL personalizada”, habría que cargar primero el menú, mostrar el diálogo y luego cargar la URL; flujo más complejo pero viable.
- **Opción B — Ventana modal con HTML:** crear un `BrowserWindow` hijo con `parent`, `modal: true` y cargar un `file://` con el contenido del diálogo; el preload de esa ventana podría exponer un API mínimo y comunicar el resultado por IPC al main. Así los diálogos son independientes de si la ventana principal está en menú o en servicio.

**Recomendación:** empezar por mejorar los diálogos nativos (mensajes, títulos) y, en una segunda iteración, introducir un diálogo HTML para “URL personalizada” cuando la ventana esté en el menú (envío de evento desde main + overlay en index.html), o un `BrowserWindow` modal genérico reutilizable para varios casos.

**Esfuerzo:** medio (overlay en menú + IPC) a alto (ventana modal genérica + varios tipos de diálogo).

---

## 6. Estados de sistema (§7)

### 7.1 Indicador textual en loader

**Viabilidad: alta.**

- **Menú local:** en `animateLoader(service, img)` se puede añadir un `<span>` debajo del logo con texto "Conectando con {service.name}..." y estilos en `index.css`.
- **Overlay inyectado (remoto):** en el script de `main.ts` que construye el overlay, añadir un nodo de texto con el nombre del servicio (ya disponible como `loadingOverlayService.name`) y el mismo mensaje. Incluir estilos para tipografía y posición.

**Esfuerzo:** bajo.

### 7.2 Pantalla sin conexión

**Viabilidad: media; requiere detección en main.**

- Detección: en main, `webContents` puede usar el evento `did-fail-load` (p. ej. código de error de red) o comprobar conectividad antes de cargar. No hay actualmente una “pantalla offline” en la app.
- Si se detecta fallo de carga: el main puede enviar por IPC algo como `load-failed` (o `set-offline`) y la ventana podría cargar una página local de “sin conexión” (nuevo HTML en `src/ui/offline.html`) con icono, mensaje y botón “Reintentar” que envíe por IPC `retry-load` y el main vuelva a intentar la URL o vuelva al menú.

Complejidad: definir bien qué se considera “offline” (solo fallo de carga de la URL actual vs. comprobación de red global) y qué hacer al “Reintentar” (reload, volver al menú, etc.).

**Esfuerzo:** medio (detección en main + página offline + IPC).

---

## 7. Accesibilidad (§8)

**Viabilidad: alta en gran parte.**

- **Contraste WCAG AA:** revisar fondos y textos actuales (p. ej. `#e5e5e5` sobre `#1a1a1a` ya es alto contraste). Ajustar colores de acento y secundarios para cumplir ratios.
- **Foco visible:** en `index.css`, `:focus-visible` con `outline` o `box-shadow` en tarjetas y botones; asegurar orden de tabulación lógico en el menú (encabezado, tarjetas, cualquier botón).
- **Escalado de UI configurable:** opción en store (p. ej. `options.uiScale`: 1 | 1.25 | 1.5) y aplicar `transform: scale()` al contenedor del menú o `font-size` base en `html`; los diálogos/overlays inyectados no escalan automáticamente salvo que se use la misma variable o un factor pasado desde main.

**Esfuerzo:** bajo para contraste y foco; medio si se quiere escalado persistente y aplicado también a overlays.

---

## 8. Evolución a medio plazo (§9)

### 9.1 Sidebar opcional colapsable

**Viabilidad: media; cambio de layout.**

- Implica un layout distinto: área lateral con iconos de servicios (y posiblemente “Menú”) + área principal con el contenido (web o menú de selección). Hoy la ventana muestra *o* menú *o* contenido web a pantalla completa.
- Opciones:
  - **A)** La “área principal” es el mismo `webContents`; la sidebar sería parte de la UI local (solo visible cuando se carga `index.html`). Al hacer clic en un servicio se haría `loadURL` en el mismo `webContents` y la sidebar desaparecería a menos que la sidebar esté en un **segundo** webContents (por ejemplo un `BrowserView` o iframe) que siempre esté visible. Eso ya es un cambio arquitectónico (varias vistas o iframe).
  - **B)** Sidebar solo en la vista “menú”: pantalla de inicio con sidebar + contenido principal mostrando la cuadrícula o un servicio en iframe. Mostrar un sitio externo en iframe puede tener restricciones (X-Frame-Options, etc.), por lo que no todos los servicios serían compatibles.
- Conclusión: es viable como evolución, pero requiere decidir modelo (iframe vs. una sola vista que cambia) y asumir posibles limitaciones con algunos sitios. Mejor como fase posterior al plan actual.

**Esfuerzo:** alto.

### 9.2 Sistema de temas (claro/oscuro, sin relaunch)

**Viabilidad: alta.**

- Variables CSS en `:root` para colores de fondo, texto, bordes, acento. Tema oscuro = valores actuales; tema claro = conjunto alternativo.
- Opción en store: `options.theme: 'dark' | 'light'`. Al cambiar, el renderer (menú local) aplica una clase a `html` o `body` (p. ej. `theme-light`) y los estilos usan `var(--bg)` etc., definidos en `.theme-light { ... }`.
- El menú local se puede retocar sin relaunch (solo se recarga si hace falta con `loadURL` del file). Los overlays inyectados (loader, barra) se generan en main; se podría pasar `theme` por parámetro y generar estilos distintos (más trabajo pero factible).
- Sin relaunch: el cambio de tema solo afecta a la vista actual; si está en menú, se actualiza al instante; si está en una web externa, la barra inyectada podría actualizarse en la siguiente inyección (p. ej. en la siguiente navegación) o inyectando un script que cambie clases/estilos de la barra.

**Esfuerzo:** medio (solo menú) a medio-alto (incluir barra y loader).

---

## 9. Priorización y dependencias

Resumen de viabilidad por prioridad del plan:

| Prioridad | Item | Viabilidad | Esfuerzo |
|-----------|------|------------|----------|
| Alta | Refinamiento tarjetas (§3.2) | Alta | Bajo |
| Alta | Transiciones suaves loader (§4) | Alta | Bajo |
| Alta | Rediseño barra sin marco (§5) | Alta | Bajo–medio |
| Alta | Encabezado menú principal (§3.1) | Alta | Bajo |
| Media | Diálogos propios (§6) | Media | Medio–alto |
| Media | Indicador textual loader (§7.1) | Alta | Bajo |
| Media | Estado offline (§7.2) | Media | Medio |
| Evolutivo | Sidebar (§9.1) | Media | Alto |
| Evolutivo | Sistema de temas (§9.2) | Alta | Medio |
| Evolutivo | Escalado UI (§8) | Alta | Bajo–medio |

No hay dependencias técnicas que impidan desarrollar el plan; la única decisión de diseño relevante es cómo integrar los diálogos HTML (overlay en menú vs. ventana modal) y si la barra sin marco debe mostrar el nombre del servicio desde la primera iteración.

---

## 10. Resumen

- **¿Es viable desarrollarlo?** Sí. El plan es compatible con la arquitectura actual.
- **Qué es más directo:** sistema de diseño (§2), encabezado (§3.1), refinamiento de tarjetas (§3.2), loader (§4), barra sin marco (§5), indicador textual en loader (§7.1), accesibilidad básica (§8) y, a medio plazo, temas (§9.2).
- **Qué requiere más diseño o código:** último servicio (§3.3) por el dato nuevo en main; diálogos HTML (§6) por el flujo main/renderer; pantalla offline (§7.2) por la detección y la UX; sidebar (§9.1) por el posible cambio de layout.

Recomendación: abordar primero los puntos de prioridad alta (encabezado, tarjetas, loader, barra sin marco) para ganar impacto visual con poco riesgo; luego indicador textual en loader y último servicio; después valorar diálogos propios y estado offline según tiempo disponible.
