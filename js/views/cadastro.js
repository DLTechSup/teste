import { html, raw, icone, aviso, erro, recolher } from '../ui.js';
import { STATUS_FOTOS, reais } from '../regras.js';

const CHAVE = 'sf-fila-cadastro';
const lerFila = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; } };
const gravarFila = (f) => { try { localStorage.setItem(CHAVE, JSON.stringify(f)); } catch { /* sem armazenamento */ } };
let ultimaMarca = '';

function filaHTML(fila) {
  if (!fila.length) return html`<div class="vazio">${icone('caixa')}<h3>Fila vazia</h3><p>Os calçados que você adicionar aparecem aqui antes de irem para a loja.</p></div>`;
  return html`<ul class="lista cascata">${fila.map((f, i) => html`
    <li class="item" data-fila="${f.tmp}" style="--i:${i}">
      ${f.fotos[0] ? html`<span class="thumb"><img src="${f.fotos[0]}" alt=""></span>` : html`<span class="thumb">${icone('foto')}</span>`}
      <div class="item-info"><div class="item-titulo"><b>${f.marca} · ${f.ref}</b></div>
        <div class="item-meta"><span>${STATUS_FOTOS[f.statusFotos]}</span>${f.preco ? html`<span>${reais(f.preco)}</span>` : ''}${f.faltamCores ? html`<span>Faltam: ${f.faltamCores}</span>` : ''}</div>
        ${f.obs ? html`<div class="item-nota">${f.obs}</div>` : ''}</div>
      <div class="item-acoes"><button class="btn fant peq ico" data-tirar="${f.tmp}" aria-label="Tirar ${f.ref} da fila">${icone('x')}</button></div>
    </li>`)}</ul>`;
}

