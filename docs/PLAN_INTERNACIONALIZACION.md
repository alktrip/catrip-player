# Plan de internacionalización (i18n) — CatripPlayer

Objetivo: ofrecer la aplicación en **español**, **inglés**, **francés**, **portugués**, **alemán** y **chino** (simplificado), con posibilidad de elegir idioma en Preferencias y de detectar el idioma del sistema.

---

## 1. Idiomas soportados

| Código | Idioma           | Archivo   |
|--------|------------------|-----------|
| es     | Español          | es.json   |
| en     | English          | en.json   |
| fr     | Français         | fr.json   |
| pt     | Português        | pt.json   |
| de     | Deutsch          | de.json   |
| zh     | 简体中文 (chino)  | zh.json   |

**Idioma por defecto:** español (`es`). Fallback si falta una clave: español.

---

## 2. Ubicación de cadenas en la aplicación

| Origen              | Ubicación                    | Uso |
|---------------------|------------------------------|-----|
| Menú nativo         | `src/menu.ts`                | Etiquetas de menú (CatripPlayer, Navegación, Preferencias, etc.), diálogo Acerca de, prompt URL. |
| Ventana principal   | `src/ui/index.html`          | Título de página, encabezado (“Selecciona un servicio”), subtítulo, estado vacío. |
| Lógica del menú UI  | `src/ui/index.js`            | “Conectando con …”, badge “Último”, versión. |
| Overlay de carga    | `src/main.ts`                | Texto del overlay “Conectando con …” inyectado en páginas remotas. |
| Isla flotante       | `src/client-header.js`      | Tooltip/aria-label “Volver al menú” (inyectado desde main). |

Los **nombres de servicios** (Netflix, YouTube, etc.) se mantienen como marcas; opcionalmente se pueden añadir claves por servicio si se desea traducir en algún idioma.

---

## 3. Estructura de claves de traducción

Archivos JSON en **`src/locales/`** con claves planas. Namespaces conceptuales:

- **menu.*** — Menú de aplicación (CatripPlayer, Navegación, Reproducción, Preferencias, Ayuda).
- **about.*** — Diálogo “Acerca de”.
- **prompt.*** — Diálogo “URL personalizada”.
- **ui.*** — Pantalla principal (selector de servicios, estado vacío, loader).
- **island.*** — Isla flotante (modo sin marco).

Ejemplo de estructura en cada locale:

```json
{
  "menu.appName": "CatripPlayer",
  "menu.version": "Versión",
  "menu.quit": "Salir",
  "menu.nav.mainMenu": "Menú principal",
  "menu.nav.customUrl": "URL personalizada…",
  "ui.selectService": "Selecciona un servicio",
  "ui.connecting": "Conectando con {name}…",
  ...
}
```

Sustitución de parámetros: `{name}`, `{version}` donde haga falta (p. ej. en el loader y en Acerca de).

---

## 4. Persistencia y detección de idioma

- **Clave en electron-store:** `options.locale` (valor: `es`, `en`, `fr`, `pt`, `de`, `zh`).
- **Valor por defecto:** idioma del sistema si está soportado; si no, `es`.
  - En Electron: `app.getLocale()` (p. ej. `es`, `en-US`, `fr-FR`). Mapear a uno de nuestros códigos (es, en, fr, pt, de, zh); para `zh-TW`/`zh-CN` usar `zh`.
- **Selector de idioma en la aplicación:** el usuario elige el idioma desde el menú **Preferencias** → submenú **Idioma**. Dentro de “Idioma” se muestra una lista de opciones (una por idioma soportado), por ejemplo:
  - **Español**
  - **English**
  - **Français**
  - **Português**
  - **Deutsch**
  - **简体中文** (o “Chino”)
  Se implementa como opciones de **radio**: al elegir una, se guarda `options.locale` con el código correspondiente (`es`, `en`, `fr`, `pt`, `de`, `zh`) y se reconstruye el menú y, si hace falta, se recarga la ventana para que toda la interfaz (menú, pantalla de servicios, diálogos, isla flotante) use el nuevo idioma de inmediato.

---

## 4.1 Dónde se elige el idioma (resumen)

| Menú       | Submenú  | Contenido                                                                 |
|------------|----------|----------------------------------------------------------------------------|
| Preferencias | **Idioma** | Lista de idiomas (Español, English, Français, Português, Deutsch, 中文). El usuario elige uno; se guarda y se aplica al instante. |

---

## 5. Implementación técnica

### 5.1 Proceso principal (main)

- **Módulo de i18n:** `src/i18n.ts` (o `src/locales/index.ts`).
  - Carga el JSON del locale activo desde `src/locales/{locale}.json`.
  - Exporta `getLocale(): string`, `setLocale(locale: string)`, `t(key: string, params?: Record<string, string>): string`.
  - Si falta una clave, devolver la clave o el valor en español.
