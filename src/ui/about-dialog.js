/**
 * Ventana "Acerca de": recibe cadenas por IPC, muestra info y enlace a GitHub.
 */
const ipc = (window.catrip && window.catrip.ipc) || null;
const appEl = document.getElementById('about-dialog-app');
const detailEl = document.getElementById('about-dialog-detail');
const githubLink = document.getElementById('about-dialog-github');
const btnClose = document.getElementById('btn-close');

function applyStrings(payload) {
  if (!payload) return;
  if (payload.title != null) document.title = payload.title;
  if (payload.message != null && appEl) appEl.textContent = payload.message;
  if (payload.detail != null && detailEl) detailEl.textContent = payload.detail;
  if (payload.githubLabel != null && githubLink) githubLink.textContent = payload.githubLabel;
  if (payload.githubUrl != null && githubLink) githubLink.href = payload.githubUrl;
  if (btnClose) btnClose.textContent = payload.closeLabel != null ? payload.closeLabel : 'Cerrar';
}

if (ipc) {
  ipc.on('about-dialog-strings', applyStrings);
}

function openGitHub() {
  if (githubLink && githubLink.href && githubLink.href !== '#') {
    ipc.send('about-dialog-open-external', githubLink.href);
  }
}

function closeDialog() {
  if (ipc) ipc.send('about-dialog-close');
}

if (githubLink) {
  githubLink.addEventListener('click', function (e) {
    e.preventDefault();
    openGitHub();
  });
}

if (btnClose) btnClose.addEventListener('click', closeDialog);

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeDialog();
});
