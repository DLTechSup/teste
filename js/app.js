// Núcleo: sessão, dados, tempo real, rotas e moldura da aplicação.
import { lerItem, aguardandoCodigo, codigoPronto, temPendencia, faltaAtacado } from './regras.js';
import { html, raw, icone, iniciais, aviso, erro, bip } from './ui.js';
import { abrirEditor, carregando } from './componentes.js';
import { NOME_LOJA } from './config.js';
import telaLogin from './views/login.js';
import painel from './views/painel.js';
import cadastro from './views/cadastro.js';
import listas from './views/listas.js';
import equipe from './views/equipe.js';
import loja from './views/loja.js';

const DEMO = new URLSearchParams(location.search).has('demo');
const banco = DEMO ? (await import('./demo.js')).criarBancoDemo() : (await import('./db.js')).criarBanco();

const ROTAS = {
  admin: [
    { id: 'painel', titulo: 'Painel', icone: 'painel', tela: painel },
    { id: 'cadastro', titulo: 'Cadastro', icone: 'mais', tela: cadastro },
    { grupo: 'Fluxo' },
    { id: 'recebidos', titulo: 'Códigos recebidos', icone: 'sino', tela: listas.recebidos, conta: codigoPronto, alerta: true },
    { id: 'aguardando', titulo: 'Aguardando código', icone: 'relogio', tela: listas.aguardando, conta: aguardandoCodigo },
    { id: 'pendencias', titulo: 'Pendências', icone: 'alerta', tela: listas.pendencias, conta: temPendencia },
    { id: 'finalizados', titulo: 'Finalizados', icone: 'feito', tela: listas.finalizados, conta: faltaAtacado, dica: 'faltando atacado' },
    { grupo: 'Gestão' },
    { id: 'arquivados', titulo: 'Arquivados', icone: 'arquivo', tela: listas.arquivados },
    { id: 'equipe', titulo: 'Equipe', icone: 'equipe', tela: equipe },
  ],
  loja: [
    { id: 'loja', titulo: 'Enviar códigos', icone: 'loja', tela: loja.codigos, conta: aguardandoCodigo },
    { id: 'loja-pendencias', titulo: 'Pendências', icone: 'alerta', tela: loja.pendencias, conta: temPendencia },
  ],
};

const estado = { sessao: null, linhas: new Map(), carregado: false, erro: null, aoVivo: false, menu: false };
let raiz, segurar = 0, renderPendente = false, rotaAnterior = null;

const itens = () => [...estado.linhas.values()].map(lerItem);
const papel = () => estado.sessao?.perfil.papel || 'loja';
const rotasDoPapel = () => ROTAS[papel()].filter((r) => r.id);
const autor = () => estado.sessao?.perfil.nome || estado.sessao?.user.email;

