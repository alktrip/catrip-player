# Plan de desarrollo — CatripPlayer

Aplicación de escritorio tipo cliente unificado de streaming (Electron + TypeScript), priorizada para **Zorin OS 18 Pro** (Linux).

---

## 1. Objetivos y alcance

### 1.1 Objetivo del producto

- **CatripPlayer:** aplicación de escritorio (Electron) que actúa como cliente unificado para servicios de vídeo en streaming.
- Una única ventana con menú de servicios; al elegir uno se carga la URL del servicio (Netflix, YouTube, Twitch, etc.) dentro del mismo **Chromium embebido**.
- Opciones de ventana (sin marco, siempre encima, fullscreen), persistencia de preferencias y, opcionalmente, bloqueo de anuncios.
- Soporte **Widevine (DRM)** en Linux mediante build de Electron con Widevine (p. ej. CastLabs).

### 1.2 Alcance inicial

- **SO objetivo principal:** Zorin OS 18 Pro (Linux).
- **Stack:** Node.js, Electron, TypeScript. UI con HTML/CSS/JS (o TS en renderer).
- **Empaquetado:** AppImage y/o .deb para distribución en Zorin/Ubuntu.

### 1.3 Fuente de referencia

- Funcionalidad basada en la especificación funcional de **ElectronPlayer** (documento de referencia para replicar comportamiento).

---

## 2. Stack técnico

| Componente           | Tecnología |
|----------------------|------------|
| Runtime              | Node.js (incluido en Electron) |
| Lenguaje             | TypeScript (main + renderer opcional) |
| UI nativa            | Electron (Chromium + Node) |
| Proceso principal    | `src/main.ts` (compilado a JS o ejecutado con ts-node/tsx) |
| Interfaz de usuario  | HTML/CSS/JS en `src/ui/` (cargado como `file://`) |
| Contenido externo    | Páginas web por URL en el mismo `BrowserWindow` |
| Persistencia         | `electron-store` (JSON en disco) |
| DRM (Widevine)       | Electron CastLabs: `castlabs/electron-releases` (versión estable para Linux) |
| Build / empaquetado  | `electron-builder` (AppImage, deb) |

---

## 3. Estructura objetivo del proyecto

