# Fix: libva Error in Electron (Intel Iris Xe / Tiger Lake)

## The Problem
```
libva error: /usr/lib/x86_64-linux-gnu/dri/i965_drv_video.so init failed
```

This error occurs because Electron tries to use the wrong VA-API driver (`i965`) for modern Intel GPUs (Gen8+).

## How CatripPlayer Fixes It

- **With `npm start`:** The script in `package.json` exports `LIBVA_DRIVER_NAME=iHD` before launching Electron, so the binary receives the variable at startup (libva loads before our JS runs).
- **Bootstrap:** `dist/bootstrap.js` remains the entry point so that, in the future, the AppImage can use a wrapper that exports the variable; in development, what actually avoids the error is the `start` script.

## Other Options (if needed)

### 1. Install the correct driver (recommended on the system)
```bash
sudo apt install intel-media-va-driver-non-free
```

### 2. Set the environment variable manually
```bash
LIBVA_DRIVER_NAME=iHD npm start
# or for the AppImage:
LIBVA_DRIVER_NAME=iHD ./CatripPlayer-*.AppImage
```

### 3. Verify that VA-API is using iHD
```bash
LIBVA_DRIVER_NAME=iHD LIBVA_MESSAGING_LEVEL=1 npm start
```
You should see something like:
```
libva info: Trying to open .../iHD_drv_video.so
libva info: va_openDriver() returns 0
```

## Intel Driver Reference

| GPU | Driver | Package |
|-----|--------|---------|
| Gen 5–9 (Ironlake – Coffee Lake) | i965 | `i965-va-driver` |
| Gen 8+ (Broadwell – Tiger Lake+) | iHD | `intel-media-va-driver` |

**Iris Xe (Tiger Lake)** GPU → **iHD** driver.
