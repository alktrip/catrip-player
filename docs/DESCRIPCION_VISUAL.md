# Descripción visual — CatripPlayer

Documento que describe la apariencia y el comportamiento visual de la aplicación de escritorio CatripPlayer (cliente unificado de streaming). Sirve como referencia para diseño, pruebas de usabilidad y documentación.

---

## 1. Ventana principal

- **Tipo:** ventana única de escritorio (Electron `BrowserWindow`).
- **Tamaño por defecto:** 890×600 píxeles.
- **Tamaño mínimo:** 400×300 píxeles.
- **Marco:** según la opción *Ventana sin marco* en Ajustes:
  - **Con marco:** barra de título y bordes del sistema (estilo nativo del SO, p. ej. en Zorin/GTK).
  - **Sin marco:** sin barra de título; la aplicación inyecta una barra superior propia (ver sección 6).
- **Comportamiento:** puede estar *siempre encima* de otras ventanas y *pantalla completa* según Ajustes; posición y tamaño se pueden recordar al cerrar.
- **Icono de la aplicación:** el icono que aparece en el lanzador del SO (y en el AppImage/.deb) es la imagen de marca de CatripPlayer (`build/icon.png`): cuadrado redondeado con botón de play y estética moderna en tonos azul, púrpura y rosa/rojo. La misma imagen se usa como logo dentro del menú principal (ver §3.3).

Todo el contenido (selector de servicios o web del servicio) se muestra dentro de esta única ventana; no hay pestañas ni ventanas secundarias para el contenido.

---

## 2. Menú de aplicación (nativo)

Menú de barra superior (Linux) o integrado en la ventana, según el entorno. Estructura:

| Menú        | Ítems |
|------------|--------|
| **CatripPlayer** | Versión (ej. «CatripPlayer 1.0.0», solo lectura), separador, *Salir* (Ctrl+Q). |
| **Servicios**    | *Menú* (Ctrl+H), *URL personalizada...* (Ctrl+O), separador, un ítem por servicio visible (Netflix, YouTube, Twitch, Amazon Prime Video, HBO Max, Crunchyroll, etc.). |
| **Ajustes**      | *Siempre encima*, *Ventana sin marco*, *Recordar posición y tamaño*, *Iniciar en pantalla completa*, *Bloquear anuncios*, separador, *Servicios visibles* (submenú con un checkbox por servicio), separador, *Servicio al iniciar* (submenú: Menú principal / Última página abierta / por servicio), separador, *Restablecer ajustes*, separador, *Editar configuración...*. |
| **Developer**    | *Recargar* (Ctrl+R), *DevTools* (Ctrl+Shift+I). |
| **Ayuda**        | *Acerca de CatripPlayer* (abre diálogo con versión y descripción). |

- Checkboxes y radios reflejan el estado guardado; los cambios se aplican de inmediato (o tras relaunch cuando corresponde).
- Los ítems de Servicios visibles y Servicio al iniciar se generan a partir de la lista de servicios (por defecto y personalizada).

---

## 3. Pantalla de selección de servicios (menú local)

Pantalla que se muestra cuando la ventana carga el menú local (`index.html`), por ejemplo al elegir *Servicios → Menú* o al iniciar con «Menú principal» como servicio por defecto.

### 3.1 Sistema de diseño (variables CSS)

La interfaz usa variables en `:root` para coherencia:

- **Tipografía:** título principal 1.4rem / 600, subtítulo 1.1rem / 500, texto base 0.95rem, texto secundario 0.85rem / 400.
- **Color acento (identidad de la app):** `#2563eb` (azul). Se usa en focos de teclado y en elementos de la interfaz.
- **Fondos y tarjetas:** `--bg-page` (#1a1a1a), `--card-bg` (rgba 0.04), `--card-border` (rgba 0.05), `--card-shadow` y `--card-hover-shadow`.
- **Transiciones:** `--transition-fast` (0.15s), `--transition-smooth` (0.25s).

### 3.2 Contenedor y fondo

- **Fondo:** gradiente radial sutil (`radial-gradient(circle at top center, #1f1f1f 0%, #1a1a1a 60%)`) que aporta profundidad sin distraer; el tono base sigue siendo `#1a1a1a`.
- **Texto general:** `#e5e5e5` (variable `--text-primary`); texto secundario con opacidad reducida (`--text-secondary`).
- **Tipografía:** `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`; tamaño base según variables.
- **Espaciado:** relleno según variables de espaciado (`--space-sm`, etc.); contenido centrado con ancho máximo de 900 px.

### 3.3 Encabezado del menú

Encima de la cuadrícula aparece un **encabezado** centrado:

- **Logo:** imagen 48×48 px (`logo.png`), misma imagen de marca que el icono de la aplicación: cuadrado redondeado con botón de play y estética moderna (tonos azul, púrpura, rosa/rojo, efecto neón/cósmico). Refuerza la identidad de CatripPlayer en la pantalla de servicios.
- **Título:** «Selecciona un servicio» (1.4rem, peso 600).
- **Subtítulo:** «Accede rápidamente a tus plataformas favoritas» (1.1rem, color secundario).

### 3.4 Cuadrícula de servicios

- **Layout:** rejilla responsiva (`grid`), columnas de **mínimo 160 px** que se rellenan según espacio (evita compresión excesiva en resoluciones intermedias).
- **Separación:** según variables de espaciado (`--space-sm`) entre tarjetas.

Cada **tarjeta de servicio**:

- **Aspecto:** rectángulo con bordes redondeados (12 px), fondo `rgba(255,255,255,0.04)`, borde sutil `1px solid rgba(255,255,255,0.05)`, sombra `0 4px 14px rgba(0,0,0,0.4)`.
- **Contenido:**  
  - **Logo:** imagen 64×64 px, centrada, `object-fit: contain` (puede tener estilos extra por servicio).  
  - **Nombre:** texto debajo del logo, fuente 0.85rem, peso 600, color principal, centrado.
- **Interacción:**  
  - *Hover:* ligera elevación (`translateY(-4px)`), sombra más marcada (`0 8px 24px`), barra inferior en el **color del servicio** (variable `--service-color` por tarjeta).  
  - *Clic:* ligera bajada.  
  - *Foco teclado:* `outline` de 2 px en color acento (`--accent`).  
  - Al hacer clic se inicia la carga del servicio (ver sección 5) y la ventana pasa a mostrar la web del servicio.

**Indicador de último servicio:** la tarjeta del servicio abierto más recientemente muestra una barra inferior en color del servicio siempre visible y un **badge** «Último» (esquina superior derecha, fondo oscuro, texto pequeño en mayúsculas). El último servicio se guarda al cargar cualquier servicio.

Solo se muestran servicios no ocultos (configuración en *Ajustes → Servicios visibles*). **Servicios por defecto visibles:** Netflix, YouTube, Twitch, Amazon Prime Video, HBO Max, Crunchyroll (además de YouTube TV, Floatplane, Disney+ y otros que pueden estar ocultos por defecto).

### 3.5 Estado vacío y versión

- **Estado vacío:** si todos los servicios están ocultos, se muestra un mensaje centrado con icono, título «Ningún servicio visible» y texto que indica activar servicios en *Ajustes → Servicios visibles*.
- **Versión:** en la esquina inferior izquierda del menú, texto discreto en formato «vX.X» (0.65rem, opacidad 50 %), con la versión de la aplicación.

### 3.6 Título de la ventana

- Con el menú local cargado, el título del documento es: **«CatripPlayer — Elige un servicio»**.

---

## 4. Contenido del servicio (página web embebida)

Al elegir un servicio (desde la cuadrícula o desde *Servicios*), la ventana deja de mostrar el menú local y carga la URL del servicio (Netflix, YouTube, etc.) en el mismo `BrowserWindow`.

- **Aspecto:** idéntico al del sitio en un navegador (mismo HTML/CSS/JS del sitio).
- **Comportamiento:** scroll, clics, formularios y reproducción de vídeo/DRM (Widevine) funcionan como en un navegador; la barra de dirección no se muestra.
- Si está activa la opción *Ventana sin marco*, se superpone la barra superior de CatripPlayer (ver sección 6).
- Si está activo el bloqueo de anuncios, se aplica a esta sesión de navegación.

---

## 5. Loader y overlay de carga

Se usa en dos momentos: en el menú local (brevemente) y en la página del servicio (hasta que termina de cargar).

### 5.1 En el menú local (cuadrícula)

- Al hacer clic en una tarjeta:
  - El cuerpo recibe la clase `loading` y `menu-fade-out`: el menú hace **fade-out** (opacidad 0 en ~150 ms) y se deshabilitan eventos de puntero.
  - Se muestra un **loader** a pantalla completa: fondo semiopaco con **backdrop-filter: blur(6px)**, animación de aparición (fade-in ~150 ms).
  - En el centro: círculo «ripple» en el color del servicio y logo del servicio (48×48 px) con drop-shadow. El ripple pulsa en un ciclo de **1.1 s** (escala ~1 → 1.12, opacidad 0.4 ↔ 0.2).
  - **Texto bajo el logo:** «Conectando con {nombre del servicio}…» (tamaño secundario, color secundario).
- Cuando la ventana cambia a la URL del servicio, este contenido desaparece porque se sustituye por la nueva página.

### 5.2 En la página del servicio (overlay inyectado)

- Al cargar la URL del servicio, el proceso principal inyecta un **overlay de carga** sobre la página:
  - **Contenedor:** capa a pantalla completa, fondo negro semiopaco (~50%), **backdrop-filter: blur(6px)**, animación de aparición (fade-in 0.15 s). Id `catrip-loader-overlay`, z-index 2147483647.
  - **Contenido:** círculo ripple en el color del servicio (animación 1.1 s, escala máx. 1.12), logo del servicio (48×48 px) con drop-shadow, y texto **«Conectando con {nombre del servicio}…»** debajo.
- El overlay se elimina automáticamente cuando la página termina de cargar (`did-finish-load`), dejando solo el contenido del sitio.

Con esto se cumple: «animación de carga (ripple + logo) hasta que la página cargue» y mensaje contextual de conexión.

---

## 6. Modo ventana sin marco (barra superior inyectada)

Cuando *Ajustes → Ventana sin marco* está activado, en cada página cargada (local o remota) se inyecta una barra superior para poder arrastrar la ventana y salir del modo sin marco.

- **Contenedor:** `CatripPlayer-topbar-wrap`.
- **Barra arrastrable:**  
  - **Altura 30 px**, ancho 100%, fija arriba.  
  - **Fondo negro al 85 % de opacidad** (`rgba(0,0,0,0.85)`), siempre visible.  
  - **Nombre del servicio centrado:** el proceso principal resuelve el servicio actual por URL y lo inyecta en `window.__catripServiceName`; la barra muestra ese nombre en el centro (tipografía 0.85rem, color blanco ~90 %). Opcionalmente, un **punto de 6 px** en el color del servicio (`window.__catripServiceColor`) aparece junto al nombre. Si no hay servicio (p. ej. URL personalizada), el centro queda vacío.  
  - **Separador inferior:** borde sutil `1px solid rgba(255,255,255,0.05)`.  
  - `-webkit-app-region: drag` en la barra para arrastrar la ventana; cursor «grab».  
  - Diseño en flex: botón a la izquierda, bloque centrado (punto + título) con flex:1.
- **Botón de salir:**  
  - Símbolo «×» (times), a la izquierda. **Área de clic ampliada:** min-width 32 px, min-height 24 px, padding 4 px 10 px, border-radius 4 px.  
  - Color blanco ~75 %; **hover:** color blanco sólido y **fondo rojo tenue** (`rgba(220,53,69,0.35)`), con transición 0.15 s.  
  - `-webkit-app-region: no-drag`; atributo `aria-label` «Restaurar marco».  
  - Al hacer clic se envía `exit-fullscreen` por IPC: la aplicación desactiva la ventana sin marco y hace relaunch (ventana con marco).
- **Z-index:** 2147483647 para quedar por encima del contenido de la página.

---

## 7. Diálogos y ventanas auxiliares

- **Acerca de CatripPlayer** (*Ayuda*): cuadro de diálogo modal del sistema (`dialog.showMessageBox`), tipo *info*, título «Acerca de CatripPlayer», mensaje «CatripPlayer» y detalle con la versión de la app y una breve descripción (cliente unificado de streaming).
- **URL personalizada** (*Servicios → URL personalizada...*): ventana de diálogo (electron-prompt) con campo de texto para URL y botones Aceptar/Cancelar; título «Abrir URL», etiqueta «URL:», placeholder tipo URL.
- **Restablecer ajustes** no abre diálogo; al elegir la opción se borran datos guardados y caché de adblock y se hace relaunch (ventana se cierra y se vuelve a abrir con valores por defecto).
- **Editar configuración:** abre el archivo `config.json` del usuario en la aplicación por defecto del SO (editor de texto o similar), no un diálogo dentro de la app.

---

## 8. Resumen de paleta y estilos

| Uso              | Valor |
|------------------|--------|
| **Sistema de diseño** | |
| Color acento (app) | `#2563eb` (focos, logo) |
| Título | 1.4rem / 600 |
| Subtítulo | 1.1rem / 500 |
| Texto base / secundario | 0.95rem, 0.85rem |
| Fondo menú local | `#1a1a1a` (`--bg-page`) |
| Texto principal  | `#e5e5e5` (`--text-primary`) |
| Texto secundario | `rgba(229,229,229,0.85)` |
| Tarjeta servicio (normal) | Fondo `rgba(255,255,255,0.04)`, borde `rgba(255,255,255,0.05)`, sombra `0 4px 14px rgba(0,0,0,0.4)` |
| Tarjeta servicio (hover)  | Elevación, sombra `0 8px 24px`, barra inferior en color del servicio |
| Colores por servicio (ripple/loader/badge) | Netflix `#e50914`, YouTube `#ff0000`, Twitch `#6441a5`, Amazon Prime Video `#00A8E1`, HBO Max `#b535f6`, Crunchyroll `#ffe600`, etc. (`--service-color`) |
| Loader (menú y overlay) | Fondo semiopaco, `backdrop-filter: blur(6px)`, ripple 1.1 s, texto «Conectando con…» |
| Overlay de carga | Fondo ~50–60 %, blur 6 px |
| Barra sin marco   | Altura 30 px, fondo `rgba(0,0,0,0.85)`, nombre del servicio centrado |
| Botón × (sin marco) | Blanco ~75 %; hover: `#fff` + fondo `rgba(220,53,69,0.35)` |

---

## 9. Flujos visuales resumidos

1. **Abrir aplicación** → Ventana con menú nativo; contenido según «Servicio al iniciar» (menú principal, última página o un servicio concreto).
2. **Menú principal** → Encabezado con logo de marca (misma imagen que el icono de la app), «Selecciona un servicio» y subtítulo; bajo él, cuadrícula de tarjetas (logo + nombre) con servicios como Netflix, YouTube, Twitch, Amazon Prime Video, HBO Max, Crunchyroll. Si no hay servicios visibles, se muestra estado vacío. Versión «vX.X» en esquina inferior izquierda. La tarjeta del último servicio usado muestra badge «Último» y barra inferior en color. Clic en tarjeta → fade-out del menú → loader a pantalla completa (blur, ripple 1.1 s, drop-shadow en logo, texto «Conectando con {servicio}…») → ventana muestra la web del servicio con overlay de carga (mismo estilo y texto) → overlay desaparece al cargar la página.
3. **Desde menú Servicios** → Elegir *Menú* vuelve al selector; *URL personalizada* abre diálogo y luego carga la URL; elegir un servicio carga su web con el mismo overlay de carga.
4. **Ventana sin marco** → Barra superior 30 px, fondo 85 %, separador inferior sutil, nombre del servicio centrado (con punto de color si aplica), botón «×» a la izquierda (hover rojo tenue); clic en «×» restaura ventana con marco y relaunch.
5. **Ajustes** → Cambios reflejados en checkboxes/radios; opciones que requieren relaunch (sin marco, adblock) cierran y reabren la ventana manteniendo URL y geometría cuando aplica.

---

*Documento de descripción visual para CatripPlayer. Incluye: icono y logo de marca (logo.png / build/icon.png), gradiente de fondo, cuadrícula 160 px, estado vacío, versión en esquina, servicios Amazon Prime Video y HBO Max, refinamiento de barra sin marco (separador, punto de color), loader con ripple 1.12 y drop-shadow. Versión 1.2.*