export default {
  titulo: () => 'Cadastro de calçados',

  render(ctx) {
    const fila = lerFila();
    const marcas = [...new Set(ctx.itens.map((i) => i.marca))].sort();
    return html`<div class="cadastro">
      <section class="painel">
        <div class="painel-cab"><h2>Novo calçado</h2></div>
        <form class="painel-corpo grade" id="f-cad" novalidate>
          <div class="grade g2">
            <label class="campo"><span>Marca *</span><input class="inp" name="marca" list="lista-marcas" value="${ultimaMarca}" required autocomplete="off"></label>
            <label class="campo"><span>Referência *</span><input class="inp mono" name="ref" required autocomplete="off" placeholder="8320-100"></label>
          </div>
          <datalist id="lista-marcas">${marcas.map((m) => html`<option value="${m}">`)}</datalist>
          <p class="erro-txt" id="dup" hidden></p>
          <div class="campo"><span>Foto</span>
            <div class="solta" id="solta" tabindex="0" role="button" aria-label="Escolher foto">
              ${icone('upload')}<div><b>Arraste, clique ou cole (Ctrl+V)</b></div><small>JPG, PNG ou WEBP · reduzida automaticamente</small>
            </div><input type="file" accept="image/*" id="arq" class="sr" tabindex="-1"></div>
          <fieldset class="campo" style="border:0;padding:0;margin:0"><legend style="font-size:13px;font-weight:500;margin-bottom:6px">Situação das fotos</legend>
            <div class="situacoes">${Object.entries(STATUS_FOTOS).map(([v, t], k) => html`<label><input type="radio" name="statusFotos" value="${v}" ${k === 0 ? raw('checked') : ''}>${t}</label>`)}</div></fieldset>
          <label class="campo" id="campo-cores" hidden><span>Cores que faltam</span><input class="inp" name="faltamCores" placeholder="Preto, Off white"></label>
          <label class="campo"><span>Valor no Bling (R$)</span><input class="inp" name="preco" inputmode="decimal" placeholder="Opcional"></label>
          <label class="campo"><span>Observação</span><textarea class="inp" name="obs" placeholder="Ex.: numeração 34 ao 39, conferir solado"></textarea></label>
          <div class="grade g2">
            <label class="check"><input type="checkbox" name="site"> Enviar ao site</label>
            <label class="check"><input type="checkbox" name="atacado"> Enviar ao atacado</label>
          </div>
          <button class="btn pri" type="submit">${icone('mais')} Adicionar à fila</button>
        </form>
      </section>
      <section class="painel">
        <div class="painel-cab"><h2>Fila de envio</h2><span class="n mono muted">${fila.length}</span><span class="espaco"></span>
          <button class="btn acc" id="enviar-fila" ${fila.length ? '' : raw('disabled')}>${icone('enviar')} Enviar para a loja</button></div>
        <div id="fila">${filaHTML(fila)}</div>
      </section>
    </div>`;
  },

  montar(el, ctx) {
    const f = el.querySelector('#f-cad');
    const solta = el.querySelector('#solta');
    const arq = el.querySelector('#arq');
    let foto = null;

    const mostrarFoto = (file) => {
      if (!file?.type?.startsWith('image/')) return aviso('Arquivo inválido', 'Escolha uma imagem.', 'erro');
      foto = file;
      solta.innerHTML = String(html`<img src="${URL.createObjectURL(file)}" alt="Prévia da foto"><small>Clique para trocar</small>`);
    };
    solta.onclick = () => arq.click();
    solta.onkeydown = (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), arq.click());
    arq.onchange = () => arq.files[0] && mostrarFoto(arq.files[0]);
    solta.ondragover = (e) => { e.preventDefault(); solta.classList.add('ativa'); };
    solta.ondragleave = () => solta.classList.remove('ativa');
    solta.ondrop = (e) => { e.preventDefault(); solta.classList.remove('ativa'); mostrarFoto(e.dataTransfer.files[0]); };
    f.onpaste = (e) => { const img = [...e.clipboardData.files].find((x) => x.type.startsWith('image/')); if (img) mostrarFoto(img); };

    const cores = el.querySelector('#campo-cores');
    f.querySelectorAll('[name=statusFotos]').forEach((r) => (r.onchange = () => (cores.hidden = f.statusFotos.value !== 'faltam')));

    // Aviso de referência repetida
    const dup = el.querySelector('#dup');
    const checar = () => {
      const m = f.marca.value.trim().toUpperCase(), r = f.ref.value.trim().toLowerCase();
      const existe = r && ctx.itens.find((i) => !i.arquivado && i.marca === m && i.ref.toLowerCase() === r);
      dup.hidden = !existe;
      if (existe) dup.textContent = `Atenção: ${m} ${existe.ref} já está cadastrado (${existe.etapa === 'feito' ? 'finalizado' : 'em andamento'}).`;
    };
    f.marca.oninput = f.ref.oninput = checar;

    f.onsubmit = async (e) => {
      e.preventDefault();
      const d = new FormData(f);
      const marca = d.get('marca').trim().toUpperCase(), ref = d.get('ref').trim();
      if (!marca || !ref) { (marca ? f.ref : f.marca).focus(); return aviso('Faltam dados', 'Marca e referência são obrigatórias.', 'erro'); }
      const btn = f.querySelector('[type=submit]');
      btn.disabled = true;
      try {
        const fotos = foto ? [await ctx.enviarFoto(foto)] : [];
        const preco = parseFloat((d.get('preco') || '').replace(/\./g, '').replace(',', '.'));
        const statusFotos = fotos.length || d.get('statusFotos') !== 'completas' ? d.get('statusFotos') : 'nenhuma';
        const item = {
          tmp: crypto.randomUUID(), marca, ref, fotos, statusFotos,
          faltamCores: statusFotos === 'faltam' ? d.get('faltamCores').trim() : '',
          preco: preco > 0 ? preco : null, obs: d.get('obs').trim(),
          sentToSite: d.has('site'), sentToAtacado: d.has('atacado'),
        };
        gravarFila([item, ...lerFila()]);
        ultimaMarca = marca;
        aviso('Adicionado à fila', `${marca} · ${ref}`);
        f.ref.value = ''; f.obs.value = ''; f.preco.value = ''; foto = null;
        solta.innerHTML = String(html`${icone('upload')}<div><b>Arraste, clique ou cole (Ctrl+V)</b></div><small>JPG, PNG ou WEBP · reduzida automaticamente</small>`);
        el.querySelector('#fila').innerHTML = String(filaHTML(lerFila()));
        el.querySelector('.painel-cab .n').textContent = lerFila().length;
        el.querySelector('#enviar-fila').disabled = false;
        ligarFila();
        f.ref.focus();
        dup.hidden = true;
      } catch (err) { erro(err); } finally { btn.disabled = false; }
    };

    const ligarFila = () => el.querySelectorAll('[data-tirar]').forEach((b) => (b.onclick = async () => {
      gravarFila(lerFila().filter((x) => x.tmp !== b.dataset.tirar));
      await recolher(b.closest('li'));
      el.querySelector('.painel-cab .n').textContent = lerFila().length;
      if (!lerFila().length) { el.querySelector('#fila').innerHTML = String(filaHTML([])); el.querySelector('#enviar-fila').disabled = true; }
    }));
    ligarFila();

    el.querySelector('#enviar-fila').onclick = async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      let ok = 0;
      await ctx.segurando(async () => {
        for (const item of [...lerFila()].reverse()) {
          btn.innerHTML = `<span class="giro" aria-hidden="true"></span> Enviando ${ok + 1}…`;
          try {
            const { tmp, ...dados } = item;
            const agora = Date.now();
            await ctx.inserir({ ...dados, codigo: '', status: 'pendente', nota: dados.obs, visto: true, criado: agora, cadastradoEm: agora });
            gravarFila(lerFila().filter((x) => x.tmp !== tmp));
            await recolher(el.querySelector(`[data-fila="${tmp}"]`));
            ok++;
          } catch (err) { erro(err); break; }
        }
      });
      if (ok) aviso(`${ok} ${ok === 1 ? 'calçado enviado' : 'calçados enviados'} para a loja`, 'A loja já pode informar os códigos.');
    };
  },
};
