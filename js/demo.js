// Modo demonstração (?demo): mesmos métodos do banco real, com dados fictícios em memória.
// Nada aqui toca o Supabase.

const MARCAS = {
  'BEIRA RIO': ['8320-100', '8320-101', '8320-102', '8320-103', '8336-410'],
  MOLECA: ['5674-210', '5674-215', '5307-155'],
  VIZZANO: ['1483.100', '6525.219', '6288-100', '1356.200'],
  DAKOTA: ['G9651', 'G9652'],
  USAFLEX: ['AB2103', 'AB2210'],
  PICCADILLY: ['500380-15', '117083'],
  OLYMPIKUS: ['CORRE-3', 'ATTRACT 2'],
  MODARE: ['7016.473', '7357.201'],
};
const CORES = ['#b9a48a', '#7d8b74', '#a86b4f', '#5f6f86', '#c4a35a', '#8a6a8a', '#6f8f8a'];

function fotoFicticia(ref, n) {
  const cor = CORES[n % CORES.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${cor}"/><path d="M70 205c40-6 70-28 92-60 8-12 24-14 34-4 22 22 52 34 92 38 30 3 46 14 46 28v10H70z" fill="#fff" opacity=".88"/><rect x="70" y="214" width="264" height="14" rx="4" fill="#222" opacity=".75"/><text x="20" y="40" font-family="monospace" font-size="18" fill="#fff" opacity=".9">${ref}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function gerar() {
  const linhas = [];
  const agora = Date.now();
  let n = 0;
  for (const [marca, refs] of Object.entries(MARCAS)) {
    for (const ref of refs) {
      n++;
      const dias = (n * 37) % 40;
      const criado = agora - dias * 864e5 - n * 36e5;
      const doc = { marca, ref, fotos: [fotoFicticia(ref, n)], criado, cadastradoEm: criado, obs: '', nota: '', preco: 79.9 + (n % 9) * 20 };
      const tipo = n % 7;
      if (tipo === 0 || tipo === 3 || tipo === 5) {
        Object.assign(doc, { status: 'feito', codigo: String(40000 + n * 13), respondidoEm: criado + (1 + (n % 4)) * 864e5, feitoEm: criado + (2 + (n % 4)) * 864e5, sentToSite: true });
      } else if (tipo === 1) {
        Object.assign(doc, { status: 'respondido', codigo: String(40000 + n * 13), respondidoEm: criado + 864e5 });
      } else if (tipo === 2) {
        Object.assign(doc, { fotos: [], nota: 'Não tenho nenhuma foto', status: 'pendente' });
      } else if (tipo === 4) {
        Object.assign(doc, { status: 'respondido', codigo: String(40000 + n * 13), notaPainel: 'Faltam as fotos da cor preta', faltamCores: 'Preto', respondidoEm: criado + 864e5 });
      } else doc.status = 'pendente';
      linhas.push({ id: 'demo-' + n, doc, atualizado: new Date(criado).toISOString() });
    }
  }
  linhas.push({ id: 'demo-arq', doc: { marca: 'MODARE', ref: '7000.100', status: 'excluido', deletado: true, fotos: [] }, atualizado: new Date(agora - 20 * 864e5).toISOString() });
  return linhas;
}

export function criarBancoDemo() {
  const linhas = gerar();
  const ouvintes = new Set();
  const avisar = (l, ev) => ouvintes.forEach((f) => f(structuredClone(l), ev));
  let perfis = [
    { id: 'p1', nome: 'Jakero', email: 'admin@demo', papel: 'admin', ativo: true, criado_em: new Date().toISOString() },
    { id: 'p2', nome: 'Loja Centro', email: 'loja@demo', papel: 'loja', ativo: true, criado_em: new Date().toISOString() },
  ];
  let sessao = null;
  const espera = (ms = 150) => new Promise((r) => setTimeout(r, ms));

  // Simula a loja enviando um código de tempos em tempos
  setInterval(() => {
    if (!sessao || sessao.perfil.papel !== 'admin') return;
    const l = linhas.find((x) => x.doc.status === 'pendente' && x.doc.fotos.length);
    if (!l) return;
    Object.assign(l.doc, { status: 'respondido', codigo: String(50000 + Math.floor(Math.random() * 9999)), respondidoEm: Date.now(), atualizadoPor: 'Loja Centro' });
    l.atualizado = new Date().toISOString();
    avisar(l, 'UPDATE');
  }, 40000);

  return {
    demo: true,
    async sessao() { return sessao; },
    async entrar(email) {
      await espera();
      const perfil = perfis.find((p) => p.email === email) || perfis[0];
      sessao = { user: { id: perfil.id, email: perfil.email }, perfil };
      return sessao;
    },
    async sair() { sessao = null; },
    async listar() { await espera(300); return structuredClone(linhas); },
    async alterar(id, mudancas, autor) {
      await espera();
      const l = linhas.find((x) => x.id === id);
      if (!l) throw new Error('Item não encontrado.');
      l.doc = { ...l.doc, ...mudancas, atualizadoPor: autor };
      l.atualizado = new Date().toISOString();
      avisar(l, 'UPDATE');
      return structuredClone(l);
    },
    async inserir(doc) {
      await espera();
      const id = 'demo-' + crypto.randomUUID().slice(0, 8);
      const l = { id, doc: { ...doc, id }, atualizado: new Date().toISOString() };
      linhas.unshift(l);
      avisar(l, 'INSERT');
      return structuredClone(l);
    },
    async enviarFoto(blob) {
      return new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
    },
    ouvir(f, aoStatus) { ouvintes.add(f); aoStatus?.(true); return () => ouvintes.delete(f); },
    async listarPerfis() { await espera(); return structuredClone(perfis); },
    async alterarPerfil(id, m) { perfis = perfis.map((p) => (p.id === id ? { ...p, ...m } : p)); },
    async criarUsuario(email, _s, nome) {
      perfis.push({ id: crypto.randomUUID(), email, nome, papel: 'loja', ativo: true, criado_em: new Date().toISOString() });
    },
  };
}
