# CatripPlayer

Cliente unificado de streaming para escritorio. Una sola ventana para Netflix, YouTube, Twitch, Amazon Prime Video, HBO Max, Apple TV, Crunchyroll, Disney+ y más. Desarrollado con **Electron** y **TypeScript** (Linux, Windows y macOS).

![Versión](https://img.shields.io/badge/versi%C3%B3n-1.1.1-blue) ![Licencia](https://img.shields.io/badge/licencia-GPL--3.0-blue)

---

## Descripción

CatripPlayer es una aplicación de escritorio que centraliza el acceso a plataformas de vídeo en streaming en un único **Chromium embebido**. Incluye:

- **Menú de servicios** con cuadrícula visual (Evolución Aura: mesh gradient, iluminación ambiental, paralaje y animaciones).
- **Ventana única** que carga la web del servicio elegido (Netflix, YouTube, etc.) con soporte **Widevine (DRM)** en Linux.
- **Internacionalización (i18n):** español, inglés, francés, portugués, alemán y chino. El idioma se elige en **Preferencias → Idioma** y se aplica al menú, pantalla de servicios, diálogos y isla flotante.
- **Opciones de ventana:** siempre encima, sin marco (Isla Flotante), pantalla completa, recordar posición y tamaño.
- **Bloqueo de anuncios** opcional (Ghostery).
- **Persistencia** de preferencias y último servicio usado (electron-store).
- **URL personalizada** mediante un diálogo con el mismo estilo visual de la aplicación (no ventana nativa del sistema).
- **Editar configuración:** Preferencias → Editar configuración… abre el `config.json` de la app en el editor del sistema.

---

## Requisitos

- **Node.js** 18 o superior
- **npm** (o yarn / pnpm)

---

## Instalación

```bash
git clone https://github.com/alktrip/catrip-player.git
cd catrip-player
npm install
```

> La aplicación usa **Electron de CastLabs** (Widevine) desde GitHub. Si `npm install` falla, comprueba que tengas acceso a `github.com/castlabs/electron-releases`.

---

## Desarrollo

```bash
npm start
```

Se compila TypeScript, se abre la ventana y se muestra el menú de servicios. Desde la cuadrícula o el menú **Navegación** puedes abrir cualquier plataforma; **URL personalizada** (Ctrl+O) abre un diálogo con el estilo de la app. En **Preferencias** se configuran idioma, ventana, anuncios, servicios visibles, servicio al iniciar y opción para editar el archivo de configuración.

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
- **macOS:** desde **Linux** o **Windows** se genera un **.zip** con la app (`release/CatripPlayer-x.x.x-mac.zip`); el usuario descomprime y arrastra la app a Aplicaciones. Para obtener un instalador **DMG** hay que ejecutar el build en **macOS** y descomentar la línea `dmg` en `build/electron-builder.yml`. Icono: `build/icon.png` (512×512 px).

Los iconos están en **`build/`**: **`icon.png`** para Linux y macOS y **`icon.ico`** para Windows.

---

## Uso

| Acción | Cómo |
|--------|------|
| **Abrir un servicio** | Clic en la tarjeta del menú o en **Navegación** → nombre del servicio. |
| **Volver al menú** | **Navegación** → Menú principal (Ctrl+H) o **Reproducción** → Volver al menú. |
| **Abrir una URL cualquiera** | **Navegación** → URL personalizada… (Ctrl+O). Se abre un diálogo con el estilo de la app. |
| **Cambiar idioma** | **Preferencias** → Idioma → elegir idioma (ES, EN, FR, PT, DE, ZH). La ventana se recarga para aplicar. |
| **Ventana siempre encima** | **Preferencias** → Ventana → Siempre encima. |
| **Ventana sin marco (Isla Flotante)** | **Preferencias** → Ventana → Ventana sin marco. La barra superior se convierte en una píldora centrada que se expande al pasar el ratón. |
| **Bloquear anuncios** | **Preferencias** → Privacidad → Bloquear anuncios (requiere reinicio). |
| **Mostrar u ocultar servicios** | **Preferencias** → Servicios → Servicios visibles → marcar o desmarcar cada uno. |
| **Servicio al iniciar** | **Preferencias** → Servicios → Servicio al iniciar (Menú principal, Última página abierta o un servicio concreto). |
| **Editar configuración a mano** | **Preferencias** → Editar configuración… (abre `config.json` en el editor del sistema). |
| **Restablecer todo** | **Preferencias** → Restablecer preferencias. |
| **Versión** | **Ayuda** → Acerca de CatripPlayer. |

---

## Servicios incluidos

Por defecto están disponibles: **Netflix**, **YouTube**, **Twitch**, **Amazon Prime Video**, **HBO Max**, **Apple TV**, **Crunchyroll**, **Disney+**, **Floatplane**, etc. La visibilidad de cada uno se controla en **Preferencias → Servicios → Servicios visibles**.

---

## Estructura del proyecto

```
CatripPlayer/
├── src/
│   ├── main.ts              # Proceso principal Electron
│   ├── menu.ts              # Menú nativo (CatripPlayer, Navegación, Reproducción, Preferencias, Ayuda)
│   ├── i18n.ts              # Internacionalización (locale, t, getUIStrings)
│   ├── default-services.ts  # Lista de servicios por defecto
│   ├── preload.ts           # Preload (expone IPC al renderer)
│   ├── client-header.js     # Barra inyectada en modo sin marco (Isla Flotante)
│   ├── bootstrap.js         # Punto de entrada (Widevine, etc.)
│   ├── locales/             # Traducciones (es, en, fr, pt, de, zh)
│   │   ├── es.json
│   │   ├── en.json
│   │   └── ...
│   └── ui/
│       ├── index.html       # Menú principal (selector de servicios)
│       ├── index.css        # Estilos (Evolución Aura, mesh gradient, tarjetas)
│       ├── index.js         # Lógica del menú (paralaje, morphing, loader, cadenas i18n)
│       ├── url-dialog.html  # Diálogo URL personalizada (estilo de la app)
│       ├── url-dialog.css
│       ├── url-dialog.js
│       ├── logo.png
│       └── services/        # Iconos por servicio (SVG)
├── build/
│   ├── electron-builder.yml # Configuración de empaquetado (Linux, Windows, macOS)
│   ├── icon.png
│   └── icon.ico
├── docs/                    # Plan de desarrollo, internacionalización, menús, etc.
├── LICENSE                  # GNU GPL v3.0
├── package.json
├── tsconfig.json
└── README.md
```

---

## Stack técnico

| Componente   | Tecnología |
|-------------|------------|
| Runtime     | Node.js (Electron) |
| Lenguaje    | TypeScript (main), HTML/CSS/JS (UI) |
| UI          | `src/ui/` (menú, diálogo URL, estilos Aura) |
| i18n        | JSON en `src/locales/` (es, en, fr, pt, de, zh), módulo `src/i18n.ts` |
| Persistencia| electron-store (`config.json` en userData) |
| DRM         | Electron CastLabs (Widevine), `v38.7.2+wvcus` |
| Empaquetado | electron-builder (Linux: AppImage, deb; Windows: NSIS; macOS: zip/dmg) |

---

## Licencia

GNU General Public License v3.0 (GPL-3.0). Ver [LICENSE](LICENSE) para el texto completo.
