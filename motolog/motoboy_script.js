// ===== HELPERS =====
const DAYS   = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Formata número com zero à esquerda: 5 → "05"
const p = n => String(n).padStart(2, '0');

// Retorna a chave do dia atual no formato "AAAA-MM-DD"
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
};

// Formata valor em reais: 12.5 → "R$ 12,50"
const brl = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Formata chave de data para texto legível: "2026-05-13" → "Terça, 13 de Maio de 2026"
const fmtKey = key => {
  const [y, m, d] = key.split('-');
  const dt = new Date(+y, +m-1, +d);
  return `${DAYS[dt.getDay()]}, ${d} de ${MONTHS[+m-1]} de ${y}`;
};

// ===== STORAGE (localStorage) =====

// Carrega todos os dados salvos
const load = () => {
  try { return JSON.parse(localStorage.getItem('motolog3') || '{}'); }
  catch { return {}; }
};

// Salva todos os dados
const save = data => localStorage.setItem('motolog3', JSON.stringify(data));

// Retorna as entregas de hoje
const getToday = () => load()[todayKey()] || [];

// Salva as entregas de hoje
const saveToday = list => {
  const all = load();
  all[todayKey()] = list;
  save(all);
};

// ===== BADGE DE APLICATIVO =====
// Retorna HTML do badge colorido por aplicativo
const badge = app => {
  const map = { Uber: 'b-uber', 99: 'b-99', iFood: 'b-ifood', Particular: 'b-part' };
  return `<span class="badge ${map[app] || 'b-outro'}">${app}</span>`;
};

// ===== RENDERIZAR ENTREGAS DO DIA =====
function renderToday() {
  const list = getToday();
  const el   = document.getElementById('d-list');
  const tb   = document.getElementById('total-bar');

  // Se não há entregas, mostra estado vazio
  if (!list.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📦</div>
        <p>Nenhuma entrega registrada hoje.<br>Adicione a primeira acima!</p>
      </div>
    `;
    tb.style.display = 'none';
    updateSummary(list);
    return;
  }

  // Renderiza cada entrega
  el.innerHTML = list.map((d, i) => `
    <div class="d-item">
      <div class="d-num">#${p(i+1)}</div>
      <div class="d-company">${d.company} ${badge(d.app)}</div>
      <div class="d-time">🕐 ${d.time}</div>
      <div class="d-value">${brl(d.value)}</div>
      <button class="btn btn-del" onclick="delDelivery(${i})">✕</button>
    </div>
  `).join('');

  // Atualiza total
  const total = list.reduce((s, d) => s + d.value, 0);
  document.getElementById('total-val').textContent = brl(total);
  tb.style.display = 'flex';
  updateSummary(list);
}

// ===== ATUALIZAR RESUMO (cards do topo) =====
function updateSummary(list) {
  const total = list.reduce((s, d) => s + d.value, 0);
  document.getElementById('s-count').textContent = list.length;
  document.getElementById('s-total').textContent = brl(total);
  document.getElementById('s-avg').textContent   = brl(list.length ? total / list.length : 0);
}

// ===== ADICIONAR NOVA ENTREGA =====
function addDelivery() {
  const company = document.getElementById('f-company').value.trim();
  const app     = document.getElementById('f-app').value;
  const value   = parseFloat(document.getElementById('f-value').value);

  // Validações
  if (!company) { alert('Informe a empresa ou cliente!'); return; }
  if (!value || value <= 0) { alert('Informe um valor válido!'); return; }

  // Captura horário atual
  const now  = new Date();
  const time = `${p(now.getHours())}:${p(now.getMinutes())}`;

  // Adiciona ao storage
  const list = getToday();
  list.push({ company, app, value, time });
  saveToday(list);

  // Limpa campos
  document.getElementById('f-company').value = '';
  document.getElementById('f-value').value   = '';
  document.getElementById('f-company').focus();

  renderToday();
}

// ===== EXCLUIR ENTREGA =====
function delDelivery(idx) {
  if (!confirm('Remover esta entrega?')) return;
  const list = getToday();
  list.splice(idx, 1);
  saveToday(list);
  renderToday();
}

// ===== RENDERIZAR HISTÓRICO =====
function renderHist() {
  const all    = load();
  const filter = document.getElementById('f-month').value; // Ex: "2026-05"
  const keys   = Object.keys(all).sort((a, b) => b.localeCompare(a)); // Mais recentes primeiro
  const shown  = filter ? keys.filter(k => k.startsWith(filter)) : keys;

  const el = document.getElementById('hist-list');

  if (!shown.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📋</div>
        <p>Nenhum registro encontrado.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = shown.map(key => {
    const list = all[key];
    if (!list || !list.length) return '';
    const total = list.reduce((s, d) => s + d.value, 0);
    return `
      <div class="hist-day">
        <div class="hist-day-hdr" onclick="toggleDay(this)">
          <div class="hist-day-title">${fmtKey(key)}</div>
          <div class="hist-day-meta">
            <span>${list.length} entrega${list.length > 1 ? 's' : ''}</span>
            <span class="hist-day-total">${brl(total)}</span>
            <span class="chevron">▼</span>
          </div>
        </div>
        <div class="hist-day-body">
          ${list.map((d, i) => `
            <div class="hist-row">
              <span class="hist-row-num">#${p(i+1)}</span>
              <span class="hist-row-co">${d.company} ${badge(d.app)}</span>
              <span class="hist-row-time">🕐 ${d.time}</span>
              <span class="hist-row-val">${brl(d.value)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ===== EXPANDIR / RECOLHER DIA NO HISTÓRICO =====
function toggleDay(hdr) {
  const body = hdr.nextElementSibling;
  const chev = hdr.querySelector('.chevron');
  body.classList.toggle('open');
  chev.classList.toggle('open');
}

// ===== LIMPAR FILTRO DE MÊS =====
function clearFilter() {
  document.getElementById('f-month').value = '';
  renderHist();
}

// ===== TROCAR ABA =====
function switchTab(id, el) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');
  if (id === 'historico') renderHist();
}

// ===== ATALHOS DE TECLADO =====
document.addEventListener('DOMContentLoaded', () => {
  // Enter no campo empresa → vai para o valor
  document.getElementById('f-company').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('f-value').focus();
  });
  // Enter no valor → adiciona a entrega
  document.getElementById('f-value').addEventListener('keydown', e => {
    if (e.key === 'Enter') addDelivery();
  });
});

// ===== INICIALIZAÇÃO =====
const now = new Date();
document.getElementById('hdr-date').textContent =
  `${p(now.getDate())}/${p(now.getMonth()+1)}/${now.getFullYear()}`;
document.getElementById('hdr-day').textContent = DAYS[now.getDay()];

renderToday();