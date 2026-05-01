// ========================
// MÓDULO ROTAS (PARTE A)
// ========================

// Lista de perguntas baseada no Protocolo Corrêa (Parte A)
const PROTOCOLO_ITENS_ROTAS = [
  { id: 'r1', categoria: 'Acesso e portas', texto: 'O portão de entrada permite passagem adequada (largura ≥ 0,80m e sem desnível)?', tipo: 'escala3', opcoes: ['Adequado', 'Parcialmente adequado', 'Inadequado'], observacao: true },
  { id: 'r2', categoria: 'Acesso e portas', texto: 'As portas internas possuem largura ≥ 0,80m?', tipo: 'boolean' },
  { id: 'r3', categoria: 'Acesso e portas', texto: 'As maçanetas são do tipo alavanca?', tipo: 'boolean' },
  { id: 'r4', categoria: 'Acesso e portas', texto: 'Há revestimento resistente a impactos na parte inferior das portas?', tipo: 'boolean' },
  { id: 'r5', categoria: 'Pisos', texto: 'O piso dos caminhos e corredores é antiderrapante?', tipo: 'escala3simples', opcoes: ['Sim', 'Não', 'Parcial'] },
  { id: 'r6', categoria: 'Obstáculos', texto: 'Existem obstáculos fixos (árvores, postes, lixeiras) sem proteção adequada?', tipo: 'boolean', inverso: true, observacao: true },
  { id: 'r7', categoria: 'Obstáculos', texto: 'Existem buracos ou desníveis perigosos no piso?', tipo: 'boolean', inverso: true, observacao: true },
  { id: 'r8', categoria: 'Obstáculos', texto: 'As valetas de água pluvial são cobertas por grades?', tipo: 'boolean' },
  { id: 'r9', categoria: 'Obstáculos', texto: 'Há tapetes ou capachos no percurso?', tipo: 'boolean', inverso: true },
  { id: 'r10', categoria: 'Circulação', texto: 'A largura dos corredores é adequada (≥ 1,20m)?', tipo: 'escala3', opcoes: ['Adequada', 'Parcialmente adequada (1,20m - 1,50m)', 'Inadequada (< 1,20m)'] },
  { id: 'r11', categoria: 'Mudança de nível', texto: 'Rampas possuem corrimão e inclinação adequada?', tipo: 'escala3comNA', opcoes: ['Adequadas', 'Parcialmente adequadas', 'Inadequadas', 'Não se aplica'] },
  { id: 'r12', categoria: 'Mudança de nível', texto: 'Escadas possuem corrimão em ambos os lados?', tipo: 'escala3comNA', opcoes: ['Sim', 'Parcial', 'Não', 'Não se aplica'] },
  { id: 'r13', categoria: 'Ambientes', texto: 'O piso do local de recebimento dos alunos é antiderrapante?', tipo: 'boolean' },
  { id: 'r14', categoria: 'Ambientes', texto: 'O piso das salas de aula é antiderrapante?', tipo: 'boolean' },
  { id: 'r15', categoria: 'Ambientes', texto: 'O piso do refeitório é antiderrapante?', tipo: 'boolean' },
  { id: 'r16', categoria: 'Ambientes', texto: 'O piso do bebedouro é antiderrapante?', tipo: 'boolean' },
  { id: 'r17', categoria: 'Ambientes', texto: 'O bebedouro possui dupla altura de torneira e base recuada?', tipo: 'boolean' },
  { id: 'r18', categoria: 'Ambientes', texto: 'O piso do banheiro é antiderrapante?', tipo: 'boolean' },
  { id: 'r19', categoria: 'Ambientes', texto: 'O banheiro possui barras de apoio e box adaptado?', tipo: 'boolean' },
  { id: 'r20', categoria: 'Mudança de nível', texto: 'Existem mudanças de nível (degraus) sem rampa alternativa acessível?', tipo: 'boolean', inverso: true, observacao: true },
  { id: 'obs_rotas', categoria: 'Observações', texto: 'Descreva outras barreiras ou aspectos relevantes para a acessibilidade das rotas (opcional).', tipo: 'text', obrigatorio: true },
  { id: 'img_rotas', categoria: 'Registro visual', texto: 'Imagens das rotas avaliadas (opcional)', tipo: 'imagemMultipla' }
];

