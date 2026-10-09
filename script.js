document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'painel-monitoria-historico';

  const refs = {
    relatorioBruto: document.getElementById('relatorioBruto'),
    dataRealizada: document.getElementById('dataRealizada'),
    operador: document.getElementById('operador'),
    dataAtendimento: document.getElementById('dataAtendimento'),
    protocolo: document.getElementById('protocolo'),
    notaMonitoria: document.getElementById('notaMonitoria'),
    notaAqm: document.getElementById('notaAqm'),
    mo: document.getElementById('mo'),
    atendimento: document.getElementById('atendimento'),
    observacoes: document.getElementById('observacoes'),
    ocorrencias: document.getElementById('ocorrencias'),
    processar: document.getElementById('processar'),
    limpar: document.getElementById('limpar'),
    colarTexto: document.getElementById('colarTexto'),
    copiarTexto: document.getElementById('copiarTexto'),
    copiarFormatado: document.getElementById('copiarFormatado'),
    copiarImagem: document.getElementById('copiarImagem'),
    botaoTema: document.getElementById('botaoTema'),
    historico: document.getElementById('historico'),
    filtroData: document.getElementById('filtroData'),
    limparHistorico: document.getElementById('limparHistorico'),
    exportarHistorico: document.getElementById('exportarHistorico'),
    totalHoje: document.getElementById('totalHoje'),
    totalGeral: document.getElementById('totalGeral'),
    justificativa: document.getElementById('justificativa'),
    saidaOperador: document.getElementById('saidaOperador'),
    saidaNotaMonitoria: document.getElementById('saidaNotaMonitoria'),
    saidaNotaAqm: document.getElementById('saidaNotaAqm'),
    saidaProtocolo: document.getElementById('saidaProtocolo'),
    saidaMo: document.getElementById('saidaMo'),
    saidaAtendimento: document.getElementById('saidaAtendimento'),
    saidaObservacoes: document.getElementById('saidaObservacoes')
  };

  function updateFichaPreview() {
    refs.saidaOperador.textContent = refs.operador.value || '---';
    refs.saidaNotaMonitoria.textContent = refs.notaMonitoria.value || '---';
    refs.saidaNotaAqm.textContent = refs.notaAqm.value || '---';
    refs.saidaProtocolo.textContent = refs.protocolo.value || '---';
    refs.saidaMo.textContent = refs.mo.value || '---';
    refs.saidaAtendimento.textContent = refs.atendimento.value || '---';
    refs.saidaObservacoes.textContent = refs.observacoes.value || 'Não se aplica.';
  }

  function getTodayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().split('T')[0];
  }

  function setDefaultDates() {
    if (!refs.dataRealizada.value) {
      refs.dataRealizada.value = getTodayISO();
    }
    if (!refs.dataAtendimento.value) {
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const local = new Date(now.getTime() - offset * 60000);
      refs.dataAtendimento.value = local.toISOString().slice(0, 16);
    }
  }

  function parseText(text) {
    const lines = text.split(/\r?\n/);
    const data = {};

    const findValue = (label) => {
      const regex = new RegExp(`${label}\\s*[:\\-]?\\s*(.+)`, 'i');
      for (const line of lines) {
        const match = line.match(regex);
        if (match) return match[1].trim();
      }
      return '';
    };

    const findMultiLine = (labelStart, labelEnd) => {
      const startIndex = lines.findIndex(line => new RegExp(`^${labelStart}\\s*[:\\-]?`, 'i').test(line));
      if (startIndex === -1) return '';

      const endLabels = labelEnd ? new RegExp(`^${labelEnd}\\s*[:\\-]?`, 'i') : null;
      let result = '';

      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (endLabels && endLabels.test(line)) break;
        if (!line) continue;
        result += (result ? ' ' : '') + line;
      }
      return result.trim();
    };

    data.dataRealizada = findValue('Data realizada') || findValue('Data da monitoria') || '';
    data.operador = findValue('Operador\(a\)|Operador') || '';
    data.dataAtendimento = findValue('Data\/hora atendimento') || findValue('Data/hora atendimento') || '';
    data.protocolo = findValue('Protocolo') || '';
    data.notaMonitoria = findValue('Nota monitoria') || '';
    data.notaAqm = findValue('Nota AQM') || findValue('AQM') || '';
    data.mo = findValue('M\.O\.|MO') || '';
    data.atendimento = findMultiLine('Atendimento', 'Observações') || findValue('Atendimento') || '';
    data.observacoes = findMultiLine('Observações', 'Ocorrências') || 'Não se aplica.';
    data.ocorrencias = findMultiLine('Ocorrências', 'Justificativa') || 'Não se aplica.';

    return data;
  }

  function saveToHistory() {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const item = {
      id: Date.now(),
      date: refs.dataRealizada.value || getTodayISO(),
      operador: refs.operador.value || '---',
      protocolo: refs.protocolo.value || '---',
      createdAt: new Date().toISOString()
    };

    entries.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
  }

  function getHistoryEntries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function updateCounters() {
    const entries = getHistoryEntries();
    const today = getTodayISO();
    refs.totalHoje.textContent = String(entries.filter(item => item.date === today).length);
    refs.totalGeral.textContent = String(entries.length);
  }

  function renderHistory() {
    const entries = getHistoryEntries();
    const filter = refs.filtroData.value || 'all';

    const dates = [...new Set(entries.map(item => item.date))].sort((a, b) => b.localeCompare(a));
    refs.filtroData.innerHTML = '<option value="all">Todas as datas</option>' + dates.map(date => `
      <option value="${date}">${date}</option>
    `).join('');

    if (filter !== 'all' && dates.includes(filter)) {
      refs.filtroData.value = filter;
    } else {
      refs.filtroData.value = 'all';
    }

    const filtered = filter === 'all' ? entries : entries.filter(item => item.date === filter);

    if (!filtered.length) {
      refs.historico.innerHTML = '<div class="historico-vazio">Nenhum registro salvo no histórico.</div>';
      updateCounters();
      return;
    }

    refs.historico.innerHTML = filtered.map(item => `
      <div class="item-historico">
        <strong>${item.operador}</strong>
        <div>Protocolo: ${item.protocolo}</div>
        <div>Data: ${item.date}</div>
        <small>${new Date(item.createdAt).toLocaleString('pt-BR')}</small>
      </div>
    `).join('');

    updateCounters();
  }

  function limparFormulario() {
    refs.relatorioBruto.value = '';
    refs.dataRealizada.value = '';
    refs.operador.value = '';
    refs.dataAtendimento.value = '';
    refs.protocolo.value = '';
    refs.notaMonitoria.value = '';
    refs.notaAqm.value = '';
    refs.mo.value = '';
    refs.atendimento.value = '';
    refs.observacoes.value = 'Não se aplica.';
    refs.ocorrencias.value = 'Não se aplica.';
    refs.justificativa.value = '';
    updateFichaPreview();
    setDefaultDates();
  }

  function processarTexto() {
    const text = refs.relatorioBruto.value.trim();
    if (!text) {
      alert('Cole o texto da monitoria antes de processar.');
      return;
    }

    const parsed = parseText(text);

    if (parsed.dataRealizada) refs.dataRealizada.value = parsed.dataRealizada;
    if (parsed.operador) refs.operador.value = parsed.operador;
    if (parsed.dataAtendimento) refs.dataAtendimento.value = parsed.dataAtendimento;
    if (parsed.protocolo) refs.protocolo.value = parsed.protocolo;
    if (parsed.notaMonitoria) refs.notaMonitoria.value = parsed.notaMonitoria;
    if (parsed.notaAqm) refs.notaAqm.value = parsed.notaAqm;
    if (parsed.mo) refs.mo.value = parsed.mo;
    if (parsed.atendimento) refs.atendimento.value = parsed.atendimento;
    if (parsed.observacoes) refs.observacoes.value = parsed.observacoes;
    if (parsed.ocorrencias) refs.ocorrencias.value = parsed.ocorrencias;

    updateFichaPreview();
    saveToHistory();
    renderHistory();
  }

  function buildFormattedText() {
    return [
      'FEEDBACK MONITORIA',
      `Data da monitoria: ${refs.dataRealizada.value || '---'}`,
      `Operador(a): ${refs.operador.value || '---'}`,
      `Nota monitoria: ${refs.notaMonitoria.value || '---'}`,
      `Nota AQM: ${refs.notaAqm.value || '---'}`,
      `Protocolo: ${refs.protocolo.value || '---'}`,
      `M.O.: ${refs.mo.value || '---'}`,
      `Atendimento: ${refs.atendimento.value || '---'}`,
      `Observações / pontos de atenção: ${refs.observacoes.value || 'Não se aplica.'}`,
      `Justificativa / ocorrência rápida: ${refs.justificativa.value || '---'}`
    ].join('\n');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      return true;
    }
  }

  async function copiarFormatado() {
    await copyText(buildFormattedText());
    alert('Texto formatado copiado para a área de transferência.');
  }

  async function copiarTexto() {
    await copyText(refs.relatorioBruto.value || '');
    alert('Relatório bruto copiado.');
  }

  async function copiarImagem() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 760;
    canvas.height = 840;

    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1d1d1d';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#111';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('FEEDBACK MONITORIA', 220, 60);

    const lines = [
      `Data da monitoria: ${refs.dataRealizada.value || '---'}`,
      `Operador(a): ${refs.operador.value || '---'}`,
      `Nota monitoria: ${refs.notaMonitoria.value || '---'}`,
      `Nota AQM: ${refs.notaAqm.value || '---'}`,
      `Protocolo: ${refs.protocolo.value || '---'}`,
      `M.O.: ${refs.mo.value || '---'}`,
      `Atendimento: ${refs.atendimento.value || '---'}`,
      `Observações / pontos de atenção: ${refs.observacoes.value || 'Não se aplica.'}`,
      `Justificativa / ocorrência rápida: ${refs.justificativa.value || '---'}`
    ];

    ctx.font = '14px Arial';
    let y = 110;
    lines.forEach(line => {
      ctx.fillText(line, 35, y);
      y += 32;
    });

    const dataUrl = canvas.toDataURL('image/png');
    const blob = await fetch(dataUrl).then(res => res.blob());

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
      }
      alert('Imagem copiada para a área de transferência.');
    } catch {
      alert('Seu navegador não permite copiar imagem automaticamente.');
    }
  }

  async function colarTexto() {
    try {
      const text = await navigator.clipboard.readText();
      refs.relatorioBruto.value = text;
      processarTexto();
    } catch {
      alert('Não foi possível acessar a área de transferência.');
    }
  }

  function exportarHistorico() {
    const entries = getHistoryEntries();
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historico-monitoria.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleTheme() {
    document.body.classList.toggle('dark');
    refs.botaoTema.textContent = document.body.classList.contains('dark') ? '☀️ Modo claro' : '🌙 Modo escuro';
  }

  refs.processar.addEventListener('click', processarTexto);
  refs.limpar.addEventListener('click', limparFormulario);
  refs.colarTexto.addEventListener('click', colarTexto);
  refs.copiarTexto.addEventListener('click', copiarTexto);
  refs.copiarFormatado.addEventListener('click', copiarFormatado);
  refs.copiarImagem.addEventListener('click', copiarImagem);
  refs.botaoTema.addEventListener('click', toggleTheme);
  refs.filtroData.addEventListener('change', renderHistory);
  refs.limparHistorico.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });
  refs.exportarHistorico.addEventListener('click', exportarHistorico);

  refs.operador.addEventListener('input', updateFichaPreview);
  refs.notaMonitoria.addEventListener('input', updateFichaPreview);
  refs.notaAqm.addEventListener('input', updateFichaPreview);
  refs.protocolo.addEventListener('input', updateFichaPreview);
  refs.mo.addEventListener('input', updateFichaPreview);
  refs.atendimento.addEventListener('input', updateFichaPreview);
  refs.observacoes.addEventListener('input', updateFichaPreview);

  setDefaultDates();
  updateFichaPreview();
  renderHistory();
  refs.botaoTema.textContent = '🌙 Modo escuro';
});
