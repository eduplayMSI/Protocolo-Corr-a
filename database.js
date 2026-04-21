// database.js - Persistência com IndexedDB (suporta muitas imagens)
const DB_NAME = 'ProtocoloCorreaDB';
const DB_VERSION = 1;
const STORE_AVALIACOES = 'avaliacoes';
const STORE_RESPOSTAS = 'respostas';

let db = null;

// Abre (ou cria) o banco de dados IndexedDB
async function openDB() {
    return new Promise((resolve, reject) => {
        if (db && db.name === DB_NAME) {
            resolve(true);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Erro ao abrir IndexedDB:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB aberto com sucesso');
            resolve(true);
        };

        request.onupgradeneeded = (event) => {
            const dbUpgrade = event.target.result;
            
            // Store de avaliações (chave primária = id)
            if (!dbUpgrade.objectStoreNames.contains(STORE_AVALIACOES)) {
                const storeAvaliacoes = dbUpgrade.createObjectStore(STORE_AVALIACOES, { keyPath: 'id', autoIncrement: true });
                storeAvaliacoes.createIndex('data', 'data', { unique: false });
            }
            
            // Store de respostas (chave composta: [idAvaliacao, perguntaId])
            if (!dbUpgrade.objectStoreNames.contains(STORE_RESPOSTAS)) {
                const storeRespostas = dbUpgrade.createObjectStore(STORE_RESPOSTAS, { keyPath: ['idAvaliacao', 'perguntaId'] });
                storeRespostas.createIndex('idAvaliacao', 'idAvaliacao', { unique: false });
                storeRespostas.createIndex('perguntaId', 'perguntaId', { unique: false });
            }
        };
    });
}

// Lista todas as avaliações
async function listarAvaliacoes() {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_AVALIACOES, 'readonly');
        const store = transaction.objectStore(STORE_AVALIACOES);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Salva uma avaliação (nova ou atualização)
async function salvarAvaliacao(avaliacao) {
    if (!db) await openDB();
    return new Promise(async (resolve, reject) => {
        const transaction = db.transaction(STORE_AVALIACOES, 'readwrite');
        const store = transaction.objectStore(STORE_AVALIACOES);
        
        let dados = { ...avaliacao };
        
        if (!dados.id) {
            // Nova avaliação: o ID será gerado automaticamente
            const request = store.add(dados);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = () => reject(request.error);
        } else {
            // Atualização: usa put (substitui pelo mesmo ID)
            const request = store.put(dados);
            request.onsuccess = () => resolve(dados.id);
            request.onerror = () => reject(request.error);
        }
    });
}

// Deleta uma avaliação e todas as suas respostas
async function deletarAvaliacao(id) {
    if (!db) await openDB();
    
    // Deleta a avaliação
    const txAvaliacao = db.transaction(STORE_AVALIACOES, 'readwrite');
    const storeAvaliacao = txAvaliacao.objectStore(STORE_AVALIACOES);
    storeAvaliacao.delete(id);
    
    // Deleta todas as respostas associadas
    const txRespostas = db.transaction(STORE_RESPOSTAS, 'readwrite');
    const storeRespostas = txRespostas.objectStore(STORE_RESPOSTAS);
    const index = storeRespostas.index('idAvaliacao');
    const range = IDBKeyRange.only(id);
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            storeRespostas.delete(cursor.primaryKey);
            cursor.continue();
        }
    };
    
    return new Promise((resolve) => {
        txAvaliacao.oncomplete = () => resolve();
        txAvaliacao.onerror = () => resolve();
    });
}

// Salva a resposta de uma pergunta específica
async function salvarResposta(idAvaliacao, perguntaId, resposta) {
    if (!db) await openDB();
    
    const dados = {
        idAvaliacao: Number(idAvaliacao),
        perguntaId: String(perguntaId),
        valor: resposta.valor || '',
        observacao: resposta.observacao || '',
        outroTexto: resposta.outroTexto || '',
        imagens: Array.isArray(resposta.imagens) ? resposta.imagens : [],
        timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_RESPOSTAS, 'readwrite');
        const store = transaction.objectStore(STORE_RESPOSTAS);
        const request = store.put(dados);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Carrega todas as respostas de uma avaliação (retorna array)
async function carregarRespostas(idAvaliacao) {
    if (!db) await openDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_RESPOSTAS, 'readonly');
        const store = transaction.objectStore(STORE_RESPOSTAS);
        const index = store.index('idAvaliacao');
        const range = IDBKeyRange.only(Number(idAvaliacao));
        const request = index.openCursor(range);
        
        const respostas = [];
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                respostas.push(cursor.value);
                cursor.continue();
            } else {
                resolve(respostas);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

// Limpa todos os dados do aplicativo (útil para testes)
async function limparTodosDados() {
    if (!db) await openDB();
    
    const txAvaliacao = db.transaction(STORE_AVALIACOES, 'readwrite');
    const txRespostas = db.transaction(STORE_RESPOSTAS, 'readwrite');
    
    txAvaliacao.objectStore(STORE_AVALIACOES).clear();
    txRespostas.objectStore(STORE_RESPOSTAS).clear();
    
    return Promise.all([
        new Promise(resolve => { txAvaliacao.oncomplete = resolve; }),
        new Promise(resolve => { txRespostas.oncomplete = resolve; })
    ]);
}