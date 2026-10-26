// Telas de lista do administrador
import { html, raw, icone, aviso, erro, recolher, imprimir, tempo, dataBR } from '../ui.js';
import { codigoPronto, semCodigo, temPendencia, pendenteComCodigo, pendenteSemCodigo, finalizado, faltaAtacado, porMarca, buscar } from '../regras.js';
import { linhaItem, grupos, vazioBloco, relatorio, miniatura } from '../componentes.js';

const filtros = {};
const porRef = (a, b) => a.marca.localeCompare(b.marca, 'pt-BR') || a.ref.localeCompare(b.ref, 'pt-BR'); // busca e aba de cada tela, mantidas ao navegar

function barra(id, { abas, imprimir: imp } = {}) {
  const f = filtros[id] ||= { q: '', aba: abas?.[0]?.[0] };
  return html`<div class="barra">
    ${abas ? html`<div class="abas" role="tablist">${abas.map(([v, t, n]) => html`<button role="tab" data-aba="${v}" aria-selected="${f.aba === v}">${t}<span class="n">${n}</span></button>`)}</div>` : ''}
    <span class="espaco"></span>
    <label class="busca">${icone('busca')}<span class="sr">Buscar</span><input class="inp" type="search" data-busca value="${f.q}" placeholder="Buscar marca, referência ou código"></label>
    ${imp ? html`<button class="btn" data-imprimir>${icone('imprimir')} Relatório</button>` : ''}
  </div><div data-lista></div>`;
}

// Liga busca/abas e redesenha só a lista
function ligar(el, id, desenhar, aoImprimir) {
  const f = filtros[id];
  const lista = el.querySelector('[data-lista]');
  const pintar = (cascata) => {
    lista.innerHTML = String(desenhar(f));
    if (!cascata) lista.querySelectorAll('.cascata').forEach((c) => c.classList.remove('cascata'));
    lista.querySelectorAll('[data-abrir]').forEach((li) => li.addEventListener('click', (e) => { if (!e.target.closest('button')) el.dispatchEvent(new CustomEvent('abrir', { detail: li.dataset.abrir })); }));
    lista.querySelectorAll('[data-abrir]').forEach((li) => li.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === li) el.dispatchEvent(new CustomEvent('abrir', { detail: li.dataset.abrir })); }));
  };
  pintar(true);
  el.querySelector('[data-busca]').oninput = (e) => { f.q = e.target.value; pintar(false); };
  el.querySelectorAll('[data-aba]').forEach((b) => (b.onclick = () => {
    f.aba = b.dataset.aba;
    el.querySelectorAll('[data-aba]').forEach((x) => x.setAttribute('aria-selected', x === b));
    pintar(true);
  }));
  el.querySelector('[data-imprimir]')?.addEventListener('click', aoImprimir);
  return pintar;
}

// Ação que remove a linha com animação depois de salvar
async function acaoSaida(ctx, botao, id, mudancas, msg) {
  const li = botao.closest('li');
  botao.disabled = true;
  await ctx.segurando(async () => {
    try {
      await ctx.alterar(id, mudancas);
      botao.outerHTML = '<span class="marca-ok" aria-hidden="true"><svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>';
      await recolher(li);
      aviso(msg[0], msg[1]);
    } catch (e) { botao.disabled = false; erro(e); }
  });
}

const abrirComum = (el, ctx) => el.addEventListener('abrir', (e) => ctx.abrirItem(e.detail));

const recebidos = {
  titulo: () => 'Códigos recebidos',
  render: () => barra('recebidos', { imprimir: true }),
  montar(el, ctx) {
    abrirComum(el, ctx);
    ligar(el, 'recebidos', (f) => grupos(porMarca(buscar(ctx.itens.filter(codigoPronto), f.q)),
      (i, j) => linhaItem(i, { i: j, acoes: html`<button class="btn ok peq" data-feito="${i.id}">${icone('feito')} Feito</button>` }),
      { vazio: vazioBloco('sino', 'Nenhum código para processar', 'Quando a loja enviar um código, ele aparece aqui na hora.') }),
    () => imprimir(relatorio('Códigos recebidos', [['Prontos para finalizar', ctx.itens.filter(codigoPronto).sort(porRef)]])));
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-feito]');
      if (b) { const i = ctx.itens.find((x) => x.id === b.dataset.feito); acaoSaida(ctx, b, b.dataset.feito, { status: 'feito', feitoEm: Date.now() }, ['Finalizado', `${i.marca} · ${i.ref}`]); }
    });
  },
};

