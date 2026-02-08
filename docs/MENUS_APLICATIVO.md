# Menús del aplicativo CatripPlayer

Este documento describe el funcionamiento de todos los menús y elementos de navegación de CatripPlayer.

La aplicación usa la **nueva organización de menús** (ver `CatripPlayer_Nueva_Organizacion_Menus.md`): **CatripPlayer**, **Navegación**, **Reproducción**, **Preferencias**, **Ayuda**.

---

## 1. Resumen

CatripPlayer tiene:

- **Menú nativo de la aplicación**: barra de menús del sistema (CatripPlayer, Navegación, Reproducción, Preferencias, Ayuda). Ver propuesta en `CatripPlayer_Nueva_Organizacion_Menus.md`.
- **Menú principal (pantalla de servicios)**: interfaz gráfica con cuadrícula de tarjetas para elegir un servicio.
- **Isla flotante**: barra superior inyectada en páginas remotas cuando la ventana está en modo “sin marco”.

Los dos primeros están siempre disponibles; la Isla flotante solo cuando **Preferencias → Ventana → Ventana sin marco** está activada.

---

## 2. Menú nativo de la aplicación

Es la barra de menús que aparece en la parte superior de la ventana (o integrada en el escritorio en algunos entornos Linux). Se construye en `src/menu.ts` y se asigna con `Menu.setApplicationMenu()`.

### 2.1 CatripPlayer (identidad y ciclo de vida)

| Ítem          | Atajo   | Función |
|---------------|--------|--------|
| Versión x.x.x | —      | Solo información, no clicable. |
| *(separador)* | —      | — |
| Salir         | Ctrl+Q | Cierra la aplicación (`role: quit`). |

### 2.2 Navegación (cambiar de vista o destino)

| Ítem                | Atajo   | Función |
|---------------------|--------|--------|
| Menú principal      | Ctrl+H | Vuelve al menú principal (pantalla de servicios). Carga `src/ui/index.html` y envía por IPC la lista de servicios. |
| URL personalizada… | Ctrl+O | Abre un cuadro para escribir una URL; al aceptar, carga esa URL en la ventana. |
| *(separador)*       | —      | — |
| Netflix, YouTube, … | —      | Un ítem por cada **servicio visible**. Al hacer clic se carga la URL del servicio y se envía `run-loader` al renderer. |

Los servicios ocultos en **Preferencias → Servicios → Servicios visibles** no aparecen aquí.

### 2.3 Reproducción (comportamiento inmediato de la ventana)

| Ítem               | Tipo     | Función |
|--------------------|----------|--------|
| Volver al menú     | Acción   | Igual que Navegación → Menú principal (Ctrl+H). |
| Recargar servicio  | Acción   | Recarga la página actual (`mainWindow.reload()`). |
| *(separador)*      | —        | — |
| Siempre encima     | Checkbox | Persistido en `options.alwaysOnTop`. Ventana por encima del resto. |
| Pantalla completa  | Checkbox | Estado actual (no persistido). Conmuta `mainWindow.setFullScreen()`. |

### 2.4 Preferencias (configuración persistente)

Todo se guarda en `electron-store` (p. ej. `config.json` en `userData`).

| Ruta | Tipo / clave | Comportamiento |
|------|--------------|----------------|
| **Ventana** | | |
| → Recordar posición y tamaño | Checkbox, `options.rememberWindowDetails` | Restaura posición y tamaño entre sesiones. |
| → Iniciar en pantalla completa | Checkbox, `options.launchFullscreen` | Al abrir la app, la ventana inicia en pantalla completa. |
| → Ventana sin marco | Checkbox, `options.hideWindowFrame` | Sin decoraciones. Requiere **reinicio**. Activa la **Isla flotante** en páginas remotas. |
| **Servicios** | | |
| → Servicios visibles | Submenú de checkboxes, `services` | Muestra u oculta cada servicio en la cuadrícula y en Navegación. Emite `refresh-services`. |
| → Servicio al iniciar | Submenú de radio, `options.defaultService` | Menú principal, Última página abierta, o un servicio concreto. |
| **Privacidad** | | |
| → Bloquear anuncios | Checkbox, `options.adblock` | Activa el bloqueador (Ghostery). Requiere **reinicio**. |
| *(separador)* | | |
| Recargar ventana | Acción, Ctrl+R | Recarga la ventana (`mainWindow.reload()`). |
| Restablecer preferencias | Acción | Llama a `resetSettings()` y reinicia la ventana. |
| Editar configuración… | Acción | Abre `config.json` de `userData` con el editor del sistema. |

### 2.5 Ayuda

| Ítem                   | Función |
|------------------------|---------|
| Acerca de CatripPlayer | Cuadro de diálogo con nombre, versión y descripción de la aplicación (cliente unificado de streaming). |

---

## 3. Menú principal (pantalla de servicios)

Es la interfaz que se muestra cuando se carga `file:///.../src/ui/index.html` (por ejemplo al iniciar con “Menú principal” como servicio al iniciar, o al elegir **Navegación → Menú principal** o **Reproducción → Volver al menú** / Ctrl+H).

### 3.1 Contenido

- **Encabezado**: logo, título “Selecciona un servicio” y texto “Accede rápidamente a tus plataformas favoritas”.
- **Cuadrícula de servicios**: tarjetas (`.service`) generadas en `src/ui/index.js` a partir de la lista recibida por IPC (`set-services`). Solo se muestran los servicios **no ocultos** (según **Preferencias → Servicios → Servicios visibles**).
- **Estado vacío**: si todos los servicios están ocultos, se muestra el mensaje “Ningún servicio visible” y se indica activar servicios en **Preferencias → Servicios → Servicios visibles**.
- **Versión**: en la esquina se muestra la versión de la app (enviada en el payload de `set-services`).

