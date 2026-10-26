import { html, raw, icone, logo } from '../ui.js';

export default {
  render(ctx) {
    return html`<div class="login">
      <section class="login-arte" aria-hidden="true">
        <div>${logo('invertido grande')}</div>
        <div>
          <h1>Do cadastro ao site, sem perder nenhuma referência.</h1>
          <p>Escritório cadastra, a loja envia o código, o escritório finaliza. Tudo sincronizado ao vivo.</p>
        </div>
        <div class="fluxo" id="fluxo"><span>Cadastro</span><span>Código</span><span>Fotos</span><span>Site</span><span>Atacado</span></div>
      </section>
      <section class="login-form">
        <form id="f-login" novalidate>
          <a class="btn fant peq" href="#/loja" style="align-self:flex-start">${icone('voltar')} Voltar para a loja</a>
          <div><h2>Administração</h2><p class="muted" style="margin:4px 0 0">Área restrita. Entre com seu e-mail e senha de administrador.</p></div>
          ${ctx.demo
            ? html`<div class="grade">
                <button class="btn pri" type="button" data-demo="admin@demo">Entrar como administrador (demonstração)</button>
                <p class="muted" style="font-size:12px;margin:0">No sistema real aqui ficam os campos de e-mail e senha.</p></div>`
            : html`<label class="campo"><span>E-mail</span><input class="inp" type="email" name="email" autocomplete="username" required autofocus></label>
                <label class="campo"><span>Senha</span><input class="inp" type="password" name="senha" autocomplete="current-password" required></label>
                <p class="erro-txt" id="erro-login" role="alert" hidden></p>
                <button class="btn pri" type="submit">Entrar</button>`}
        </form>
      </section>
    </div>`;
  },

  montar(raiz, ctx, entrar) {
    // Pequena animação do fluxo, passo a passo
    const passos = [...raiz.querySelectorAll('#fluxo span')];
    let k = 0;
    const t = setInterval(() => {
      if (!passos[0]?.isConnected) return clearInterval(t);
      passos.forEach((p, j) => p.classList.toggle('on', j === k));
      k = (k + 1) % passos.length;
    }, 900);

    raiz.querySelectorAll('[data-demo]').forEach((b) => (b.onclick = async () => entrar(await ctx.banco.entrar(b.dataset.demo))));
    const f = raiz.querySelector('#f-login');
    f.onsubmit = async (e) => {
      e.preventDefault();
      if (ctx.demo) return;
      const msg = raiz.querySelector('#erro-login');
      const btn = f.querySelector('[type=submit]');
      const dados = new FormData(f);
      if (!dados.get('email') || !dados.get('senha')) { msg.hidden = false; msg.textContent = 'Preencha e-mail e senha.'; return; }
      btn.disabled = true;
      btn.innerHTML = String(raw('<span class="giro" aria-hidden="true"></span> Entrando…'));
      try {
        entrar(await ctx.banco.entrar(dados.get('email').trim(), dados.get('senha')));
      } catch (err) {
        msg.hidden = false;
        msg.textContent = err.message;
        btn.disabled = false;
        btn.textContent = 'Entrar';
        f.animate([{ translate: '0' }, { translate: '-6px' }, { translate: '6px' }, { translate: '0' }], { duration: 260 });
      }
    };
  },
};
