// Peças de interface reutilizadas pelas telas
import { html, raw, icone, esc, dataBR, tempo, gaveta, confirmar, aviso, erro, ocupado, ampliar } from './ui.js';
import { STATUS_FOTOS, temPendencia, reais } from './regras.js';

export function selo(item) {
  if (item.arquivado) return html`<span class="selo neu">Arquivado</span>`;
  if (item.etapa === 'feito') return html`<span class="selo done">Finalizado</span>`;
  if (temPendencia(item)) return html`<span class="selo pend">${STATUS_FOTOS[item.statusFotos] === STATUS_FOTOS.completas ? 'Pendência' : STATUS_FOTOS[item.statusFotos]}</span>`;
  if (item.etapa === 'recebido') return html`<span class="selo recv">Código recebido</span>`;
  return html`<span class="selo wait">Aguardando código</span>`;
}

// Código em destaque: clicar copia (tratado globalmente em app.js)
export const codigoCopiavel = (codigo) => codigo
  ? html`<button type="button" class="codigo copiar" data-copiar="${codigo}" title="Clique para copiar" aria-label="Copiar código ${codigo}">${codigo}${icone('copiar')}</button>`
  : '';

export const miniatura = (item, classe = 'thumb') =>
  item.foto
    ? html`<button type="button" class="${classe} thumb-zoom" data-ver-fotos="${item.id}" aria-label="Ver foto de ${item.marca} ${item.ref}"><img src="${item.foto}" alt="" loading="lazy"></button>`
    : html`<span class="${classe}" title="Sem foto">${icone('foto', 'Sem foto')}</span>`;

// Linha de item clicável (abre o editor). `acoes` = HTML de botões à direita.
export function linhaItem(item, { acoes = '', i = 0, grande = true } = {}) {
  return html`<li class="item clicavel ${grande ? 'item-grande' : ''}" data-abrir="${item.id}" data-id="${item.id}" style="--i:${i}" tabindex="0">
    ${grande && !item.foto ? html`<span class="thumb sem-foto-adm">${icone('foto')}<small>Sem foto</small></span>` : miniatura(item)}
    <div class="item-info">
      <span class="modelo-marca">${item.marca}</span>
      <div class="item-titulo">
        <b>${item.ref}</b>
        ${item.modelo ? html`<span class="item-modelo">${item.modelo}</span>` : ''}
        ${codigoCopiavel(item.codigo)}
        ${selo(item)}
        ${item.preco ? html`<span class="preco" title="Valor no Bling">${reais(item.preco)}</span>` : ''}
      </div>
      <div class="item-meta">
        <span>Cadastro ${dataBR(item.criadoEm)}</span>
        ${item.respondidoEm ? html`<span>Código ${tempo(item.respondidoEm)}</span>` : ''}

        ${item.faltamCores ? html`<span>Faltam: ${item.faltamCores}</span>` : ''}
      </div>
      ${item.obs ? html`<div class="item-nota" title="${item.obs}">${item.obs}</div>` : ''}
      ${item.obsLoja ? html`<div class="item-nota loja" title="${item.obsLoja}">Loja: ${item.obsLoja}</div>` : ''}
      ${grande && item.fotos.length > 1 ? html`<div class="mais-fotos">${item.fotos.slice(1, 6).map((f, k) => html`<button type="button" class="thumb thumb-zoom" data-ver-fotos="${item.id}" data-pos="${k + 1}" aria-label="Ver foto ${k + 2}"><img src="${f}" alt="" loading="lazy"></button>`)}</div>` : ''}
    </div>
    <div class="item-acoes">${acoes}</div>
  </li>`;
}

export function grupos(mapa, render, { vazio } = {}) {
  if (!mapa.size) return vazio;
  let i = 0;
  return html`<div class="cascata">${[...mapa].map(([marca, itens]) => html`
    <section class="painel grupo-marca" style="--i:${i++}" aria-label="${marca}">
      <header><h3>${marca}</h3><span class="n">${itens.length} ${itens.length === 1 ? 'referência' : 'referências'}</span></header>
      <ul class="lista">${itens.map((it, j) => render(it, j))}</ul>
    </section>`)}</div>`;
}

export const vazioBloco = (ic, titulo, texto) =>
  html`<div class="painel vazio" role="status">${icone(ic)}<h3>${titulo}</h3><p>${texto}</p></div>`;

export const carregando = () => html`<div aria-busy="true" aria-label="Carregando">${[1, 2, 3, 4].map(() => raw('<div class="esqueleto"></div>'))}</div>`;

