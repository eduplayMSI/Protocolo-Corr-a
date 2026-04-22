// app.js - Protocolo Corrêa (correção de múltiplas imagens + compartilhamento de PDF)
const PROTOCOLO_ITENS = [
  { id: 'r1', categoria: 'Parte A — Rotas de Acesso', texto: 'Existem obstáculos fixos ou móveis ao longo do percurso até o espaço de recreação?', tipo: 'boolean', inverso: true, observacao: true },
  { id: 'r2', categoria: 'Parte A — Rotas de Acesso', texto: 'A largura das passagens permite circulação adequada (aproximadamente ≥ 0,90m)?', tipo: 'escala3', opcoes: ['Adequada', 'Parcialmente adequada', 'Inadequada'] },
  { id: 'r3', categoria: 'Parte A — Rotas de Acesso', texto: 'Como é caracterizado o piso predominante no percurso?', tipo: 'select', opcoes: ['Regular e firme', 'Irregular', 'Escorregadio', 'Outro'] },
  { id: 'r4', categoria: 'Parte A — Rotas de Acesso', texto: 'Existem mudanças de nível (degraus, desníveis) sem alternativa acessível (rampa)?', tipo: 'boolean', inverso: true },
  { id: 'r5', categoria: 'Parte A — Rotas de Acesso', texto: 'Quando existem rampas, apresentam condições adequadas de inclinação e uso?', tipo: 'escala3comNA', opcoes: ['Adequadas', 'Parcialmente adequadas', 'Inadequadas', 'Não se aplica'] },
  { id: 'r6', categoria: 'Parte A — Rotas de Acesso', texto: 'Há sinalização visual e/ou tátil no percurso?', tipo: 'escala3simples', opcoes: ['Sim', 'Não', 'Parcial'] },

  { id: 'p1', categoria: 'Parte B — Acesso ao parque', texto: 'O acesso ao parque (portão/entrada) permite passagem adequada?', tipo: 'escala3', opcoes: ['Adequado', 'Parcialmente adequado', 'Inadequado'] },
  { id: 'p2', categoria: 'Parte B — Acesso ao parque', texto: 'A circulação entre os brinquedos permite deslocamento livre (≈ 1,20m)?', tipo: 'escala3', opcoes: ['Adequada', 'Parcialmente adequada', 'Inadequada'] },

  { id: 'esc1', categoria: 'Parte C — Escorregador', texto: 'A plataforma possui proteção lateral (guarda-corpo/borda)?', tipo: 'boolean' },
  { id: 'esc2', categoria: 'Parte C — Escorregador', texto: 'O acesso (escada/rampa) possui corrimão?', tipo: 'boolean' },
  { id: 'esc3', categoria: 'Parte C — Escorregador', texto: 'A área de saída possui material amortecedor de impacto?', tipo: 'escala3simples', opcoes: ['Sim', 'Não', 'Parcial'] },

  { id: 'bal1', categoria: 'Parte C — Balanço', texto: 'O balanço possui assento adaptado (ex: tipo cestinha ou com encosto)?', tipo: 'boolean' },
  { id: 'bal2', categoria: 'Parte C — Balanço', texto: 'Há espaço lateral suficiente para transferência do usuário?', tipo: 'boolean' },
  { id: 'bal3', categoria: 'Parte C — Balanço', texto: 'O assento possui encosto e/ou apoio lateral?', tipo: 'boolean' },

  { id: 'gang1', categoria: 'Parte C — Gangorra/Gira-gira', texto: 'O equipamento possui sistema de amortecimento de impacto?', tipo: 'boolean' },
  { id: 'gang2', categoria: 'Parte C — Gangorra/Gira-gira', texto: 'O acesso ao equipamento ocorre por superfície nivelada?', tipo: 'boolean' },
  { id: 'gang3', categoria: 'Parte C — Gangorra/Gira-gira', texto: 'O equipamento possui barras de apoio ou encosto?', tipo: 'boolean' },

  { id: 'seg1', categoria: 'Parte D — Segurança', texto: 'Há piso com capacidade de amortecimento na área de queda dos brinquedos?', tipo: 'escala3simples', opcoes: ['Sim', 'Não', 'Parcial'] },
  { id: 'seg2', categoria: 'Parte D — Segurança', texto: 'Os equipamentos apresentam riscos (pontas cortantes, ferrugem, desgaste)?', tipo: 'boolean', inverso: true, observacao: true },

  { id: 'obs1', categoria: 'Parte E — Observações', texto: 'Descreva dificuldades, barreiras, riscos ou aspectos relevantes observados no espaço.', tipo: 'text', obrigatorio: true },
  { id: 'obs2', categoria: 'Parte E — Observações', texto: 'Registro visual (imagens do espaço avaliado)', tipo: 'imagemMultipla' }
];

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    mostrarBotaoInstalar(true);
});

function mostrarBotaoInstalar(show) {
    const btn = document.getElementById('installBtn');
    if (btn) {
        btn.style.display = show ? 'inline-flex' : 'none';
    }
}

async function instalarApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
    } else {
        console.log('Usuário recusou');
    }
    deferredPrompt = null;
    mostrarBotaoInstalar(false);
}

const INDICE_ULTIMA_PERGUNTA_PROGRESSO = PROTOCOLO_ITENS.findIndex(item => item.id === 'obs1');

let currentAvaliacao = null;
let respostasMap = new Map();
let houveMudancaNaoSalva = false;
let deferredInstallPrompt = null;
let installButtonInjected = false;