- **menu.ts:** en lugar de cadenas fijas, usar `t('menu.quit')`, etc. Recibir la función `t` o el módulo i18n inyectado desde main.
- **main.ts:** al crear la ventana, leer `options.locale` (o detectar) y cargar ese locale. Al inyectar el overlay de carga y el client-header, usar `t('ui.connecting', { name: ... })` y `t('island.backToMenu')` para generar el script inyectado con el texto ya traducido.

### 5.2 Renderer (pantalla de servicios)

- **Carga de traducciones:** al abrir la pantalla principal (`index.html`), el proceso principal puede enviar por IPC (p. ej. en `set-services`) un objeto con las cadenas necesarias para la UI (`ui.selectService`, `ui.subtitle`, `ui.emptyTitle`, `ui.emptyHint`, `ui.connecting`, `ui.lastUsed`, etc.), o el renderer puede cargar `src/locales/{locale}.json` vía `fetch` (ruta `file://` o expuesta por preload).
- **index.html:** los textos estáticos (h1, p, empty-state) se rellenan por JS al cargar, usando las cadenas recibidas o cargadas, en lugar de tener el texto fijo en HTML. Así se evita duplicar y se mantiene un solo origen.
- **index.js:** usar la clave tipo “Conectando con {name}…” con sustitución de `{name}` por el nombre del servicio.

### 5.3 Isla flotante

- El script `client-header.js` se inyecta desde main. Main puede generar un fragmento de script que defina el texto del botón “Volver al menú” usando `t('island.backToMenu')` antes de inyectar el resto del client-header, de modo que la isla use ya el texto traducido.

### 5.4 Empaquetado

- Incluir la carpeta **`src/locales/`** en los archivos que electron-builder empaqueta (en `files` o asegurando que `src` está incluido). Así los JSON estarán disponibles en la app empaquetada.

---

## 6. Fases recomendadas

| Fase | Tarea |
|------|--------|
| **Fase 1** | Crear `src/locales/` con los 6 JSON (es, en, fr, pt, de, zh) y definir todas las claves en español como referencia. |
| **Fase 2** | Implementar módulo `src/i18n.ts`: carga de JSON, `getLocale`/`setLocale`, `t(key, params)`, fallback a `es`. Integrar lectura de `options.locale` y detección desde `app.getLocale()`. |
| **Fase 3** | Refactorizar `menu.ts`: sustituir todas las cadenas por llamadas a `t(...)`. Añadir en **Preferencias** el submenú **Idioma** con opciones de radio (Español, English, Français, Português, Deutsch, 简体中文); al elegir uno, guardar `options.locale` y reconstruir el menú (y recargar ventana si hace falta) para aplicar el idioma. |
| **Fase 4** | Refactorizar `main.ts`: overlay de carga y cualquier otro texto inyectado que use `t()`. Pasar al renderer (vía `set-services` o mensaje dedicado) el locale y las cadenas de la UI, o la ruta al JSON. |
| **Fase 5** | Refactorizar `src/ui/index.html` e `index.js`: rellenar encabezado, estado vacío y loader con cadenas traducidas; usar plantilla “Conectando con {name}…” con sustitución. |
| **Fase 6** | Ajustar inyección del client-header para que el tooltip “Volver al menú” use `t('island.backToMenu')`. |
| **Fase 7** | Revisar diálogo “Acerca de” y prompt “URL personalizada” para usar `t('about.*')` y `t('prompt.*')`. |
| **Fase 8** | Completar y revisar las traducciones en en, fr, pt, de, zh (y corregir es si hace falta). Pruebas por idioma. |

---

## 7. Archivos de traducción

Los archivos ya generados en **`src/locales/`** son:

- **es.json** — Español (base).
- **en.json** — Inglés.
- **fr.json** — Francés.
- **pt.json** — Portugués.
- **de.json** — Alemán.
- **zh.json** — Chino simplificado.

Contienen las claves necesarias para menú, Acerca de, prompt URL, UI principal, loader e isla flotante. El siguiente paso es implementar el módulo i18n y conectar estos JSON en main, menu y renderer según las fases anteriores.

---

## 8. Resumen

- **Idiomas:** es, en, fr, pt, de, zh.
- **Dónde se usa el texto:** menú nativo, pantalla de servicios, overlay de carga, isla flotante, diálogos Acerca de y URL.
- **Dónde se guarda el idioma:** `options.locale` en electron-store; valor por defecto según sistema.
- **Dónde elegir idioma:** **Preferencias** → submenú **Idioma** → el usuario elige uno de los 6 idiomas (Español, English, Français, Português, Deutsch, 简体中文); se guarda y se aplica en toda la app.
- **Estructura:** JSON por locale en `src/locales/`, claves planas con namespaces (menu.*, ui.*, about.*, prompt.*, island.*), función `t(key, params)` en main y cadenas enviadas o cargadas en renderer.

Este plan permite internacionalizar CatripPlayer de forma incremental y mantener las traducciones en un solo lugar.
