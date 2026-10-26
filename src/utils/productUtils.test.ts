import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupProductsByBrand,
  getWaitingCodeCountByBrand,
  getGeneralPendencias,
  getCodeReceivedMissingPhotos,
  getPendenciasComCodigoSemFotos,
  getPendenciasSemCodigoSemFotos,
  getAllPendenciasSummary,
  getMissingAtacado,
  filterAndSortProducts,
  formatBRL,
  formatBlingPriceText,
  isWaitingCodeOnly,
  isPendencyProduct,
  isReceivedCodeReady,
  isVizzanoMissingAtacado,
  VIZZANO_MISSING_ATACADO_REFS,
} from './productUtils';
import { Product } from '../types';

const mockProducts: Product[] = [
  {
    id: '1',
    brand: 'Moleca',
    reference: '5674-210',
    price: 89.9,
    photoUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500',
    photoStatus: 'Ja tenho as fotos',
    observation: 'Foto perfeita',
    status: 'waiting_code',
    sentToSite: true,
    sentToAtacado: true,
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: '2',
    brand: 'Beira Rio',
    reference: '8320-100',
    price: 119.9,
    photoUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
    photoStatus: 'Faltam as fotos',
    observation: 'Falta foto da lateral e sola',
    status: 'waiting_code',
    sentToSite: true,
    sentToAtacado: false, // Falta atacado!
    createdAt: '2026-10-21T10:00:00Z',
  },
  {
    id: '3',
    brand: 'Beira Rio',
    reference: '8320-101',
    // Preço opcional omitido
    photoUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
    photoStatus: 'Não tenho nenhuma foto',
    observation: 'Aguardando chegada do mostruário',
    status: 'waiting_code',
    sentToSite: false,
    sentToAtacado: false,
    createdAt: '2026-10-22T08:00:00Z',
  },
  {
    id: '4',
    brand: 'Vizzano',
    reference: '6288-100',
    price: 159.9,
    photoUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500',
    photoStatus: 'Somente foto de Capa',
    observation: 'Loja mandou código mas falta fotos de detalhe',
    status: 'code_received',
    submittedCode: '7891234567890',
    codeReceivedMissingPhotos: true,
    sentToSite: true,
    sentToAtacado: false,
    createdAt: '2026-10-22T09:00:00Z',
  },
];

test('groupProductsByBrand groups and orders brands alphabetically', () => {
  const grouped = groupProductsByBrand(mockProducts);
  const keys = Object.keys(grouped);
  assert.deepEqual(keys, ['Beira Rio', 'Moleca', 'Vizzano']);
  assert.equal(grouped['Beira Rio'].length, 2);
  assert.equal(grouped['Moleca'].length, 1);
  assert.equal(grouped['Vizzano'].length, 1);
});

test('isWaitingCodeOnly identifies ONLY products with complete photos waiting for code', () => {
  // Moleca tem fotos completas e está waiting_code -> true
  assert.equal(isWaitingCodeOnly(mockProducts[0]), true);
  // Beira Rio 1 tem Faltam as fotos -> false (é pendência)
  assert.equal(isWaitingCodeOnly(mockProducts[1]), false);
  // Beira Rio 2 não tem foto -> false (é pendência)
  assert.equal(isWaitingCodeOnly(mockProducts[2]), false);
  // Vizzano já recebeu código -> false
  assert.equal(isWaitingCodeOnly(mockProducts[3]), false);
});

test('isPendencyProduct correctly catches missing photos even if code received', () => {
  assert.equal(isPendencyProduct(mockProducts[0]), false); // Foto perfeita
  assert.equal(isPendencyProduct(mockProducts[1]), true);  // Faltam as fotos
  assert.equal(isPendencyProduct(mockProducts[2]), true);  // Não tenho nenhuma foto
  assert.equal(isPendencyProduct(mockProducts[3]), true);  // Somente foto de Capa
});

test('getWaitingCodeCountByBrand counts only true waiting-code products with complete photos', () => {
  const counts = getWaitingCodeCountByBrand(mockProducts);
  // Beira Rio tem pendências de fotos, portanto não aparece em marcas esperando código
  assert.equal(counts['Beira Rio'], undefined);
  // Moleca tem fotos prontas, portanto conta 1
  assert.equal(counts['Moleca'], 1);
  assert.equal(counts['Vizzano'], undefined);
});

test('getGeneralPendencias catches all items with incomplete photos', () => {
  const pendencias = getGeneralPendencias(mockProducts);
  assert.equal(pendencias.length, 3);
  assert.ok(pendencias.some((p) => p.reference === '8320-100'));
  assert.ok(pendencias.some((p) => p.reference === '8320-101'));
  assert.ok(pendencias.some((p) => p.reference === '6288-100'));
});