// Variáveis de estado do módulo rotas
let currentAvaliacaoRotas = null;
let respostasMapRotas = new Map();
let houveMudancaRotas = false;

function normalizarRespostaRotas(resp) {
  if (!resp || typeof resp !== 'object') return { valor: '', observacao: '', outroTexto: '', imagens: [] };
  return {
    valor: resp.valor || resp.value || resp.resposta || '',
    observacao: resp.observacao || resp.obs || '',
    outroTexto: resp.outroTexto || resp.outro || '',
    imagens: (resp.imagens || resp.images || []).filter(v => typeof v === 'string' && v)
  };
}

function getRespostaAtualRotas(id) {
  return normalizarRespostaRotas(respostasMapRotas.get(id));
}

async function salvarRespostaRotas(idAvaliacao, perguntaId, resposta) {
  const dados = {
    idAvaliacao: Number(idAvaliacao),
    perguntaId: String(perguntaId),
    valor: resposta.valor || '',
    observacao: resposta.observacao || '',
    outroTexto: resposta.outroTexto || '',
    imagens: Array.isArray(resposta.imagens) ? resposta.imagens : [],
    timestamp: Date.now()
  };
  const transaction = db.transaction(['respostas'], 'readwrite');
  const store = transaction.objectStore('respostas');
  await store.put(dados);
}

async function salvarTodasRespostasRotas() {
  if (!currentAvaliacaoRotas?.id) return;
  for (const item of PROTOCOLO_ITENS_ROTAS) {
    const resp = getRespostaAtualRotas(item.id);
    if (resp.valor || resp.observacao || resp.outroTexto || resp.imagens.length) {
      await salvarRespostaRotas(currentAvaliacaoRotas.id, item.id, resp);
    }
  }
  await salvarAvaliacao({ ...currentAvaliacaoRotas, progresso: contarRespondidasRotas() });
  houveMudancaRotas = false;
  alert('Respostas salvas com sucesso.');
}

// Índice da última pergunta obrigatória (r20)
const INDICE_ULTIMA_PERGUNTA_ROTAS = PROTOCOLO_ITENS_ROTAS.findIndex(item => item.id === 'r20') + 1; // 20

function contarRespondidasRotas() {
  let count = 0;
  for (let i = 0; i < INDICE_ULTIMA_PERGUNTA_ROTAS; i++) {
    const item = PROTOCOLO_ITENS_ROTAS[i];
    const resp = getRespostaAtualRotas(item.id);
    if (resp.valor && resp.valor.trim() !== '') count++;
  }
  return count;
}

function formularioCompletoRotas() {
  return contarRespondidasRotas() === INDICE_ULTIMA_PERGUNTA_ROTAS;
}

// ========== FUNÇÕES PARA RELATÓRIO COM MODAL (PARA ROTAS) ==========
function pontuarItemRotas(item, valor) {
  if (!valor) return { obtidos: 0, possiveis: 0 };
  if (item.tipo === 'boolean') {
    const correto = item.inverso ? valor === 'nao' : valor === 'sim';
    return { obtidos: correto ? 1 : 0, possiveis: 1 };
  }
  if (['escala3', 'escala3comNA', 'escala3simples'].includes(item.tipo)) {
    if (['Adequado', 'Adequada', 'Adequadas', 'Sim', 'Não se aplica'].includes(valor)) {
      return { obtidos: 2, possiveis: 2 };
    }
    if (['Parcial', 'Parcialmente adequado', 'Parcialmente adequada', 'Parcialmente adequadas'].includes(valor)) {
      return { obtidos: 1, possiveis: 2 };
    }
    return { obtidos: 0, possiveis: 2 };
  }
  return { obtidos: 0, possiveis: 0 };
}

function calcularPontuacaoRotas(respostasMapLocal) {
  let pontosObtidos = 0;
  let pontosPossiveis = 0;
  // Considera apenas as perguntas obrigatórias (até r20)
  for (let i = 0; i < INDICE_ULTIMA_PERGUNTA_ROTAS; i++) {
    const item = PROTOCOLO_ITENS_ROTAS[i];
    const resp = normalizarRespostaRotas(respostasMapLocal.get(item.id));
    const valor = resp.valor;
    const { obtidos, possiveis } = pontuarItemRotas(item, valor);
    pontosObtidos += obtidos;
    pontosPossiveis += possiveis;
  }
  const percent = pontosPossiveis ? (pontosObtidos / pontosPossiveis) * 100 : 0;
  const classificacao = percent >= 80 ? 'Adequado' : percent >= 50 ? 'Intermediário' : 'Crítico';
  return { percent, classificacao, pontosObtidos, pontosPossiveis };
}