function rotaAtual() {
  const [id, ...resto] = location.hash.replace(/^#\/?/, '').split('/');
  const r = rotasDoPapel().find((x) => x.id === id) || rotasDoPapel()[0];
  return { ...r, params: resto.map(decodeURIComponent) };
}

// ---------- Ações sobre os dados (usadas pelas telas) ----------
function aplicar(linha) { estado.linhas.set(linha.id, linha); pedirRender(); }

const ctx = {
  get itens() { return itens(); },
  get papel() { return papel(); },
  get perfil() { return estado.sessao?.perfil; },
  get carregado() { return estado.carregado; },
  demo: DEMO,
  banco,
  ir: (h) => (location.hash = h),
  async alterar(id, mudancas) { const l = await banco.alterar(id, mudancas, autor()); aplicar(l); return l; },
  async inserir(doc) { const l = await banco.inserir({ ...doc, atualizadoPor: autor() }); aplicar(l); return l; },
  async enviarFoto(arquivo) {
    const { comprimirImagem } = DEMO ? { comprimirImagem: async (a) => a } : await import('./db.js');
    return banco.enviarFoto(await comprimirImagem(arquivo));
  },
  abrirItem(id) { const l = estado.linhas.get(id); if (l) abrirEditor(lerItem(l), ctx); },
  // Segura re-renderizações durante uma animação de saída
  async segurando(fn) { segurar++; try { return await fn(); } finally { segurar--; pedirRender(); } },
};

// ---------- Tempo real ----------
function aoMudar(linha) {
  const antes = estado.linhas.get(linha.id);
  const a = antes && lerItem(antes);
  const d = lerItem(linha);
  estado.linhas.set(linha.id, linha);
  const meu = linha.doc?.atualizadoPor && linha.doc.atualizadoPor === autor();
  if (!meu) {
    if (papel() === 'admin' && d.etapa === 'recebido' && a?.etapa !== 'recebido') {
      aviso(`Código recebido · ${d.marca}`, raw(`<div class="mono">${d.ref} → ${d.codigo}</div>`), 'sino', 8000);
      bip();
      document.title = '● Código recebido — ShoeFlow';
    } else if (papel() === 'loja' && !a && aguardandoCodigo(d)) {
      aviso('Nova referência para código', `${d.marca} · ${d.ref}`, 'sino');
      bip();
    }
  }
  pedirRender(linha.id);
}

// ---------- Renderização ----------
let destacar = new Set();
function pedirRender(idDestaque) {
  if (idDestaque) destacar.add(idDestaque);
  const foco = document.activeElement;
  const digitando = foco?.matches?.('input, textarea, select') && raiz?.querySelector('.conteudo')?.contains(foco) && foco.value;
  if (segurar > 0 || digitando || document.querySelector('.gaveta')) {
    if (!renderPendente) {
      renderPendente = true;
      const tentar = () => { renderPendente = false; pedirRender(); };
      if (digitando) foco.addEventListener('blur', tentar, { once: true });
      else setTimeout(tentar, 600);
    }
    return;
  }
  render();
}

function moldura(rota, corpo) {
  const p = estado.sessao.perfil;
  const lista = itens();
  const nav = ROTAS[papel()].map((r) => {
    if (r.grupo) return html`<div class="nav-grupo">${r.grupo}</div>`;
    const n = r.conta ? lista.filter(r.conta).length : null;
    return html`<a href="#/${r.id}" ${r.id === rota.id ? raw('aria-current="page"') : ''}>${icone(r.icone)}${r.titulo}
      ${n ? html`<span class="n ${r.alerta ? 'alerta' : ''}" title="${r.dica || ''}">${n}</span>` : ''}</a>`;
  });
  const escuro = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  return html`
    <div class="app ${estado.menu ? 'menu-aberto' : ''}">
      <aside class="side" aria-label="Menu principal">
        <div class="marca-app"><span class="logo" aria-hidden="true">SF</span><div><b>ShoeFlow</b><small>${NOME_LOJA}</small></div></div>
        <nav class="nav">${nav}</nav>
        <div class="side-rodape">
          <div class="usuario"><span class="avatar" aria-hidden="true">${iniciais(p.nome || p.email)}</span><div><b>${p.nome || p.email}</b><small>${p.papel === 'admin' ? 'Administrador' : 'Loja'}</small></div></div>
          <div class="linha-flex">
            <button class="btn fant peq" data-tema aria-label="Alternar tema">${icone(escuro ? 'sol' : 'lua')} ${escuro ? 'Claro' : 'Escuro'}</button>
            <button class="btn fant peq" data-sair>${icone('sair')} Sair</button>
          </div>
        </div>
      </aside>
      <main class="main">
        ${DEMO ? html`<div class="demo-faixa">Modo demonstração · dados fictícios, o banco real não é tocado</div>` : ''}
        <header class="topo">
          <button class="btn fant ico menu-btn" data-menu aria-label="Abrir menu" aria-expanded="${estado.menu}">${icone('menu')}</button>
          <h1>${rota.tela.titulo?.(ctx, rota.params) || rota.titulo}</h1>
          <span class="espaco"></span>
          <span class="ao-vivo ${estado.aoVivo ? 'on' : ''}" title="${estado.aoVivo ? 'Atualizações chegam na hora' : 'Reconectando…'}"><i></i>${estado.aoVivo ? 'Ao vivo' : 'Offline'}</span>
        </header>
        <div class="conteudo" id="conteudo">${corpo}</div>
      </main>
    </div>`;
}

function render() {
  if (!estado.sessao) { raiz.innerHTML = String(telaLogin.render(ctx)); telaLogin.montar(raiz, ctx, entrar); return; }
  const rota = rotaAtual();
  const corpo = estado.erro
    ? html`<div class="painel vazio">${icone('alerta')}<h3>Não foi possível carregar os dados</h3><p>${estado.erro}</p><p style="margin-top:12px"><button class="btn" data-recarregar>Tentar de novo</button></p></div>`
    : estado.carregado ? rota.tela.render(ctx, rota.params) : carregando();
  const mudouRota = rotaAnterior !== location.hash;
  const pintar = () => {
    const rolagem = scrollY;
    raiz.innerHTML = String(moldura(rota, corpo));
    if (!mudouRota) {
      scrollTo(0, rolagem);
      raiz.querySelectorAll('.cascata').forEach((c) => c.classList.remove('cascata')); // cascata só ao entrar na tela
    } else scrollTo(0, 0);
    destacar.forEach((id) => raiz.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach((el) => el.classList.add('chegou')));
    destacar.clear();
    ligarMoldura();
    if (estado.carregado && !estado.erro) rota.tela.montar?.(raiz.querySelector('#conteudo'), ctx, rota.params);
  };
  if (mudouRota && rotaAnterior !== null && document.startViewTransition) document.startViewTransition(pintar);
  else pintar();
  rotaAnterior = location.hash;
}

function ligarMoldura() {
  raiz.querySelector('[data-sair]').onclick = async () => { await banco.sair(); estado.sessao = null; estado.linhas.clear(); estado.carregado = false; location.hash = ''; render(); };
  raiz.querySelector('[data-tema]').onclick = () => {
    const escuro = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = escuro ? 'light' : 'dark';
    try { localStorage.setItem('sf-tema', document.documentElement.dataset.theme); } catch { /* sem armazenamento */ }
    render();
  };
  raiz.querySelector('[data-menu]').onclick = () => { estado.menu = !estado.menu; render(); };
  raiz.querySelector('.app').addEventListener('click', (e) => {
    if (!estado.menu) return;
    if (e.target === e.currentTarget) { estado.menu = false; render(); }
    else if (e.target.closest('.nav a')) estado.menu = false;
  });
  raiz.querySelector('[data-recarregar]')?.addEventListener('click', carregar);
  // Abrir editor ao clicar numa linha (admin)
  const abrir = (el) => papel() === 'admin' && ctx.abrirItem(el.dataset.abrir);
  raiz.querySelectorAll('[data-abrir]').forEach((el) => {
    el.addEventListener('click', (e) => { if (!e.target.closest('button, a, input, label, select')) abrir(el); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === el) abrir(el); });
  });
}

