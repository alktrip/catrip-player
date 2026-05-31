import * as fs from 'fs';
import * as path from 'path';
import { defaultServices } from './default-services';
import type { Service } from './types';

export interface ServiceManagerEntry {
  name: string;
  url: string;
  logo: string;
  color: string;
  hidden: boolean;
  permissions: string[];
  isCustom: boolean;
}

export interface ServicesManagerSavePayload {
  order: string[];
  services: ServiceManagerEntry[];
}

type StoreLike = {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
};

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const LOGO_PATH = /^services\/[a-zA-Z0-9._-]+\.(svg|png|jpe?g)$/;

function mergeOne(defaultSvc: Service, user?: Partial<Service>): Service {
  if (!user) return { ...defaultSvc, _defaultService: true };
  return {
    name: user.name ?? defaultSvc.name,
    logo: user.logo ?? defaultSvc.logo,
    url: user.url ?? defaultSvc.url,
    color: user.color ?? defaultSvc.color,
    style: user.style ?? defaultSvc.style ?? {},
    userAgent: user.userAgent ?? defaultSvc.userAgent,
    permissions: user.permissions ?? defaultSvc.permissions ?? [],
    hidden: user.hidden !== undefined ? user.hidden : defaultSvc.hidden,
    _defaultService: true,
  };
}

export function mergeServices(store: StoreLike): Service[] {
  const userServices: Partial<Service>[] = (store.get('services') as Partial<Service>[] | undefined) || [];
  const savedOrder = (store.get('serviceOrder') as string[] | undefined) || [];
  const byName = new Map<string, Service>();
  const defaultNames = new Set(defaultServices.map((d) => d.name));

  for (const d of defaultServices) {
    const user = userServices.find((s) => s.name === d.name);
    byName.set(d.name, mergeOne(d, user));
  }

  for (const user of userServices) {
    if (!user.name || byName.has(user.name)) continue;
    if (!user.url) continue;
    byName.set(user.name, {
      name: user.name,
      url: user.url,
      logo: user.logo || 'services/youtube.svg',
      color: user.color || '#6366f1',
      style: user.style ?? {},
      userAgent: user.userAgent,
      permissions: user.permissions ?? [],
      hidden: user.hidden,
      _defaultService: false,
    });
  }

  const defaultOrder = defaultServices.map((d) => d.name);
  const known = [...byName.keys()];
  const customNames = known.filter((n) => !defaultNames.has(n));
  let order: string[];

  if (savedOrder.length > 0) {
    order = savedOrder.filter((n) => byName.has(n));
    for (const n of known) {
      if (!order.includes(n)) order.push(n);
    }
  } else {
    order = [...defaultOrder, ...customNames];
  }

  return order.map((n) => byName.get(n)!).filter(Boolean);
}

export function servicesToManagerEntries(services: Service[]): ServiceManagerEntry[] {
  return services.map((s) => ({
    name: s.name,
    url: s.url,
    logo: s.logo,
    color: s.color || '#6366f1',
    hidden: !!s.hidden,
    permissions: Array.isArray(s.permissions) ? [...s.permissions] : [],
    isCustom: s._defaultService === false,
  }));
}

export function validateServicesManagerPayload(payload: ServicesManagerSavePayload): string | null {
  if (!payload || !Array.isArray(payload.order) || !Array.isArray(payload.services)) {
    return 'invalidPayload';
  }
  const names = new Set<string>();
  for (const svc of payload.services) {
    if (!svc.name || !svc.name.trim()) return 'nameRequired';
    const name = svc.name.trim();
    if (names.has(name)) return 'duplicateName';
    names.add(name);
    if (!svc.url || !svc.url.trim()) return 'urlRequired';
    try {
      const u = new URL(svc.url.trim());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'urlInvalid';
    } catch {
      return 'urlInvalid';
    }
    if (!svc.logo || !LOGO_PATH.test(svc.logo.trim())) return 'logoInvalid';
    if (!svc.color || !HEX_COLOR.test(svc.color.trim())) return 'colorInvalid';
  }
  for (const name of payload.order) {
    if (!names.has(name)) return 'orderInvalid';
  }
  if (payload.order.length !== payload.services.length) return 'orderInvalid';
  return null;
}

export function persistServicesFromManager(store: StoreLike, payload: ServicesManagerSavePayload): void {
  const byName = new Map(payload.services.map((s) => [s.name.trim(), s]));
  const userEntries: Partial<Service>[] = [];

  for (const name of payload.order) {
    const svc = byName.get(name);
    if (!svc) continue;
    const defaultSvc = defaultServices.find((d) => d.name === name);

    if (defaultSvc) {
      const delta: Partial<Service> = { name };
      if (svc.hidden !== !!defaultSvc.hidden) delta.hidden = svc.hidden;
      if (svc.url.trim() !== defaultSvc.url) delta.url = svc.url.trim();
      if (svc.logo.trim() !== defaultSvc.logo) delta.logo = svc.logo.trim();
      if (svc.color.trim() !== defaultSvc.color) delta.color = svc.color.trim();
      const defPerms = defaultSvc.permissions ?? [];
      const svcPerms = svc.permissions ?? [];
      if (JSON.stringify(svcPerms.sort()) !== JSON.stringify([...defPerms].sort())) {
        delta.permissions = svcPerms;
      }
      if (Object.keys(delta).length > 1) userEntries.push(delta);
    } else {
      userEntries.push({
        name: name.trim(),
        url: svc.url.trim(),
        logo: svc.logo.trim(),
        color: svc.color.trim(),
        hidden: svc.hidden,
        permissions: svc.permissions ?? [],
        style: {},
      });
    }
  }

  store.set('services', userEntries);
  store.set('serviceOrder', [...payload.order]);
}

export function listAvailableLogos(basePath?: string): string[] {
  const logos = defaultServices.map((s) => s.logo);
  if (basePath) {
    try {
      const dir = path.join(basePath, 'src', 'ui', 'services');
      for (const file of fs.readdirSync(dir)) {
        if (/\.(svg|png|jpe?g)$/i.test(file)) logos.push('services/' + file);
      }
    } catch {
      // ignore
    }
  }
  return logos.filter((v, i, a) => a.indexOf(v) === i).sort();
}