async function gerarHtmlRelatorioCompletoRotas(aval, respostasMapLocal, percent, classificacao) {
  let html = `
    <div id="report-container" style="padding:1rem; font-family:sans-serif; background:white; color:black;">
      <h1>Relatório de Acessibilidade - Rotas (Parte A)</h1>
      <p><strong>Escola:</strong> ${escapeHtml(aval?.escola || '')}</p>
      <p><strong>Local:</strong> ${escapeHtml(aval?.local || '')}</p>
      <p><strong>Data:</strong> ${new Date(aval?.data || Date.now()).toLocaleString()}</p>
      <p><strong>Classificação:</strong> ${escapeHtml(classificacao)} (${Number(percent || 0).toFixed(1)}%)</p>
      <h2>Respostas detalhadas</h2>
  `;
  // Mostrar apenas perguntas obrigatórias (r1 a r20)
  for (let i = 0; i < INDICE_ULTIMA_PERGUNTA_ROTAS; i++) {
    const item = PROTOCOLO_ITENS_ROTAS[i];
    const resp = normalizarRespostaRotas(respostasMapLocal.get(item.id));
    const valorTexto = resp.valor && resp.valor.trim() !== '' ? resp.valor : 'Não respondido';
    html += `<div style="margin-bottom:12px;">
        <p><strong>${escapeHtml(item.texto)}</strong><br>Resposta: ${escapeHtml(valorTexto)}</p>`;
    if (resp.observacao && resp.observacao.trim()) {
      html += `<p><em>Observação:</em> ${escapeHtml(resp.observacao)}</p>`;
    }
    html += `</div>`;
  }
  // Adicionar observação opcional
  const obsItem = PROTOCOLO_ITENS_ROTAS.find(i => i.id === 'obs_rotas');
  if (obsItem) {
    const resp = normalizarRespostaRotas(respostasMapLocal.get(obsItem.id));
    if (resp.valor && resp.valor.trim()) {
      html += `<div><strong>${escapeHtml(obsItem.texto)}</strong><br>${escapeHtml(resp.valor)}</div>`;
    }
  }
  // Adicionar imagens da pergunta opcional
  const imgItem = PROTOCOLO_ITENS_ROTAS.find(i => i.id === 'img_rotas');
  if (imgItem) {
    const resp = normalizarRespostaRotas(respostasMapLocal.get(imgItem.id));
    if (resp.imagens && resp.imagens.length) {
      html += `<h3>Imagens anexadas</h3>`;
      resp.imagens.forEach(img => {
        html += `<div><img src="${img}" style="max-width:80%; margin:10px auto;"></div>`;
      });
    }
  }
  html += `</div>`;
  return html;
}

