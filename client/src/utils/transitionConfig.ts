/**
 * Duración y easing unificados (toasts, diálogos, paneles, navegación, hovers vía Tailwind `duration-ui`).
 * Valor en segundos: 0.62 — alineado con la animación de salida de notificaciones.
 */
export const UI_MOTION_DURATION_S = 0.62;

/** Misma curva que los toasts (cubic-bezier en Framer = tupla) */
export const UI_MOTION_EASE = [0.22, 0.61, 0.36, 1] as const;

/** Transición horizontal de slide (paneles laterales, drawers) */
export const UI_MOTION_SLIDE_TWEEN = {
  type: 'tween' as const,
  duration: UI_MOTION_DURATION_S,
  ease: UI_MOTION_EASE
};

/** Transiciones de ruta (PageTransition) y pill del nav */
export const PAGE_TRANSITION = {
  duration: UI_MOTION_DURATION_S,
  ease: UI_MOTION_EASE
};

/** Fondo de modal / overlay (solo opacidad) */
export const UI_OVERLAY_TRANSITION = {
  duration: UI_MOTION_DURATION_S,
  ease: UI_MOTION_EASE
};

/** Contenido de ventana modal (opacity + scale + translate) */
export const UI_DIALOG_CONTENT_TRANSITION = {
  type: 'tween' as const,
  duration: UI_MOTION_DURATION_S,
  ease: UI_MOTION_EASE
};

/** Menús y paneles flotantes (opacity + posición) */
export const UI_MENU_TRANSITION = {
  opacity: { duration: UI_MOTION_DURATION_S, ease: UI_MOTION_EASE },
  y: { duration: UI_MOTION_DURATION_S, ease: UI_MOTION_EASE },
  /** Sin `transform` en el antepasado: Chrome aplica mal `backdrop-filter` bajo `translateY`. */
  bottom: { duration: UI_MOTION_DURATION_S, ease: UI_MOTION_EASE },
  scale: { duration: UI_MOTION_DURATION_S, ease: UI_MOTION_EASE },
  x: { duration: UI_MOTION_DURATION_S, ease: UI_MOTION_EASE }
};
