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

export const miniatura = (item, classe = 'thumb') =>
  item.foto
    ? html`<span class="${classe}"><img src="${item.foto}" alt="Foto ${item.marca} ${item.ref}" loading="lazy"></span>`
    : html`<span class="${classe}" title="Sem foto">${icone('foto', 'Sem foto')}</span>`;

// Linha de item clicável (abre o editor). `acoes` = HTML de botões à direita.
export function linhaItem(item, { acoes = '', mostrarMarca = false, i = 0 } = {}) {
  return html`<li class="item clicavel" data-abrir="${item.id}" data-id="${item.id}" style="--i:${i}" tabindex="0">
    ${miniatura(item)}
    <div class="item-info">
      <div class="item-titulo">
        <b>${mostrarMarca ? `${item.marca} · ` : ''}${item.ref}</b>
        ${item.codigo ? html`<span class="codigo" title="Código">${item.codigo}</span>` : ''}
        ${selo(item)}
      </div>
      <div class="item-meta">
        <span>Cadastro ${dataBR(item.criadoEm)}</span>
        ${item.respondidoEm ? html`<span>Código ${tempo(item.respondidoEm)}</span>` : ''}
        ${item.preco ? html`<span>Bling ${reais(item.preco)}</span>` : ''}
        ${item.faltamCores ? html`<span>Faltam: ${item.faltamCores}</span>` : ''}
      </div>
      ${item.obs ? html`<div class="item-nota" title="${item.obs}">${item.obs}</div>` : ''}
      ${item.obsLoja ? html`<div class="item-nota loja" title="${item.obsLoja}">Loja: ${item.obsLoja}</div>` : ''}
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
        <label class="campo"><span>Código</span><input class="inp mono" name="codigo" value="${item.codigo}" placeholder="Ainda não recebido"></label>
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
  foto && (foto.onclick = () => ampliar(fotoAtual));
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
  const linhas = (itens) => itens.map((i) => `<tr><td>${esc(i.marca)}</td><td>${esc(i.ref)}</td><td>${esc(i.codigo || '—')}</td><td>${esc(STATUS_FOTOS[i.statusFotos])}</td><td>${esc(i.faltamCores || '')}</td><td>${esc([i.obs, i.obsLoja && 'Loja: ' + i.obsLoja].filter(Boolean).join(' · '))}</td></tr>`).join('');
  return raw(`<h1>${esc(titulo)}</h1><div>Gerado em ${new Date().toLocaleString('pt-BR')}</div>` +
    secoes.map(([nome, itens]) => `<h2>${esc(nome)} (${itens.length})</h2><table><thead><tr><th>Marca</th><th>Referência</th><th>Código</th><th>Fotos</th><th>Cores</th><th>Observações</th></tr></thead><tbody>${linhas(itens)}</tbody></table>`).join(''));
}
