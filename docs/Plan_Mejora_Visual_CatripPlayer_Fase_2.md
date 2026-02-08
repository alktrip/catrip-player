# Plan de Mejora Visual --- CatripPlayer

## Fase 2: Evolución y Refinamiento

Versión 2.0

------------------------------------------------------------------------

## 1. Objetivo

Elevar la percepción de madurez, profundidad visual y cohesión estética
de CatripPlayer sin modificar su arquitectura base ni comprometer
estabilidad.

Esta fase se enfoca en refinamiento, microinteracciones y consolidación
de identidad.

------------------------------------------------------------------------

## 2. Profundidad y Atmósfera Visual

### 2.1 Fondo con gradiente sutil

Reemplazar el fondo sólido por un gradiente muy discreto:

    background: radial-gradient(
      circle at top center,
      #1f1f1f 0%,
      #1a1a1a 60%
    );

Beneficio: - Reduce sensación de superficie plana. - Añade profundidad
sin distraer.

------------------------------------------------------------------------

## 3. Sistema Formal de Estados

Definir estados visuales consistentes:

-   Normal
-   Cargando
-   Error
-   Sin conexión
-   Estado vacío (sin servicios visibles)

Cada estado debe incluir: - Iconografía coherente - Título claro -
Descripción breve - Acción principal visible

------------------------------------------------------------------------

## 4. Microinteracciones Refinadas

### 4.1 Curvas de animación

Estandarizar animaciones con:

    cubic-bezier(0.4, 0, 0.2, 1)

Aplicar en: - Hover tarjetas - Fade in/out - Elevaciones

------------------------------------------------------------------------

### 4.2 Animación de entrada del menú

Al cargar el menú principal:

-   Fade-in (120 ms)
-   Entrada vertical leve (translateY 8px → 0)

------------------------------------------------------------------------

## 5. Refinamiento de la Cuadrícula

### 5.1 Ajuste de densidad

-   Aumentar ancho mínimo de tarjeta a 160px.
-   Evitar compresión excesiva en resoluciones intermedias.

### 5.2 Alineación óptica de logos

-   Permitir ajustes visuales por servicio.
-   Normalizar proporciones internas cuando sea necesario.

------------------------------------------------------------------------

## 6. Refinamiento del Badge "Último"

-   Tamaño de texto: 0.65rem
-   Fondo con blur ligero
-   Animación leve de aparición
-   Espaciado compacto

Debe ser visible pero no dominante.

------------------------------------------------------------------------

## 7. Barra sin Marco --- Evolución

### 7.1 Separador inferior sutil

    border-bottom: 1px solid rgba(255,255,255,0.05);

### 7.2 Indicador contextual mínimo

-   Punto de 6px en color del servicio junto al nombre centrado.

------------------------------------------------------------------------

## 8. Transición Entre Servicios

Implementar transición cruzada (crossfade):

-   Reducir opacidad del contenido anterior.
-   Fade cruzado 100--150 ms.

Evita sensación de corte abrupto.

------------------------------------------------------------------------

## 9. Refinamiento del Overlay

### 9.1 Profundidad visual

    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5));

Aplicado al logo.

### 9.2 Ajuste ripple

Reducir escala máxima a 1.12 para mayor sobriedad.

------------------------------------------------------------------------

## 10. Sistema de Espaciado Formal

Definir tokens:

    --space-xs: 8px;
    --space-sm: 16px;
    --space-md: 24px;
    --space-lg: 32px;

Aplicar sistemáticamente.

------------------------------------------------------------------------

## 11. Indicador de Foco Refinado

Complementar outline con:

    box-shadow: 0 0 0 3px rgba(37,99,235,0.3);

Mejora accesibilidad y estética.

------------------------------------------------------------------------

## 12. Elementos de Madurez Visual

### 12.1 Versión discreta visible

En esquina inferior izquierda del menú:

-   Texto 0.65rem
-   Opacidad 50%
-   Formato: vX.X

------------------------------------------------------------------------

## 13. Preparación para Escalabilidad

-   Layout adaptable para futura sidebar.
-   Preparación para modo compacto.
-   Ajustes HiDPI avanzados.

------------------------------------------------------------------------

## 14. Priorización

Alta prioridad: - Gradiente sutil de fondo - Curvas de animación
estandarizadas - Crossfade entre servicios - Separador en barra sin
marco

Media prioridad: - Ajustes ópticos de logos - Refinamiento badge -
Sistema formal de spacing

Evolutivo: - Versión visible discreta - Preparación para sidebar -
Optimización HiDPI

------------------------------------------------------------------------

## 15. Conclusión

La base visual es sólida y coherente.\
Esta fase consolida identidad, continuidad y profundidad visual sin
alterar la arquitectura existente.

El objetivo es reforzar percepción de estabilidad, precisión y producto
maduro.
