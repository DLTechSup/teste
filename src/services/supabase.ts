import { createClient } from '@supabase/supabase-js';
import { Product, PhotoStatus, ProductLifecycle } from '../types';
import { isExplicitNonPendency, isVizzanoMissingAtacado } from '../utils/productUtils';

export const SUPABASE_URL = 'https://pknrpljdwegytzprcoqw.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbnJwbGpkd2VneXR6cHJjb3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNzc4NTMsImV4cCI6MjEwNTk1Mzg1M30.wO7ASjzwoY2m-dzCLnKHfszRbjoVsZiPmhC73PCLGjM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Retorna o preço / valor no Bling apenas se tiver sido explicitamente cadastrado pelo usuário.
 * Nunca atribui valores padrão ou fictícios.
 */
export function extractPriceFromCodeOrDoc(doc: any): number | undefined {
  if (typeof doc?.preco === 'number' && doc.preco > 0) return doc.preco;
  if (typeof doc?.price === 'number' && doc.price > 0) return doc.price;
  if (typeof doc?.valor === 'number' && doc.valor > 0) return doc.valor;
  if (typeof doc?.valores?.preco === 'number' && doc.valores.preco > 0) return doc.valores.preco;

  if (typeof doc?.preco === 'string' && doc.preco.trim()) {
    const p = parseFloat(doc.preco.replace(',', '.'));
    if (!isNaN(p) && p > 0) return p;
  }
  if (typeof doc?.valor === 'string' && doc.valor.trim()) {
    const p = parseFloat(doc.valor.replace(',', '.'));
    if (!isNaN(p) && p > 0) return p;
  }

  return undefined;
}

/**
 * Converte um registro bruto da tabela 'itens' do Supabase para o formato Product
 */
export function mapSupabaseRowToProduct(row: any): Product {
  const doc = row.doc || {};
  const id = row.id || doc.id || 'item-' + Math.random().toString(36).substr(2, 6);
  const brand = (doc.marca || 'Sem Marca').toString().trim().toUpperCase();
  const reference = (doc.ref || 'S/ Ref').toString().trim();
  const submittedCode = (doc.codigo || '').toString().trim() || undefined;

  // Status mapping
  let status: ProductLifecycle = 'waiting_code';
  if (doc.status === 'feito') {
    status = 'completed';
  } else if (doc.status === 'respondido' || Boolean(submittedCode)) {
    status = 'code_received';
  } else {
    status = 'waiting_code';
  }

  // Foto principal
  const photos = Array.isArray(doc.fotos) ? doc.fotos : [];
  const photoUrl = photos[0] || '';

  // Determina photoStatus
  let photoStatus: PhotoStatus = 'Ja tenho as fotos';
  if (isExplicitNonPendency(brand, reference)) {
    // Modelos que NÃO são para constar nas pendências (Picadili 500380-15, 500375-6/500375-4, Santinelli 1490-106-241)
    photoStatus = 'Ja tenho as fotos';
  } else {
    const notaLower = (doc.nota || doc.notaPainel || doc.motivoFoto || '').toLowerCase();
    if (
      notaLower.includes('não tenho nenhuma') ||
      notaLower.includes('nao tenho nenhuma') ||
      notaLower.includes('não tenho foto') ||
      notaLower.includes('nao tenho foto') ||
      notaLower.includes('não tenho as fotos') ||
      notaLower.includes('nao tenho as fotos')
    ) {
      photoStatus = 'Não tenho nenhuma foto';
    } else if (
      ((notaLower.includes('falta') || notaLower.includes('faltam')) &&
        (notaLower.includes('foto') ||
          notaLower.includes('fotos') ||
          notaLower.includes('escritorio') ||
          notaLower.includes('escritório') ||
          notaLower.includes('tudo') ||
          notaLower.includes('mandar') ||
          notaLower.includes('enviar'))) ||
      notaLower.includes('tenho somente')
    ) {
      photoStatus = 'Faltam as fotos';
    } else if (notaLower.includes('somente foto de capa') || (notaLower.includes('capa') && !notaLower.includes('champagne'))) {
      photoStatus = 'Somente foto de Capa';
    } else if (photos.length === 0) {
      photoStatus = 'Não tenho nenhuma foto';
    } else {
      photoStatus = 'Ja tenho as fotos';
    }
  }

  // Datas
  const createdAt = doc.criado
    ? new Date(doc.criado).toISOString()
    : doc.cadastradoEm
    ? new Date(doc.cadastradoEm).toISOString()
    : row.atualizado || new Date().toISOString();

  const submittedAt = doc.respondidoEm
    ? new Date(doc.respondidoEm).toISOString()
    : submittedCode
    ? createdAt
    : undefined;

  const completedAt = doc.feitoEm
    ? new Date(doc.feitoEm).toISOString()
    : status === 'completed'
    ? row.atualizado || createdAt
    : undefined;

  // Preço / Valor no Bling
  const price = extractPriceFromCodeOrDoc(doc);

  // Observações
  const observation = (doc.obs || doc.nota || '').toString().trim();
  const storeObservation = (doc.notaPainel || doc.motivoFoto || '').toString().trim() || undefined;

  // Condição especial: código recebido, mas faltam fotos
  const codeReceivedMissingPhotos =
    Boolean(submittedCode) &&
    !isExplicitNonPendency(brand, reference) &&
    (photoStatus === 'Faltam as fotos' ||
      photoStatus === 'Não tenho nenhuma foto' ||
      photoStatus === 'Somente foto de Capa');

  // Site e Atacado
  const sentToSite = doc.sentToSite !== undefined ? Boolean(doc.sentToSite) : (status === 'completed' || Boolean(submittedCode));
  
  // Regra do usuário: No histórico feito, todos já foram para o atacado, EXCETO os 6 Vizzanos que ainda faltam
  let sentToAtacado: boolean;
  if (doc.sentToAtacado !== undefined) {
    sentToAtacado = Boolean(doc.sentToAtacado);
  } else if (status === 'completed') {
    sentToAtacado = !isVizzanoMissingAtacado(brand, reference);
  } else {
    sentToAtacado = false;
  }

  const missingColors = (doc.faltamCores || doc.coresFaltantes || '').toString().trim() || undefined;

  return {
    id,
    brand,
    reference,
    price,
    photoUrl,
    photoStatus,
    missingColors,
    observation,
    status,
    submittedCode,
    submittedAt,
    completedAt,
    storeObservation,
    sentToSite,
    sentToAtacado,
    codeReceivedMissingPhotos,
    createdAt,
  };
}

