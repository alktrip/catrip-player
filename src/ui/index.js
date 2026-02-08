/**
 * Menú principal: lista de servicios. Recibe datos por IPC set-services.
 * Evolución Aura: iluminación ambiental, paralaje, stagger, morphing, Ripple 2.0.
 */
const { ipc } = window.catrip || {};
const servicesEl = document.querySelector('.services');
const ambientEl = document.getElementById('ambient-layer');

function isLoading() {
  return document.body.classList.contains('loading');
}

function createElement(tag, className = null, style = null) {
  const el = document.createElement(tag);
  if (className) el.classList.add(className);
  if (style && typeof style === 'object') {
    Object.keys(style).forEach((key) => {
      el.style[key] = style[key];
    });
  }
  return el;
}

function hexToRgba(hex, a) {
  if (!hex || hex.length < 4) return 'rgba(255,255,255,0.04)';
  const h = hex.replace('#', '');
  const r = parseInt(h.substr(0, 2), 16);
  const g = parseInt(h.substr(2, 2), 16);
  const b = parseInt(h.substr(4, 2), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + (a != null ? a : 1) + ')';
}

function setAmbient(card, service) {
  if (!ambientEl) return;
  const rect = card.getBoundingClientRect();
  const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
  const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
  ambientEl.style.setProperty('--ambient-x', x + '%');
  ambientEl.style.setProperty('--ambient-y', y + '%');
  ambientEl.style.setProperty('--ambient-color', hexToRgba(service.color || '#666', 0.12));
  ambientEl.style.setProperty('--ambient-opacity', '1');
}

function clearAmbient() {
  if (ambientEl) ambientEl.style.setProperty('--ambient-opacity', '0');
}

function setupParallax(card, imgWrap) {
  if (!imgWrap) return;
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    const px = Math.max(-5, Math.min(5, dx * 5));
    const py = Math.max(-5, Math.min(5, dy * 5));
    imgWrap.style.transform = 'translate(' + px + 'px, ' + py + 'px)';
  });
  card.addEventListener('mouseleave', () => {
    imgWrap.style.transform = 'translate(0, 0)';
  });
}

function startMorphThenLoad(service, img, card) {
  if (isLoading()) return;
  const rect = img.getBoundingClientRect();
  const clone = document.createElement('img');
  clone.src = img.src;
  clone.alt = img.alt;
  clone.className = 'morph-logo';
  clone.style.left = rect.left + rect.width / 2 + 'px';
  clone.style.top = rect.top + rect.height / 2 + 'px';
  clone.style.transform = 'translate(-50%, -50%) scale(0.8)';
  document.body.appendChild(clone);
  document.body.classList.add('loading');
  requestAnimationFrame(() => {
    clone.style.left = '50%';
    clone.style.top = '50%';
    clone.style.transform = 'translate(-50%, -50%) scale(1.2)';
  });
  clone.addEventListener('transitionend', function onEnd() {
    clone.removeEventListener('transitionend', onEnd);
    document.body.classList.add('menu-fade-out');
    showLoaderWithParticles(service, clone, window.__catripStrings);
    if (ipc) ipc.send('open-url', service);
  });
}

function getConnectingText(strings, serviceName) {
  const raw = (strings && strings['ui.connecting']) || 'Conectando con {name}…';
  return raw.replace(/\{name\}/g, serviceName || '');
}

function showLoaderWithParticles(service, logoImg, strings) {
  const loader = createElement('div', 'loader');
  const inner = createElement('div', 'loader-inner');
  const ripple = createElement('div', 'ripple', {
    backgroundColor: service.color || '#666',
  });
  const color = service.color || '#666';
  for (let i = 0; i < 8; i++) {
    const p = createElement('div', 'loader-particle');
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 25 + Math.random() * 20;
    p.style.background = color;
    p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
    p.style.animationDelay = i * 0.05 + 's';
    inner.appendChild(p);
  }
  const logoClone = document.createElement('img');
  logoClone.alt = service.name;
  if (logoImg && logoImg.src) logoClone.src = logoImg.src;
  const textEl = document.createElement('div');
  textEl.className = 'loader-text';
  textEl.textContent = getConnectingText(strings, service.name);
  inner.appendChild(ripple);
  inner.appendChild(logoClone);
  loader.appendChild(inner);
  loader.appendChild(textEl);
  document.body.appendChild(loader);
  if (logoImg && logoImg.parentNode) logoImg.remove();
}

