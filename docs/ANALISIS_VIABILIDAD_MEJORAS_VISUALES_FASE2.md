# Análisis de viabilidad — Plan de mejora visual CatripPlayer (Fase 2)

Valoración técnica del **Plan_Mejora_Visual_CatripPlayer_Fase_2.md** respecto a la arquitectura actual y a lo ya implementado en la Fase 1 de mejoras visuales.

---

## Conclusión general: **Sí, es viable**

El plan de Fase 2 es **desarrollable** sin cambiar la arquitectura. Casi todo son ajustes de CSS (variables, animaciones, estilos inyectados) y pequeñas ampliaciones en el menú local y en los scripts inyectados (barra sin marco, overlay). El único bloque que pide más diseño y lógica es el **sistema formal de estados** (§3), sobre todo los estados Error y Sin conexión, que ya se habían valorado en el análisis de la Fase 1. El resto encaja de forma directa con el código actual.

---

## 1. Profundidad y atmósfera (§2)

### 2.1 Fondo con gradiente sutil

**Viabilidad: alta.**

- Sustituir en `index.css` el `background` del `body` (o de `:root`/contenedor del menú) por el `radial-gradient` indicado.
- Una sola regla CSS; las variables existentes se pueden dejar y aplicar el gradiente sobre ellas si se desea.

**Esfuerzo:** muy bajo.

---

## 2. Sistema formal de estados (§3)

**Viabilidad: media.** Depende de cuántos estados se implementen y con qué nivel de detalle.

- **Normal:** ya existe (menú con cuadrícula).
- **Cargando:** ya existe (loader con blur y texto).
- **Error:** requiere que el proceso principal detecte fallo de carga (p. ej. `did-fail-load` en `webContents`) y comunique al renderer (IPC) o cargue una vista local de error. Luego, una pantalla con icono, título, descripción y acción (Reintentar / Volver al menú). Es viable pero implica lógica en main y una pantalla en `src/ui/` o en el mismo menú.
- **Sin conexión:** similar: detección (fallo de red o comprobación explícita) + vista con icono, mensaje y botón “Reintentar”. Ya analizado en la Fase 1.
- **Estado vacío (sin servicios visibles):** cuando todos los servicios están ocultos, la cuadrícula queda vacía. En `index.js`, al hacer `renderServices`, si la lista filtrada (no ocultos) está vacía, mostrar un bloque con icono, título (“Ningún servicio visible”), descripción breve y acción (“Mostrar servicios en Ajustes” o abrir menú de ajustes). No requiere main; solo HTML/CSS y un poco de JS en el renderer.

**Recomendación:** implementar primero **estado vacío** y **Cargando** (ya hecho). Dejar **Error** y **Sin conexión** para una iteración posterior, con el mismo enfoque que en el análisis de viabilidad de la Fase 1 (detección en main + vista local + IPC).

**Esfuerzo:** bajo para estado vacío; medio–alto para Error y Sin conexión si se hacen completos.

---

## 3. Microinteracciones refinadas (§4)

### 4.1 Curvas de animación

**Viabilidad: alta.**

- Añadir una variable en `:root`, p. ej. `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`.
- Usarla en transiciones de tarjetas (hover), fades y elevaciones en `index.css`. Opcionalmente en el overlay inyectado (main) si se parametriza la curva en el script.

**Esfuerzo:** bajo.

### 4.2 Animación de entrada del menú

**Viabilidad: alta.**

- Al cargar el menú (cuando el renderer recibe `set-services` y pinta la cuadrícula), aplicar al contenedor del menú (o al `body`) una animación: opacidad 0→1 en 120 ms y `translateY(8px) → 0`.
- Opciones: clase inicial (p. ej. `menu-enter`) que se quita tras un `requestAnimationFrame` o tras 120 ms, o animación CSS con `@keyframes` aplicada al cargar. El menú ya está en un documento local; no hay problema de “flash” si la animación es corta.

**Esfuerzo:** bajo.

---

## 4. Refinamiento de la cuadrícula (§5)

### 5.1 Densidad

**Viabilidad: alta.**

- En `index.css`, en `.services`, cambiar `minmax(140px, 1fr)` a `minmax(160px, 1fr)`.

**Esfuerzo:** muy bajo.

### 5.2 Alineación óptica de logos

**Viabilidad: alta.**