// ---------- Carga e sessão ----------
async function carregar() {
  estado.erro = null; estado.carregado = false; render();
  try {
    const linhas = await banco.listar();
    estado.linhas = new Map(linhas.map((l) => [l.id, l]));
    estado.carregado = true;
  } catch (e) { estado.erro = e.message; }
  render();
}

let pararTempoReal;
async function entrar(sessao) {
  estado.sessao = sessao;
  if (!rotasDoPapel().some((r) => location.hash.startsWith('#/' + r.id))) location.hash = '#/' + rotasDoPapel()[0].id;
  await carregar();
  pararTempoReal?.();
  pararTempoReal = banco.ouvir(aoMudar, (on) => { if (estado.aoVivo !== on) { estado.aoVivo = on; pedirRender(); } });
}

async function iniciar() {
  try { const t = localStorage.getItem('sf-tema'); if (t) document.documentElement.dataset.theme = t; } catch { /* ok */ }
  raiz = document.getElementById('app');
  window.addEventListener('hashchange', () => { estado.menu = false; render(); });
  window.addEventListener('focus', () => (document.title = 'ShoeFlow'));
  // Rede de segurança: se o tempo real cair, recarrega a cada 2 min
  setInterval(() => { if (estado.sessao && !estado.aoVivo) banco.listar().then((ls) => { ls.forEach((l) => estado.linhas.set(l.id, l)); pedirRender(); }).catch(() => {}); }, 120000);
  try {
    const s = await banco.sessao();
    if (s) return entrar(s);
  } catch (e) { erro(e); }
  render();
}

iniciar();
