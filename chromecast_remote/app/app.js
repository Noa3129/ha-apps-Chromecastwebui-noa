const statusText = document.querySelector('#statusText');
const status = document.querySelector('.status');
const themeToggle = document.querySelector('#themeToggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');
const toast = document.querySelector('#toast');
const deviceSubtitle = document.querySelector('#deviceSubtitle');
let currentTheme = localStorage.getItem('remote-theme') || 'system';
let isMuted = false;
let toastTimer;

function applyTheme(theme) {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  themeMeta.content = dark ? '#17130f' : '#f1f9ff';
  const label = theme === 'system' ? 'システム設定' : theme === 'dark' ? 'ダーク' : 'ライト';
  themeToggle.setAttribute('aria-label', `テーマ切り替え（現在：${label}）`);
}
function notify(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1800); }
function setConnectionStatus() { const offline = !navigator.onLine; status.classList.toggle('offline', offline); if (offline) statusText.textContent = 'オフライン · 操作は送信されません'; }
async function refreshHaStatus() {
  if (!navigator.onLine) return;
  try {
    const response = await fetch('./api/status', { cache: 'no-store' });
    const data = await response.json();
    if (!data.configured) { deviceSubtitle.textContent = 'Home Assistant · 未設定'; statusText.textContent = '接続設定が必要 · 操作は送信されません'; return; }
    if (!data.available) { deviceSubtitle.textContent = 'Home Assistant · オフライン'; statusText.textContent = 'Home Assistantに接続できません'; status.classList.add('offline'); return; }
    deviceSubtitle.textContent = 'Google TV HD · 接続済み'; status.classList.remove('offline'); statusText.textContent = 'Home Assistant · 接続済み';
  } catch { deviceSubtitle.textContent = 'Home Assistant · 接続エラー'; statusText.textContent = 'Home Assistantに接続できません'; status.classList.add('offline'); }
}
async function sendAction(action) {
  if (!navigator.onLine) { notify('オフラインのため操作を送信できません'); return; }
  const apps = { 'YouTubeを開く': 'https://www.youtube.com', 'Netflixを開く': 'https://www.netflix.com' };
  const commands = { '電源':'POWER', '上':'DPAD_UP', '下':'DPAD_DOWN', '左':'DPAD_LEFT', '右':'DPAD_RIGHT', '決定':'DPAD_CENTER', '戻る':'BACK', 'ホーム':'HOME', 'メニュー':'MENU', '音量を下げる':'VOLUME_DOWN', '音量を上げる':'VOLUME_UP', 'ミュート':'VOLUME_MUTE' };
  try {
    const isApp = Boolean(apps[action]);
    const body = isApp ? { activity: apps[action] } : { command: commands[action] };
    if (!body.command && !body.activity) throw new Error('unsupported action');
    const response = await fetch(isApp ? './api/launch' : './api/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error('request failed');
    notify(`${action}を送信しました`);
  } catch { notify('Home Assistantへの送信に失敗しました'); statusText.textContent = '送信失敗 · Home Assistantを確認してください'; }
}
function markPressed(button) { button.classList.add('pressed'); clearTimeout(button._pressTimer); button._pressTimer = setTimeout(() => button.classList.remove('pressed'), 180); }

applyTheme(currentTheme); setConnectionStatus(); refreshHaStatus();
themeToggle.addEventListener('click', () => { currentTheme = currentTheme === 'system' ? 'light' : currentTheme === 'light' ? 'dark' : 'system'; localStorage.setItem('remote-theme', currentTheme); applyTheme(currentTheme); notify(`テーマ：${currentTheme === 'system' ? 'システム設定' : currentTheme === 'dark' ? 'ダーク' : 'ライト'}`); });
addEventListener('online', () => { setConnectionStatus(); refreshHaStatus(); });
addEventListener('offline', setConnectionStatus);
document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('pointerdown', () => markPressed(button));
  button.addEventListener('pointerup', () => button.classList.remove('pressed'));
  button.addEventListener('pointercancel', () => button.classList.remove('pressed'));
  button.addEventListener('click', () => { const action = button.dataset.action; markPressed(button); if (action === 'ミュート') { isMuted = !isMuted; button.classList.toggle('muted', isMuted); button.setAttribute('aria-pressed', String(isMuted)); button.querySelector('span').textContent = isMuted ? 'ミュート中' : 'ミュート'; } sendAction(action); });
});
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