function injectInstallButton() {
    if (installButtonInjected) return;

    const headerDiv = document.querySelector('header .header-actions');
    if (!headerDiv) return;

    let installBtn = document.getElementById('installBtn');
    if (!installBtn) {
        installBtn = document.createElement('button');
        installBtn.id = 'installBtn';
        installBtn.type = 'button';
        installBtn.setAttribute('aria-label', 'Instalar aplicativo');
        installBtn.title = 'Instalar aplicativo';
        installBtn.innerHTML = '📲';
        installBtn.style.display = 'none';
        installBtn.onclick = async () => {
            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt();
        const choiceResult = await deferredInstallPrompt.userChoice;
        if (choiceResult.outcome !== 'accepted') {
            installBtn.style.display = 'inline-flex';
        } else {
            installBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
    } else {
        // Fallback: instrui o usuário
        alert('Para instalar, use o menu do navegador: "Adicionar à tela inicial" ou "Instalar aplicativo".');
    }
  }
}
};

function updateInstallButtonVisibility() {
    const installBtn = document.getElementById('installBtn');
    if (!installBtn) return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    // Se já está instalado, esconde. Senão, mostra sempre (independente do deferredInstallPrompt)
    if (isStandalone) {
        installBtn.style.display = 'none';
    } else {
        installBtn.style.display = 'inline-flex';
    }
}

function setupPWAInstallPrompt() {
    injectInstallButton();
    updateInstallButtonVisibility();

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        updateInstallButtonVisibility();
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        updateInstallButtonVisibility();
    });
}

function injectHomeButton() {
    if (document.getElementById('homeBtn')) return;
    const headerDiv = document.querySelector('header .header-actions');
    if (!headerDiv) return;

    const homeBtn = document.createElement('button');
    homeBtn.id = 'homeBtn';
    homeBtn.setAttribute('aria-label', 'Início');
    homeBtn.innerHTML = '<img src="icons/home-icon.png" alt="Início" style="width:32px; height:32px;">';
    homeBtn.onclick = () => voltarParaInicio();
    headerDiv.insertBefore(homeBtn, headerDiv.firstChild);

    if (!document.getElementById('installBtn')) {
        const installBtn = document.createElement('button');
        installBtn.id = 'installBtn';
        installBtn.setAttribute('aria-label', 'Instalar App');
        installBtn.innerHTML = '<img src="icons/install-icon.png" alt="Instalar" style="width:32px; height:32px;">';
        installBtn.onclick = instalarApp;
        installBtn.style.display = 'none';
        headerDiv.appendChild(installBtn);
    }
}

function normalizarResposta(resp) {
  if (!resp || typeof resp !== 'object') {
    return { valor: '', observacao: '', outroTexto: '', imagens: [] };
  }

  let valor = '';
  if (typeof resp.valor === 'string') valor = resp.valor;
  else if (typeof resp.value === 'string') valor = resp.value;
  else if (typeof resp.resposta === 'string') valor = resp.resposta;
  else if (typeof resp.texto === 'string' && !resp.observacao) valor = resp.texto;
  else if (typeof resp === 'string') valor = resp;

  let observacao = '';
  if (typeof resp.observacao === 'string') observacao = resp.observacao;
  else if (typeof resp.obs === 'string') observacao = resp.obs;

  let outroTexto = '';
  if (typeof resp.outroTexto === 'string') outroTexto = resp.outroTexto;
  else if (typeof resp.outro === 'string') outroTexto = resp.outro;

  let imagens = [];
  if (Array.isArray(resp.imagens)) imagens = resp.imagens.filter(v => typeof v === 'string' && v);
  else if (Array.isArray(resp.images)) imagens = resp.images.filter(v => typeof v === 'string' && v);
  else if (typeof resp.imagem === 'string' && resp.imagem && imagens.length === 0) {
    imagens = [resp.imagem];
  }
  else if (typeof resp.image === 'string' && resp.image && imagens.length === 0) {
    imagens = [resp.image];
  }

  return { valor, observacao, outroTexto, imagens };
}

function getRespostaAtual(id) {
  return normalizarResposta(respostasMap.get(id));
}

function marcarMudancaPendente() {
  houveMudancaNaoSalva = true;
}

function limparMudancaPendente() {
  houveMudancaNaoSalva = false;
}

function contarRespostasPreenchidas() {
  let count = 0;
  for (let i = 0; i <= INDICE_ULTIMA_PERGUNTA_PROGRESSO; i++) {
    const item = PROTOCOLO_ITENS[i];
    const resp = getRespostaAtual(item.id);

    if (item.id === 'obs1') {
      const temTexto = resp.valor && resp.valor.trim() !== '';
      const temImagens = Array.isArray(resp.imagens) && resp.imagens.length > 0;
      if (temTexto || temImagens) count++;
    } else {
      if (resp.valor && resp.valor.trim() !== '') count++;
    }
  }
  return count;
}

function contarTotalImagens() {
    let total = 0;
    for (const item of PROTOCOLO_ITENS) {
        const resp = getRespostaAtual(item.id);
        if (Array.isArray(resp.imagens)) {
            total += resp.imagens.length;
        }
    }
    return total;
}

function formularioCompletoParaRelatorio() {
  return contarRespostasPreenchidas() === (INDICE_ULTIMA_PERGUNTA_PROGRESSO + 1);
}

function atualizarProgresso() {
  const totalItens = INDICE_ULTIMA_PERGUNTA_PROGRESSO + 1;
  const respondidos = contarRespostasPreenchidas();
  const percent = totalItens ? (respondidos / totalItens) * 100 : 0;

  const fill = document.querySelector('.progress-fill');
  const text = document.querySelector('.progress-text');

  if (fill) fill.style.width = `${percent}%`;
  if (text) text.textContent = `Progresso: ${respondidos}/${totalItens}`;

  const podeRelatorio = respondidos === totalItens;
  document.querySelectorAll('.btn-finalizar-relatorio, .btn-relatorio-dashboard').forEach(btn => {
    btn.disabled = !podeRelatorio;
    btn.setAttribute('aria-disabled', String(!podeRelatorio));
    btn.style.opacity = podeRelatorio ? '1' : '0.6';
    btn.style.pointerEvents = podeRelatorio ? 'auto' : 'none';
  });

  if (currentAvaliacao) {
    currentAvaliacao.progresso = respondidos;
  }
}