```
CatripPlayer/
├── src/
│   ├── main.ts                 # Proceso principal
│   ├── menu.ts                 # Menú nativo de la aplicación
│   ├── default-services.ts     # Lista por defecto de servicios
│   ├── preload.ts              # Preload: expone IPC y services solo en file://
│   ├── client-header.ts        # Script inyectado en sitios remotos (barra + salir)
│   └── ui/
│       ├── index.html          # Menú principal (selector de servicios)
│       ├── index.css           # Estilos del menú
│       ├── index.js            # Lógica del menú (servicios, loader, IPC)
│       └── services/           # Iconos/logos por servicio (SVG/PNG)
├── build/
│   ├── electron-builder.yml    # Configuración de empaquetado (AppImage, deb)
│   └── icon.*                  # Iconos de la aplicación
├── docs/
│   ├── PLAN_DESARROLLO.md      # Este documento
│   └── ESPECIFICACION_FUNCIONAL.md  # (opcional) copia o adaptación de ElectronPlayer
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Fases de desarrollo

### Fase 0: Entorno y esqueleto (Semana 1)

**Objetivo:** Proyecto Electron + TypeScript que abre una ventana en Zorin OS.

| Tarea | Descripción | Criterio de aceptación |
|-------|-------------|------------------------|
| 0.1   | Inicializar proyecto Node (npm/yarn/pnpm) | `package.json` con nombre `catripplayer`, scripts `start`, `build` |
| 0.2   | Añadir Electron y TypeScript | Electron como dependencia; TypeScript para `src/` |
| 0.3   | Configurar Electron con CastLabs (Widevine) | Usar `castlabs/electron-releases` en `package.json` o `electron-builder`; documentar versión usada |
| 0.4   | Proceso principal mínimo (`main.ts`) | Crear `BrowserWindow`, cargar una página local o `about:blank` |
| 0.5   | Script de arranque | `npm start` abre la ventana en Zorin OS 18 Pro |
| 0.6   | Configurar `electron-builder` para Linux | Salida AppImage y/o deb; probar en Zorin |

**Entregable:** App que abre una ventana y se empaqueta para Linux.

---

### Fase 1: Ventana, menú local y servicios (Semanas 2–3)

**Objetivo:** Ventana con menú principal (UI local) y lista de servicios; al hacer clic en un servicio se carga su URL.

| Tarea | Descripción | Criterio de aceptación |
|-------|-------------|------------------------|
| 1.1   | Definir modelo de datos de servicios | Tipo/interface: `name`, `logo`, `url`, `color`, `userAgent?`, `permissions?`, `hidden?` |
| 1.2   | Implementar `default-services.ts` | Array por defecto (ej.: Netflix, YouTube, Twitch; URLs y logos en `ui/services/`) |
| 1.3   | Persistencia con `electron-store` | Guardar/cargar `services`, `options` (defaultService, lastOpenedPage, windowDetails, etc.) |
| 1.4   | Fusión servicios por defecto + guardados | En main, al arrancar: merge por `name`; resultado en variable global o store para el renderer |
| 1.5   | Preload seguro | Preload expone `ipc` siempre; `services` solo cuando `protocol === 'file:'` |
| 1.6   | UI del menú principal (`index.html` + CSS + JS) | Cuadrícula de tarjetas por servicio (logo, nombre); solo servicios no ocultos |
| 1.7   | IPC `open-url` | Clic en servicio → renderer envía `open-url` con objeto servicio → main hace `loadURL(service.url)` y asigna `userAgent` si existe |
| 1.8   | Menú nativo básico | Menú de aplicación con: CatripPlayer (Acerca, Salir), Servicios (Menú, Custom URL, ítems por servicio), Developer (Recargar, DevTools) |

**Entregable:** Usuario puede elegir un servicio desde la UI o el menú y ver la web del servicio en la misma ventana.

---

### Fase 2: Opciones de ventana y preferencias (Semana 4)

**Objetivo:** Opciones de ventana persistentes y menú Settings funcional.

| Tarea | Descripción | Criterio de aceptación |
|-------|-------------|------------------------|
| 2.1   | Opciones guardadas en store | `alwaysOnTop`, `hideWindowFrame`, `launchFullscreen`, `rememberWindowDetails` |
| 2.2   | Aplicar opciones al crear ventana | Tamaño/posición desde `windowDetails`; `alwaysOnTop`, `fullScreen` según flags |
| 2.3   | Guardar al cerrar | Si `rememberWindowDetails`, guardar posición y tamaño; si default es “última página”, guardar `lastOpenedPage` |
| 2.4   | Menú Settings | Always On Top, Frameless Window, Remember Window Details, Start in Fullscreen, Default Service (Menú / Last Opened Page / por servicio), Edit Config (abrir JSON del store) |
| 2.5   | Relaunch “suave” | Para Frameless (y luego Adblock/PiP si se añaden): guardar `relaunch.toPage` y `relaunch.windowDetails`, cerrar ventana, volver a `createWindow()` y restaurar URL y geometría |

**Entregable:** Preferencias de ventana y de arranque guardadas y aplicadas; relaunch sin cerrar la app completamente.

---

### Fase 3: Ventana sin marco y barra de arrastre (Semana 5)

**Objetivo:** Modo ventana sin marco con barra superior arrastrable y botón de salir.

| Tarea | Descripción | Criterio de aceptación |
|-------|-------------|------------------------|
| 3.1   | Crear ventana con `frame: false` | Cuando `hideWindowFrame` (o PiP si se implementa) esté activo |
| 3.2   | Inyectar script en `dom-ready` | En páginas cargadas (local y remotas), si frameless: ejecutar `client-header` en `webContents` |
| 3.3   | Contenido de `client-header` | Barra superior (`.CatripPlayer-topbar`) con `-webkit-app-region: drag`; botón “×” que envía `ipc.send('exit-fullscreen')` |
| 3.4   | Main: `exit-fullscreen` | Limpiar opción frameless (y PiP si aplica), emitir `relaunch` y recrear ventana con marco |

**Entregable:** Modo sin marco usable con barra para arrastrar y salir del modo.

---

### Fase 4: Permisos por servicio (Semana 5–6)

**Objetivo:** Solo aceptar permisos definidos por servicio según el origen.

| Tarea | Descripción | Criterio de aceptación |
|-------|-------------|------------------------|
| 4.1   | `setPermissionRequestHandler` en la sesión | Para cada petición: obtener origen de la URL cargada |
| 4.2   | Resolver servicio por origen | Buscar servicio cuyo `url` coincida con el origen (misma base) |
| 4.3   | Aceptar/rechazar | Si el servicio tiene `permissions` y el permiso está en la lista, o si es `fullscreen`, aceptar; si no, rechazar |

**Entregable:** Sitios solo obtienen permisos configurados para su servicio.

---

### Fase 5: Adblock opcional (Semana 6–7)

**Objetivo:** Bloqueo de anuncios opcional con relaunch.

| Tarea | Descripción | Criterio de aceptación |
|-------|-------------|------------------------|
| 5.1   | Añadir dependencia | `@cliqz/adblocker-electron` (o equivalente); revisar compatibilidad con versión Electron CastLabs) |
| 5.2   | Opción en store y Settings | `options.adblock` (checkbox); al activar/desactivar → relaunch |
| 5.3   | Inicializar motor en main | Si `adblock`: crear o cargar desde disco (ej. `userData/adblock-engine-cache`), `enableBlockingInSession(session.defaultSession)` |
| 5.4   | Persistir motor | Serializar motor a disco tras actualizar para arranques siguientes |
| 5.5   | Parches si hace falta | Usar `patch-package` si la librería requiere parches (ej. `node:path` en Electron 12) |

**Entregable:** Opción Adblock en Settings que, tras relaunch, bloquea anuncios en la sesión.

---

### Fase 6: Servicios habilitados y Custom URL (Semana 7)

**Objetivo:** El usuario puede mostrar/ocultar servicios y abrir una URL personalizada.

| Tarea | Descripción | Criterio de aceptación |
|-------|-------------|------------------------|
| 6.1   | Submenú Enabled Services | Checkbox por servicio; actualizar `store.services[].hidden` |
| 6.2   | Custom URL en menú | Diálogo (ej. `electron-prompt` o nativo) para introducir URL; main hace `loadURL(url)` |
| 6.3   | Default Service: Menú / Last opened / servicio | Al arrancar, decidir qué cargar según `options.defaultService` y `lastOpenedPage` o URL del servicio |

**Entregable:** Lista de servicios configurable y apertura de URL arbitraria desde el menú.

---

### Fase 7: Ajustes, pruebas y empaquetado (Semana 8)

**Objetivo:** Estable y empaquetado listo para Zorin OS 18 Pro.

| Tarea | Descripción | Criterio de aceptación |
|-------|-------------|------------------------|
| 7.1   | Loader en UI | Al cambiar de servicio (desde menú o cuadrícula), mostrar animación de carga (ripple + logo) hasta que la página cargue |
| 7.2   | Reset settings | Opción en Settings que borra store y caché de adblock y hace relaunch |
| 7.3   | Pruebas en Zorin OS 18 Pro | Probar: abrir servicios (Netflix, YouTube, Twitch), DRM, permisos, frameless, adblock, guardado de ventana |
| 7.4   | Build y artefactos | `npm run build` genera AppImage y/o .deb; instalar y ejecutar en Zorin |
| 7.5   | README y versión | README con requisitos, instalación y uso; versión en package.json y en menú Acerca de |

**Entregable:** Build instalable y documentación mínima para uso en Zorin OS 18 Pro.

---

## 5. Dependencias clave (previstas)

| Paquete | Uso |
|---------|-----|
| `electron` | Runtime (sustituir por build CastLabs para Widevine) |
| `electron-store` | Persistencia de configuración y servicios |
| `electron-builder` | Empaquetado AppImage / deb |
| `typescript` | Tipado en main (y opcionalmente en renderer) |
| `@cliqz/adblocker-electron` | Bloqueo de anuncios (Fase 5) |
| `electron-prompt` o similar | Diálogo Custom URL |
| `patch-package` | Parches a dependencias si es necesario |

---

## 6. Criterios de calidad

- **Funcional:** Cumplir flujos de la especificación de referencia (menú, servicios, ventana, permisos, relaunch, adblock).
- **Plataforma:** Desarrollado y probado en Zorin OS 18 Pro; build Linux (AppImage/deb).
- **Seguridad:** Preload expone solo lo necesario; `services` solo en `file://`; permisos restringidos por origen.
- **Mantenibilidad:** Código en TypeScript en main; estructura de carpetas clara y documentada.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Incompatibilidad CastLabs Electron con Zorin 18 | Probar versión concreta de CastLabs en Zorin desde Fase 0; documentar versión exacta |
| Adblocker desactualizado con Electron 12+ | Usar parches con `patch-package`; valorar alternativas si es inviable |
| Widevine no funciona en algún caso | Documentar requisitos (codecs/libs) y probar Netflix en el build final |

---

## 8. Próximos pasos inmediatos

1. Crear repositorio/estructura en `CatripPlayer` según la sección 3.
2. Ejecutar **Fase 0** (entorno, Electron + TypeScript, ventana mínima, build Linux).
3. Validar en Zorin OS 18 Pro que la ventana abre y que el build (AppImage o .deb) se ejecuta.
4. Continuar con **Fase 1** (servicios, menú local, IPC `open-url`).

---

*Documento de plan de desarrollo para CatripPlayer. Versión 1.0.*
