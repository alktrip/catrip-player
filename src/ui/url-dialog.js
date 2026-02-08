/**
 * Diálogo "URL personalizada": recibe cadenas por IPC y envía la URL o cancelación.
 */
const ipc = (window.catrip && window.catrip.ipc) || null;
const form = document.getElementById('url-form');
const input = document.getElementById('url-input');
const titleEl = document.getElementById('url-dialog-title');
const labelEl = document.getElementById('url-label');
const btnCancel = document.getElementById('btn-cancel');
const btnSubmit = document.getElementById('btn-submit');

function applyStrings(payload) {
  if (!payload) return;
  if (payload.title && titleEl) {
    titleEl.textContent = payload.title;
    document.title = payload.title;
  }
  if (payload.label && labelEl) labelEl.textContent = payload.label;
  if (payload.placeholder && input) input.placeholder = payload.placeholder;
  if (btnCancel) btnCancel.textContent = payload.cancel != null ? payload.cancel : 'Cancelar';
  if (btnSubmit) btnSubmit.textContent = payload.submit != null ? payload.submit : 'Abrir';
}

if (ipc) {
  ipc.on('dialog-strings', (payload) => {
    applyStrings(payload);
    if (input) {
      input.focus();
      input.select();
    }
  });
}

function submitUrl() {
  const url = (input && input.value && input.value.trim()) || '';
  if (ipc) ipc.send('url-dialog-submit', url);
}

function cancel() {
  if (ipc) ipc.send('url-dialog-cancel');
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitUrl();
  });
}

if (btnCancel) btnCancel.addEventListener('click', cancel);
if (btnSubmit) btnSubmit.addEventListener('click', (e) => { e.preventDefault(); submitUrl(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cancel();
});