function agruparPerguntasPorCategoria() {
  const perguntasPorCategoria = {};
  PROTOCOLO_ITENS.forEach(item => {
    if (!perguntasPorCategoria[item.categoria]) perguntasPorCategoria[item.categoria] = [];
    perguntasPorCategoria[item.categoria].push(item);
  });
  return perguntasPorCategoria;
}

async function init() {
  try {
    if (document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }

     await openDB();
     injectHomeButton();
     setupPWAInstallPrompt();
     aplicarConfiguracoes();
     await renderDashboard();
     setupEventListeners();

    const status = document.getElementById('status');
    if (status) status.innerHTML = '✅ Banco de dados pronto | Modo offline';
  } catch (error) {
    console.error('Falha na inicialização:', error);
    const main = document.getElementById('main-content');
    if (main) {
      main.innerHTML = `
        <div class="card" style="color:red;">
          <h2>Erro ao iniciar o aplicativo</h2>
          <p>${escapeHtml(error?.message || String(error))}</p>
          <p>Verifique se seu navegador suporta IndexedDB e tente recarregar.</p>
          <button onclick="location.reload()">Recarregar</button>
        </div>
      `;
    }
  }
}

function setupEventListeners() {
  const configBtn = document.getElementById('configBtn');
  const helpBtn = document.getElementById('helpBtn');

  if (configBtn) configBtn.onclick = mostrarConfiguracoes;
  if (helpBtn) {
    helpBtn.onclick = () => {
      alert('Avalie cada item. Fotos podem ser anexadas. O app salva automaticamente e também pode ser salvo manualmente. Após concluir, gere o relatório ao final. No botão de Configurações, você pode personalizar o tamanho da fonte e as cores para melhor conforto visual. Para qualquer dúvida ou problema, entre em contato com o suporte, através do telefone (84) 9 8816-4322.');
    };
  }
}

async function salvarTodasRespostas() {
    if (!currentAvaliacao?.id) return;
    
    for (const item of PROTOCOLO_ITENS) {
        const resposta = getRespostaAtual(item.id);
        const temConteudo =
            (resposta.valor && resposta.valor.trim() !== '') ||
            (resposta.observacao && resposta.observacao.trim() !== '') ||
            (resposta.outroTexto && resposta.outroTexto.trim() !== '') ||
            (Array.isArray(resposta.imagens) && resposta.imagens.length > 0);
        
        if (temConteudo) {
            await salvarResposta(currentAvaliacao.id, item.id, resposta);
        }
    }
    
    const respondidos = contarRespostasPreenchidas();
    currentAvaliacao.progresso = respondidos;
    await salvarAvaliacao(currentAvaliacao);
    
    limparMudancaPendente();
    atualizarProgresso();
    alert('Respostas salvas com sucesso.');
}

async function voltarParaInicio() {
  if (currentAvaliacao && houveMudancaNaoSalva) {
    const desejaSalvar = confirm('Deseja salvar as respostas antes de sair?');
    if (desejaSalvar) {
      await salvarTodasRespostas();
    }
  }

  currentAvaliacao = null;
  respostasMap = new Map();
  limparMudancaPendente();
  await renderDashboard();
}

async function renderDashboard() {
  let avaliacoes = [];
  try {
    avaliacoes = await listarAvaliacoes();
    if (!Array.isArray(avaliacoes)) avaliacoes = [];
  } catch (e) {
    console.warn('Erro ao listar avaliações:', e);
    avaliacoes = [];
  }

  const html = `
    <div class="card">
      <button id="novaAvaliacaoBtn" class="btn-primary">➕ Nova Avaliação</button>
    </div>

    <div class="card">
      <h2>Histórico</h2>
      ${avaliacoes.length === 0
        ? '<p>Nenhuma avaliação salva.</p>'
        : avaliacoes.map(a => `
          <div style="margin:1rem 0; padding:0.5rem 0; border-bottom:1px solid var(--border);">
            <strong>${escapeHtml(a.escola || 'Escola')}</strong> - ${escapeHtml(a.local || 'Local')}
            <br>
            <small>${new Date(a.data).toLocaleString()}</small>
            <div class="grid-2" style="margin-top:0.5rem;">
              <button class="btn-secondary continuarBtn" data-id="${a.id}">Continuar</button>
              <button class="btn-outline deletarBtn" data-id="${a.id}">Deletar</button>
              <button class="btn-outline relatorioBtn btn-relatorio-dashboard" data-id="${a.id}" ${Number(a.progresso || 0) < (INDICE_ULTIMA_PERGUNTA_PROGRESSO + 1) ? 'disabled aria-disabled="true" style="opacity:0.6;pointer-events:none;"' : ''}>📄 Relatório</button>
            </div>
          </div>
        `).join('')
      }
    </div>
  `;

  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = html;

  document.getElementById('novaAvaliacaoBtn')?.addEventListener('click', iniciarNovaAvaliacao);

  document.querySelectorAll('.continuarBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.getAttribute('data-id'), 10);
      if (!isNaN(id)) await continuarAvaliacao(id);
    });
  });

  document.querySelectorAll('.deletarBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.getAttribute('data-id'), 10);
      if (isNaN(id)) return;
      if (!confirm('Remover avaliação?')) return;
      await deletarAvaliacao(id);
      await renderDashboard();
    });
  });

  document.querySelectorAll('.relatorioBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      const id = parseInt(btn.getAttribute('data-id'), 10);
      if (!isNaN(id)) await mostrarMenuRelatorio(id);
    });
  });
}

