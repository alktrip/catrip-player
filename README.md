# CatripPlayer

Cliente unificado de streaming para escritorio. Una sola ventana para Netflix, YouTube, Twitch, Amazon Prime Video, HBO Max, Apple TV, Crunchyroll y más. Desarrollado con **Electron** y **TypeScript** (Linux y Windows).

![Versión](https://img.shields.io/badge/versi%C3%B3n-1.0.0-blue)

---

## Descripción

CatripPlayer es una aplicación de escritorio que centraliza el acceso a plataformas de vídeo en streaming en un único **Chromium embebido**. Incluye:

- **Menú de servicios** con cuadrícula visual (Evolución Aura: mesh gradient, iluminación ambiental, paralaje y animaciones).
- **Ventana única** que carga la web del servicio elegido (Netflix, YouTube, etc.) con soporte **Widevine (DRM)** en Linux.
- **Opciones de ventana:** siempre encima, sin marco (Isla Flotante), pantalla completa, recordar posición y tamaño.
- **Bloqueo de anuncios** opcional (Ghostery).
- **Persistencia** de preferencias y último servicio usado (electron-store).

---

## Requisitos

- **Node.js** 18 o superior
- **npm** (o yarn / pnpm)

---

## Instalación

```bash
git clone https://github.com/catrip/catripplayer.git
cd catripplayer
npm install
```

> La aplicación usa **Electron de CastLabs** (Widevine) desde GitHub. Si `npm install` falla, comprueba que tengas acceso a `github.com/castlabs/electron-releases`.

---

## Desarrollo

```bash
npm start
```

Se compila TypeScript, se abre la ventana y se muestra el menú de servicios. Desde la cuadrícula o el menú **Servicios** puedes abrir cualquier plataforma; **URL personalizada** (Ctrl+O) permite cargar cualquier dirección. En **Ajustes** se configuran ventana, anuncios, servicios visibles y servicio al iniciar.

### Solución de problemas

| Problema | Solución |
|----------|----------|
| `libva error: i965_drv_video.so init failed` | El script ya usa `LIBVA_DRIVER_NAME=iHD`. Si persiste: `sudo apt install intel-media-va-driver-non-free`. |
| "Failed to install Widevine" (404) | La app se abre igual. Para Netflix se requiere Electron CastLabs (incluido). |
| Crash al abrir Netflix | `npm start` ya incluye `--no-sandbox`. Sin GPU: `electron . --no-sandbox --disable-gpu`. |
| "Se requiere actualización" en Netflix | Usar Electron CastLabs v38+ (Chrome 116+). El proyecto usa `v38.7.2+wvcus`. |

---

## Build

```bash
npm run build
```

Se genera la carpeta **`release/`** con:

- **Linux:** AppImage (portable) y .deb. Instalación del .deb: `sudo dpkg -i release/catripplayer_*.deb`. El paquete incluye maintainer y metadatos .desktop correctos. Se generan al ejecutar el build en Linux.
- **Windows:** instalador **NSIS** (.exe): asistente de instalación, elegir carpeta, acceso directo en escritorio y menú Inicio (x64). Para generarlo: `npm run build` en **Windows** o `npx electron-builder -c build/electron-builder.yml --win -p never` en Linux (cross-compile). Icono: `build/icon.ico`.
- **macOS:** desde **Linux** o **Windows** se genera un **.zip** con la app (`release/CatripPlayer-x.x.x-mac.zip`); el usuario descomprime y arrastra la app a Aplicaciones. Para obtener un instalador **DMG** hay que ejecutar el build en **macOS** y descomentar la línea `dmg` en `build/electron-builder.yml` (el formato DMG requiere el módulo `dmg-license`, que solo está disponible en macOS). Icono: `build/icon.png` (512×512 px).

Los iconos están en **`build/`**: **`icon.png`** para Linux y macOS (256×256 o 512×512 px) y **`icon.ico`** para Windows (puedes copiar `docs/CatripPlayer.ico` como `build/icon.ico`).

---

## Uso

| Acción | Cómo |
|--------|------|
| **Abrir un servicio** | Clic en la tarjeta del menú o en **Servicios** → nombre del servicio. |
| **Volver al menú** | **Servicios** → Menú (Ctrl+H). |
| **Abrir una URL cualquiera** | **Servicios** → URL personalizada… (Ctrl+O). |
| **Ventana siempre encima** | **Ajustes** → Siempre encima. |
| **Ventana sin marco (Isla Flotante)** | **Ajustes** → Ventana sin marco. La barra superior se convierte en una píldora centrada que se expande al pasar el ratón. |
| **Bloquear anuncios** | **Ajustes** → Bloquear anuncios (requiere reinicio de ventana). |
| **Mostrar u ocultar servicios** | **Ajustes** → Servicios visibles → marcar o desmarcar cada uno. |
| **Servicio al iniciar** | **Ajustes** → Servicio al iniciar (Menú principal, Última página abierta o un servicio concreto). |
| **Restablecer todo** | **Ajustes** → Restablecer ajustes. |
| **Versión** | **Ayuda** → Acerca de CatripPlayer. |

---

## Servicios incluidos

Por defecto están visibles: **Netflix**, **YouTube**, **Twitch**, **Amazon Prime Video**, **HBO Max**, **Apple TV**, **Crunchyroll**. Otros (YouTube TV, Floatplane, Disney+) pueden estar ocultos y activarse en **Ajustes → Servicios visibles**.

---

## Estructura del proyecto

```
CatripPlayer/
├── src/
│   ├── main.ts              # Proceso principal Electron
│   ├── menu.ts              # Menú nativo (Servicios, Ajustes, Developer, Ayuda)
│   ├── default-services.ts # Lista de servicios por defecto
│   ├── preload.ts           # Preload (expone IPC al renderer)
│   ├── client-header.js     # Barra inyectada en modo sin marco (Isla Flotante)
│   ├── bootstrap.js         # Punto de entrada (Widevine, etc.)
│   └── ui/
│       ├── index.html       # Menú principal (selector de servicios)
│       ├── index.css        # Estilos (Evolución Aura, mesh gradient, tarjetas)
│       ├── index.js         # Lógica del menú (paralaje, morphing, loader)
│       ├── logo.png         # Logo de la aplicación
│       └── services/       # Iconos por servicio (SVG)
├── build/
│   ├── electron-builder.yml # Configuración de empaquetado (Linux, Windows, macOS)
│   ├── icon.png             # Icono Linux
│   └── icon.ico             # Icono Windows (instalador NSIS)
├── docs/                    # Plan de desarrollo, descripción visual, etc.
├── package.json
├── tsconfig.json
└── README.md
```

---

## Stack técnico

| Componente   | Tecnología |
|-------------|------------|
| Runtime     | Node.js (Electron) |
| Lenguaje    | TypeScript (main) |
| UI          | HTML/CSS/JS en `src/ui/` |
| Persistencia| electron-store |
| DRM         | Electron CastLabs (Widevine), `v38.7.2+wvcus` |
| Empaquetado | electron-builder (Linux: AppImage, deb; Windows: NSIS; macOS: DMG) |

---

## Licencia

MIT.
