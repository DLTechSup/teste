// Página pública da loja (sem login): todos os modelos sem código, cada um com foto, código e observação
import { html, raw, icone, aviso, erro, recolher, ampliar, tempo } from '../ui.js';
import { aguardandoCodigo, pendenteComCodigo, pendenteSemCodigo, porMarca, STATUS_FOTOS, temPendencia, reais } from '../regras.js';
import { vazioBloco } from '../componentes.js';

const filtro = { marca: '', q: '' };

function cartao(i, j, resposta = false) {
  const pend = temPendencia(i);
  return html`<article class="painel modelo" data-id="${i.id}" data-marca="${i.marca}" data-busca="${`${i.marca} ${i.ref}`.toLowerCase()}" style="--i:${j}">
    <button type="button" class="modelo-foto" data-zoom="${i.id}" aria-label="${i.foto ? `Ampliar foto de ${i.marca} ${i.ref}` : `${i.ref} sem foto`}" ${i.foto ? '' : raw('disabled')}>
      ${i.foto ? html`<img src="${i.foto}" alt="${i.marca} ${i.ref}" loading="lazy"><span class="ver-foto">${icone('busca')} ${i.fotos.length > 1 ? `Ver ${i.fotos.length} fotos` : 'Ver foto'}</span>`
        : html`<span class="sem-foto">${icone('foto')}<span>Sem foto</span></span>`}
    </button>
    <div class="modelo-corpo">
      <header>
        <div><span class="modelo-marca">${i.marca}</span><h3 class="mono">${i.ref}</h3>${i.modelo ? html`<span class="muted" style="font-size:13px">${i.modelo}</span>` : ''}</div>
        <div class="linha-flex">${pend ? html`<span class="selo pend">${STATUS_FOTOS[i.statusFotos]}</span>` : html`<span class="selo wait">Aguardando código</span>`}${i.codigo ? html`<span class="codigo" title="Código já enviado">${i.codigo}</span>` : ''}${i.preco ? html`<span class="preco" title="Valor no Bling">${reais(i.preco)}</span>` : ''}</div>
      </header>
      <div class="item-meta"><span>Cadastrado ${tempo(i.criadoEm)}</span>${i.faltamCores ? html`<span>Faltam fotos: ${i.faltamCores}</span>` : ''}</div>
      ${i.obs ? html`<p class="nota-escritorio"><b>Escritório:</b> ${i.obs}</p>` : ''}
      ${i.obsLoja ? html`<p class="nota-loja"><b>Sua observação:</b> ${i.obsLoja}</p>` : ''}
      <form data-form="${i.id}" class="modelo-form" novalidate>
        ${resposta ? '' : html`<label class="campo"><span>Código</span>
          <input class="inp mono" name="codigo" autocomplete="off" enterkeyhint="send" placeholder="Digite o código"></label>`}
        <label class="campo ${resposta ? 'largo' : ''}"><span>Observação</span>
          <textarea class="inp" name="obs" rows="2" placeholder="${resposta ? 'Ex.: as fotos da cor preta vão amanhã' : 'Opcional — ex.: só tem numeração 35 a 37'}"></textarea></label>
        <div class="modelo-rodape">
          ${resposta || pend ? '' : html`<label class="check-simples"><input type="checkbox" name="faltam"> Faltam fotos deste modelo</label>`}
          <button class="btn pri" type="submit">${icone('enviar')} ${resposta ? 'Enviar observação' : 'Enviar'}</button>
        </div>
      </form>
    </div>
  </article>`;
}

function barraFiltros(itens) {
  const marcas = porMarca(itens);
  return html`<div class="loja-filtros">
    <div class="chips" role="group" aria-label="Filtrar por marca">
      <button class="chip" data-marca="" aria-pressed="${!filtro.marca}">Todas <span>${itens.length}</span></button>
      ${[...marcas].map(([m, its]) => html`<button class="chip" data-marca="${m}" aria-pressed="${filtro.marca === m}">${m} <span>${its.length}</span></button>`)}
    </div>
    <label class="busca">${icone('busca')}<span class="sr">Buscar referência</span><input class="inp" type="search" id="lj-busca" value="${filtro.q}" placeholder="Buscar referência"></label>
  </div>`;
}

