// Acesso ao banco. REGRA: este arquivo nunca apaga nada.
// Toda alteração lê o doc atual e grava {...docAtual, ...alterações}, preservando campos desconhecidos.
import { SUPABASE_URL, SUPABASE_ANON_KEY, TABELA, BUCKET_FOTOS } from './config.js';

const { createClient } = window.supabase;

export function criarBanco() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function perfilDe(user) {
    if (!user) return null;
    const { data, error } = await sb.from('perfis').select('*').eq('id', user.id).maybeSingle();
    if (error) throw new Error('Não foi possível ler seu perfil. Execute o sql/setup.sql no Supabase.');
    if (!data) throw new Error('Seu usuário ainda não tem perfil. Execute o sql/setup.sql no Supabase.');
    if (!data.ativo) throw new Error('Seu acesso está desativado.');
    if (data.papel !== 'admin') throw new Error('Este usuário não tem acesso à administração.');
    return data;
  }

  return {
    demo: false,

    async sessao() {
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) return null;
      try { return { user, perfil: await perfilDe(user) }; } catch { await sb.auth.signOut(); return null; }
    },

    async entrar(email, senha) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message);
      try {
        return { user: data.user, perfil: await perfilDe(data.user) };
      } catch (e) {
        await sb.auth.signOut();
        throw e;
      }
    },

    sair: () => sb.auth.signOut(),

    // Lê todas as linhas, em páginas de 1000 (limite do Supabase)
    async listar() {
      const linhas = [];
      for (let de = 0; ; de += 1000) {
        const { data, error } = await sb.from(TABELA).select('id, doc, atualizado').order('atualizado', { ascending: false }).range(de, de + 999);
        if (error) throw new Error(error.message);
        linhas.push(...data);
        if (data.length < 1000) break;
      }
      return linhas;
    },

    async alterar(id, mudancas, autor) {
      const { data: atual, error: e1 } = await sb.from(TABELA).select('doc').eq('id', id).maybeSingle();
      if (e1) throw new Error(e1.message);
      if (!atual) throw new Error('Item não encontrado no banco.');
      const doc = { ...(atual.doc || {}), ...mudancas, atualizadoPor: autor || undefined };
      const atualizado = new Date().toISOString();
      const { data, error } = await sb.from(TABELA).update({ doc, atualizado }).eq('id', id).select('id, doc, atualizado').maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error('O banco não aceitou a alteração (permissão).');
      return data;
    },

    async inserir(doc) {
      const id = crypto.randomUUID();
      const linha = { id, doc: { ...doc, id }, atualizado: new Date().toISOString() };
      const { data, error } = await sb.from(TABELA).insert(linha).select('id, doc, atualizado').maybeSingle();
      if (error) throw new Error(error.message);
      return data || linha;
    },

    async enviarFoto(blob) {
      const caminho = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.jpg`;
      const { error } = await sb.storage.from(BUCKET_FOTOS).upload(caminho, blob, { contentType: 'image/jpeg' });
      if (error) throw new Error('Falha ao enviar a foto: ' + error.message);
      return sb.storage.from(BUCKET_FOTOS).getPublicUrl(caminho).data.publicUrl;
    },

    // Tempo real: chama aoMudar(linha) a cada insert/update na tabela
    ouvir(aoMudar, aoStatus) {
      const canal = sb
        .channel('itens-tempo-real')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABELA }, (p) => {
          if (p.new && p.new.id) aoMudar(p.new, p.eventType, p.old);
        })
        .subscribe((s) => aoStatus?.(s === 'SUBSCRIBED'));
      return () => sb.removeChannel(canal);
    },

    async listarPerfis() {
      const { data, error } = await sb.from('perfis').select('*').order('nome');
      if (error) throw new Error(error.message);
      return data;
    },

    async alterarPerfil(id, mudancas) {
      const { error } = await sb.from('perfis').update(mudancas).eq('id', id);
      if (error) throw new Error(error.message);
    },

    // Cria um usuário sem derrubar a sessão do admin (cliente separado, sem guardar sessão)
    async criarUsuario(email, senha, nome) {
      const temp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sf-temp' } });
      const { data, error } = await temp.auth.signUp({ email, password: senha, options: { data: { nome } } });
      if (error) throw new Error(error.message);
      return data.user;
    },
  };
}

// Reduz a foto para no máximo 1400px e JPEG ~85% antes de enviar
export async function comprimirImagem(arquivo, max = 1400) {
  const bmp = await createImageBitmap(arquivo);
  const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * escala);
  c.height = Math.round(bmp.height * escala);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85));
}