function animateLoader(service, img) {
  document.body.classList.add('loading', 'menu-fade-out');
  const loader = createElement('div', 'loader');
  const inner = createElement('div', 'loader-inner');
  const ripple = createElement('div', 'ripple', {
    backgroundColor: service.color || '#666',
  });
  const logoClone = document.createElement('img');
  logoClone.src = img.src;
  logoClone.alt = img.alt;
  const textEl = document.createElement('div');
  textEl.className = 'loader-text';
  textEl.textContent = getConnectingText(window.__catripStrings, service.name);
  for (let i = 0; i < 8; i++) {
    const p = createElement('div', 'loader-particle');
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 25 + Math.random() * 20;
    p.style.background = service.color || '#666';
    p.style.setProperty('--px', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--py', Math.sin(angle) * dist + 'px');
    p.style.animationDelay = i * 0.05 + 's';
    inner.appendChild(p);
  }
  inner.appendChild(ripple);
  inner.appendChild(logoClone);
  loader.appendChild(inner);
  loader.appendChild(textEl);
  document.body.appendChild(loader);
}

function applyUIStrings(strings) {
  if (!strings || typeof strings !== 'object') return;
  const titleEl = document.querySelector('.menu-header h1');
  const subtitleEl = document.querySelector('.menu-header p');
  if (titleEl && strings['ui.selectService']) titleEl.textContent = strings['ui.selectService'];
  if (subtitleEl && strings['ui.subtitle']) subtitleEl.textContent = strings['ui.subtitle'];
  const docTitle = strings['ui.selectService'] || document.title;
  if (docTitle) document.title = docTitle + ' – CatripPlayer';
}

function renderServices(services, lastUsedService, appVersion, strings) {
  if (strings && typeof strings === 'object') window.__catripStrings = strings;
  applyUIStrings(strings);

  const list = Array.isArray(services) ? services : (services && services.services) ? services.services : [];
  const last = lastUsedService != null ? lastUsedService : (services && !Array.isArray(services) ? services.lastUsedService : null);
  const visible = list.filter((s) => !s.hidden);
  const s = strings || window.__catripStrings || {};
  const versionPrefix = (s['ui.versionPrefix'] != null && s['ui.versionPrefix'] !== '') ? s['ui.versionPrefix'] : 'v';

  const emptyEl = document.getElementById('empty-state');
  const versionEl = document.getElementById('menu-version');
  if (versionEl && appVersion != null) versionEl.textContent = versionPrefix + appVersion;

  if (!servicesEl) return;
  servicesEl.textContent = '';

  if (visible.length === 0) {
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.removeAttribute('hidden');
      const emptyTitle = emptyEl.querySelector('h2');
      const emptyHint = emptyEl.querySelector('p');
      if (emptyTitle && s['ui.emptyTitle']) emptyTitle.textContent = s['ui.emptyTitle'];
      if (emptyHint && s['ui.emptyHint']) emptyHint.textContent = s['ui.emptyHint'];
    }
    servicesEl.style.display = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.body.classList.add('menu-ready'));
    });
    return;
  }

  if (emptyEl) {
    emptyEl.hidden = true;
    emptyEl.setAttribute('hidden', '');
  }
  servicesEl.style.display = '';

  visible.forEach((service, index) => {
    const card = createElement('a', 'service');
    card.href = '#';
    card.setAttribute('role', 'listitem');
    card.style.setProperty('--service-color', service.color || '#666');
    card.style.setProperty('--service-glow', hexToRgba(service.color || '#666', 0.058));
    card.style.setProperty('--service-logo-glow', hexToRgba(service.color || '#666', 0.48));
    card.style.animationDelay = index * 0.05 + 's';
    if (last && service.name === last) {
      card.classList.add('service--last');
      const badge = document.createElement('span');
      badge.className = 'service-badge';
      badge.textContent = s['ui.lastUsed'] != null ? s['ui.lastUsed'] : 'Último';
      card.appendChild(badge);
    }

    const logoWrap = document.createElement('div');
    logoWrap.className = 'service-logo-wrap';
    const img = createElement('img');
    img.src = service.logo;
    img.alt = service.name;
    if (service.style) {
      Object.keys(service.style).forEach((k) => {
        img.style[k] = service.style[k];
      });
    }
    logoWrap.appendChild(img);

    const title = document.createElement('h3');
    title.textContent = service.name;

    card.appendChild(logoWrap);
    card.appendChild(title);
    servicesEl.appendChild(card);

    card.addEventListener('mouseenter', () => setAmbient(card, service));
    card.addEventListener('mouseleave', clearAmbient);
    setupParallax(card, logoWrap);

    card.addEventListener('click', (e) => {
      e.preventDefault();
      if (isLoading()) return;
      startMorphThenLoad(service, img, card);
    });
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.add('menu-ready'));
  });
}

if (ipc) {
  ipc.on('set-services', (payload) => {
    const strings = payload && payload.strings ? payload.strings : null;
    if (Array.isArray(payload)) {
      renderServices(payload, null, null, strings);
    } else if (payload && payload.services) {
      renderServices(payload.services, payload.lastUsedService, payload.appVersion, strings);
    } else {
      renderServices(payload, null, null, strings);
    }
  });

  ipc.on('run-loader', (service) => {
    if (isLoading()) return;
    const img = document.querySelector(`.service img[alt="${service.name}"]`);
    if (img) animateLoader(service, img);
  });
}