async function iniciarNovaAvaliacao() {
  let escola = '';
  while (!escola || !escola.trim()) {
    const valor = prompt('Nome da escola:');
    if (valor === null) return;
    escola = valor.trim();
    if (!escola) alert('O nome da escola é obrigatório.');
  }

  let local = '';
  while (!local || !local.trim()) {
    const valor = prompt('Local avaliado (ex: pátio/parque):');
    if (valor === null) return;
    local = valor.trim();
    if (!local) alert('O local avaliado é obrigatório.');
  }

  const nova = {
    escola,
    local,
    data: new Date().toISOString(),
    concluida: false,
    progresso: 0
  };

  const id = await salvarAvaliacao(nova);
  currentAvaliacao = { ...nova, id };
  respostasMap = new Map();
  limparMudancaPendente();
  await renderFormulario();
}

async function continuarAvaliacao(id) {
    const avaliacoes = await listarAvaliacoes();
    currentAvaliacao = avaliacoes.find(a => a.id === id);
    
    if (!currentAvaliacao) {
        alert('Avaliação não encontrada.');
        await renderDashboard();
        return;
    }
    
    const respostasCarregadas = await carregarRespostas(id);
    const novoMap = new Map();
    
    if (Array.isArray(respostasCarregadas)) {
        for (const item of respostasCarregadas) {
            if (item.perguntaId) {
                const normalizada = normalizarResposta(item);
                novoMap.set(String(item.perguntaId), normalizada);
            }
        }
    } 
    else if (respostasCarregadas && typeof respostasCarregadas === 'object') {
        for (const [key, value] of Object.entries(respostasCarregadas)) {
            novoMap.set(String(key), normalizarResposta(value));
        }
    }
    
    respostasMap = novoMap;
    await renderFormulario();
    atualizarProgresso();
    limparMudancaPendente();
}

// ========== CORREÇÃO: ADIÇÃO DE MÚLTIPLAS IMAGENS SEM RECARREGAR TUDO ==========
async function adicionarImagens(perguntaId, maxPorPergunta = 5) {
    const resposta = getRespostaAtual(perguntaId);
    let imagensAtuais = Array.isArray(resposta.imagens) ? [...resposta.imagens] : [];
    
    if (imagensAtuais.length >= maxPorPergunta) {
        alert(`Esta pergunta já tem o máximo de ${maxPorPergunta} imagens.`);
        return;
    }

    // Contar imagens já existentes no app inteiro
    const totalAtual = contarTotalImagens();
    const limiteGlobal = 105; // 21 perguntas x 5 imagens
    const vagasRestantes = limiteGlobal - totalAtual;
    
    if (vagasRestantes <= 0) {
        alert(`Limite total de ${limiteGlobal} imagens atingido. Remova algumas fotos antes de adicionar novas.`);
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async e => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Verifica limite por pergunta novamente (pode ter mudado)
        if (imagensAtuais.length >= maxPorPergunta) {
            alert(`Esta pergunta já tem o máximo de ${maxPorPergunta} imagens.`);
            return;
        }

        const totalDesejado = imagensAtuais.length + files.length;
        if (totalDesejado > maxPorPergunta) {
            alert(`Você pode adicionar no máximo ${maxPorPergunta} imagens por pergunta. Atualmente ${imagensAtuais.length}.`);
            return;
        }

        // Verifica limite global novamente
        const novoTotal = totalAtual + files.length;
        if (novoTotal > limiteGlobal) {
            alert(`Você excederia o limite total de ${limiteGlobal} imagens. Remova algumas fotos antes de adicionar.`);
            return;
        }

        // Processa cada arquivo
        for (const file of files) {
            // O alerta foi removido, a imagem será redimensionada mesmo se for maior que 2MB.
// (nenhum código aqui)
            try {
                const base64 = await redimensionarImagem(file, 1600, 0.9);
                imagensAtuais.push(base64);
            } catch (err) {
                console.error('Erro ao processar imagem:', err);
                alert(`Erro ao processar ${file.name}.`);
            }
        }

        if (imagensAtuais.length > (resposta.imagens?.length || 0)) {
            resposta.imagens = imagensAtuais;
            respostasMap.set(perguntaId, resposta);
            if (currentAvaliacao?.id) {
                await salvarResposta(currentAvaliacao.id, perguntaId, resposta);
            }
            marcarMudancaPendente();
            atualizarListaImagens(perguntaId);
            const btn = document.querySelector(`.img-btn-multi[data-id="${perguntaId}"]`);
            if (btn) {
                btn.textContent = imagensAtuais.length ? '📷 Nova Foto' : '📷 Adicionar Foto';
            }
            atualizarProgresso();
        }
    };

    input.click();
}

// Atualiza apenas a lista de imagens de uma pergunta específica
function atualizarListaImagens(perguntaId) {
    const resposta = getRespostaAtual(perguntaId);
    const imagens = resposta.imagens || [];
    const container = document.querySelector(`.question-group[data-id="${perguntaId}"]`);
    if (!container) return;

    // Remove a lista de imagens antiga, se existir
    const oldImgList = container.querySelector('.img-list');
    if (oldImgList) oldImgList.remove();

    if (imagens.length) {
        const imgListDiv = document.createElement('div');
        imgListDiv.className = 'img-list';
        imgListDiv.id = `img-list-${perguntaId}`;
        imagens.forEach((img, idx) => {
            const div = document.createElement('div');
            div.className = 'img-item';
            div.innerHTML = `
                <img src="${img}" class="image-preview" style="max-width:100px; margin:5px;">
                <button class="remove-img" data-id="${perguntaId}" data-idx="${idx}">❌ Remover foto</button>
            `;
            imgListDiv.appendChild(div);
        });
        // Insere antes do botão de adicionar imagem
        const btn = container.querySelector('.img-btn-multi');
        if (btn) {
            container.insertBefore(imgListDiv, btn);
        } else {
            container.appendChild(imgListDiv);
        }
        // Reatribui eventos de remoção
        imgListDiv.querySelectorAll('.remove-img').forEach(btnRm => {
            btnRm.addEventListener('click', async (e) => {
                const idx = parseInt(btnRm.dataset.idx, 10);
                const resp = getRespostaAtual(perguntaId);
                const novas = [...resp.imagens];
                if (idx >= 0 && idx < novas.length) {
                    novas.splice(idx, 1);
                    resp.imagens = novas;
                    respostasMap.set(perguntaId, resp);
                    if (currentAvaliacao?.id) {
                        await salvarResposta(currentAvaliacao.id, perguntaId, resp);
                    }
                    marcarMudancaPendente();
                    atualizarListaImagens(perguntaId);
                    const btnImg = document.querySelector(`.img-btn-multi[data-id="${perguntaId}"]`);
                    if (btnImg) btnImg.textContent = novas.length ? '📷 Nova Foto' : '📷 Adicionar Foto';
                    atualizarProgresso();
                }
            });
        });
    }
}

