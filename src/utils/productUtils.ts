import { Product, SortOption } from '../types';

/**
 * Agrupa produtos por marca em ordem alfabética (A-Z)
 */
export function groupProductsByBrand(products: Product[]): Record<string, Product[]> {
  const grouped: Record<string, Product[]> = {};
  
  // Ordena produtos por marca primeiro
  const sorted = [...products].sort((a, b) => a.brand.localeCompare(b.brand, 'pt-BR'));
  
  for (const product of sorted) {
    const brand = product.brand.trim() || 'Sem Marca';
    if (!grouped[brand]) {
      grouped[brand] = [];
    }
    grouped[brand].push(product);
  }
  
  // Retorna objeto com chaves ordenadas alfabeticamente
  const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const result: Record<string, Product[]> = {};
  for (const key of sortedKeys) {
    result[key] = grouped[key];
  }
  
  return result;
}

/**
 * Modelos que expressamente NÃO são para constar nas pendências (estão estritamente esperando código):
 * 1. Picadili 500380-15
 * 2. 500375-6/500375-4 (Picadili)
 * 3. Santinelli 1490-106-241
 */
export function isExplicitNonPendency(brand?: string, reference?: string): boolean {
  const b = (brand || '').toLowerCase().trim();
  const r = (reference || '').toLowerCase().replace(/\s+/g, '');

  // 1. Picadili / Piccadilly 500380-15
  if ((b.includes('piccadilly') || b.includes('picadili')) && r.includes('500380-15')) {
    return true;
  }

  // 2. 500375-6/500375-4 (Picadili)
  if (r.includes('500375-6') || r.includes('500375-4')) {
    return true;
  }

  // 3. Santinelli 1490-106-241
  if (b.includes('santinelli') && r.includes('1490-106-241')) {
    return true;
  }

  return false;
}

/**
 * Verifica se um produto possui alguma pendência de fotos ou de código+fotos.
 * Produtos com qualquer tipo de pendência NÃO devem aparecer em "marcas esperando código",
 * devendo figurar exclusivamente na Central de Pendências.
 * 
 * ATENÇÃO: Os modelos Piccadilly 500380-15, 500375-6/500375-4 e Santinelli 1490-106-241
 * NÃO são pendências e NUNCA devem figurar nas pendências!
 */
export function isPendencyProduct(product: Product): boolean {
  if (product.status === 'completed' || product.status === 'draft') return false;

  // Trava explícita: modelos que não são para constar nas pendências
  if (isExplicitNonPendency(product.brand, product.reference)) {
    return false;
  }

  // 1. Status explícito de foto com pendência
  if (
    product.photoStatus === 'Não tenho nenhuma foto' ||
    product.photoStatus === 'Faltam as fotos' ||
    product.photoStatus === 'Somente foto de Capa'
  ) {
    return true;
  }

  // 2. Marcador explícito de código recebido com fotos faltantes
  if (product.codeReceivedMissingPhotos) {
    return true;
  }

  // 3. Ausência de foto
  if (!product.photoUrl || product.photoUrl.trim() === '') {
    return true;
  }

  // 4. Observações de cadastro ou notas da loja indicando pendência de fotos
  const text = `${product.observation || ''} ${product.storeObservation || ''}`.toLowerCase();
  if (
    text.includes('não tenho nenhuma') ||
    text.includes('nao tenho nenhuma') ||
    text.includes('não tenho foto') ||
    text.includes('nao tenho foto') ||
    text.includes('não tenho as fotos') ||
    text.includes('nao tenho as fotos') ||
    ((text.includes('falta') || text.includes('faltam')) &&
      (text.includes('foto') ||
        text.includes('fotos') ||
        text.includes('escritorio') ||
        text.includes('escritório') ||
        text.includes('tudo') ||
        text.includes('mandar') ||
        text.includes('enviar'))) ||
    text.includes('sem foto') ||
    text.includes('sem fotos') ||
    text.includes('sem código e sem foto') ||
    text.includes('sem codigo e sem foto') ||
    text.includes('tenho somente') ||
    text.includes('somente foto de capa') ||
    (text.includes('capa') && !text.includes('champagne'))
  ) {
    return true;
  }

  return false;
}