test('getCodeReceivedMissingPhotos identifies codes with incomplete photos', () => {
  const missing = getCodeReceivedMissingPhotos(mockProducts);
  assert.equal(missing.length, 1);
  assert.equal(missing[0].reference, '6288-100');
});

test('getPendenciasComCodigoSemFotos identifies items with code but missing photos', () => {
  const list = getPendenciasComCodigoSemFotos(mockProducts);
  assert.equal(list.length, 1);
  assert.equal(list[0].id, '4');
  assert.equal(list[0].submittedCode, '7891234567890');
});

test('getPendenciasSemCodigoSemFotos identifies items with no code and missing photos', () => {
  const list = getPendenciasSemCodigoSemFotos(mockProducts);
  assert.equal(list.length, 2);
  assert.ok(list.some((p) => p.reference === '8320-100'));
  assert.ok(list.some((p) => p.reference === '8320-101'));
});

test('getAllPendenciasSummary consolidates both pendency types', () => {
  const summary = getAllPendenciasSummary(mockProducts);
  assert.equal(summary.withCodeMissingPhotos.length, 1);
  assert.equal(summary.missingCodeAndPhotos.length, 2);
  assert.equal(summary.total, 3);
});

test('getMissingAtacado identifies site-ready items missing atacado', () => {
  const missingAtacado = getMissingAtacado(mockProducts);
  assert.equal(missingAtacado.length, 2);
  assert.ok(missingAtacado.some((p) => p.id === '2'));
  assert.ok(missingAtacado.some((p) => p.id === '4'));
});

test('formatBlingPriceText formats price with Bling prefix or returns null', () => {
  const formatted = formatBlingPriceText(159.9);
  assert.ok(formatted?.startsWith('Este produto está no Bling por R$'));
  assert.ok(formatted?.includes('159,90'));
  assert.equal(formatBlingPriceText(undefined), null);
  assert.equal(formatBlingPriceText(0), null);
});

test('filterAndSortProducts correctly filters by brand and search', () => {
  const filtered = filterAndSortProducts(mockProducts, { search: '8320' });
  assert.equal(filtered.length, 2);

  const brandFiltered = filterAndSortProducts(mockProducts, { brand: 'Moleca' });
  assert.equal(brandFiltered.length, 1);
  assert.equal(brandFiltered[0].reference, '5674-210');
});

test('formatBRL formats properly to Brazilian Real', () => {
  const formatted = formatBRL(119.9);
  assert.ok(formatted.includes('119,90'));
  assert.ok(formatted.includes('R$'));
});

test('Piccadilly and Santinelli specific references are strictly excluded from pendências', () => {
  const p1: Product = {
    id: 'p1',
    brand: 'PICCADILLY',
    reference: '500380-15',
    photoUrl: 'https://example.com/photo1.jpg',
    status: 'waiting_code',
    photoStatus: 'Ja tenho as fotos',
    observation: 'Foto completa',
    sentToSite: true,
    sentToAtacado: true,
    createdAt: '2026-10-25T00:00:00Z',
  };

  const p2: Product = {
    id: 'p2',
    brand: 'PICCADILLY',
    reference: '500375-6 / 500375-4',
    photoUrl: 'https://example.com/photo2.jpg',
    status: 'waiting_code',
    photoStatus: 'Ja tenho as fotos',
    observation: '',
    sentToSite: true,
    sentToAtacado: true,
    createdAt: '2026-10-25T00:00:00Z',
  };

  const p3: Product = {
    id: 'p3',
    brand: 'SANTINELLI',
    reference: '1490-106-241',
    photoUrl: 'https://example.com/photo3.jpg',
    status: 'waiting_code',
    photoStatus: 'Ja tenho as fotos',
    observation: 'ME INFORMA A REFERENCIA CORRETA POIS NO BLING NÃO APARECE ESSA REF: 1490-106-241',
    sentToSite: true,
    sentToAtacado: true,
    createdAt: '2026-10-25T00:00:00Z',
  };

  // NENHUM DELES pode ser considerado pendência
  assert.equal(isPendencyProduct(p1), false);
  assert.equal(isPendencyProduct(p2), false);
  assert.equal(isPendencyProduct(p3), false);

  // TODOS OS TRÊS devem estar em esperando código
  assert.equal(isWaitingCodeOnly(p1), true);
  assert.equal(isWaitingCodeOnly(p2), true);
  assert.equal(isWaitingCodeOnly(p3), true);

  // E não devem aparecer em getGeneralPendencias
  const pendencias = getGeneralPendencias([p1, p2, p3]);
  assert.equal(pendencias.length, 0);

  // Mas devem contar em getWaitingCodeCountByBrand
  const counts = getWaitingCodeCountByBrand([p1, p2, p3]);
  assert.equal(counts['PICCADILLY'], 2);
  assert.equal(counts['SANTINELLI'], 1);
});