// Referências agrupadas por marca: cada marca é um bloco com cabeçalho e contagem
const qtd = (n) => `${n} ${n === 1 ? 'referência' : 'referências'}`;
function blocos(itens, resposta) {
  let g = 0;
  return html`<div class="grupos-loja cascata">${[...porMarca(itens)].map(([marca, its]) => html`
    <section class="grupo-loja" data-grupo="${marca}" style="--i:${g++}" aria-label="${marca}">
      <header class="grupo-cab"><h2>${marca}</h2><span class="grupo-n" data-restam="${its.length}">${qtd(its.length)}</span></header>
      <div class="modelos">${its.map((i, j) => cartao(i, j, resposta))}</div>
    </section>`)}</div>`;
}
const nada = () => html`<div class="painel vazio" id="lj-nada" hidden>${icone('busca')}<h3>Nenhum modelo encontrado</h3><p>Tente outra marca ou referência.</p></div>`;
function lista(itens, resposta) {
  return html`${blocos(itens, resposta)}${nada()}`;
}

const ordenar = (a, b) => a.marca.localeCompare(b.marca, 'pt-BR') || a.ref.localeCompare(b.ref, 'pt-BR');

const codigos = {
  titulo: () => 'Enviar códigos',
  render(ctx) {
    const itens = ctx.itens.filter(aguardandoCodigo).sort(ordenar);
    if (!itens.length) return vazioBloco('feito', 'Todos os códigos foram enviados', 'Quando o escritório cadastrar novos modelos, eles aparecem aqui na hora.');
    return html`<div class="loja-intro"><h1>Modelos aguardando código</h1><p class="muted">As referências estão agrupadas por marca. Digite o código e aperte <b>Enter</b>: envia e já vai para a próxima referência da mesma marca.</p></div>
      ${barraFiltros(itens)}${lista(itens, false)}`;
  },
  montar: (el, ctx) => ligar(el, ctx),
};

const pendencias = {
  titulo: () => 'Pendências',
  render(ctx) {
    const comCodigo = ctx.itens.filter(pendenteComCodigo).sort(ordenar);
    const semCodigo = ctx.itens.filter(pendenteSemCodigo).sort(ordenar);
    const todos = [...semCodigo, ...comCodigo];
    if (!todos.length) return vazioBloco('feito', 'Nenhuma pendência', 'Todos os modelos estão com código e fotos em dia.');
    const secao = (titulo, texto, its, resposta) => its.length ? html`
      <h2 class="secao-titulo pend-titulo">${titulo} <span>${its.length}</span></h2><p class="muted" style="margin:-6px 0 12px">${texto}</p>
      ${blocos(its, resposta)}` : '';
    return html`<div class="loja-intro"><h1>Pendências para resolver</h1><p class="muted">Modelos sem fotos completas. Envie o código quando tiver e avise o escritório sobre as fotos.</p></div>
      ${barraFiltros(todos)}
      ${secao('Sem código e sem fotos', 'Envie o código e conte o que falta de fotos.', semCodigo, false)}
      ${secao('Com código, faltando fotos', 'O código já foi enviado; falta resolver as fotos.', comCodigo, true)}
      ${nada()}`;
  },
  montar: (el, ctx) => ligar(el, ctx),
};

function aplicarFiltro(el) {
  const q = filtro.q.trim().toLowerCase();
  let visiveis = 0;
  el.querySelectorAll('.modelo').forEach((c) => {
    const ok = (!filtro.marca || c.dataset.marca === filtro.marca) && (!q || c.dataset.busca.includes(q));
    c.hidden = !ok;
    if (ok) visiveis++;
  });
  el.querySelectorAll('.grupo-loja').forEach((g) => (g.hidden = !g.querySelector('.modelo:not([hidden])')));
  el.querySelectorAll('.pend-titulo').forEach((t) => {
    const grupos = t.nextElementSibling?.nextElementSibling;
    const vazio = grupos && !grupos.querySelector('.modelo:not([hidden])');
    t.hidden = vazio; t.nextElementSibling.hidden = vazio;
  });
  el.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', b.dataset.marca === filtro.marca));
  const nada = el.querySelector('#lj-nada');
  if (nada) nada.hidden = visiveis > 0;
}

