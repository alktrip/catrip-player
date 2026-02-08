# Solución: Error libva en Electron (Intel Iris Xe / Tiger Lake)

## El Problema
```
libva error: /usr/lib/x86_64-linux-gnu/dri/i965_drv_video.so init failed
```

Este error ocurre porque Electron intenta usar el driver VA-API incorrecto (`i965`) para GPUs Intel modernas (Gen8+).

## Cómo lo resuelve CatripPlayer

- **Con `npm start`:** El script en `package.json` exporta `LIBVA_DRIVER_NAME=iHD` antes de lanzar Electron, así el binario recibe la variable al iniciar (libva se carga antes de ejecutar nuestro JS).
- **Bootstrap:** Se mantiene `dist/bootstrap.js` como entrada para que, en el futuro, el AppImage pueda usar un wrapper que exporte la variable; en desarrollo lo que realmente evita el error es el script `start`.

## Otras opciones (por si acaso)

### 1. Instalar el driver correcto (recomendado en el sistema)
```bash
sudo apt install intel-media-va-driver-non-free
```

### 2. Variable de entorno manual
```bash
LIBVA_DRIVER_NAME=iHD npm start
# o para el AppImage:
LIBVA_DRIVER_NAME=iHD ./CatripPlayer-*.AppImage
```

### 3. Verificar que VA-API usa iHD
```bash
LIBVA_DRIVER_NAME=iHD LIBVA_MESSAGING_LEVEL=1 npm start
```
Deberías ver algo como:
```
libva info: Trying to open .../iHD_drv_video.so
libva info: va_openDriver() returns 0
```

## Referencia de drivers Intel

| GPU | Driver | Paquete |
|-----|--------|---------|
| Gen 5-9 (Ironlake - Coffee Lake) | i965 | `i965-va-driver` |
| Gen 8+ (Broadwell - Tiger Lake+) | iHD | `intel-media-va-driver` |

GPU **Iris Xe (Tiger Lake)** → driver **iHD**.