- El modelo de servicio ya tiene `style` (objeto aplicado al `<img>`). Se puede usar para `object-position`, `width`/`height` o márgenes por servicio si hace falta.
- “Normalizar proporciones internas” puede ser reglas CSS genéricas (p. ej. `object-fit: contain` y un tamaño base ya definido). Ajustes finos por servicio vía `service.style` en `index.js`.

**Esfuerzo:** bajo.

---

## 5. Refinamiento del badge “Último” (§6)

**Viabilidad: alta.**

- Tamaño de texto 0.65 rem: ya está en esa línea en el plan; comprobar en `.service-badge` y ajustar si no.
- Fondo con blur ligero: `backdrop-filter: blur(4px)` (o similar) y fondo semiopaco en `.service-badge`.
- Animación leve de aparición: `animation` o `transition` (opacity/transform) al montar la tarjeta; se puede hacer con una clase que se añade al pintar y un keyframe corto.
- Espaciado compacto: padding y posición ya definidos; afinar si hace falta.

**Esfuerzo:** bajo.

---

## 6. Barra sin marco — evolución (§7)

### 7.1 Separador inferior

**Viabilidad: alta.**

- En `client-header.js`, en los estilos inyectados de `.CatripPlayer-topbar`, añadir `border-bottom: 1px solid rgba(255,255,255,0.05);`.

**Esfuerzo:** muy bajo.

### 7.2 Indicador contextual (punto de color)

**Viabilidad: alta.**

- El main ya inyecta `window.__catripServiceName` antes del header. Se puede inyectar también `window.__catripServiceColor` (color del servicio actual, resuelto por URL como el nombre).
- En `client-header.js`, si hay nombre (o siempre), dibujar un `<span>` de 6 px de diámetro (border-radius 50 %, background = color del servicio) junto al título centrado (por ejemplo a la izquierda del texto del nombre). Ajuste de layout (flex) para que el punto + nombre sigan centrados.

**Esfuerzo:** bajo.

---

## 7. Transición entre servicios (§8)

**Viabilidad: media–alta**, según cómo se interprete.

- **En el menú:** al hacer clic en un servicio, el menú ya hace fade-out y el loader hace fade-in. Se puede afinar tiempos (100–150 ms) y usar la curva estándar (§4.1).
- **En la página del servicio:** cuando la nueva URL termina de cargar (`did-finish-load`), el documento es el de la web cargada; no hay “contenido anterior” en el mismo documento. Lo que sí se puede hacer es **fade-in del contenido nuevo**: en `did-finish-load`, inyectar un script que aplique al `body` (o a un wrapper) una animación corta de opacidad 0→1 (100–150 ms). Así se evita el corte abrupto de la aparición de la página.
- Crossfade “clásico” (dos capas superpuestas) entre dos URLs en el mismo `webContents` no es posible sin cambiar a un modelo de múltiples vistas/iframes, que el plan explícitamente no pide.

**Recomendación:** mantener y pulir el fade-out del menú + fade-in del loader; añadir fade-in del contenido nuevo al terminar de cargar la URL en main (inyección de script en `did-finish-load` para páginas remotas).

**Esfuerzo:** bajo.

---

## 8. Refinamiento del overlay (§9)

### 9.1 Profundidad visual (drop-shadow en logo)

**Viabilidad: alta.**

- **Menú local:** en `index.css`, en `.loader img`, añadir `filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5));`.
- **Overlay inyectado:** en el script de `main.ts` que construye el overlay, añadir la misma propiedad `filter` en el estilo del `img` del logo.

**Esfuerzo:** muy bajo.

### 9.2 Ajuste ripple (escala máxima 1.12)

**Viabilidad: alta.**

- En `index.css`, en el keyframe del ripple, cambiar la escala en el 50 % de 1.15 a 1.12.
- En `main.ts`, en el keyframe inyectado `catrip-ripple`, hacer el mismo cambio.

**Esfuerzo:** muy bajo.

---

## 9. Sistema de espaciado formal (§10)

**Viabilidad: alta.**

- Añadir en `:root` las variables indicadas: `--space-xs: 8px`, `--space-sm: 16px`, `--space-md: 24px`, `--space-lg: 32px`.
- Ir reemplazando en `index.css` valores sueltos (padding, margin, gap) por estas variables donde tenga sentido, sin obligar a cambiar todo de golpe.

**Esfuerzo:** bajo.