async function mostrarMenuRelatorioRotas(idAvaliacao) {
  try {
    const todas = await listarAvaliacoes();
    const aval = todas.find(a => a.id === idAvaliacao);
    if (!aval) {
      alert('Avaliação não encontrada para gerar relatório.');
      return;
    }
    // Carregar respostas
    const respostasBrutas = await carregarRespostas(idAvaliacao);
    const respostasMapTemp = new Map();
    for (const r of respostasBrutas) {
      respostasMapTemp.set(String(r.perguntaId), normalizarRespostaRotas(r));
    }
    // Verificar se as perguntas obrigatórias estão respondidas
    let respondidos = 0;
    for (let i = 0; i < INDICE_ULTIMA_PERGUNTA_ROTAS; i++) {
      const item = PROTOCOLO_ITENS_ROTAS[i];
      const resp = normalizarRespostaRotas(respostasMapTemp.get(item.id));
      if (resp.valor && resp.valor.trim() !== '') respondidos++;
    }
    if (respondidos !== INDICE_ULTIMA_PERGUNTA_ROTAS) {
      alert(`O relatório só pode ser gerado após o preenchimento dos ${INDICE_ULTIMA_PERGUNTA_ROTAS} itens. (Atualmente: ${respondidos}/${INDICE_ULTIMA_PERGUNTA_ROTAS})`);
      return;
    }
    const { percent, classificacao } = calcularPontuacaoRotas(respostasMapTemp);
    const htmlRelatorio = await gerarHtmlRelatorioCompletoRotas(aval, respostasMapTemp, percent, classificacao);
    // Criar modal com opções (igual ao app.js)
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Opções do Relatório</h3>
        <button id="btnPdfRotas" class="btn-primary" style="margin:0.5rem 0;">📄 Baixar PDF</button>
        <button id="btnWhatsappRotas" class="btn-primary" style="margin:0.5rem 0;">📱 Compartilhar PDF (WhatsApp)</button>
        <button id="btnEmailRotas" class="btn-primary" style="margin:0.5rem 0;">✉️ Compartilhar PDF (E-mail)</button>
        <button id="fecharModalRelRotas" class="btn-outline">Fechar</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Funções de compartilhamento (reaproveitando as do app.js, que estão no escopo global)
    document.getElementById('btnPdfRotas').onclick = async () => {
      await gerarPDFComDados(htmlRelatorio, aval.escola);
      modal.remove();
    };
    document.getElementById('btnWhatsappRotas').onclick = async () => {
      await compartilharPDF(aval, respostasMapTemp, percent, classificacao, 'WhatsApp');
      modal.remove();
    };
    document.getElementById('btnEmailRotas').onclick = async () => {
      await compartilharPDF(aval, respostasMapTemp, percent, classificacao, 'E-mail');
      modal.remove();
    };
    document.getElementById('fecharModalRelRotas').onclick = () => modal.remove();
  } catch (error) {
    console.error('Erro ao abrir relatório de rotas:', error);
    alert('Erro ao gerar relatório.');
  }
}

function agruparPerguntasRotasPorCategoria() {
  const categorias = {};
  for (const item of PROTOCOLO_ITENS_ROTAS) {
    // Remove perguntas opcionais (obs_rotas e img_rotas) do agrupamento (elas já estão no final)
    if (item.id === 'obs_rotas' || item.id === 'img_rotas') continue;
    if (!categorias[item.categoria]) categorias[item.categoria] = [];
    categorias[item.categoria].push(item);
  }
  return categorias;
}

async function renderDashboardRotas() {
  const todas = await listarAvaliacoes();
  const avaliacoes = todas.filter(a => a.tipo === 'rotas');
  const html = `
    <div class="card">
      <button id="novaRotasBtn" class="btn-primary">➕ Nova Avaliação</button>
    </div>
    <div class="card">
      <h2>Histórico de Avaliações de Rotas</h2>
      ${avaliacoes.length === 0 ? '<p>Nenhuma avaliação salva.</p>' :
        avaliacoes.map(a => `
          <div style="margin:1rem 0; padding:0.5rem 0; border-bottom:1px solid var(--border);">
            <strong>${escapeHtml(a.escola || 'Escola')}</strong> - ${escapeHtml(a.local || 'Local')}<br>
            <small>${new Date(a.data).toLocaleString()}</small>
            <div class="grid-2" style="margin-top:0.5rem;">
              <button class="btn-secondary continuarRotasBtn" data-id="${a.id}">Continuar</button>
              <button class="btn-outline deletarRotasBtn" data-id="${a.id}">Deletar</button>
              <button class="btn-outline relatorioRotasBtn" data-id="${a.id}" ${Number(a.progresso || 0) < INDICE_ULTIMA_PERGUNTA_ROTAS ? 'disabled' : ''}>📄 Relatório</button>
              <button id="voltarInicioRotas" class="btn-outline" style="margin-top:0.5rem;">← Voltar ao início</button>
            </div>
          </div>
        `).join('')
      }
      </div>
     </div>
  `;
  document.getElementById('main-content').innerHTML = html;

  const novaBtn = document.getElementById('novaRotasBtn');
  if (novaBtn) novaBtn.onclick = () => iniciarNovaAvaliacaoRotas();

  document.querySelectorAll('.continuarRotasBtn').forEach(btn => {
    btn.onclick = () => continuarAvaliacaoRotas(parseInt(btn.dataset.id));
  });
  document.querySelectorAll('.deletarRotasBtn').forEach(btn => {
    btn.onclick = async () => {
      if (confirm('Remover avaliação?')) {
        await deletarAvaliacao(parseInt(btn.dataset.id));
        renderDashboardRotas();
      }
    };
  });
  document.querySelectorAll('.relatorioRotasBtn').forEach(btn => {
  btn.onclick = () => mostrarMenuRelatorioRotas(parseInt(btn.dataset.id));
});
  const voltarBtn = document.getElementById('voltarInicioRotas');
  if (voltarBtn) voltarBtn.onclick = () => window.renderPaginaInicial();
}

