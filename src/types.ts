/**
 * Modelo de datos de un servicio de streaming (Fase 1).
 */
export interface Service {
  name: string;
  logo: string;
  url: string;
  color: string;
  style?: Record<string, string>;
  userAgent?: string;
  permissions?: string[];
  hidden?: boolean;
  _defaultService?: boolean;
}