test('isReceivedCodeReady only includes products with received code AND complete photos', () => {
  // Produto com código recebido mas com fotos faltantes (deve ir para pendências!)
  const itemWithCodeMissingPhotos: Product = {
    id: 'c1',
    brand: 'Beira Rio',
    reference: '8379.271',
    photoUrl: 'https://example.com/photo.jpg',
    status: 'code_received',
    submittedCode: 'BR1241026169',
    photoStatus: 'Faltam as fotos',
    observation: 'Faltam as fotos, tem somente essa.',
    sentToSite: true,
    sentToAtacado: false,
    createdAt: '2026-10-25T00:00:00Z',
  };

  // Produto com código recebido e fotos completas (deve ir para Códigos Recebidos!)
  const itemWithCodePhotosReady: Product = {
    id: 'c2',
    brand: 'Olympikus',
    reference: 'Marte',
    photoUrl: 'https://example.com/photo.jpg',
    status: 'code_received',
    submittedCode: 'OL1891026239',
    photoStatus: 'Ja tenho as fotos',
    observation: '',
    sentToSite: true,
    sentToAtacado: true,
    createdAt: '2026-10-25T00:00:00Z',
  };

  // O calçado com fotos faltantes NÃO pode constar em códigos recebidos!
  assert.equal(isReceivedCodeReady(itemWithCodeMissingPhotos), false);
  // Ele é pendência
  assert.equal(isPendencyProduct(itemWithCodeMissingPhotos), true);

  // O calçado com fotos completas DEVE constar em códigos recebidos!
  assert.equal(isReceivedCodeReady(itemWithCodePhotosReady), true);
  // Ele não é pendência
  assert.equal(isPendencyProduct(itemWithCodePhotosReady), false);
});

test('isVizzanoMissingAtacado accurately detects the 6 designated references', () => {
  // As 6 referências que faltam atacado
  assert.equal(isVizzanoMissingAtacado('Vizzano', '6525.219'), true);
  assert.equal(isVizzanoMissingAtacado('VIZZANO', '6536.221/6536.121'), true);
  assert.equal(isVizzanoMissingAtacado('Vizzano', '6591.100/6591.200'), true);
  assert.equal(isVizzanoMissingAtacado('VIZZANO', '1483.100'), true);
  assert.equal(isVizzanoMissingAtacado('Vizzano', '1206.1025'), true);
  assert.equal(isVizzanoMissingAtacado('vizzano', '6576.104'), true);

  // Outras referências da Vizzano já foram para o atacado se estão no histórico
  assert.equal(isVizzanoMissingAtacado('Vizzano', '1234.567'), false);
  assert.equal(isVizzanoMissingAtacado('Beira Rio', '6525.219'), false);
});

test('getMissingAtacado only flags the 6 Vizzano items among completed products', () => {
  const completedProducts: Product[] = [
    {
      id: 'h1',
      brand: 'Vizzano',
      reference: '6525.219',
      photoUrl: '',
      photoStatus: 'Ja tenho as fotos',
      observation: '',
      status: 'completed',
      sentToSite: true,
      sentToAtacado: false,
      createdAt: '2026-10-25T00:00:00Z',
    },
    {
      id: 'h2',
      brand: 'Vizzano',
      reference: '6536.221/6536.121',
      photoUrl: '',
      photoStatus: 'Ja tenho as fotos',
      observation: '',
      status: 'completed',
      sentToSite: true,
      sentToAtacado: false,
      createdAt: '2026-10-25T00:00:00Z',
    },
    {
      id: 'h3',
      brand: 'Moleca',
      reference: '5000.100',
      photoUrl: '',
      photoStatus: 'Ja tenho as fotos',
      observation: '',
      status: 'completed',
      sentToSite: true,
      sentToAtacado: false, // Mesmo marcado como false no dado antigo, foi feito e enviado ao atacado!
      createdAt: '2026-10-25T00:00:00Z',
    },
    {
      id: 'h4',
      brand: 'Beira Rio',
      reference: '8000.200',
      photoUrl: '',
      photoStatus: 'Ja tenho as fotos',
      observation: '',
      status: 'completed',
      sentToSite: true,
      sentToAtacado: false,
      createdAt: '2026-10-25T00:00:00Z',
    },
  ];

  const missing = getMissingAtacado(completedProducts);
  // Apenas as duas referências Vizzano devem constar!
  assert.equal(missing.length, 2);
  assert.ok(missing.some((p) => p.reference === '6525.219'));
  assert.ok(missing.some((p) => p.reference === '6536.221/6536.121'));
  assert.ok(!missing.some((p) => p.reference === '5000.100'));
  assert.ok(!missing.some((p) => p.reference === '8000.200'));
});
