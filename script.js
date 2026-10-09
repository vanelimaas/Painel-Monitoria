document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'painel-monitoria-historico';

  const refs = {
    relatorioBruto: document.getElementById('relatorioBruto'),
    dataRealizada: document.getElementById('dataRealizada'),
    operador: document.getElementById('operador'),
    operacao: document.getElementById('operacao'),
    dataAtendimento: document.getElementById('dataAtendimento'),
    idAtendimento: document.getElementById('idAtendimento'),
    uc: document.getElementById('uc'),
    tma: document.getElementById('tma'),
    protocolo: document.getElementById('protocolo'),
    assunto: document.getElementById('assunto'),
    notaMonitoria: document.getElementById('notaMonitoria'),
    notaAqm: document.getElementById('notaAqm'),
    mo: document.getElementById('mo'),
    atendimento: document.getElementById('atendimento'),
    pontosPositivos: document.getElementById('pontosPositivos'),
    pontosDesenvolver: document.getElementById('pontosDesenvolver'),
    falhaCritica: document.getElementById('falhaCritica'),
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
    refs.saidaOperador.textContent = refs.operador?.value || '---';
    refs.saidaNotaMonitoria.textContent = refs.notaMonitoria?.value || '---';
    refs.saidaNotaAqm.textContent = refs.notaAqm?.value || '---';
    refs.saidaProtocolo.textContent = refs.protocolo?.value || '---';
    refs.saidaMo.textContent = refs.mo?.value || '---';
    refs.saidaAtendimento.textContent = refs.atendimento?.value || '---';
    refs.saidaObservacoes.textContent = refs.observacoes?.value || 'Não se aplica.';
  }

  function getTodayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    return local.toISOString().split('T')[0];
  }

  function setDefaultDates() {
    if (refs.dataRealizada && !refs.dataRealizada.value) refs.dataRealizada.value = getTodayISO();
    if (refs.dataAtendimento && !refs.dataAtendimento.value) {
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const local = new Date(now.getTime() - offset * 60000);
      refs.dataAtendimento.value = local.toISOString().slice(0, 16);
    }
  }

  function normalizeText(raw) {
    return raw
      .replace(/\r/g, '')
      .replace(/\u2022|•/g, '🔹')
      .replace(/\u2705/g, '✅')
      .replace(/\u26A0/g, '⚠️')
      .replace(/\u274C/g, '❌')
      .replace(/\u27A1/g, '➡️')
      .replace(/\u25CF|\u2023/g, '●')
      .trim();
  }

  function parseText(rawText) {
    const text = normalizeText(rawText);
    const lines = text.split('\n');
    const data = {};

    const findValue = (pattern) => {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1]) return match[1].trim();
      }
      return '';
    };

    const findSection = (titlePattern, endPattern) => {
      let collecting = false;
      let out = [];

      for (const line of lines) {
        if (titlePattern.test(line)) {
          collecting = true;
          const m = line.match(titlePattern);
          if (m && m[1]) out.push(m[1].trim());
          continue;
        }

        if (collecting && endPattern && endPattern.test(line)) break;

        if (collecting && line.trim()) {
          const clean = line.replace(/^\s*[\*\-•●➡️🔹🔸✅🚨❌]+\s*/, '').trim();
          if (clean) out.push(clean);
        }
      }

      return out.join(' ').trim();
    };

    data.operador = findValue(/\*?Operador\(a\)\*?\s*[:\-]?\s*([^\n*]+)/i) || findValue(/Operador\(a\):\s*([^\n]+)/i) || '';
    data.operacao = findValue(/\*?Operação\*?\s*[:\-]?\s*([^\n*]+)/i) || findValue(/Operação\s*[:\-]?\s*([^\n]+)/i) || '';
    data.dataAtendimento = findValue(/\*?Data\s*e\s*horário\s*da\s*ligação\*?\s*[:\-]?\s*(\d{2}\.\d{2}\.\d{4}\s*\d{2}:\d{2}:\d{2})/i) || findValue(/Data\s*e\s*horário\s*da\s*ligação\s*[:\-]?\s*(\d{2}\.\d{2}\.\d{4}\s*\d{2}:\d{2}:\d{2})/i) || '';
    data.idAtendimento = findValue(/\*?ID\*?\s*[:\-]?\s*([^\n*]+)/i) || '';
    data.uc = findValue(/\*?UC\*?\s*[:\-]?\s*([^\n*]+)/i) || '';
    data.tma = findValue(/\*?TMA\*?\s*[:\-]?\s*([^\n*]+)/i) || '';
    data.protocolo = findValue(/\*?Protocolo\*?\s*[:\-]?\s*([^\n*]+)/i) || '';
    data.assunto = findValue(/\*?Assunto\*?\s*[:\-]?\s*([^\n*]+)/i) || '';
    data.atendimento = findSection(/\*?Descrição\s*do\s*atendimento\*?\s*[:\-]?\s*(.*)/i, /\*?Pontos\s*(?:positivos|a\s*desenvolver)|\*?Falha\s*crítica|\*?NOTA/i) || '';
    data.pontosPositivos = findSection(/\*?Pontos\s*positivos\*?\s*[:\-]?\s*(.*)/i, /\*?Pontos\s*a\s*desenvolver|\*?Falha\s*crítica|\*?NOTA/i) || '';
    data.pontosDesenvolver = findSection(/\*?Pontos\s*a\s*desenvolver\*?\s*[:\-]?\s*(.*)/i, /\*?Falha\s*crítica|\*?NOTA/i) || '';
    data.falhaCritica = findSection(/\*?Falha\s*crítica\*?\s*[:\-]?\s*(.*)/i, /\*?NOTA/i) || 'Não se aplica.';
    data.notaMonitoria = findValue(/\*?NOTA\*?\s*[:\-]?\s*([^\n*]+)/i) || '';

    // Compatibilidade com campos antigos
    data.dataRealizada = findValue(/(?:Data\s*realizada|Data\s*da\s*monitoria)\s*[:\-]?\s*(\d{2}\.\d{2}\.\d{4})/i) || (data.dataAtendimento ? data.dataAtendimento.split(' ')[0] : '');
    data.notaAqm = findValue(/\*?Nota\s*AQM\*?\s*[:\-]?\s*([^\n*]+)/i) || '';
    data.mo = findValue(/\*?M\.O\.?\*?\s*[:\-]?\s*([^\n*]+)/i) || '';
    data.observacoes = data.pontosDesenvolver || 'Não se aplica.';
    data.ocorrencias = data.falhaCritica || 'Não se aplica.';

    return data;
  }

  function saveToHistory() {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const item = {
      id: Date.now(),
      date: refs.dataRealizada?.value || getTodayISO(),
      operador: refs.operador?.value || '---',
      protocolo: refs.protocolo?.value || '---',
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
    if (refs.relatorioBruto) refs.relatorioBruto.value = '';
    if (refs.dataRealizada) refs.dataRealizada.value = '';
    if (refs.operador) refs.operador.value = '';
    if (refs.operacao) refs.operacao.value = '';
    if (refs.dataAtendimento) refs.dataAtendimento.value = '';
    if (refs.idAtendimento) refs.idAtendimento.value = '';
    if (refs.uc) refs.uc.value = '';
    if (refs.tma) refs.tma.value = '';
    if (refs.protocolo) refs.protocolo.value = '';
    if (refs.assunto) refs.assunto.value = '';
    if (refs.notaMonitoria) refs.notaMonitoria.value = '';
    if (refs.notaAqm) refs.notaAqm.value = '';
    if (refs.mo) refs.mo.value = '';
    if (refs.atendimento) refs.atendimento.value = '';
    if (refs.pontosPositivos) refs.pontosPositivos.value = '';
    if (refs.pontosDesenvolver) refs.pontosDesenvolver.value = '';
    if (refs.falhaCritica) refs.falhaCritica.value = '';
    if (refs.observacoes) refs.observacoes.value = 'Não se aplica.';
    if (refs.ocorrencias) refs.ocorrencias.value = 'Não se aplica.';
    if (refs.justificativa) refs.justificativa.value = '';
    updateFichaPreview();
    setDefaultDates();
  }

  function processarTexto() {
    const text = refs.relatorioBruto?.value?.trim();
    if (!text) {
      alert('Cole o texto da monitoria antes de processar.');
      return;
    }

    const parsed = parseText(text);

    if (parsed.dataRealizada && refs.dataRealizada) refs.dataRealizada.value = parsed.dataRealizada;
    if (parsed.operador && refs.operador) refs.operador.value = parsed.operador;
    if (parsed.operacao && refs.operacao) refs.operacao.value = parsed.operacao;
    if (parsed.dataAtendimento && refs.dataAtendimento) refs.dataAtendimento.value = parsed.dataAtendimento;
    if (parsed.idAtendimento && refs.idAtendimento) refs.idAtendimento.value = parsed.idAtendimento;
    if (parsed.uc && refs.uc) refs.uc.value = parsed.uc;
    if (parsed.tma && refs.tma) refs.tma.value = parsed.tma;
    if (parsed.protocolo && refs.protocolo) refs.protocolo.value = parsed.protocolo;
    if (parsed.assunto && refs.assunto) refs.assunto.value = parsed.assunto;
    if (parsed.notaMonitoria && refs.notaMonitoria) refs.notaMonitoria.value = parsed.notaMonitoria;
    if (parsed.notaAqm && refs.notaAqm) refs.notaAqm.value = parsed.notaAqm;
    if (parsed.mo && refs.mo) refs.mo.value = parsed.mo;
    if (parsed.atendimento && refs.atendimento) refs.atendimento.value = parsed.atendimento;
    if (parsed.pontosPositivos && refs.pontosPositivos) refs.pontosPositivos.value = parsed.pontosPositivos;
    if (parsed.pontosDesenvolver && refs.pontosDesenvolver) refs.pontosDesenvolver.value = parsed.pontosDesenvolver;
    if (parsed.falhaCritica && refs.falhaCritica) refs.falhaCritica.value = parsed.falhaCritica;
    if (parsed.observacoes && refs.observacoes) refs.observacoes.value = parsed.observacoes;
    if (parsed.ocorrencias && refs.ocorrencias) refs.ocorrencias.value = parsed.ocorrencias;

    updateFichaPreview();
    saveToHistory();
    renderHistory();
    alert('✓ Dados processados com sucesso!');
  }

  function buildFormattedText() {
    return [
      'FEEDBACK MONITORIA',
      `Data da monitoria: ${refs.dataRealizada?.value || '---'}`,
      `Operador(a): ${refs.operador?.value || '---'}`,
      `Nota monitoria: ${refs.notaMonitoria?.value || '---'}`,
      `Nota AQM: ${refs.notaAqm?.value || '---'}`,
      `Protocolo: ${refs.protocolo?.value || '---'}`,
      `M.O.: ${refs.mo?.value || '---'}`,
      `Atendimento: ${refs.atendimento?.value || '---'}`,
      `Observações / pontos de atenção: ${refs.observacoes?.value || 'Não se aplica.'}`,
      `Justificativa / ocorrência rápida: ${refs.justificativa?.value || '---'}`
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
    alert('✓ Texto formatado copiado para a área de transferência.');
  }

  async function copiarTexto() {
    if (!refs.relatorioBruto?.value?.trim()) {
      alert('Nenhum texto para copiar.');
      return;
    }
    await copyText(refs.relatorioBruto.value);
    alert('✓ Relatório bruto copiado.');
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
      `Data da monitoria: ${refs.dataRealizada?.value || '---'}`,
      `Operador(a): ${refs.operador?.value || '---'}`,
      `Nota monitoria: ${refs.notaMonitoria?.value || '---'}`,
      `Nota AQM: ${refs.notaAqm?.value || '---'}`,
      `Protocolo: ${refs.protocolo?.value || '---'}`,
      `M.O.: ${refs.mo?.value || '---'}`,
      `Atendimento: ${refs.atendimento?.value || '---'}`,
      `Observações / pontos de atenção: ${refs.observacoes?.value || 'Não se aplica.'}`,
      `Justificativa / ocorrência rápida: ${refs.justificativa?.value || '---'}`
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
        alert('✓ Imagem copiada para a área de transferência.');
      }
    } catch {
      alert('Seu navegador não permite copiar imagem automaticamente.');
    }
  }

  async function colarTexto() {
    try {
      const text = await navigator.clipboard.readText();
      if (refs.relatorioBruto) refs.relatorioBruto.value = text;
      processarTexto();
    } catch {
      alert('Não foi possível acessar a área de transferência.');
    }
  }

  function exportarHistorico() {
    const entries = getHistoryEntries();
    if (entries.length === 0) {
      alert('Nenhum histórico para exportar.');
      return;
    }
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

  if (refs.processar) refs.processar.addEventListener('click', processarTexto);
  if (refs.limpar) refs.limpar.addEventListener('click', limparFormulario);
  if (refs.colarTexto) refs.colarTexto.addEventListener('click', colarTexto);
  if (refs.copiarTexto) refs.copiarTexto.addEventListener('click', copiarTexto);
  if (refs.copiarFormatado) refs.copiarFormatado.addEventListener('click', copiarFormatado);
  if (refs.copiarImagem) refs.copiarImagem.addEventListener('click', copiarImagem);
  if (refs.botaoTema) refs.botaoTema.addEventListener('click', toggleTheme);
  if (refs.filtroData) refs.filtroData.addEventListener('change', renderHistory);
  if (refs.limparHistorico) refs.limparHistorico.addEventListener('click', () => {
    if (confirm('Deseja limpar todo o histórico?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderHistory();
      alert('✓ Histórico limpo.');
    }
  });
  if (refs.exportarHistorico) refs.exportarHistorico.addEventListener('click', exportarHistorico);

  if (refs.operador) refs.operador.addEventListener('input', updateFichaPreview);
  if (refs.notaMonitoria) refs.notaMonitoria.addEventListener('input', updateFichaPreview);
  if (refs.notaAqm) refs.notaAqm.addEventListener('input', updateFichaPreview);
  if (refs.protocolo) refs.protocolo.addEventListener('input', updateFichaPreview);
  if (refs.mo) refs.mo.addEventListener('input', updateFichaPreview);
  if (refs.atendimento) refs.atendimento.addEventListener('input', updateFichaPreview);
  if (refs.observacoes) refs.observacoes.addEventListener('input', updateFichaPreview);

  setDefaultDates();
  updateFichaPreview();
  renderHistory();
  if (refs.botaoTema) refs.botaoTema.textContent = '🌙 Modo escuro';
});