function ligar(el, ctx) {
  el.querySelectorAll('[data-zoom]').forEach((b) => (b.onclick = () => {
    const i = ctx.itens.find((x) => x.id === b.dataset.zoom);
    if (i) ampliar(i.fotos, 0, `${i.marca} · ${i.ref}${i.modelo ? ' · ' + i.modelo : ''}`);
  }));
  if (filtro.marca && !el.querySelector(`.chip[data-marca="${CSS.escape(filtro.marca)}"]`)) filtro.marca = '';
  el.querySelectorAll('.chip').forEach((b) => (b.onclick = () => { filtro.marca = b.dataset.marca; aplicarFiltro(el); }));
  const busca = el.querySelector('#lj-busca');
  if (busca) busca.oninput = () => { filtro.q = busca.value; aplicarFiltro(el); };
  aplicarFiltro(el);

  el.querySelectorAll('[data-form]').forEach((form) => (form.onsubmit = async (e) => {
    e.preventDefault();
    const id = form.dataset.form;
    const item = ctx.itens.find((x) => x.id === id);
    const codigo = form.codigo?.value.trim() || '';
    const obs = form.obs.value.trim();
    if (!codigo && !obs) {
      (form.codigo || form.obs).focus();
      return aviso(form.codigo ? 'Digite o código' : 'Escreva a observação', form.codigo ? 'Ou escreva uma observação para o escritório.' : '', 'erro');
    }
    const mudancas = {};
    if (codigo) Object.assign(mudancas, { codigo, status: 'respondido', respondidoEm: Date.now() });
    if (obs) mudancas.notaPainel = obs;
    if (form.faltam?.checked) mudancas.statusFotos = 'faltam';

    const card = form.closest('.modelo');
    const grupo = card.closest('.grupo-loja');
    // Próxima referência da MESMA marca
    const daMarca = [...grupo.querySelectorAll('.modelo:not([hidden])')];
    const proximo = daMarca.slice(daMarca.indexOf(card) + 1).find((c) => c.querySelector('input[name=codigo]'))?.querySelector('input[name=codigo]');
    const campos = form.querySelectorAll('button, input, textarea');
    campos.forEach((x) => (x.disabled = true));
    await ctx.segurando(async () => {
      try {
        await ctx.alterar(id, mudancas);
        card.classList.add('enviado');
        card.querySelector('header .linha-flex').insertAdjacentHTML('beforeend', '<span class="marca-ok" aria-hidden="true"><svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>');
        aviso(codigo ? 'Código enviado' : 'Observação enviada', `${item.marca} · ${item.ref}${codigo ? ' → ' + codigo : ''}`);
        if (codigo) {
          const suave = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
          const cont = grupo.querySelector('[data-restam]');
          const restam = Number(cont.dataset.restam) - 1;
          cont.dataset.restam = restam;
          cont.textContent = restam ? `faltam ${qtd(restam)}` : 'concluída';
          if (proximo) {
            proximo.focus({ preventScroll: true });
            proximo.closest('.modelo').scrollIntoView({ behavior: suave, block: 'center' });
            await recolher(card);
          } else if (!restam) {
            // Marca concluída: recolhe o bloco e volta para o início da loja
            await recolher(card);
            aviso(`${item.marca} concluída`, 'Todas as referências desta marca foram enviadas.');
            await recolher(grupo);
            scrollTo(0, 0);
          } else {
            await recolher(card);
          }
        } else {
          campos.forEach((x) => (x.disabled = false));
          form.obs.value = '';
        }
      } catch (err) {
        campos.forEach((x) => (x.disabled = false));
        erro(err);
      }
    });
  }));
}

export default { codigos, pendencias };