async function redimensionarImagem(file, maxWidth = 1200, qualidade = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', qualidade);
                resolve(base64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderInputPergunta(item, respostaSalva) {
  const resposta = normalizarResposta(respostaSalva);
  const valor = resposta.valor;
  const imagens = resposta.imagens;
  const obsValor = resposta.observacao;
  const outroValor = resposta.outroTexto;

  let html = `
    <div class="question-group" data-id="${item.id}">
      <div class="question-text">${escapeHtml(item.texto)}</div>
  `;

  if (item.tipo === 'boolean') {
    html += `
      <div class="radio-group">
        <label><input type="radio" name="${item.id}" value="sim" ${valor === 'sim' ? 'checked' : ''}> Sim</label>
        <label><input type="radio" name="${item.id}" value="nao" ${valor === 'nao' ? 'checked' : ''}> Não</label>
      </div>
    `;
    if (item.observacao) {
      html += `
        <textarea class="obs-text" data-id="${item.id}" placeholder="Descreva os obstáculos/riscos..." rows="2">${escapeHtml(obsValor)}</textarea>
      `;
    }
  } else if (['escala3', 'escala3comNA', 'escala3simples'].includes(item.tipo)) {
    html += `
      <div class="radio-group">
        ${item.opcoes.map(op => `
          <label><input type="radio" name="${item.id}" value="${escapeHtmlAttr(op)}" ${valor === op ? 'checked' : ''}> ${escapeHtml(op)}</label>
        `).join('')}
      </div>
    `;
  } else if (item.tipo === 'select') {
    html += `
      <select id="sel-${item.id}">
        <option value="">Selecione</option>
        ${item.opcoes.map(op => `
          <option value="${escapeHtmlAttr(op)}" ${valor === op ? 'selected' : ''}>${escapeHtml(op)}</option>
        `).join('')}
      </select>
    `;

    if (valor === 'Outro') {
      html += `
        <input
          type="text"
          id="outro-${item.id}"
          placeholder="Especifique outro tipo de piso"
          value="${escapeHtmlAttr(outroValor)}"
          style="margin-top:0.5rem;"
        >
      `;
    }
  } else if (item.tipo === 'text') {
    html += `<textarea id="txt-${item.id}" rows="3">${escapeHtml(valor)}</textarea>`;
  } else if (item.tipo === 'imagemMultipla') {
    html += `<div id="img-list-${item.id}" class="img-list">`;
    if (imagens.length) {
        imagens.forEach((img, idx) => {
            html += `<div class="img-item">
                <img src="${img}" class="image-preview" style="max-width:100px; margin:5px;">
                <button class="remove-img" data-id="${item.id}" data-idx="${idx}">❌ Remover foto</button>
            </div>`;
        });
    }
    html += `</div>
        <button class="img-btn-multi" data-id="${item.id}">
            ${imagens.length ? '📷 Nova Foto' : '📷 Adicionar Foto'}
        </button>`;
  }

  if (item.tipo !== 'imagemMultipla') {
    if (imagens.length) {
      html += `<div id="img-list-${item.id}" class="img-list">`;
      imagens.forEach((img, idx) => {
        html += `<div class="img-item">
            <img src="${img}" class="image-preview" style="max-width:100px; margin:5px;">
            <button class="remove-img" data-id="${item.id}" data-idx="${idx}">❌ Remover foto</button>
        </div>`;
      });
      html += `</div>`;
    }
    const btnText = imagens.length ? '📷 Nova Foto' : '📷 Adicionar Foto';
    html += `<button class="img-btn-multi" data-id="${item.id}">${btnText}</button>`;
  }

  html += `<button class="speak-btn" data-text="${escapeHtmlAttr(item.texto)}">🔊 Ouvir</button>`;
  html += `</div>`;

  return html;
}

async function renderFormulario() {
  const perguntasPorCategoria = agruparPerguntasPorCategoria();
  const totalItens = INDICE_ULTIMA_PERGUNTA_PROGRESSO + 1;
  const respondidos = contarRespostasPreenchidas();
  const percent = totalItens ? (respondidos / totalItens) * 100 : 0;
  const podeRelatorio = respondidos === totalItens;

  let html = `
    <div class="card">
      <h2>${escapeHtml(currentAvaliacao?.escola || '')} - ${escapeHtml(currentAvaliacao?.local || '')}</h2>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>
      <div class="progress-text">Progresso: ${respondidos}/${totalItens}</div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button id="salvarBtnTop" class="btn-secondary">💾 Salvar Respostas</button>
        <button id="finalizarBtnTop" class="btn-primary btn-finalizar-relatorio" ${!podeRelatorio ? 'disabled aria-disabled="true" style="opacity:0.6;pointer-events:none;"' : ''}>📋 Finalizar e ver Relatório</button>
      </div>
    </div>
  `;

  for (const categoria in perguntasPorCategoria) {
    html += `<div class="card"><h3>${escapeHtml(categoria)}</h3>`;
    for (const item of perguntasPorCategoria[categoria]) {
      const respostaSalva = respostasMap.get(item.id);
      html += renderInputPergunta(item, respostaSalva);
    }
    html += `</div>`;
  }

  html += `
    <div class="card">
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button id="salvarBtnBottom" class="btn-secondary">💾 Salvar Respostas</button>
        <button id="finalizarBtnBottom" class="btn-primary btn-finalizar-relatorio" ${!podeRelatorio ? 'disabled aria-disabled="true" style="opacity:0.6;pointer-events:none;"' : ''}>📋 Finalizar e ver Relatório</button>
      </div>
    </div>
  `;

  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = html;

  bindFormularioEventos();

  document.getElementById('salvarBtnTop')?.addEventListener('click', salvarTodasRespostas);
  document.getElementById('salvarBtnBottom')?.addEventListener('click', salvarTodasRespostas);

  document.getElementById('finalizarBtnTop')?.addEventListener('click', async () => {
    if (!formularioCompletoParaRelatorio()) return;
    await salvarTodasRespostas();
    await mostrarMenuRelatorio(currentAvaliacao.id, respostasMap);
  });

  document.getElementById('finalizarBtnBottom')?.addEventListener('click', async () => {
    if (!formularioCompletoParaRelatorio()) return;
    await salvarTodasRespostas();
    await mostrarMenuRelatorio(currentAvaliacao.id, respostasMap);
  });

  atualizarProgresso();
}

function bindFormularioEventos() {
  for (const item of PROTOCOLO_ITENS) {
    if (item.tipo === 'boolean' || ['escala3', 'escala3comNA', 'escala3simples'].includes(item.tipo)) {
      document.querySelectorAll(`input[name="${item.id}"]`).forEach(radio => {
        radio.addEventListener('change', async e => {
          const resposta = getRespostaAtual(item.id);
          resposta.valor = e.target.value;
          respostasMap.set(item.id, resposta);
          if (currentAvaliacao?.id) {
            await salvarResposta(currentAvaliacao.id, item.id, resposta);
          }
          marcarMudancaPendente();
          atualizarProgresso();
        });
      });
    }

    if (item.observacao) {
      const obsText = document.querySelector(`.obs-text[data-id="${item.id}"]`);
      if (obsText) {
        obsText.addEventListener('blur', async e => {
          const resposta = getRespostaAtual(item.id);
          resposta.observacao = e.target.value;
          respostasMap.set(item.id, resposta);
          if (currentAvaliacao?.id) {
            await salvarResposta(currentAvaliacao.id, item.id, resposta);
          }
          marcarMudancaPendente();
          atualizarProgresso();
        });
      }
    }

    if (item.tipo === 'select') {
      const sel = document.getElementById(`sel-${item.id}`);
      if (sel) {
        sel.addEventListener('change', async e => {
          const resposta = getRespostaAtual(item.id);
          resposta.valor = e.target.value;
          if (resposta.valor !== 'Outro') resposta.outroTexto = '';
          respostasMap.set(item.id, resposta);
          if (currentAvaliacao?.id) {
            await salvarResposta(currentAvaliacao.id, item.id, resposta);
          }
          marcarMudancaPendente();

          if (resposta.valor === 'Outro' || document.getElementById(`outro-${item.id}`)) {
            await renderFormulario();
          } else {
            atualizarProgresso();
          }
        });
      }

      const outroInput = document.getElementById(`outro-${item.id}`);
      if (outroInput) {
        outroInput.addEventListener('blur', async e => {
          const resposta = getRespostaAtual(item.id);
          resposta.outroTexto = e.target.value;
          respostasMap.set(item.id, resposta);
          if (currentAvaliacao?.id) {
            await salvarResposta(currentAvaliacao.id, item.id, resposta);
          }
          marcarMudancaPendente();
          atualizarProgresso();
        });
      }
    }

    if (item.tipo === 'text') {
      const txt = document.getElementById(`txt-${item.id}`);
      if (txt) {
        txt.addEventListener('blur', async e => {
          const resposta = getRespostaAtual(item.id);
          resposta.valor = e.target.value;
          respostasMap.set(item.id, resposta);
          if (currentAvaliacao?.id) {
            await salvarResposta(currentAvaliacao.id, item.id, resposta);
          }
          marcarMudancaPendente();
          atualizarProgresso();
        });
      }
    }

    // Botões de adicionar imagem (classe unificada)
    document.querySelectorAll(`.img-btn-multi[data-id="${item.id}"]`).forEach(btn => {
        btn.onclick = () => adicionarImagens(item.id, 5);
    });

    // Botões de remover imagem (tratamento para os que já existem no HTML)
    document.querySelectorAll(`.remove-img[data-id="${item.id}"]`).forEach(btnRm => {
        btnRm.addEventListener('click', async (e) => {
            const idx = parseInt(btnRm.dataset.idx, 10);
            const resposta = getRespostaAtual(item.id);
            const novas = [...resposta.imagens];
            if (idx >= 0 && idx < novas.length) {
                novas.splice(idx, 1);
                resposta.imagens = novas;
                respostasMap.set(item.id, resposta);
                if (currentAvaliacao?.id) {
                    await salvarResposta(currentAvaliacao.id, item.id, resposta);
                }
                marcarMudancaPendente();
                atualizarListaImagens(item.id);
                const btn = document.querySelector(`.img-btn-multi[data-id="${item.id}"]`);
                if (btn) btn.textContent = novas.length ? '📷 Nova Foto' : '📷 Adicionar Foto';
                atualizarProgresso();
            }
        });
    });
  }

  document.querySelectorAll('.speak-btn').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const texto = btn.getAttribute('data-text') || '';
      const utterance = new SpeechSynthesisUtterance(texto);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };
  });
}