### 3.2 Comportamiento de las tarjetas

- **Clic en una tarjeta**: se inicia la secuencia “morph” (el logo de la tarjeta se anima hacia el centro), luego se muestra un loader con partículas y texto “Conectando con [servicio]…”, y se envía por IPC `open-url` con el servicio. El proceso principal carga la URL del servicio en la ventana.
- **Efectos visuales (Evolución Aura)**:
  - Iluminación ambiental al pasar el ratón sobre la tarjeta.
  - Paralaje del logo dentro de la tarjeta según la posición del cursor.
  - Animación de entrada en escalonado (stagger) según el índice de la tarjeta.
- **Servicio “Último”**: si el servicio coincide con `lastUsedService` guardado, la tarjeta lleva una etiqueta “Último”.

### 3.3 IPC utilizado

- **Entrada**: el proceso principal envía `set-services` con `{ services, lastUsedService, appVersion }` (o un array de servicios). El renderer pinta la cuadrícula y la versión.
- **Salida**: al hacer clic en un servicio, el renderer envía `open-url` con el objeto servicio; el main carga la URL y guarda `options.lastUsedService`.

Si desde el **menú nativo** se elige un servicio (Navegación → Netflix, etc.), el main carga la URL y envía `run-loader` al renderer; si en ese momento se está mostrando el menú principal, el renderer muestra el loader sobre la cuadrícula (sin morph) y luego la ventana muestra la página del servicio.

---

## 4. Isla flotante (ventana sin marco)

Cuando **Preferencias → Ventana → Ventana sin marco** está activado, en las páginas que **no** son el menú principal (contenido remoto: Netflix, YouTube, etc.) se inyecta el script `src/client-header.js`. Este script añade una barra superior (“Isla flotante”) que:

- **Aspecto**: píldora centrada en la parte superior, con fondo oscuro semitransparente y blur. Incluye un punto de color (del servicio actual) y el nombre del servicio. Al pasar el ratón, la píldora se ensancha y aparece un botón “×” con tooltip **“Volver al menú”**.
- **Función**:
  - **Arrastrar**: la zona de la píldora tiene `-webkit-app-region: drag` para poder mover la ventana (al no haber marco).
  - **Botón ×** (tooltip y aria-label: “Volver al menú”): al hacer clic se envía por IPC `exit-fullscreen`. El proceso principal vuelve al menú principal (evitando ambigüedad entre cerrar servicio y cerrar aplicación).

El nombre y el color del servicio se inyectan desde el proceso principal (`window.__catripServiceName`, `window.__catripServiceColor`) comparando el `origin` de la URL cargada con las URLs de los servicios conocidos. Si no hay coincidencia, el título puede quedar vacío.

La Isla **no** se inyecta en la página del menú principal (`file://`), solo en URLs remotas (http/https).

---

## 5. Atajos de teclado

| Atajo         | Acción                    |
|---------------|---------------------------|
| Ctrl+Q        | Salir                     |
| Ctrl+H        | Ir al menú principal      |
| Ctrl+O        | URL personalizada…       |
| Ctrl+R        | Recargar ventana (Preferencias) |

---

## 6. Flujo resumido

1. **Al abrir la aplicación**: se lee `options.defaultService`. Si es “Menú principal” o vacío, se carga el menú principal (`index.html`). Si es “Última página abierta” o un servicio concreto, se carga esa URL; en ese caso, en contenido remoto con ventana sin marco se muestra la Isla flotante.
2. **Desde el menú principal**: el usuario hace clic en una tarjeta → morph + loader → `open-url` → el main carga la URL del servicio y guarda `lastUsedService`.
3. **Volver al menú**: **Navegación → Menú principal** o **Reproducción → Volver al menú** (o Ctrl+H) → el main carga `index.html` y envía `set-services`.
4. **Cambiar de servicio sin pasar por el menú**: **Navegación** → elegir otro servicio; se carga su URL y se envía `run-loader` si el renderer actual es el menú principal.
5. **Preferencias**: todos los cambios se persisten en `electron-store`. Algunos (Ventana sin marco, Bloquear anuncios) provocan reinicio de la ventana para aplicar los cambios.

---

## 7. Archivos implicados

| Archivo               | Rol |
|-----------------------|-----|
| `src/menu.ts`         | Construcción del menú nativo (CatripPlayer, Navegación, Reproducción, Preferencias, Ayuda). |
| `src/main.ts`         | Creación de ventana, carga de URL/menú, manejo de IPC `open-url`, `exit-fullscreen`, `set-services`, lógica de defaultService y relaunch. |
| `src/ui/index.html`   | Estructura del menú principal (encabezado, cuadrícula, estado vacío). |
| `src/ui/index.js`     | Renderizado de tarjetas, morph, loader, listeners de IPC `set-services` y `run-loader`. |
| `src/client-header.js`| Script inyectado en páginas remotas cuando la ventana es sin marco; dibuja la Isla flotante y envía `exit-fullscreen`. |
| `src/default-services.ts` | Lista de servicios por defecto (nombre, logo, URL, color, etc.) usada por el menú y la cuadrícula. |

Este documento refleja el comportamiento implementado en el código actual de CatripPlayer.