---

## 10. Indicador de foco refinado (§11)

**Viabilidad: alta.**

- En `.service:focus-visible` (o el selector que se use para foco), añadir `box-shadow: 0 0 0 3px rgba(37,99,235,0.3);` (37,99,235 = #2563eb). Se puede combinar con el `outline` actual o sustituirlo para un aspecto más suave, manteniendo contraste suficiente para accesibilidad.

**Esfuerzo:** muy bajo.

---

## 11. Versión discreta visible (§12)

**Viabilidad: alta.**

- Añadir en el menú local (p. ej. en `index.html`) un elemento en la esquina inferior izquierda (posición fija o dentro del layout), texto “v1.0.0” (o el que corresponda).
- La versión puede venir del proceso principal: incluirla en el payload de `set-services` (p. ej. `appVersion`) y que el renderer la muestre. Ya se usa `app.getVersion()` en el menú nativo; el mismo valor se puede enviar por IPC al cargar el menú.
- Estilos: 0.65 rem, opacidad 50 %, sin molestar al contenido.

**Esfuerzo:** bajo.

---

## 12. Preparación para escalabilidad (§13)

**Viabilidad: media; esfuerzo bajo si se acota.**

- **Layout adaptable para futura sidebar:** estructurar el menú (p. ej. un `main` o `#app` con flex/grid) para que, en el futuro, se pueda añadir una columna lateral sin rehacer todo. No implica implementar la sidebar ni cambiar comportamiento actual.
- **Modo compacto / HiDPI:** el plan los marca como evolutivos. Preparación mínima: usar variables de espaciado y tipografía (ya en camino con §10 y el sistema actual) para que luego un tema o media query pueda escalar. No hace falta implementar modo compacto ni HiDPI ahora.

**Esfuerzo:** bajo si se limita a estructura de layout y variables.

---

## 13. Priorización y resumen de viabilidad

| Prioridad (plan) | Item | Viabilidad | Esfuerzo |
|------------------|------|------------|----------|
| **Alta** | Gradiente sutil fondo (§2.1) | Alta | Muy bajo |
| **Alta** | Curvas de animación (§4.1) | Alta | Bajo |
| **Alta** | Crossfade entre servicios (§8) | Media–alta* | Bajo |
| **Alta** | Separador barra sin marco (§7.1) | Alta | Muy bajo |
| **Media** | Ajustes ópticos logos (§5.2) | Alta | Bajo |
| **Media** | Refinamiento badge (§6) | Alta | Bajo |
| **Media** | Sistema formal spacing (§10) | Alta | Bajo |
| **—** | Animación entrada menú (§4.2) | Alta | Bajo |
| **—** | Densidad cuadrícula (§5.1) | Alta | Muy bajo |
| **—** | Punto color barra (§7.2) | Alta | Bajo |
| **—** | Drop-shadow y ripple overlay (§9) | Alta | Muy bajo |
| **—** | Foco refinado (§11) | Alta | Muy bajo |
| **—** | Versión discreta (§12) | Alta | Bajo |
| **Evolutivo** | Sistema formal de estados (§3) | Media** | Bajo (vacío) a medio–alto (error/offline) |
| **Evolutivo** | Preparación sidebar / HiDPI (§13) | Alta (acotado) | Bajo |

\* Crossfade: viable como fade-out menú + fade-in loader + fade-in contenido nuevo al cargar.  
\** Estado vacío: viable y fácil; Error y Sin conexión: viables con lógica en main y vistas.

---

## 14. Conclusión

- **¿Es viable desarrollar la Fase 2?** **Sí.** No requiere cambios de arquitectura; encaja con el stack actual (Electron, menú local, scripts inyectados).
- **Qué es más directo:** §2.1, §4, §5, §6, §7, §9, §10, §11, §12 y la parte de transición que sea fade-in del contenido nuevo + refinado de tiempos. También el estado vacío del §3.
- **Qué conviene acotar o dejar para después:** sistema completo de estados Error y Sin conexión (§3); crossfade entendido como dos capas en el mismo documento; preparación HiDPI/modo compacto más allá de variables y estructura.

Recomendación: abordar en primer lugar los ítems de prioridad alta y los de esfuerzo muy bajo/bajo; luego estado vacío y sistema de espaciado; y dejar Error/Sin conexión y refinamientos evolutivos para una siguiente iteración.
