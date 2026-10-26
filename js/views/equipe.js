import { html, raw, icone, iniciais, aviso, erro, ocupado, dataBR } from '../ui.js';
import { vazioBloco } from '../componentes.js';

export default {
  titulo: () => 'Equipe',

  render() {
    return html`<div class="grade" style="grid-template-columns:minmax(0,1fr) 360px;align-items:start" id="eq-grade">
      <section class="painel"><div class="painel-cab"><h2>Pessoas com acesso</h2></div><div id="eq-lista"><div class="painel-corpo"><div class="esqueleto"></div><div class="esqueleto"></div></div></div></section>
      <section class="painel"><div class="painel-cab"><h2>Adicionar pessoa</h2></div>
        <form class="painel-corpo grade" id="eq-form">
          <label class="campo"><span>Nome</span><input class="inp" name="nome" required></label>
          <label class="campo"><span>E-mail</span><input class="inp" type="email" name="email" required></label>
          <label class="campo"><span>Senha inicial</span><input class="inp" name="senha" minlength="6" required><small>Mínimo 6 caracteres. Passe para a pessoa; ela entra como Loja e você pode promover a Administrador.</small></label>
          <button class="btn pri" type="submit">${icone('mais')} Criar acesso</button>
        </form></section></div>`;
  },

  async montar(el, ctx) {
    if (matchMedia('(max-width: 1100px)').matches) el.querySelector('#eq-grade').style.gridTemplateColumns = '1fr';
    const alvo = el.querySelector('#eq-lista');
    const pintar = async () => {
      try {
        const perfis = await ctx.banco.listarPerfis();
        if (!perfis.length) { alvo.innerHTML = String(vazioBloco('equipe', 'Ninguém ainda', 'Adicione a primeira pessoa ao lado.')); return; }
        alvo.innerHTML = String(html`<ul class="lista cascata">${perfis.map((p, i) => html`
          <li class="item" style="--i:${i}">
            <span class="avatar" style="width:40px;height:40px" aria-hidden="true">${iniciais(p.nome || p.email)}</span>
            <div class="item-info"><div class="item-titulo"><b style="font-family:var(--sans)">${p.nome || '—'}</b>${p.ativo ? '' : html`<span class="selo neu">Desativado</span>`}${p.id === ctx.perfil.id ? html`<span class="selo recv">Você</span>` : ''}</div>
              <div class="item-meta"><span>${p.email}</span><span>desde ${dataBR(p.criado_em)}</span></div></div>
            <div class="item-acoes">
              <label class="sr" for="papel-${p.id}">Papel de ${p.nome}</label>
              <select class="inp" style="height:32px;width:auto" id="papel-${p.id}" data-papel="${p.id}" ${p.id === ctx.perfil.id ? raw('disabled') : ''}>
                <option value="loja" ${p.papel === 'loja' ? raw('selected') : ''}>Loja</option>
                <option value="admin" ${p.papel === 'admin' ? raw('selected') : ''}>Administrador</option></select>
              ${p.id === ctx.perfil.id ? '' : html`<button class="btn peq" data-ativo="${p.id}" data-valor="${!p.ativo}">${p.ativo ? 'Desativar' : 'Reativar'}</button>`}
            </div></li>`)}</ul>`);
        alvo.querySelectorAll('[data-papel]').forEach((s) => (s.onchange = async () => {
          try { await ctx.banco.alterarPerfil(s.dataset.papel, { papel: s.value }); aviso('Papel atualizado'); } catch (e) { erro(e); }
        }));
        alvo.querySelectorAll('[data-ativo]').forEach((b) => (b.onclick = () => ocupado(b, async () => {
          try { await ctx.banco.alterarPerfil(b.dataset.ativo, { ativo: b.dataset.valor === 'true' }); aviso('Acesso atualizado'); pintar(); } catch (e) { erro(e); }
        })));
      } catch (e) {
        alvo.innerHTML = String(vazioBloco('alerta', 'Não foi possível listar a equipe', e.message));
      }
    };
    pintar();

    el.querySelector('#eq-form').onsubmit = (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      if (!e.target.checkValidity()) return e.target.reportValidity();
      ocupado(e.submitter, async () => {
        try {
          await ctx.banco.criarUsuario(f.get('email').trim(), f.get('senha'), f.get('nome').trim());
          aviso('Acesso criado', ctx.demo ? '' : 'Se o Supabase exigir confirmação, a pessoa recebe um e-mail para confirmar.');
          e.target.reset();
          pintar();
        } catch (err) { erro(err); }
      });
    };
  },
};