const aguardando = {
  titulo: () => 'Aguardando código',
  render: (ctx) => {
    const it = ctx.itens.filter(semCodigo);
    return html`<p class="muted" style="margin:0 0 16px">Tudo o que você enviou à loja e ainda não recebeu código.</p>${barra('aguardando', { imprimir: true, abas: [
      ['todos', 'Todos enviados', it.length],
      ['com-foto', 'Com fotos', it.filter((i) => !temPendencia(i)).length],
      ['sem-foto', 'Sem fotos completas', it.filter(temPendencia).length],
    ] })}`;
  },
  montar(el, ctx) {
    abrirComum(el, ctx);
    const filtrar = (aba) => ctx.itens.filter(semCodigo).filter((i) => (aba === 'com-foto' ? !temPendencia(i) : aba === 'sem-foto' ? temPendencia(i) : true));
    ligar(el, 'aguardando', (f) => grupos(porMarca(buscar(filtrar(f.aba), f.q)),
      (i, j) => linhaItem(i, { i: j, acoes: html`<span class="muted" style="font-size:12px" title="Enviado em ${dataBR(i.criadoEm)}">esperando ${tempo(i.criadoEm).replace('há ', '')}</span>` }),
      { vazio: vazioBloco('relogio', 'Nada esperando código', 'Tudo que foi enviado à loja já tem código.') }),
    () => imprimir(relatorio('Aguardando código da loja', [['Enviados à loja sem código', filtrar(filtros.aguardando.aba).sort(porRef)]])));
  },
};

const pendencias = {
  titulo: () => 'Pendências de fotos',
  render(ctx) {
    const it = ctx.itens;
    return barra('pendencias', { imprimir: true, abas: [
      ['com', 'Com código, faltam fotos', it.filter(pendenteComCodigo).length],
      ['sem', 'Sem código e sem fotos', it.filter(pendenteSemCodigo).length],
    ] });
  },
  montar(el, ctx) {
    abrirComum(el, ctx);
    ligar(el, 'pendencias', (f) => grupos(porMarca(buscar(ctx.itens.filter(f.aba === 'sem' ? pendenteSemCodigo : pendenteComCodigo), f.q)),
      (i, j) => linhaItem(i, { i: j, acoes: html`<button class="btn peq" data-fotos-ok="${i.id}" title="Marcar fotos como completas">${icone('foto')} Fotos ok</button>` }),
      { vazio: vazioBloco('feito', 'Sem pendências aqui', 'Nenhum calçado nesta situação.') }),
    () => imprimir(relatorio('Pendências de fotos', [['Com código, faltam fotos', ctx.itens.filter(pendenteComCodigo)], ['Sem código e sem fotos', ctx.itens.filter(pendenteSemCodigo)]])));
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-fotos-ok]');
      if (b) acaoSaida(ctx, b, b.dataset.fotosOk, { statusFotos: 'completas', faltamCores: '' }, ['Fotos marcadas como completas', '']);
    });
  },
};

