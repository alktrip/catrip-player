# Plan de Mejora Visual --- CatripPlayer

Versión 1.0

------------------------------------------------------------------------

## 1. Objetivo

Elevar la madurez visual, coherencia estética y percepción profesional
de CatripPlayer sin alterar su arquitectura base.\
El enfoque prioriza sobriedad, consistencia y mejora progresiva.

------------------------------------------------------------------------

## 2. Sistema de Diseño Unificado

### 2.1 Escala tipográfica

-   Título principal: 1.4rem / 600
-   Subtítulo: 1.1rem / 500
-   Texto base: 0.95rem
-   Texto secundario: 0.85rem / 400

### 2.2 Color acento global

Definir un color de identidad propio de la aplicación (independiente de
los servicios):

Opciones sugeridas: - Azul profundo (#2563eb) - Gris acero (#3a3a3a con
matiz frío)

Los colores de servicios permanecen como identidad contextual.

------------------------------------------------------------------------

## 3. Mejoras del Menú Principal

### 3.1 Encabezado estructural

Agregar encima de la cuadrícula:

-   Logo pequeño de CatripPlayer
-   Título: "Selecciona un servicio"
-   Subtítulo: "Accede rápidamente a tus plataformas favoritas"

Beneficio: mayor claridad y sensación de producto terminado.

------------------------------------------------------------------------

### 3.2 Refinamiento de tarjetas

Estado normal: - Fondo: rgba(255,255,255,0.04) - Borde: 1px solid
rgba(255,255,255,0.05) - Sombra: 0 4px 14px rgba(0,0,0,0.4)

Estado hover: - Elevación (translateY -4px) - Incremento de sombra -
Brillo inferior sutil en color del servicio

Beneficio: profundidad visual y mayor calidad percibida.

------------------------------------------------------------------------

### 3.3 Indicador de último servicio

Opciones: - Barra inferior en color del servicio - Badge discreto
"Último"

Beneficio: continuidad de uso.

------------------------------------------------------------------------

## 4. Optimización del Loader

### 4.1 Ajuste de animación

-   Duración ripple: \~1.1s
-   Transición más progresiva
-   Blur de fondo opcional: backdrop-filter: blur(6px);

### 4.2 Transiciones suaves

-   Fade-out del menú (150ms)
-   Fade-in del overlay

Beneficio: percepción más pulida.

------------------------------------------------------------------------

## 5. Modo Ventana sin Marco

### 5.1 Rediseño barra superior

-   Altura: 28--32px
-   Fondo negro 85% opacidad
-   Nombre del servicio centrado
-   Botones integrados

### 5.2 Mejora botón de salida

-   Área clic mayor
-   Hover con fondo rojo tenue
-   Animación ligera

Beneficio: mejor ergonomía y apariencia profesional.

------------------------------------------------------------------------

## 6. Diálogos

Migrar progresivamente a diálogos HTML propios para:

-   URL personalizada
-   Confirmaciones internas
-   Información contextual

Mantener diálogos nativos solo cuando sea estratégico.

------------------------------------------------------------------------

## 7. Estados de Sistema

### 7.1 Indicador textual en loader

Ejemplo: - "Conectando con Netflix..." - "Cargando contenido..."

### 7.2 Pantalla sin conexión

-   Icono simple
-   Mensaje claro
-   Botón "Reintentar"

------------------------------------------------------------------------

## 8. Accesibilidad

-   Cumplimiento contraste WCAG AA
-   Foco visible en navegación por teclado
-   Escalado de UI configurable

------------------------------------------------------------------------

## 9. Evolución a Mediano Plazo

### 9.1 Sidebar opcional colapsable

-   Iconos de servicios
-   Área principal para contenido web

### 9.2 Sistema de temas

-   Tema claro opcional
-   Cambio sin relaunch

------------------------------------------------------------------------

## 10. Priorización

Alta prioridad: - Refinamiento tarjetas - Transiciones suaves - Rediseño
barra sin marco - Encabezado menú principal

Media prioridad: - Diálogos propios - Indicador textual en loader -
Estado offline

Evolutivo: - Sidebar - Sistema de temas - Escalado UI

------------------------------------------------------------------------

## 11. Conclusión

La base funcional es sólida.\
Las mejoras propuestas apuntan a coherencia, sobriedad y madurez visual
sin alterar la arquitectura actual.

El objetivo estratégico es consolidar a CatripPlayer como un cliente de
escritorio consistente, estable y visualmente profesional.
