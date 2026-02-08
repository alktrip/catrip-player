/**
 * Entrada real de Electron. Fija LIBVA_DRIVER_NAME antes de cargar el proceso principal
 * para evitar el error "i965_drv_video.so init failed" en Intel Iris Xe / Tiger Lake.
 * Ver docs/electron-vaapi-fix.md (o electron-vaapi-fix.md en Escritorio).
 */
process.env.LIBVA_DRIVER_NAME = 'iHD';

require('./main.js');
