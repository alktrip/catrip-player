/**
 * Gestor visual de servicios: listado, reordenación, alta/edición y borrado.
 */
const ipc = (window.catrip && window.catrip.ipc) || null;

const listEl = document.getElementById('svc-mgr-list');
const listWrap = document.getElementById('svc-mgr-list-wrap');
const formWrap = document.getElementById('svc-mgr-form-wrap');
const formEl = document.getElementById('svc-mgr-form');
const errorEl = document.getElementById('svc-mgr-error');

const inputName = document.getElementById('svc-mgr-name');
const inputUrl = document.getElementById('svc-mgr-url');
const inputColor = document.getElementById('svc-mgr-color');
const selectLogo = document.getElementById('svc-mgr-logo');
const checkVisible = document.getElementById('svc-mgr-visible');
const checkMedia = document.getElementById('svc-mgr-media');

let strings = {};
let services = [];
let order = [];
let availableLogos = [];
let editingName = null;
let dragFromIndex = null;

function t(key, fallback) {
  return (strings && strings[key]) || fallback;
}

function applyStrings(payload) {
  if (!payload || !payload.strings) return;
  strings = payload.strings;
  const set = (id, key, fb) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key, fb);
  };
  set('svc-mgr-title', 'svcMgr.title', 'Gestionar servicios');
  set('svc-mgr-subtitle', 'svcMgr.subtitle', 'Añade, edita y ordena tus plataformas.');
  set('svc-mgr-list-label', 'svcMgr.listLabel', 'Servicios');
  set('svc-mgr-form-title', 'svcMgr.formTitle', 'Servicio');
  set('svc-mgr-label-name', 'svcMgr.fieldName', 'Nombre');
  set('svc-mgr-label-url', 'svcMgr.fieldUrl', 'URL');
  set('svc-mgr-label-color', 'svcMgr.fieldColor', 'Color');
  set('svc-mgr-label-logo', 'svcMgr.fieldLogo', 'Icono');
  set('svc-mgr-label-visible', 'svcMgr.fieldVisible', 'Visible en el menú');
  set('svc-mgr-label-media', 'svcMgr.fieldMedia', 'Permiso de micrófono/cámara');
  set('svc-mgr-form-cancel', 'svcMgr.formCancel', 'Cancelar');
  set('svc-mgr-form-apply', 'svcMgr.formApply', 'Aplicar');
  set('svc-mgr-add', 'svcMgr.add', 'Añadir servicio');
  set('svc-mgr-cancel', 'svcMgr.cancel', 'Cancelar');
  set('svc-mgr-save', 'svcMgr.save', 'Guardar');
  document.title = t('svcMgr.title', 'Gestionar servicios');
}

function getOrderedServices() {
  return order.map((name) => services.find((s) => s.name === name)).filter(Boolean);
}

function showError(key, fallback) {
  if (!errorEl) return;
  errorEl.textContent = t(key, fallback);
  errorEl.hidden = false;
}

function clearError() {
  if (errorEl) errorEl.hidden = true;
}

function populateLogoSelect(selected) {
  if (!selectLogo) return;
  selectLogo.textContent = '';
  availableLogos.forEach((logo) => {
    const opt = document.createElement('option');
    opt.value = logo;
    opt.textContent = logo.replace('services/', '');
    selectLogo.appendChild(opt);
  });
  if (selected && availableLogos.includes(selected)) selectLogo.value = selected;
  else if (availableLogos.length) selectLogo.value = availableLogos[0];
}

function renderList() {
  if (!listEl) return;
  listEl.textContent = '';
  const items = getOrderedServices();
  items.forEach((svc, index) => {
    const li = document.createElement('li');
    li.className = 'svc-mgr-item';
    li.dataset.name = svc.name;
    li.draggable = true;
    li.setAttribute('role', 'listitem');

    const drag = document.createElement('span');
    drag.className = 'svc-mgr-drag';
    drag.textContent = '≡';
    drag.title = t('svcMgr.dragHint', 'Arrastrar para reordenar');
    drag.draggable = false;

    const img = document.createElement('img');
    img.className = 'svc-mgr-item-logo';
    img.src = svc.logo;
    img.alt = '';

    const info = document.createElement('div');
    info.className = 'svc-mgr-item-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'svc-mgr-item-name';
    nameEl.textContent = svc.name;
    const meta = document.createElement('div');
    meta.className = 'svc-mgr-item-meta';
    meta.textContent = svc.hidden
      ? t('svcMgr.hiddenBadge', 'Oculto')
      : t('svcMgr.visibleBadge', 'Visible');
    info.appendChild(nameEl);
    info.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'svc-mgr-item-actions';

    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'svc-mgr-icon-btn';
    btnEdit.textContent = '✎';
    btnEdit.title = t('svcMgr.edit', 'Editar');
    btnEdit.addEventListener('click', () => openForm(svc.name));

    actions.appendChild(btnEdit);

    if (svc.isCustom) {
      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.className = 'svc-mgr-icon-btn svc-mgr-icon-btn--danger';
      btnDel.textContent = '×';
      btnDel.title = t('svcMgr.delete', 'Eliminar');
      btnDel.addEventListener('click', () => deleteService(svc.name));
      actions.appendChild(btnDel);
    }

    li.appendChild(drag);
    li.appendChild(img);
    li.appendChild(info);
    li.appendChild(actions);

    li.addEventListener('dragstart', (e) => {
      dragFromIndex = index;
      li.classList.add('is-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', svc.name);
      }
    });
    li.addEventListener('dragend', () => {
      dragFromIndex = null;
      li.classList.remove('is-dragging');
      listEl.querySelectorAll('.is-drop-target').forEach((el) => el.classList.remove('is-drop-target'));
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      li.classList.add('is-drop-target');
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    });
    li.addEventListener('dragleave', () => li.classList.remove('is-drop-target'));
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      li.classList.remove('is-drop-target');
      if (dragFromIndex === null || dragFromIndex === index) return;
      const moved = order.splice(dragFromIndex, 1)[0];
      order.splice(index, 0, moved);
      dragFromIndex = null;
      renderList();
    });

    listEl.appendChild(li);
  });
}