async function iniciarNovaAvaliacaoRotas() {
  let escola = prompt('Nome da escola:*')?.trim();
  if (!escola) return alert('Nome obrigatório');
  let local = prompt('Local avaliado:*')?.trim();
  if (!local) return alert('Local obrigatório');

  const nova = {
    escola,
    local,
    data: new Date().toISOString(),
    tipo: 'rotas',
    progresso: 0
  };
  const id = await salvarAvaliacao(nova);
  currentAvaliacaoRotas = { ...nova, id };
  respostasMapRotas.clear();
  houveMudancaRotas = false;
  renderFormularioRotas();
}

async function continuarAvaliacaoRotas(id) {
  const todas = await listarAvaliacoes();
  const aval = todas.find(a => a.id === id);
  if (!aval || aval.tipo !== 'rotas') return alert('Avaliação não encontrada');
  currentAvaliacaoRotas = aval;
  const respostas = await carregarRespostas(id);
  respostasMapRotas.clear();
  for (const resp of respostas) {
    respostasMapRotas.set(String(resp.perguntaId), normalizarRespostaRotas(resp));
  }
  houveMudancaRotas = false;
  renderFormularioRotas();
}

function renderFormularioRotas() {
  const respondidos = contarRespondidasRotas();
  const total = INDICE_ULTIMA_PERGUNTA_ROTAS;
  const percent = total ? (respondidos / total) * 100 : 0;
  const completo = formularioCompletoRotas();

  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn) {
  const originalOnclick = homeBtn.onclick;
  homeBtn.onclick = async () => {
    if (houveMudancaRotas) {
      const desejaSalvar = confirm('Deseja salvar as respostas antes de sair?');
      if (desejaSalvar) await salvarTodasRespostasRotas();
    }
    // Restaura o comportamento original e navega
    if (originalOnclick) originalOnclick();
    else window.renderPaginaInicial();
  };
  }

  let html = `
    <div class="card">
      <h2>${escapeHtml(currentAvaliacaoRotas?.escola || '')} - ${escapeHtml(currentAvaliacaoRotas?.local || '')}</h2>
      <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
      <div class="progress-text">Progresso: ${respondidos}/${total}</div>
      <button id="salvarRotasTop" class="btn-secondary">💾 Salvar Respostas</button>
      <button id="finalizarRotasTop" class="btn-primary" ${!completo ? 'disabled' : ''}>📋 Finalizar e ver Relatório</button>
    </div>
  `;

  const salvarBottom = document.getElementById('salvarRotasBottom');
    if (salvarBottom) salvarBottom.onclick = salvarTodasRespostasRotas;

  const finalizarBottom = document.getElementById('finalizarRotasBottom');
    if (finalizarBottom) finalizarBottom.onclick = () => { 
    if (formularioCompletoRotas()) mostrarMenuRelatorioRotas(currentAvaliacaoRotas.id); 
  };

  const perguntasPorCategoria = agruparPerguntasRotasPorCategoria();

  for (const categoria in perguntasPorCategoria) {
    html += `<div class="card"><h3>${escapeHtml(categoria)}</h3>`;
    for (const item of perguntasPorCategoria[categoria]) {
      const resp = getRespostaAtualRotas(item.id);
      // Cria a pergunta (igual ao que você já fazia, mas sem repetir o card)
      html += `<div class="question-group" data-id="${item.id}">
        <div class="question-text">${escapeHtml(item.texto)}</div>`;
      if (item.tipo === 'boolean') {
        html += `<div class="radio-group">
          <label><input type="radio" name="${item.id}" value="sim" ${resp.valor === 'sim' ? 'checked' : ''}> Sim</label>
          <label><input type="radio" name="${item.id}" value="nao" ${resp.valor === 'nao' ? 'checked' : ''}> Não</label>
        </div>`;
        if (item.observacao) html += `<textarea class="obs-text" data-id="${item.id}" placeholder="Observação...">${escapeHtml(resp.observacao)}</textarea>`;
      } else if (['escala3', 'escala3comNA', 'escala3simples'].includes(item.tipo)) {
        html += `<div class="radio-group">${item.opcoes.map(op => `<label><input type="radio" name="${item.id}" value="${op}" ${resp.valor === op ? 'checked' : ''}> ${op}</label>`).join('')}</div>`;
      }
      if (resp.imagens.length) {
        html += `<div class="img-list">${resp.imagens.map((img, idx) => `<div class="img-item"><img src="${img}" style="max-width:100px"><button class="remove-img" data-id="${item.id}" data-idx="${idx}">❌ Remover foto</button></div>`).join('')}</div>`;
      }
      html += `<button class="img-btn-multi" data-id="${item.id}">${resp.imagens.length ? '📷 Nova Foto' : '📷 Adicionar Foto'}</button>`;
      html += `<button class="speak-btn" data-text="${escapeHtml(item.texto)}">🔊 Ouvir</button></div>`;
    }
    html += `</div>`; // fecha card da categoria
  }

  // Adicionar as perguntas opcionais (obs_rotas e img_rotas) em cards separados
  const obsItem = PROTOCOLO_ITENS_ROTAS.find(i => i.id === 'obs_rotas');
  if (obsItem) {
    const resp = getRespostaAtualRotas(obsItem.id);
    html += `<div class="card"><h3>Observações adicionais</h3>
      <div class="question-group"><div class="question-text">${escapeHtml(obsItem.texto)}</div>
      <textarea id="txt-${obsItem.id}" rows="3">${escapeHtml(resp.valor)}</textarea></div>
    </div>`;
  }
  const imgItem = PROTOCOLO_ITENS_ROTAS.find(i => i.id === 'img_rotas');
  if (imgItem) {
    const resp = getRespostaAtualRotas(imgItem.id);
    html += `<div class="card"><h3>Registro fotográfico</h3>
      <div class="question-group">
        <div id="img-list-${imgItem.id}" class="img-list">${resp.imagens.map((img, idx) => `<div class="img-item"><img src="${img}" style="max-width:100px"><button class="remove-img" data-id="${imgItem.id}" data-idx="${idx}">❌ Remover foto</button></div>`).join('')}</div>
        <button class="img-btn-multi" data-id="${imgItem.id}">${resp.imagens.length ? '📷 Nova Foto' : '📷 Adicionar Foto'}</button>
      </div>
    </div>`;
  }

  html += `
  <div class="card">
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <button id="salvarRotasBottom" class="btn-secondary">💾 Salvar Respostas</button>
      <button id="finalizarRotasBottom" class="btn-primary" ${!completo ? 'disabled' : ''}>📋 Finalizar e ver Relatório</button>
    </div>
  </div>
  <div class="card">
    <button id="voltarDashboardRotas" class="btn-outline">← Voltar ao histórico</button>
  </div>
 `;
  document.getElementById('main-content').innerHTML = html;

  // Adicionar eventos de áudio
  document.querySelectorAll('.speak-btn').forEach(btn => {
  btn.onclick = (e) => {
    e.stopPropagation();
    const texto = btn.getAttribute('data-text') || '';
    if (texto) {
      const utterance = new SpeechSynthesisUtterance(texto);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };
  });

  // Eventos
  for (const item of PROTOCOLO_ITENS_ROTAS) {
    document.querySelectorAll(`input[name="${item.id}"]`).forEach(r => {
      r.onchange = async e => {
        const resp = getRespostaAtualRotas(item.id);
        resp.valor = e.target.value;
        respostasMapRotas.set(item.id, resp);
        await salvarRespostaRotas(currentAvaliacaoRotas.id, item.id, resp);
        renderFormularioRotas();
      };
    });
    document.querySelectorAll(`.obs-text[data-id="${item.id}"]`).forEach(t => {
      t.onblur = async e => {
        const resp = getRespostaAtualRotas(item.id);
        resp.observacao = e.target.value;
        respostasMapRotas.set(item.id, resp);
        await salvarRespostaRotas(currentAvaliacaoRotas.id, item.id, resp);
      };
    });
    document.querySelectorAll(`.img-btn-multi[data-id="${item.id}"]`).forEach(btn => {
      btn.onclick = () => adicionarImagemRotas(item.id, 5);
    });
      };
      // Eventos de remoção de imagem (botões ❌)
    document.querySelectorAll('.remove-img').forEach(btn => {
    btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const perguntaId = btn.getAttribute('data-id');
    const idx = parseInt(btn.getAttribute('data-idx'), 10);
    if (!perguntaId || isNaN(idx)) return;
    const resp = getRespostaAtualRotas(perguntaId);
    const novas = [...(resp.imagens || [])];
    if (idx >= 0 && idx < novas.length) {
      novas.splice(idx, 1);
      resp.imagens = novas;
      respostasMapRotas.set(perguntaId, resp);
      if (currentAvaliacaoRotas?.id) {
        await salvarRespostaRotas(currentAvaliacaoRotas.id, perguntaId, resp);
      }
      // Recarregar o formulário para atualizar a lista de imagens
      renderFormularioRotas();
    }
  });
});

  const salvarTop = document.getElementById('salvarRotasTop');
  if (salvarTop) salvarTop.onclick = salvarTodasRespostasRotas;
  const finalizarTop = document.getElementById('finalizarRotasTop');
  if (finalizarTop) finalizarTop.onclick = () => { if (formularioCompletoRotas()) mostrarMenuRelatorioRotas(currentAvaliacaoRotas.id); };
  const voltarDashboard = document.getElementById('voltarDashboardRotas');
  if (voltarDashboard) voltarDashboard.onclick = renderDashboardRotas;
}