const LIMITE = 150;
const finalizados = {
  titulo: () => 'Finalizados',
  render(ctx) {
    const it = ctx.itens.filter(finalizado);
    return barra('finalizados', { imprimir: true, abas: [
      ['todos', 'Todos', it.length],
      ['atacado', 'Falta atacado', it.filter(faltaAtacado).length],
      ['site', 'Falta site', it.filter((i) => !i.site).length],
    ] });
  },
  montar(el, ctx) {
    abrirComum(el, ctx);
    let limite = LIMITE;
    const lista = (f) => {
      let it = ctx.itens.filter(finalizado);
      if (f.aba === 'atacado') it = it.filter(faltaAtacado);
      if (f.aba === 'site') it = it.filter((i) => !i.site);
      return buscar(it, f.q).sort((a, b) => (b.feitoEm || '').localeCompare(a.feitoEm || ''));
    };
    const pintar = ligar(el, 'finalizados', (f) => {
      const it = lista(f);
      if (!it.length) return vazioBloco('feito', 'Nada por aqui', f.aba === 'todos' ? 'Nenhum item finalizado ainda.' : 'Tudo enviado. 👏');
      const chip = (i, campo, rot) => html`<button class="btn peq ${i[campo] ? '' : 'fant'}" data-alternar="${campo}" data-id="${i.id}" aria-pressed="${i[campo]}" title="${i[campo] ? 'Enviado' : 'Não enviado'} — clique para alterar">${i[campo] ? icone('feito') : raw('<span style="width:18px;text-align:center">○</span>')}${rot}</button>`;
      return html`<section class="painel"><ul class="lista cascata">${it.slice(0, limite).map((i, j) => linhaItem(i, { i: j, acoes: html`${chip(i, 'site', 'Site')}${chip(i, 'atacado', 'Atacado')}` }))}</ul>
        ${it.length > limite ? html`<div class="painel-corpo" style="text-align:center"><button class="btn" data-mais>Mostrar mais (${it.length - limite} restantes)</button></div>` : ''}</section>`;
    }, () => imprimir(relatorio('Finalizados — falta atacado', [['Falta atacado', ctx.itens.filter(faltaAtacado)], ['Falta site', ctx.itens.filter((i) => finalizado(i) && !i.site)]])));
    el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-mais]')) { limite += LIMITE; pintar(false); return; }
      const b = e.target.closest('[data-alternar]');
      if (!b) return;
      const campo = b.dataset.alternar;
      const novo = b.getAttribute('aria-pressed') !== 'true';
      b.disabled = true;
      try {
        await ctx.alterar(b.dataset.id, { [campo === 'site' ? 'sentToSite' : 'sentToAtacado']: novo });
        b.setAttribute('aria-pressed', novo);
        b.classList.toggle('fant', !novo);
        b.firstElementChild.outerHTML = novo ? String(icone('feito')) : '<span style="width:18px;text-align:center">○</span>';
        b.animate([{ scale: 0.92 }, { scale: 1 }], { duration: 200, easing: 'cubic-bezier(.22,1,.36,1)' });
      } catch (err) { erro(err); } finally { b.disabled = false; }
    });
  },
};

const arquivados = {
  titulo: () => 'Arquivados',
  render: () => html`<p class="muted" style="margin:0 0 16px">Itens arquivados continuam guardados no banco. Nada é apagado — restaure quando quiser.</p>${barra('arquivados')}`,
  montar(el, ctx) {
    abrirComum(el, ctx);
    ligar(el, 'arquivados', (f) => {
      const it = buscar(ctx.itens.filter((i) => i.arquivado), f.q);
      if (!it.length) return vazioBloco('arquivo', 'Nenhum item arquivado', 'Itens arquivados aparecem aqui.');
      return html`<section class="painel"><ul class="lista cascata">${it.map((i, j) => linhaItem(i, { i: j, acoes: html`<button class="btn peq" data-restaurar="${i.id}">${icone('restaurar')} Restaurar</button>` }))}</ul></section>`;
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-restaurar]');
      if (!b) return;
      const i = ctx.itens.find((x) => x.id === b.dataset.restaurar);
      acaoSaida(ctx, b, i.id, { arquivado: false, deletado: false, removido: false, status: i.etapa === 'feito' ? 'feito' : i.codigo ? 'respondido' : 'pendente' }, ['Restaurado', `${i.marca} · ${i.ref}`]);
    });
  },
};

export default { recebidos, aguardando, pendencias, finalizados, arquivados, miniatura };