function showListView() {
  if (listWrap) listWrap.hidden = false;
  if (formWrap) formWrap.hidden = true;
  editingName = null;
  clearError();
}

function showFormView() {
  if (listWrap) listWrap.hidden = true;
  if (formWrap) formWrap.hidden = false;
  clearError();
}

function openForm(name) {
  showFormView();
  const isNew = !name;
  const svc = isNew
    ? { name: '', url: 'https://', logo: availableLogos[0] || 'services/youtube.svg', color: '#6366f1', hidden: false, permissions: [], isCustom: true }
    : services.find((s) => s.name === name);

  editingName = isNew ? null : name;
  const titleEl = document.getElementById('svc-mgr-form-title');
  if (titleEl) {
    titleEl.textContent = isNew
      ? t('svcMgr.formAddTitle', 'Nuevo servicio')
      : t('svcMgr.formEditTitle', 'Editar servicio');
  }

  if (inputName) {
    inputName.value = svc.name;
    inputName.disabled = !svc.isCustom;
  }
  if (inputUrl) inputUrl.value = svc.url;
  if (inputColor) inputColor.value = svc.color || '#6366f1';
  populateLogoSelect(svc.logo);
  if (checkVisible) checkVisible.checked = !svc.hidden;
  if (checkMedia) checkMedia.checked = (svc.permissions || []).includes('media');
}

function deleteService(name) {
  if (!confirm(t('svcMgr.confirmDelete', '¿Eliminar este servicio?'))) return;
  services = services.filter((s) => s.name !== name);
  order = order.filter((n) => n !== name);
  renderList();
}

function validateFormLocal() {
  clearError();
  const name = (inputName && inputName.value.trim()) || '';
  const url = (inputUrl && inputUrl.value.trim()) || '';
  if (!name) {
    showError('svcMgr.errorName', 'El nombre es obligatorio.');
    return null;
  }
  if (services.some((s) => s.name === name && s.name !== editingName)) {
    showError('svcMgr.errorDuplicate', 'Ya existe un servicio con ese nombre.');
    return null;
  }
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
  } catch {
    showError('svcMgr.errorUrl', 'Introduce una URL válida (http o https).');
    return null;
  }
  return {
    name,
    url,
    logo: (selectLogo && selectLogo.value) || 'services/youtube.svg',
    color: (inputColor && inputColor.value) || '#6366f1',
    hidden: !(checkVisible && checkVisible.checked),
    permissions: checkMedia && checkMedia.checked ? ['media'] : [],
    isCustom: editingName ? services.find((s) => s.name === editingName)?.isCustom ?? true : true,
  };
}

function applyForm() {
  const entry = validateFormLocal();
  if (!entry) return;

  if (editingName && editingName !== entry.name) {
    services = services.filter((s) => s.name !== editingName);
    order = order.map((n) => (n === editingName ? entry.name : n));
  }

  const idx = services.findIndex((s) => s.name === entry.name);
  if (idx >= 0) services[idx] = entry;
  else {
    services.push(entry);
    order.push(entry.name);
  }

  showListView();
  renderList();
}

function saveAll() {
  if (formWrap && !formWrap.hidden) {
    showError('svcMgr.errorPendingForm', 'Aplica o cancela los cambios del formulario antes de guardar.');
    return;
  }
  if (ipc) {
    ipc.send('services-manager-save', {
      order: [...order],
      services: getOrderedServices().map((s) => ({
        name: s.name,
        url: s.url,
        logo: s.logo,
        color: s.color,
        hidden: s.hidden,
        permissions: s.permissions || [],
        isCustom: !!s.isCustom,
      })),
    });
  }
}

function cancelAll() {
  if (ipc) ipc.send('services-manager-cancel');
}

if (ipc) {
  ipc.on('services-manager-init', (payload) => {
    applyStrings(payload);
    availableLogos = Array.isArray(payload.availableLogos) ? payload.availableLogos : [];
    services = Array.isArray(payload.services) ? payload.services.map((s) => ({ ...s })) : [];
    order = Array.isArray(payload.order) ? [...payload.order] : services.map((s) => s.name);
    populateLogoSelect();
    showListView();
    renderList();
  });

  ipc.on('services-manager-error', (key) => {
    showError(key, t(key, 'No se pudo guardar.'));
  });
}

document.getElementById('svc-mgr-add')?.addEventListener('click', () => openForm(null));
document.getElementById('svc-mgr-form-cancel')?.addEventListener('click', showListView);
document.getElementById('svc-mgr-cancel')?.addEventListener('click', cancelAll);
document.getElementById('svc-mgr-save')?.addEventListener('click', saveAll);

if (formEl) {
  formEl.addEventListener('submit', (e) => {
    e.preventDefault();
    applyForm();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (formWrap && !formWrap.hidden) showListView();
    else cancelAll();
  }
});