async function adicionarImagemRotas(perguntaId, max = 5) {
  const resp = getRespostaAtualRotas(perguntaId);
  let imagens = resp.imagens || [];
  if (imagens.length >= max) return alert(`Máximo ${max} imagens por questão.`);
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = async e => {
    for (const file of e.target.files) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      imagens.push(base64);
      if (imagens.length >= max) break;
    }
    resp.imagens = imagens;
    respostasMapRotas.set(perguntaId, resp);
    await salvarRespostaRotas(currentAvaliacaoRotas.id, perguntaId, resp);
    renderFormularioRotas();
  };
  input.click();
}

async function gerarRelatorioRotas(id) {
  const todas = await listarAvaliacoes();
  const aval = todas.find(a => a.id === id);
  if (!aval) return;
  const respostas = await carregarRespostas(id);
  const respostasMap = new Map();
  for (const r of respostas) respostasMap.set(r.perguntaId, r);
  let html = `<h1>Relatório de Acessibilidade - Rotas (Parte A)</h1><p>Escola: ${aval.escola}</p><p>Local: ${aval.local}</p><p>Data: ${new Date(aval.data).toLocaleString()}</p>`;
  for (const item of PROTOCOLO_ITENS_ROTAS) {
    const r = respostasMap.get(item.id);
    const valor = r?.valor || 'Não respondido';
    html += `<div><strong>${item.texto}</strong><br>Resposta: ${valor}${r?.observacao ? `<br><em>Obs: ${r.observacao}</em>` : ''}</div>`;
    if (r?.imagens?.length) r.imagens.forEach(img => html += `<img src="${img}" style="max-width:200px">`);
  }
  const blob = await new Promise(resolve => html2pdf().set({ margin: 0.5, filename: `relatorio_rotas_${aval.escola}.pdf` }).from(html).outputPdf('blob').then(resolve));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relatorio_rotas_${aval.escola}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Exportar para o escopo global (para ser chamado pelo app.js)
if (typeof window !== 'undefined') {
  window.routesModule = {
  renderDashboardRotas,
  iniciarNovaAvaliacaoRotas,
  continuarAvaliacaoRotas,
  renderFormularioRotas,
  gerarRelatorioRotas,
  // Expor também as variáveis e funções de estado
  currentAvaliacaoRotas: currentAvaliacaoRotas,
  respostasMapRotas: respostasMapRotas,
  houveMudancaRotas: houveMudancaRotas,
  salvarTodasRespostasRotas: salvarTodasRespostasRotas,
  // Opcional: função para resetar
  resetarEstado: () => {
    currentAvaliacaoRotas = null;
    respostasMapRotas.clear();
    houveMudancaRotas = false;
  }
  };
}