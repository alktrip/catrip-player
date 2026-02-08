# CatripPlayer — Propuesta de Nueva Organización de Menús

Este documento describe una reorganización conceptual y funcional de los menús de **CatripPlayer**, con el objetivo de mejorar la claridad, reducir la carga cognitiva del usuario y preparar la aplicación para futuras extensiones sin comprometer estabilidad ni rendimiento.

La propuesta mantiene intacta la arquitectura técnica actual (Electron, IPC, `electron-store`) y se centra únicamente en **jerarquía, semántica y experiencia de uso**.

---

## Principios de diseño

La nueva organización se basa en los siguientes principios:

- **Una intención por menú**: cada menú responde a una sola pregunta mental.
- **Separación clara entre navegación y configuración**.
- **Preferencia por convenciones de aplicaciones de escritorio maduras**.
- **Compatibilidad con crecimiento futuro** (nuevas funciones, perfiles, modos).

---

## Estructura general propuesta

La barra de menús queda organizada de la siguiente forma:

- **CatripPlayer**
- **Navegación**
- **Reproducción**
- **Preferencias**
- **Developer**
- **Ayuda**

---

## 1. Menú CatripPlayer

**Propósito:** identidad de la aplicación y control de ciclo de vida.

```
CatripPlayer
├─ Acerca de CatripPlayer
├─ Versión x.x.x
├─ ─────────────
└─ Salir              Ctrl+Q
```

Este menú no contiene acciones operativas ni configuraciones.

---

## 2. Menú Navegación

**Propósito:** cambiar de vista o destino dentro de la aplicación.

```
Navegación
├─ Menú principal        Ctrl+H
├─ URL personalizada…    Ctrl+O
├─ ─────────────
├─ Netflix
├─ YouTube
├─ Twitch
└─ … (servicios visibles)
```

Notas:
- Sustituye al antiguo menú **Servicios**.
- Contiene únicamente acciones de navegación.
- La lista de servicios es dinámica y respeta la visibilidad configurada.

---

## 3. Menú Reproducción

**Propósito:** controlar el comportamiento inmediato de la ventana y del contenido.

```
Reproducción
├─ Volver al menú        Ctrl+H
├─ Recargar servicio
├─ ─────────────
├─ Siempre encima        ✔
└─ Pantalla completa
```

Notas:
- Separa los **modos operativos** de las preferencias persistentes.
- Puede ampliarse en el futuro (audio, calidad, etc.).
- Refuerza la sensación de control contextual.

---

## 4. Menú Preferencias

**Propósito:** configuración persistente de la aplicación.

```
Preferencias
├─ Ventana
│  ├─ Recordar posición y tamaño
│  ├─ Iniciar en pantalla completa
│  └─ Ventana sin marco        (requiere reinicio)
│
├─ Servicios
│  ├─ Servicios visibles
│  │  ├─ Netflix        ✔
│  │  ├─ YouTube        ✔
│  │  └─ …
│  │
│  └─ Servicio al iniciar
│     ├─ Menú principal
│     ├─ Última página abierta
│     └─ Servicio específico
│
├─ Privacidad
│  └─ Bloquear anuncios        (requiere reinicio)
│
├─ ─────────────
├─ Restablecer preferencias
└─ Editar configuración…
```

Notas:
- Agrupa opciones por dominio funcional.
- Las opciones que requieren reinicio quedan claramente identificadas.
- Todo lo aquí presente se guarda en `electron-store`.

---

## 5. Menú Developer

**Propósito:** herramientas técnicas para desarrollo y depuración.

```
Developer
├─ Recargar ventana        Ctrl+R
├─ Abrir DevTools          Ctrl+Shift+I
└─ (futuro) Estado IPC
```

Recomendación:
- Mantener visible solo en builds de desarrollo o bajo flag.

---

## 6. Menú Ayuda

**Propósito:** información y soporte.

```
Ayuda
└─ Acerca de CatripPlayer
```

---

## Ajuste recomendado: Isla Flotante

En modo **Ventana sin marco**, se recomienda:

- Mantener el botón ×.
- Tooltip explícito: **“Volver al menú”**.
- Evitar ambigüedad entre cerrar servicio y cerrar aplicación.

---

## Beneficios de la reorganización

- Menor confusión entre navegación y ajustes.
- Menús más cortos y semánticos.
- Mejor alineación con aplicaciones de escritorio consolidadas.
- Base sólida para futuras extensiones sin refactor estructural.

---

## Conclusión

Esta reorganización no introduce nuevas funcionalidades ni modifica flujos técnicos existentes. Su valor reside en aportar **orden, claridad y escalabilidad**, asegurando que CatripPlayer pueda evolucionar sin perder coherencia ni sobriedad.

Se recomienda implementar el cambio de forma incremental y validar la experiencia en entornos Linux con distintos gestores de ventanas.