/**
 * Determina se o calçado está PRONTO na aba de Códigos Recebidos:
 * 1. Deve ter recebido o código (status === 'code_received' ou submittedCode preenchido).
 * 2. Deve ter fotos completas (NÃO pode ter nenhuma pendência de foto: !isPendencyProduct(p)).
 * 
 * Regra do usuário: Calçados que já receberam código mas faltam fotos ou não têm fotos
 * NUNCA devem aparecer em códigos recebidos! Devem ir exclusivamente para as pendências.
 */
export function isReceivedCodeReady(product: Product): boolean {
  if (product.status === 'completed' || product.status === 'draft') return false;
  const hasCode = Boolean(product.submittedCode && product.submittedCode.trim().length > 0);
  if (product.status !== 'code_received' && !hasCode) return false;
  // Se tem qualquer pendência de fotos, NUNCA fica em códigos recebidos!
  if (isPendencyProduct(product)) return false;
  return true;
}

/**
 * Determina se o calçado está ESTRITAMENTE esperando código na Home e no Painel Admin.
 * Regra: status === 'waiting_code' E NÃO possui pendência de fotos (já tem fotos prontas).
 * Na base atual de 37 pendentes, restringe exatamente às marcas/referências que têm fotos completas:
 * 2 Piccadilly e 1 Santinelli.
 */
export function isWaitingCodeOnly(product: Product): boolean {
  if (product.status !== 'waiting_code') return false;
  if (isExplicitNonPendency(product.brand, product.reference)) return true;
  return !isPendencyProduct(product);
}

/**
 * Conta quantas referências estão esperando código por marca (estritamente sem pendência de fotos)
 */