// ---------- Editor completo do item (gaveta lateral) ----------
export function abrirEditor(item, ctx) {
  let fotoAtual = item.foto;
  const opcoesFotos = Object.entries(STATUS_FOTOS)
    .map(([v, t]) => html`<option value="${v}" ${item.statusFotos === v ? raw('selected') : ''}>${t}</option>`);

  const { caixa, fechar } = gaveta(html`
    <header>
      <div><h2 id="ed-tit">${item.marca} · <span class="mono">${item.ref}</span></h2>${selo(item)}</div>
      <span class="espaco" style="flex:1"></span>
      <button class="btn fant ico" data-fechar aria-label="Fechar">${icone('x')}</button>
    </header>
    <form class="corpo" id="ed-form">
      ${item.fotos.length
        ? html`<img class="foto-grande" id="ed-foto" src="${item.foto}" alt="Foto do calçado" style="cursor:zoom-in">
          ${item.fotos.length > 1 ? html`<div class="galeria">${item.fotos.map((f, k) => html`<button type="button" class="thumb" data-foto="${f}" aria-current="${k === 0}"><img src="${f}" alt="Foto ${k + 1}"></button>`)}</div>` : ''}`
        : html`<div class="foto-grande vazio">${icone('foto')}<p>Sem foto cadastrada</p></div>`}
      <label class="btn peq" style="align-self:flex-start">${icone('upload')} Adicionar foto<input type="file" accept="image/*" id="ed-up" class="sr"></label>
      <div class="grade g2">
        <label class="campo"><span>Marca</span><input class="inp" name="marca" value="${item.marca}" required></label>
        <label class="campo"><span>Referência</span><input class="inp mono" name="ref" value="${item.ref}" required></label>
        <label class="campo" style="grid-column:1/-1"><span>Modelo</span><input class="inp" name="modelo" value="${item.modelo}" placeholder="Ex.: Sandália salto bloco"></label>
        <label class="campo"><span>Código ${item.codigo ? codigoCopiavel(item.codigo) : ''}</span><input class="inp mono" name="codigo" value="${item.codigo}" placeholder="Ainda não recebido"></label>
        <label class="campo"><span>Valor no Bling (R$)</span><input class="inp" name="preco" inputmode="decimal" value="${item.preco ? item.preco.toFixed(2).replace('.', ',') : ''}"></label>
        <label class="campo"><span>Situação das fotos</span><select class="inp" name="statusFotos">${opcoesFotos}</select></label>
        <label class="campo"><span>Cores que faltam</span><input class="inp" name="faltamCores" value="${item.faltamCores}"></label>
      </div>
      <label class="campo"><span>Observação do escritório</span><textarea class="inp" name="obs">${item.obs}</textarea></label>
      ${item.obsLoja ? html`<div class="campo"><span>Observação da loja</span><p class="item-nota loja" style="white-space:normal;margin:0">${item.obsLoja}</p></div>` : ''}
      <div class="grade g2">
        <label class="check"><input type="checkbox" name="site" ${item.site ? raw('checked') : ''}> Enviado ao site</label>
        <label class="check"><input type="checkbox" name="atacado" ${item.atacado ? raw('checked') : ''}> Enviado ao atacado</label>
      </div>
      <label class="check"><input type="checkbox" name="ignorarPendencia" ${item.ignorarPendencia ? raw('checked') : ''}> Não contar como pendência (só aguarda código)</label>
      <p class="muted" style="font-size:12px;margin:0">Cadastrado em ${dataBR(item.criadoEm)}${item.respondidoEm ? ` · código em ${dataBR(item.respondidoEm)}` : ''}${item.feitoEm ? ` · finalizado em ${dataBR(item.feitoEm)}` : ''}</p>
    </form>
    <footer>
      <button class="btn pri" form="ed-form" type="submit">Salvar alterações</button>
      ${!item.arquivado && item.etapa !== 'feito' ? html`<button class="btn ok" data-acao="feito">${icone('feito')} Marcar como feito</button>` : ''}
      ${item.etapa === 'feito' && !item.arquivado ? html`<button class="btn" data-acao="reabrir">Reabrir</button>` : ''}
      <span style="flex:1"></span>
      ${item.arquivado
        ? html`<button class="btn" data-acao="restaurar">${icone('restaurar')} Restaurar</button>`
        : html`<button class="btn fant" data-acao="arquivar">${icone('arquivo')} Arquivar</button>`}
    </footer>`);
  caixa.setAttribute('aria-labelledby', 'ed-tit');

  const foto = caixa.querySelector('#ed-foto');
  foto && (foto.onclick = () => ampliar(item.fotos, item.fotos.indexOf(fotoAtual), `${item.marca} · ${item.ref}`));
  caixa.querySelectorAll('[data-foto]').forEach((b) => (b.onclick = () => {
    fotoAtual = b.dataset.foto; foto.src = fotoAtual;
    caixa.querySelectorAll('[data-foto]').forEach((x) => x.setAttribute('aria-current', x === b));
  }));

  caixa.querySelector('#ed-up').onchange = async (e) => {
    const arq = e.target.files[0];
    if (!arq) return;
    try {
      const url = await ctx.enviarFoto(arq);
      await ctx.alterar(item.id, { fotos: [...item.fotos, url] });
      aviso('Foto adicionada');
      fechar();
    } catch (err) { erro(err); }
  };

  caixa.querySelector('#ed-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const precoTxt = (f.get('preco') || '').toString().trim();
    const codigo = f.get('codigo').toString().trim();
    const mudancas = {
      marca: f.get('marca').toString().trim().toUpperCase(),
      ref: f.get('ref').toString().trim(),
      modelo: f.get('modelo').toString().trim(),
      codigo,
      preco: precoTxt ? parseFloat(precoTxt.replace(/\./g, '').replace(',', '.')) || null : null,
      statusFotos: f.get('statusFotos'),
      faltamCores: f.get('faltamCores').toString().trim(),
      obs: f.get('obs').toString().trim(),
      sentToSite: f.has('site'),
      sentToAtacado: f.has('atacado'),
      ignorarPendencia: f.has('ignorarPendencia'),
    };
    if (codigo && item.etapa === 'aguardando') Object.assign(mudancas, { status: 'respondido', respondidoEm: Date.now() });
    await ocupado(e.submitter || caixa.querySelector('[type=submit]'), async () => {
      try { await ctx.alterar(item.id, mudancas); aviso('Alterações salvas'); fechar(); } catch (err) { erro(err); }
    });
  };

  caixa.querySelectorAll('[data-acao]').forEach((b) => (b.onclick = async () => {
    const a = b.dataset.acao;
    if (a === 'arquivar' && !(await confirmar('Arquivar este calçado?', 'Ele sai das listas, mas continua guardado no banco. Você pode restaurar quando quiser em Arquivados.', 'Arquivar'))) return;
    const mapa = {
      feito: { status: 'feito', feitoEm: Date.now() },
      reabrir: { status: item.codigo ? 'respondido' : 'pendente', feitoEm: null },
      arquivar: { arquivado: true, arquivadoEm: Date.now() },
      restaurar: { arquivado: false, deletado: false, removido: false, ...(item.etapa === 'feito' ? { status: 'feito' } : { status: item.codigo ? 'respondido' : 'pendente' }) },
    };
    await ocupado(b, async () => {
      try {
        await ctx.alterar(item.id, mapa[a]);
        aviso({ feito: 'Marcado como feito', reabrir: 'Item reaberto', arquivar: 'Arquivado', restaurar: 'Restaurado' }[a], `${item.marca} · ${item.ref}`);
        fechar();
      } catch (err) { erro(err); }
    });
  }));
}