/**
 * Converte um Product de volta para o formato de documento da tabela 'itens'
 */
export function mapProductToSupabaseDoc(product: Product, existingDoc: any = {}) {
  let docStatus = 'pendente';
  if (product.status === 'completed') {
    docStatus = 'feito';
  } else if (product.status === 'code_received' || Boolean(product.submittedCode)) {
    docStatus = 'respondido';
  }

  return {
    ...existingDoc,
    id: product.id,
    marca: product.brand.toUpperCase(),
    ref: product.reference,
    codigo: product.submittedCode || '',
    status: docStatus,
    preco: product.price,
    faltamCores: product.missingColors || existingDoc.faltamCores || undefined,
    sentToSite: product.sentToSite,
    sentToAtacado: product.sentToAtacado,
    fotos: product.photoUrl ? (existingDoc.fotos?.length ? existingDoc.fotos : [product.photoUrl]) : existingDoc.fotos || [],
    obs: product.observation || existingDoc.obs || '',
    nota: product.observation || existingDoc.nota || '',
    notaPainel: product.storeObservation || existingDoc.notaPainel || '',
    motivoFoto: existingDoc.motivoFoto || '',
    visto: true,
    cadastradoEm: existingDoc.cadastradoEm || Date.now(),
    criado: existingDoc.criado || Date.now(),
    respondidoEm: product.submittedAt ? new Date(product.submittedAt).getTime() : existingDoc.respondidoEm,
    feitoEm: product.completedAt ? new Date(product.completedAt).getTime() : existingDoc.feitoEm,
  };
}

/**
 * Busca todos os produtos do Supabase
 */
export async function fetchProductsFromSupabase(): Promise<{ products: Product[]; error: string | null }> {
  try {
    const { data, error } = await supabase.from('itens').select('*').order('atualizado', { ascending: false });

    if (error) {
      console.error('Erro ao buscar itens do Supabase:', error);
      return { products: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { products: [], error: null };
    }

    // Ignora itens marcados como excluídos ou deletados
    const activeRows = data.filter((row) => {
      const doc = row.doc;
      if (!doc) return false;
      if (doc.deletado === true || doc.removido === true || doc.status === 'excluido') {
        return false;
      }
      return true;
    });

    const products = activeRows.map((row) => mapSupabaseRowToProduct(row));
    return { products, error: null };
  } catch (err: any) {
    console.error('Falha na comunicação com Supabase:', err);
    return { products: [], error: err.message || 'Erro de conexão' };
  }
}

/**
 * Atualiza um produto existente no Supabase sem jamais deletar nada indevidamente
 */
export async function saveProductToSupabase(product: Product): Promise<boolean> {
  try {
    // Busca doc atual para preservar campos existentes
    const { data: existing } = await supabase.from('itens').select('doc').eq('id', product.id).maybeSingle();
    const existingDoc = existing?.doc || {};
    const updatedDoc = mapProductToSupabaseDoc(product, existingDoc);

    const { error } = await supabase.from('itens').upsert({
      id: product.id,
      doc: updatedDoc,
      atualizado: new Date().toISOString(),
    });

    if (error) {
      console.error('Erro ao atualizar produto no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar no Supabase:', err);
    return false;
  }
}

/**
 * Insere um novo produto no Supabase com segurança
 */
export async function insertProductToSupabase(product: Product): Promise<boolean> {
  try {
    const doc = mapProductToSupabaseDoc(product, {});
    const { error } = await supabase.from('itens').insert({
      id: product.id,
      doc,
      atualizado: new Date().toISOString(),
    });

    if (error) {
      console.error('Erro ao inserir novo produto no Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao inserir produto no Supabase:', err);
    return false;
  }
}

/**
 * Exclui definitivamente um produto no Supabase marcando status excluído e doc.deletado
 */
export async function deleteProductFromSupabase(id: string): Promise<boolean> {
  try {
    // 1. Marca como excluído no doc para garantir que filtros ignorem mesmo se delete físico for restrito por RLS
    const { data: existing } = await supabase.from('itens').select('doc').eq('id', id).maybeSingle();
    const existingDoc = existing?.doc || {};

    await supabase.from('itens').update({
      doc: {
        ...existingDoc,
        deletado: true,
        removido: true,
        status: 'excluido',
        deletadoEm: new Date().toISOString(),
      },
      atualizado: new Date().toISOString(),
    }).eq('id', id);

    // 2. Tenta também delete físico caso as permissões do banco permitam
    await supabase.from('itens').delete().eq('id', id);

    return true;
  } catch (err) {
    console.error('Exceção ao deletar produto no Supabase:', err);
    return false;
  }
}
