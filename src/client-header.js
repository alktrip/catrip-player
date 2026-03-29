/* Evolución Aura: Isla Flotante — píldora centrada que se expande al hover */
(function () {
  if (document.getElementById('CatripPlayer-topbar-wrap')) return;
  var serviceName = (typeof window.__catripServiceName === 'string' && window.__catripServiceName)
    ? window.__catripServiceName
    : '';
  var serviceColor = (typeof window.__catripServiceColor === 'string' && window.__catripServiceColor)
    ? window.__catripServiceColor
    : '';
  var backToMenuLabel = (typeof window.__catripIslandBackToMenu === 'string' && window.__catripIslandBackToMenu)
    ? window.__catripIslandBackToMenu
    : 'Volver al menú';

  var wrap = document.createElement('div');
  wrap.id = 'CatripPlayer-topbar-wrap';
  wrap.innerHTML =
    '<div class="CatripPlayer-island">' +
      '<span class="CatripPlayer-island-content">' +
        '<span class="CatripPlayer-dot"></span>' +
        '<span class="CatripPlayer-title"></span>' +
      '</span>' +
      '<span class="CatripPlayer-exit-btn" title="' + backToMenuLabel.replace(/"/g, '&quot;') + '" aria-label="' + backToMenuLabel.replace(/"/g, '&quot;') + '">×</span>' +
    '</div>' +
    '<style>' +
    ':root{--catrip-island-accent:#6366f1;}' +
    '.CatripPlayer-island{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
    'display:flex;align-items:center;gap:0;padding:0 14px;height:40px;border-radius:999px;' +
    'border:1px solid transparent;background-clip:padding-box;' +
    'background-image:linear-gradient(rgba(16,16,20,0.82),rgba(16,16,20,0.82)),' +
    'linear-gradient(135deg,color-mix(in srgb,var(--catrip-island-accent) 75%,transparent) 0%,' +
    'color-mix(in srgb,var(--catrip-island-accent) 35%,rgba(124,58,237,0.55)) 45%,rgba(255,255,255,0.22) 100%);' +
    'background-origin:border-box;background-clip:padding-box,border-box;' +
    'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
    'box-shadow:0 4px 24px rgba(0,0,0,0.35),0 0 32px color-mix(in srgb,var(--catrip-island-accent) 22%,transparent);' +
    'cursor:grab;-webkit-app-region:drag;user-select:none;box-sizing:border-box;' +
    'max-width:280px;transition:max-width 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s;}' +
    '.CatripPlayer-island:hover{max-width:360px;box-shadow:0 6px 28px rgba(0,0,0,0.4),0 0 40px color-mix(in srgb,var(--catrip-island-accent) 30%,transparent);}' +
    '.CatripPlayer-island-content{display:flex;align-items:center;justify-content:center;gap:8px;pointer-events:none;min-width:0;flex:1;}' +
    '.CatripPlayer-island .CatripPlayer-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}' +
    '.CatripPlayer-island .CatripPlayer-title{font-size:0.85rem;color:rgba(255,255,255,0.95);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.CatripPlayer-exit-btn{display:inline-flex;align-items:center;justify-content:center;width:0;overflow:hidden;opacity:0;transition:width 0.2s, opacity 0.2s, background 0.15s;' +
    'min-width:0;height:28px;padding:0;margin-left:0;color:rgba(255,255,255,0.8);font-size:18px;font-weight:600;line-height:1;cursor:pointer;-webkit-app-region:no-drag;' +
    'border-radius:6px;}' +
    '.CatripPlayer-island:hover .CatripPlayer-exit-btn{width:32px;min-width:32px;padding:0 6px;margin-left:4px;opacity:1;}' +
    '.CatripPlayer-exit-btn:hover{color:#fff;background:rgba(220,53,69,0.4);}' +
    '</style>';
  document.body.appendChild(wrap);

  var islandEl = wrap.querySelector('.CatripPlayer-island');
  if (islandEl) {
    if (serviceColor && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(serviceColor.trim())) {
      islandEl.style.setProperty('--catrip-island-accent', serviceColor.trim());
    }
  }
  var titleEl = wrap.querySelector('.CatripPlayer-title');
  if (titleEl) titleEl.textContent = serviceName;
  var dotEl = wrap.querySelector('.CatripPlayer-dot');
  if (dotEl && serviceColor) dotEl.style.background = serviceColor;
  else if (dotEl) dotEl.style.display = 'none';

  wrap.querySelector('.CatripPlayer-exit-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    if (window.catrip && window.catrip.ipc) window.catrip.ipc.send('exit-fullscreen');
  });
})();