// ---------- Relatório para impressão ----------
export function relatorio(titulo, secoes) {
  const foto = (i) => (i.foto ? `<img src="${esc(i.foto)}" alt="">` : '<span class="sem">sem foto</span>');
  const linhas = (itens) => itens.map((i) => `<tr><td class="foto">${foto(i)}</td><td><b>${esc(i.marca)}</b></td><td>${esc(i.modelo || '—')}</td><td class="ref">${esc(i.ref)}</td><td class="ref">${esc(i.codigo || '—')}</td><td>${esc(STATUS_FOTOS[i.statusFotos])}${i.faltamCores ? `<br><small>Faltam: ${esc(i.faltamCores)}</small>` : ''}</td><td>${esc([i.obs, i.obsLoja && 'Loja: ' + i.obsLoja].filter(Boolean).join(' · '))}</td></tr>`).join('');
  const total = secoes.reduce((n, [, its]) => n + its.length, 0);
  return raw(`<h1>${esc(titulo)}</h1><div>Gerado em ${new Date().toLocaleString('pt-BR')} · ${total} ${total === 1 ? 'item' : 'itens'}</div>` +
    secoes.map(([nome, itens]) => `<h2>${esc(nome)} (${itens.length})</h2><table><thead><tr><th>Foto</th><th>Marca</th><th>Modelo</th><th>Referência</th><th>Código</th><th>Fotos</th><th>Observações</th></tr></thead><tbody>${linhas(itens)}</tbody></table>`).join(''));
}
