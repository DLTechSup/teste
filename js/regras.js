// Regras de negócio puras (sem acesso a banco ou tela) — testadas em tests/regras.test.mjs

export const STATUS_FOTOS = {
  completas: 'Tenho todas as fotos',
  capa: 'Somente foto de capa',
  faltam: 'Faltam fotos',
  nenhuma: 'Nenhuma foto',
};

// Exceções herdadas do sistema antigo: nunca contam como pendência (estão só esperando código)
const EXCECOES_PENDENCIA = [
  (m, r) => (m.includes('piccadilly') || m.includes('picadili')) && r.includes('500380-15'),
  (m, r) => r.includes('500375-6') || r.includes('500375-4'),
  (m, r) => m.includes('santinelli') && r.includes('1490-106-241'),
];

// Herdado: no histórico finalizado, só estes Vizzano não foram ao atacado (quando o doc não diz nada)
const VIZZANO_SEM_ATACADO = ['6525.219', '6536.221/6536.121', '6591.100/6591.200', '1483.100', '1206.1025', '6576.104'];

const limpa = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, '');

export function excecaoPendencia(marca, ref) {
  const m = (marca || '').toLowerCase();
  const r = limpa(ref);
  return EXCECOES_PENDENCIA.some((f) => f(m, r));
}

function vizzanoSemAtacado(marca, ref) {
  const m = (marca || '').toLowerCase();
  if (!m.includes('vizzano') && !m.includes('visano')) return false;
  const r = limpa(ref);
  return VIZZANO_SEM_ATACADO.some((t) => r.includes(limpa(t)) || limpa(t).includes(r));
}

// Lê o texto livre das notas (formato do sistema antigo) e deduz a situação das fotos
export function statusFotosPorTexto(texto, qtdFotos) {
  const t = (texto || '').toLowerCase();
  if (/n[ãa]o tenho (nenhuma|foto|as fotos)/.test(t)) return 'nenhuma';
  if (
    (/faltam?/.test(t) && /(foto|escrit[óo]rio|tudo|mandar|enviar)/.test(t)) ||
    t.includes('tenho somente')
  ) return 'faltam';
  if (t.includes('somente foto de capa') || (t.includes('capa') && !t.includes('champagne'))) return 'capa';
  return qtdFotos === 0 ? 'nenhuma' : 'completas';
}

const PISTAS_PENDENCIA = /(n[ãa]o tenho (nenhuma|foto|as fotos)|sem fotos?|tenho somente|somente foto de capa)/;

const data = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

function numero(v) {
  if (typeof v === 'number') return v > 0 ? v : null;
  if (typeof v === 'string' && v.trim()) {
    const n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
    return !isNaN(n) && n > 0 ? n : null;
  }
  return null;
}

// Converte uma linha da tabela "itens" no modelo usado pela tela
export function lerItem(row) {
  const doc = row.doc || {};
  const marca = (doc.marca || 'Sem marca').toString().trim().toUpperCase();
  const ref = (doc.ref || 'S/ ref').toString().trim();
  const codigo = (doc.codigo || '').toString().trim();
  const fotos = (Array.isArray(doc.fotos) ? doc.fotos : []).filter((f) => typeof f === 'string' && f);

  let etapa = 'aguardando';
  if (doc.status === 'feito') etapa = 'feito';
  else if (doc.status === 'respondido' || codigo) etapa = 'recebido';

  const ignorarPendencia = doc.ignorarPendencia === true || excecaoPendencia(marca, ref);
  const statusExplicito = STATUS_FOTOS[doc.statusFotos] ? doc.statusFotos : null;
  const textoNotas = doc.nota || doc.notaPainel || doc.motivoFoto || '';
  const statusFotos = ignorarPendencia
    ? 'completas'
    : statusExplicito || statusFotosPorTexto(textoNotas, fotos.length);

  const criadoEm = data(doc.criado) || data(doc.cadastradoEm) || data(row.atualizado) || new Date(0).toISOString();
  const respondidoEm = data(doc.respondidoEm) || (codigo ? criadoEm : null);
  const feitoEm = data(doc.feitoEm) || (etapa === 'feito' ? data(row.atualizado) || criadoEm : null);

  let atacado;
  if (doc.sentToAtacado !== undefined) atacado = Boolean(doc.sentToAtacado);
  else atacado = etapa === 'feito' ? !vizzanoSemAtacado(marca, ref) : false;

  const arquivado =
    doc.arquivado === true || doc.deletado === true || doc.removido === true || doc.status === 'excluido';

  return {
    id: row.id,
    marca,
    ref,
    modelo: (doc.modelo || doc.descricao || '').toString().trim(),
    codigo,
    etapa,
    fotos,
    foto: fotos[0] || '',
    statusFotos,
    statusExplicito: Boolean(statusExplicito),
    faltamCores: (doc.faltamCores || doc.coresFaltantes || '').toString().trim(),
    obs: (doc.obs || doc.nota || '').toString().trim(),
    obsLoja: (doc.notaPainel || doc.motivoFoto || '').toString().trim(),
    preco: numero(doc.preco) ?? numero(doc.price) ?? numero(doc.valor),
    site: doc.sentToSite !== undefined ? Boolean(doc.sentToSite) : etapa !== 'aguardando',
    atacado,
    ignorarPendencia,
    arquivado,
    criadoEm,
    respondidoEm,
    feitoEm,
    atualizado: row.atualizado || null,
  };
}

// Tem alguma pendência de fotos?
export function temPendencia(item) {
  if (item.arquivado || item.etapa === 'feito' || item.ignorarPendencia) return false;
  if (item.statusFotos !== 'completas') return true;
  if (item.statusExplicito) return false; // o admin confirmou que as fotos estão completas
  if (!item.foto) return true;
  return PISTAS_PENDENCIA.test(`${item.obs} ${item.obsLoja}`.toLowerCase());
}

export const ativo = (i) => !i.arquivado;
export const semCodigo = (i) => ativo(i) && i.etapa === 'aguardando';
export const aguardandoCodigo = (i) => ativo(i) && i.etapa === 'aguardando' && !temPendencia(i);
export const codigoPronto = (i) => ativo(i) && i.etapa === 'recebido' && !temPendencia(i);
export const pendenteComCodigo = (i) => temPendencia(i) && Boolean(i.codigo);
export const pendenteSemCodigo = (i) => temPendencia(i) && !i.codigo;
export const finalizado = (i) => ativo(i) && i.etapa === 'feito';
export const faltaAtacado = (i) => ativo(i) && i.etapa === 'feito' && i.site && !i.atacado;

// Agrupa por marca, em ordem alfabética
export function porMarca(itens) {
  const grupos = new Map();
  for (const i of [...itens].sort((a, b) => a.marca.localeCompare(b.marca, 'pt-BR') || a.ref.localeCompare(b.ref, 'pt-BR'))) {
    if (!grupos.has(i.marca)) grupos.set(i.marca, []);
    grupos.get(i.marca).push(i);
  }
  return grupos;
}

export function buscar(itens, termo) {
  const q = (termo || '').trim().toLowerCase();
  if (!q) return itens;
  return itens.filter((i) => `${i.marca} ${i.ref} ${i.codigo} ${i.obs} ${i.obsLoja}`.toLowerCase().includes(q));
}

export const reais = (v) =>
  typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
