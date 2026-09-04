const form = document.getElementById('test-form');
const apiKey = document.getElementById('api-key');
const endpoint = document.getElementById('endpoint');
const message = document.getElementById('message');
const counter = document.getElementById('counter');
const resultPanel = document.getElementById('result-panel');
const resultContent = document.getElementById('result-content');
const history = document.getElementById('history');
const modeLabel = document.getElementById('mode-label');
let network = 'tnt';

endpoint.value = localStorage.getItem('unisms-endpoint') || '';
message.addEventListener('input', () => { counter.textContent = `${message.value.length} / 480`; });

document.querySelectorAll('.network').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.network').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    network = button.dataset.network;
  });
});

document.getElementById('remember-endpoint').addEventListener('change', (event) => {
  if (event.target.checked) localStorage.setItem('unisms-endpoint', endpoint.value.trim());
  else localStorage.removeItem('unisms-endpoint');
});

function redact(value) {
  const text = String(value || '');
  return text.length > 6 ? `${text.slice(0, 3)}•••${text.slice(-3)}` : '••••••';
}

function showResult(data, request) {
  resultPanel.className = `result-panel ${data.ok ? 'success' : 'error'}`;
  modeLabel.textContent = data.mock ? 'DRY RUN COMPLETE' : data.ok ? 'REQUEST ACCEPTED' : 'REQUEST FAILED';
  resultContent.innerHTML = `<strong>${data.message || data.error || 'Request completed'}</strong><p>${request.network.toUpperCase()} · ${redact(request.recipient)}${data.status ? ` · HTTP ${data.status}` : ''}</p><details><summary>View response</summary><pre>${JSON.stringify(data, null, 2)}</pre></details>`;
  addHistory(data, request);
}

function addHistory(data, request) {
  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `<span class="history-state ${data.ok ? 'good' : 'bad'}"></span><b>${request.network.toUpperCase()}</b><span>${redact(request.recipient)}</span><span class="history-message">${request.message}</span><time>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>`;
  if (history.classList.contains('history-empty')) history.innerHTML = '';
  history.classList.remove('history-empty');
  history.prepend(item);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('.send-button');
  const request = {
    apiKey: apiKey.value.trim(), endpoint: endpoint.value.trim(), network,
    recipient: document.getElementById('recipient').value.trim(),
    sender: document.getElementById('sender').value.trim(), message: message.value.trim(),
  };
  button.disabled = true;
  button.querySelector('span').textContent = 'TESTING...';
  modeLabel.textContent = 'CONTACTING UNISMS';
  try {
    const response = await fetch('/api/unisms/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    const data = await response.json();
    showResult(data, request);
  } catch (error) {
    showResult({ ok: false, error: 'The local server could not be reached.' }, request);
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = 'RUN API TEST';
  }
});

document.getElementById('clear-history').addEventListener('click', () => {
  history.className = 'history-empty';
  history.textContent = 'No checks yet.';
});