function pontuarItem(item, valor) {
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

  if (item.tipo === 'select') {
    if (valor === 'Regular e firme') return { obtidos: 2, possiveis: 2 };
    if (valor === 'Outro') return { obtidos: 1, possiveis: 2 };
    return { obtidos: 0, possiveis: 2 };
  }

  return { obtidos: 0, possiveis: 0 };
}

function calcularPontuacao(respostasMapLocal) {
  let pontosObtidos = 0;
  let pontosPossiveis = 0;

  for (const item of PROTOCOLO_ITENS) {
    const resp = normalizarResposta(respostasMapLocal.get(item.id));
    const valor = resp.valor;
    const { obtidos, possiveis } = pontuarItem(item, valor);
    pontosObtidos += obtidos;
    pontosPossiveis += possiveis;
  }

  const percent = pontosPossiveis ? (pontosObtidos / pontosPossiveis) * 100 : 0;
  const classificacao = percent >= 80 ? 'Adequado' : percent >= 50 ? 'Intermediário' : 'Crítico';
  return { percent, classificacao, pontosObtidos, pontosPossiveis };
}

async function gerarHtmlRelatorioCompleto(aval, respostasMapLocal, percent, classificacao) {
  let html = `
    <div id="report-container" style="padding:1rem; font-family:sans-serif; background:white; color:black;">
      <h1>Relatório de Acessibilidade - Protocolo Corrêa</h1>
      <p><strong>Escola:</strong> ${escapeHtml(aval?.escola || '')}</p>
      <p><strong>Local:</strong> ${escapeHtml(aval?.local || '')}</p>
      <p><strong>Data:</strong> ${new Date(aval?.data || Date.now()).toLocaleString()}</p>
      <p><strong>Classificação:</strong> ${escapeHtml(classificacao)} (${Number(percent || 0).toFixed(1)}%)</p>
      <h2>Respostas detalhadas</h2>
  `;

  for (const item of PROTOCOLO_ITENS) {
    const resp = normalizarResposta(respostasMapLocal.get(item.id));
    const valorTexto = resp.valor && resp.valor.trim() !== '' ? resp.valor : 'Não respondido';

    html += `
      <div style="margin-bottom:12px;">
        <p><strong>${escapeHtml(item.texto)}</strong><br>Resposta: ${escapeHtml(valorTexto)}</p>
    `;

    if (resp.observacao && resp.observacao.trim()) {
      html += `<p><em>Observação:</em> ${escapeHtml(resp.observacao)}</p>`;
    }

    if (resp.outroTexto && resp.outroTexto.trim()) {
      html += `<p><em>Especificação:</em> ${escapeHtml(resp.outroTexto)}</p>`;
    }

    if (Array.isArray(resp.imagens) && resp.imagens.length) {
      resp.imagens.forEach(img => {
        html += `<div><img src="${img}" style="width:80%; max-width:600px; height:auto; margin:10px auto; display:block;">
        </div>`;
      });
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ========== CORREÇÃO: COMPARTILHAMENTO DE PDF (em vez de texto) ==========
async function gerarPDFBlob(htmlContent) {
    return new Promise((resolve, reject) => {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = '-9999px';
        div.style.top = '0';
        div.style.width = '800px';
        div.innerHTML = htmlContent;
        document.body.appendChild(div);

        const element = div.querySelector('#report-container');
        const opt = {
            margin: 0.5,
            filename: 'temp.pdf',
            html2canvas: { scale: 1.5, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).outputPdf('blob').then(blob => {
            document.body.removeChild(div);
            resolve(blob);
        }).catch(err => {
            document.body.removeChild(div);
            reject(err);
        });
    });
}

async function compartilharPDF(aval, respostasMapLocal, percent, classificacao, nomeBotao) {
    const htmlRelatorio = await gerarHtmlRelatorioCompleto(aval, respostasMapLocal, percent, classificacao);
    try {
        const blob = await gerarPDFBlob(htmlRelatorio);
        const file = new File([blob], `relatorio_${aval.escola.replace(/[^a-z0-9]/gi, '_')}.pdf`, { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Relatório de Acessibilidade',
                text: `Relatório da avaliação em ${aval.escola} - ${aval.local}`,
                files: [file]
            });
        } else {
            // Fallback: download do PDF
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_${aval.escola.replace(/[^a-z0-9]/gi, '_')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
            alert('PDF gerado! Use o menu de compartilhamento do seu dispositivo para enviar.');
        }
    } catch (error) {
        console.error('Erro ao compartilhar PDF:', error);
        alert('Não foi possível compartilhar o PDF. Tente baixar e enviar manualmente.');
    }
}

// Funções antigas substituídas: agora chamam compartilharPDF
async function compartilharWhatsAppComDados(aval, respostasMapLocal, percent, classificacao) {
    await compartilharPDF(aval, respostasMapLocal, percent, classificacao, 'WhatsApp');
}

async function compartilharEmailComDados(aval, respostasMapLocal, percent, classificacao) {
    await compartilharPDF(aval, respostasMapLocal, percent, classificacao, 'E-mail');
}

async function gerarPDFComDados(htmlContent, nomeEscola) {
    try {
        const blob = await gerarPDFBlob(htmlContent);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${String(nomeEscola || 'escola').replace(/[^\w\-]+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
    }
}

function dataURLParaFile(dataUrl, nomeArquivo) {
    const [meta, base64] = dataUrl.split(',');
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binStr = atob(base64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binStr.charCodeAt(i);
    }

    return new File([bytes], nomeArquivo, { type: mime });
}

function extrairArquivosDeImagem(respostasMapLocal) {
    const arquivos = [];
    let contador = 1;

    for (const item of PROTOCOLO_ITENS) {
        const resp = normalizarResposta(respostasMapLocal.get(item.id));

        if (Array.isArray(resp.imagens) && resp.imagens.length) {
            resp.imagens.forEach(img => {
                arquivos.push(dataURLParaFile(img, `foto-${contador++}.jpg`));
            });
        }
    }

    return arquivos;
}

async function obterAvaliacaoPorId(id) {
  const avaliacoes = await listarAvaliacoes();
  return avaliacoes.find(a => a.id === id);
}

async function mostrarMenuRelatorio(idAvaliacao, respostasMapParam = null) {
    try {
        const aval = await obterAvaliacaoPorId(idAvaliacao);
        if (!aval) {
            alert('Avaliação não encontrada para gerar relatório.');
            return;
        }
        
        let respostasMapTemp;
        if (respostasMapParam) {
            respostasMapTemp = new Map();
            for (const [key, value] of respostasMapParam.entries()) {
                respostasMapTemp.set(key, normalizarResposta(value));
            }
        } else {
            const respostasBrutas = await carregarRespostas(idAvaliacao);
            respostasMapTemp = new Map();
            if (Array.isArray(respostasBrutas)) {
                for (const item of respostasBrutas) {
                    if (item.perguntaId) {
                        respostasMapTemp.set(String(item.perguntaId), normalizarResposta(item));
                    }
                }
            } else if (respostasBrutas && typeof respostasBrutas === 'object') {
                for (const [key, value] of Object.entries(respostasBrutas)) {
                    respostasMapTemp.set(String(key), normalizarResposta(value));
                }
            }
        }
        
        let respondidos = 0;
        for (let i = 0; i <= INDICE_ULTIMA_PERGUNTA_PROGRESSO; i++) {
            const item = PROTOCOLO_ITENS[i];
            const resp = normalizarResposta(respostasMapTemp.get(item.id));
            if (item.id === 'obs1') {
                const temTexto = resp.valor && resp.valor.trim() !== '';
                const temImagens = Array.isArray(resp.imagens) && resp.imagens.length > 0;
                if (temTexto || temImagens) respondidos++;
            } else {
                if (resp.valor && resp.valor.trim() !== '') respondidos++;
            }
        }
        
        const totalItens = INDICE_ULTIMA_PERGUNTA_PROGRESSO + 1;
        if (respondidos !== totalItens) {
            alert(`O relatório só pode ser gerado após o preenchimento dos ${totalItens} itens. (Atualmente: ${respondidos}/${totalItens})`);
            return;
        }
        
        const { percent, classificacao } = calcularPontuacao(respostasMapTemp);
        const htmlRelatorio = await gerarHtmlRelatorioCompleto(aval, respostasMapTemp, percent, classificacao);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Opções do Relatório</h3>
                <button id="btnPdf" class="btn-primary" style="margin:0.5rem 0;">📄 Baixar PDF</button>
                <button id="btnWhatsapp" class="btn-primary" style="margin:0.5rem 0;">📱 Compartilhar PDF (WhatsApp)</button>
                <button id="btnEmail" class="btn-primary" style="margin:0.5rem 0;">✉️ Compartilhar PDF (E-mail)</button>
                <button id="fecharModalRel" class="btn-outline">Fechar</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('btnPdf').onclick = async () => {
            await gerarPDFComDados(htmlRelatorio, aval.escola);
            modal.remove();
        };
        document.getElementById('btnWhatsapp').onclick = async () => {
            await compartilharWhatsAppComDados(aval, respostasMapTemp, percent, classificacao);
            modal.remove();
        };
        document.getElementById('btnEmail').onclick = async () => {
            await compartilharEmailComDados(aval, respostasMapTemp, percent, classificacao);
            modal.remove();
        };
        document.getElementById('fecharModalRel').onclick = () => modal.remove();
        
    } catch (error) {
        console.error('Erro ao abrir menu de relatório:', error);
        alert('Erro ao abrir o relatório. Verifique os dados salvos e tente novamente.');
    }
}

function mostrarConfiguracoes() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Configurações</h2>
      <label>Tema:</label>
      <select id="temaSelect">
        <option value="claro">Claro</option>
        <option value="dark">Escuro</option>
        <option value="high-contrast">Alto Contraste</option>
        <option value="low-vision">Baixa Visão</option>
        <option value="daltonism">Daltonismo</option>
      </select>
      <div class="slider-font">
        <label>Tamanho da fonte:</label>
        <input type="range" id="fontSlider" min="100" max="200" step="5" value="100">
        <span id="fontValue">100%</span>
      </div>
      <button id="salvarConfig" class="btn-primary">Salvar</button>
      <button id="fecharModal" class="btn-outline">Fechar</button>
    </div>
  `;
  document.body.appendChild(modal);

  const temaSelect = document.getElementById('temaSelect');
  const fontSlider = document.getElementById('fontSlider');
  const fontValue = document.getElementById('fontValue');

  temaSelect.value = localStorage.getItem('tema') || 'claro';
  fontSlider.value = localStorage.getItem('fontSize') || '100';
  fontValue.innerText = `${fontSlider.value}%`;

  fontSlider.oninput = () => {
    fontValue.innerText = `${fontSlider.value}%`;
  };

  document.getElementById('salvarConfig').onclick = () => {
    localStorage.setItem('tema', temaSelect.value);
    localStorage.setItem('fontSize', fontSlider.value);
    aplicarConfiguracoes();
    modal.remove();
  };

  document.getElementById('fecharModal').onclick = () => modal.remove();
}

function aplicarConfiguracoes() {
  const tema = localStorage.getItem('tema') || 'claro';
  const fontSize = localStorage.getItem('fontSize') || '100';

  document.body.className = `theme-${tema}`;
  document.body.style.fontSize = `${fontSize}%`;

  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAttr(str) {
  return escapeHtml(str);
}

init();