export function getWaitingCodeCountByBrand(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const product of products) {
    if (isWaitingCodeOnly(product)) {
      const brand = product.brand.trim() || 'Sem Marca';
      counts[brand] = (counts[brand] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Pendência Tipo 1: "Tenho o código, mas NÃO tenho as fotos"
 * Calçados que já possuem código cadastrado/recebido, mas fotos ausentes ou incompletas.
 */
export function getPendenciasComCodigoSemFotos(products: Product[]): Product[] {
  return products.filter((p) => {
    if (p.status === 'draft' || p.status === 'completed') return false;
    const hasCode = Boolean(p.submittedCode && p.submittedCode.trim().length > 0);
    return hasCode && isPendencyProduct(p);
  });
}

/**
 * Pendência Tipo 2: "NÃO tenho nem o código e nem as fotos" (Falta Tudo)
 * Calçados que NÃO possuem código e TAMBÉM NÃO possuem fotos completas.
 */
export function getPendenciasSemCodigoSemFotos(products: Product[]): Product[] {
  return products.filter((p) => {
    if (p.status === 'draft' || p.status === 'completed') return false;
    const hasCode = Boolean(p.submittedCode && p.submittedCode.trim().length > 0);
    return !hasCode && isPendencyProduct(p);
  });
}

/**
 * Resumo consolidado de todas as pendências divididas por tipo
 */
export function getAllPendenciasSummary(products: Product[]): {
  withCodeMissingPhotos: Product[];
  missingCodeAndPhotos: Product[];
  all: Product[];
  total: number;
} {
  const withCodeMissingPhotos = getPendenciasComCodigoSemFotos(products);
  const missingCodeAndPhotos = getPendenciasSemCodigoSemFotos(products);
  
  // Lista unificada sem duplicatas
  const idMap = new Map<string, Product>();
  [...withCodeMissingPhotos, ...missingCodeAndPhotos].forEach((item) => {
    idMap.set(item.id, item);
  });
  const all = Array.from(idMap.values());

  return {
    withCodeMissingPhotos,
    missingCodeAndPhotos,
    all,
    total: all.length,
  };
}

/**
 * Filtra produtos com pendências de fotos gerais (compatibilidade)
 */
export function getGeneralPendencias(products: Product[]): Product[] {
  return products.filter((p) => isPendencyProduct(p));
}

/**
 * Filtra produtos com código recebido mas que faltam fotos
 */
export function getCodeReceivedMissingPhotos(products: Product[]): Product[] {
  return getPendenciasComCodigoSemFotos(products);
}

/**
 * As 6 únicas referências Vizzano que ainda NÃO foram enviadas ao Atacado.
 * Todos os outros produtos no histórico de finalizados já foram enviados ao atacado.
 */
export const VIZZANO_MISSING_ATACADO_REFS = [
  '6525.219',
  '6536.221/6536.121',
  '6591.100/6591.200',
  '1483.100',
  '1206.1025',
  '6576.104',
];

export function isVizzanoMissingAtacado(brand?: string, reference?: string): boolean {
  const b = (brand || '').toLowerCase().trim();
  const r = (reference || '').toLowerCase().replace(/\s+/g, '');
  if (!b.includes('vizzano') && !b.includes('visano')) return false;

  return VIZZANO_MISSING_ATACADO_REFS.some((target) => {
    const cleanTarget = target.toLowerCase().replace(/\s+/g, '');
    return r.includes(cleanTarget) || cleanTarget.includes(r);
  });
}

/**
 * Identifica produtos que estão com pendência de envio ao Atacado.
 * Regra estrita do usuário: No histórico feito, SOMENTE os 6 calçados Vizzano
 * (6525.219, 6536.221/6536.121, 6591.100/6591.200, 1483.100, 1206.1025, 6576.104)
 * devem constar no lembrete de falta atacado e na aba Falta Atacado.
 * Todos os outros produtos finalizados já foram enviados ao atacado.
 */
export function getMissingAtacado(products: Product[]): Product[] {
  return products.filter((p) => {
    if (p.status === 'draft') return false;
    // Se o calçado já foi marcado como enviado ao atacado, não é pendência
    if (p.sentToAtacado === true) return false;

    // Se é um produto do histórico feito (completed), somente os 6 Vizzanos especificados constam
    if (p.status === 'completed') {
      return isVizzanoMissingAtacado(p.brand, p.reference);
    }

    // Para produtos ativos que foram para o site mas falta atacado
    return p.sentToSite === true && p.sentToAtacado === false;
  });
}

/**
 * Formata moeda em Real Brasileiro (BRL)
 */
export function formatBRL(amount?: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'R$ 0,00';
  }
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata o texto do preço no padrão exigido pelo usuário:
 * "Este produto está no Bling por R$ XX,XX"
 * Retorna null se não houver preço cadastrado.
 */
export function formatBlingPriceText(price?: number): string | null {
  if (typeof price !== 'number' || isNaN(price) || price <= 0) {
    return null;
  }
  return `Este produto está no Bling por ${formatBRL(price)}`;
}

/**
 * Filtra e ordena produtos para listas e histórico
 */
export function filterAndSortProducts(
  products: Product[],
  options: {
    search?: string;
    brand?: string;
    photoStatus?: string;
    lifecycleStatus?: string;
    sort?: SortOption;
  }
): Product[] {
  const { search = '', brand = '', photoStatus = '', lifecycleStatus = '', sort = 'date_desc' } = options;
  const q = search.trim().toLowerCase();

  return products
    .filter((product) => {
      // Busca por marca, referência ou código
      if (q) {
        const matchesBrand = product.brand.toLowerCase().includes(q);
        const matchesRef = product.reference.toLowerCase().includes(q);
        const matchesCode = (product.submittedCode || '').toLowerCase().includes(q);
        const matchesObs = (product.observation || '').toLowerCase().includes(q);
        const matchesStoreObs = (product.storeObservation || '').toLowerCase().includes(q);
        if (!matchesBrand && !matchesRef && !matchesCode && !matchesObs && !matchesStoreObs) {
          return false;
        }
      }

      // Filtro por marca
      if (brand && brand !== 'all' && product.brand.toLowerCase() !== brand.toLowerCase()) {
        return false;
      }

      // Filtro por status de foto
      if (photoStatus && photoStatus !== 'all' && product.photoStatus !== photoStatus) {
        return false;
      }

      // Filtro por lifecycle
      if (lifecycleStatus && lifecycleStatus !== 'all' && product.status !== lifecycleStatus) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name_asc':
          return a.brand.localeCompare(b.brand, 'pt-BR') || a.reference.localeCompare(b.reference, 'pt-BR');
        case 'name_desc':
          return b.brand.localeCompare(a.brand, 'pt-BR') || b.reference.localeCompare(a.reference, 'pt-BR');
        case 'price_asc':
          return (a.price || 0) - (b.price || 0);
        case 'price_desc':
          return (b.price || 0) - (a.price || 0);
        case 'date_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
}
