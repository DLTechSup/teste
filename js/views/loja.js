// Telas da loja: enviar códigos por marca e responder pendências
import { html, raw, icone, aviso, erro, recolher, ampliar, tempo } from '../ui.js';
import { aguardandoCodigo, temPendencia, porMarca, ativo, STATUS_FOTOS } from '../regras.js';
import { miniatura, vazioBloco } from '../componentes.js';

let busca = '';

function cartaoMarca(marca, itens, todos, i) {
  const daMarca = todos.filter((x) => ativo(x) && x.marca === marca && x.etapa !== 'feito');
  const feitos = daMarca.filter((x) => x.etapa === 'recebido').length;
  const p = daMarca.length ? Math.round((feitos / daMarca.length) * 100) : 0;
  return html`<a class="painel marca-card" data-filtro="${`${marca} ${itens.map((x) => x.ref).join(' ')}`.toLowerCase()}" href="#/loja/${encodeURIComponent(marca)}" style="--i:${i};text-decoration:none">
    <div class="linha-flex" style="justify-content:space-between;flex-wrap:nowrap">
      <div><h3>${marca}</h3><span class="muted" style="font-size:13px">${itens.length} ${itens.length === 1 ? 'referência aguardando' : 'referências aguardando'}</span></div>
      <span class="anel" style="--p:${p}" title="${p}% da marca já com código"><span>${p}%</span></span>
    </div>
    <div class="linha-flex" style="justify-content:space-between">
      <span class="fotos">${itens.slice(0, 5).map((x) => miniatura(x))}</span>
      <span class="btn fant peq">Abrir ${icone('seta')}</span>
    </div></a>`;
}

function linhaCodigo(i, j, pendencia = false) {
  return html`<li class="entrada-codigo" data-id="${i.id}" style="--i:${j}">
    <button type="button" class="thumb" data-zoom="${i.foto}" aria-label="Ampliar foto de ${i.ref}" ${i.foto ? '' : raw('disabled')}>${i.foto ? html`<img src="${i.foto}" alt="">` : icone('foto')}</button>
    <div class="item-info">
      <div class="item-titulo"><b style="font-size:16px">${i.ref}</b>${pendencia ? html`<span class="selo pend">${STATUS_FOTOS[i.statusFotos]}</span>` : ''}${i.codigo ? html`<span class="codigo">${i.codigo}</span>` : ''}</div>
      <div class="item-meta"><span>${i.marca}</span><span>enviado ${tempo(i.criadoEm)}</span>${i.faltamCores ? html`<span>Faltam: ${i.faltamCores}</span>` : ''}</div>
      ${i.obs ? html`<div class="item-nota" style="white-space:normal">Escritório: ${i.obs}</div>` : ''}
      ${i.obsLoja ? html`<div class="item-nota loja" style="white-space:normal">Sua resposta: ${i.obsLoja}</div>` : ''}
    </div>
    <form data-form="${i.id}" novalidate>
      ${pendencia && i.codigo ? '' : html`<div class="linha-flex" style="flex-wrap:nowrap">
        <label class="sr" for="cod-${i.id}">Código de ${i.ref}</label>
        <input class="inp mono" id="cod-${i.id}" name="codigo" placeholder="Código" autocomplete="off" inputmode="text" enterkeyhint="send">
        <button class="btn pri" type="submit">${icone('enviar')}<span class="sr">Enviar</span></button></div>`}
      <details ${pendencia ? raw('open') : ''}><summary class="muted" style="font-size:12px;cursor:pointer">${pendencia ? 'Responder ao escritório' : 'Observação ou falta de fotos'}</summary>
        <div class="grade" style="gap:8px;margin-top:8px">
          <textarea class="inp" name="obs" style="min-height:60px" placeholder="Ex.: fotos da cor preta vão amanhã"></textarea>
          ${pendencia ? '' : html`<label class="check" style="font-size:13px"><input type="checkbox" name="faltam"> Faltam fotos deste modelo</label>`}
          ${pendencia && i.codigo ? html`<button class="btn pri" type="submit">${icone('enviar')} Enviar resposta</button>` : ''}
        </div></details>
    </form></li>`;
}

const codigos = {
  titulo: (ctx, [marca]) => (marca ? marca : 'Enviar códigos'),
  render(ctx, [marca]) {
    const itens = ctx.itens.filter(aguardandoCodigo);
    if (!marca) {
      const grupos = porMarca(itens);
      return html`<div class="barra"><p class="muted" style="margin:0">Escolha a marca, confira a foto e digite o código. <b>Enter</b> envia e passa para o próximo.</p><span class="espaco"></span>
        <label class="busca">${icone('busca')}<span class="sr">Buscar</span><input class="inp" type="search" id="lj-busca" value="${busca}" placeholder="Buscar marca ou referência"></label></div>
        ${grupos.size ? html`<div class="marcas-loja cascata">${[...grupos].map(([m, its], i) => cartaoMarca(m, its, ctx.itens, i))}</div>`
          : vazioBloco('feito', 'Nenhum código pendente', 'Quando o escritório cadastrar novos calçados, eles aparecem aqui na hora.')}`;
    }
    const daMarca = itens.filter((i) => i.marca === marca);
    return html`<div class="barra"><a class="btn" href="#/loja">${icone('voltar')} Marcas</a><span class="muted">${daMarca.length} ${daMarca.length === 1 ? 'referência' : 'referências'} aguardando</span></div>
      ${daMarca.length ? html`<section class="painel"><ul class="lista cascata">${daMarca.map((i, j) => linhaCodigo(i, j))}</ul></section>`
        : html`<div class="painel vazio">${icone('feito')}<h3>Marca concluída</h3><p>Todos os códigos de ${marca} foram enviados.</p><p style="margin-top:12px"><a class="btn pri" href="#/loja">Voltar às marcas</a></p></div>`}`;
  },
  montar(el, ctx) {
    const b = el.querySelector('#lj-busca');
    if (b) b.oninput = () => {
      busca = b.value;
      const q = busca.trim().toLowerCase();
      el.querySelectorAll('[data-filtro]').forEach((c) => (c.hidden = q && !c.dataset.filtro.includes(q)));
    };
    ligarFormularios(el, ctx);
    b?.dispatchEvent(new Event('input'));
    el.querySelector('input[name=codigo]')?.focus();
  },
};

const pendencias = {
  titulo: () => 'Pendências',
  render(ctx) {
    const itens = ctx.itens.filter(temPendencia).sort((a, b) => a.marca.localeCompare(b.marca) || a.ref.localeCompare(b.ref));
    return html`<p class="muted" style="margin:0 0 16px">Calçados que estão sem fotos completas. Envie o código se tiver e conte ao escritório o que falta.</p>
      ${itens.length ? html`<section class="painel"><ul class="lista cascata">${itens.map((i, j) => linhaCodigo(i, j, true))}</ul></section>`
        : vazioBloco('feito', 'Nenhuma pendência', 'Está tudo certo com as fotos.')}`;
  },
  montar: (el, ctx) => ligarFormularios(el, ctx),
};

function ligarFormularios(el, ctx) {
  el.querySelectorAll('[data-zoom]').forEach((b) => (b.onclick = () => ampliar(b.dataset.zoom)));
  el.querySelectorAll('[data-form]').forEach((form) => (form.onsubmit = async (e) => {
    e.preventDefault();
    const id = form.dataset.form;
    const item = ctx.itens.find((x) => x.id === id);
    const codigo = form.codigo?.value.trim() || '';
    const obs = form.obs.value.trim();
    if (!codigo && !obs) { (form.codigo || form.obs).focus(); return aviso('Digite o código', 'Ou escreva uma observação para o escritório.', 'erro'); }
    const mudancas = {};
    if (codigo) Object.assign(mudancas, { codigo, status: 'respondido', respondidoEm: Date.now() });
    if (obs) mudancas.notaPainel = obs;
    if (form.faltam?.checked) mudancas.statusFotos = 'faltam';
    const li = form.closest('li');
    const proximo = li.nextElementSibling?.querySelector('input[name=codigo]');
    form.querySelectorAll('button, input, textarea').forEach((x) => (x.disabled = true));
    await ctx.segurando(async () => {
      try {
        await ctx.alterar(id, mudancas);
        li.classList.add('enviado');
        li.querySelector('.item-titulo').insertAdjacentHTML('beforeend', '<span class="marca-ok" aria-hidden="true"><svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>');
        proximo?.focus();
        aviso(codigo ? 'Código enviado' : 'Resposta enviada', `${item.marca} · ${item.ref}${codigo ? ' → ' + codigo : ''}`);
        if (codigo || mudancas.statusFotos) await recolher(li);
      } catch (err) {
        form.querySelectorAll('button, input, textarea').forEach((x) => (x.disabled = false));
        erro(err);
      }
    });
  }));
}

export default { codigos, pendencias };
