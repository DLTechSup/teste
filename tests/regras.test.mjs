import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  lerItem, temPendencia, aguardandoCodigo, codigoPronto, pendenteComCodigo,
  pendenteSemCodigo, faltaAtacado, finalizado, statusFotosPorTexto,
} from '../js/regras.js';

const row = (doc, extra = {}) => ({ id: 'x1', atualizado: '2026-10-20T10:00:00Z', doc, ...extra });
const FOTO = ['https://exemplo.com/a.jpg'];

test('status do doc antigo vira etapa', () => {
  assert.equal(lerItem(row({ status: 'pendente', fotos: FOTO })).etapa, 'aguardando');
  assert.equal(lerItem(row({ status: 'respondido', fotos: FOTO })).etapa, 'recebido');
  assert.equal(lerItem(row({ status: 'pendente', codigo: '123', fotos: FOTO })).etapa, 'recebido');
  assert.equal(lerItem(row({ status: 'feito', codigo: '123', fotos: FOTO })).etapa, 'feito');
});

test('sem foto = pendência; com foto e sem pistas = aguardando código', () => {
  const sem = lerItem(row({ marca: 'moleca', ref: '5674-210', fotos: [] }));
  assert.equal(temPendencia(sem), true);
  assert.equal(pendenteSemCodigo(sem), true);
  const com = lerItem(row({ marca: 'moleca', ref: '5674-210', fotos: FOTO }));
  assert.equal(aguardandoCodigo(com), true);
  assert.equal(com.marca, 'MOLECA');
});

test('texto da nota define situação das fotos', () => {
  assert.equal(statusFotosPorTexto('Não tenho nenhuma foto', 1), 'nenhuma');
  assert.equal(statusFotosPorTexto('faltam fotos da cor preta', 1), 'faltam');
  assert.equal(statusFotosPorTexto('somente foto de capa', 1), 'capa');
  assert.equal(statusFotosPorTexto('cor champagne', 1), 'completas');
});

test('código recebido com fotos faltando vai para pendências, não para prontos', () => {
  const i = lerItem(row({ codigo: '999', status: 'respondido', fotos: FOTO, notaPainel: 'faltam fotos' }));
  assert.equal(pendenteComCodigo(i), true);
  assert.equal(codigoPronto(i), false);
});

test('statusFotos explícito "completas" resolve a pendência mesmo com nota antiga', () => {
  const i = lerItem(row({ codigo: '999', fotos: FOTO, notaPainel: 'faltam fotos', statusFotos: 'completas' }));
  assert.equal(temPendencia(i), false);
  assert.equal(codigoPronto(i), true);
});

test('exceções herdadas nunca são pendência', () => {
  const i = lerItem(row({ marca: 'Piccadilly', ref: '500380-15', fotos: [] }));
  assert.equal(temPendencia(i), false);
  assert.equal(aguardandoCodigo(i), true);
});

test('atacado: Vizzano herdados faltam; doc explícito manda', () => {
  const viz = lerItem(row({ marca: 'Vizzano', ref: '1483.100', status: 'feito', codigo: '1', fotos: FOTO }));
  assert.equal(faltaAtacado(viz), true);
  const outro = lerItem(row({ marca: 'Vizzano', ref: '9999.1', status: 'feito', codigo: '1', fotos: FOTO }));
  assert.equal(faltaAtacado(outro), false);
  const explicito = lerItem(row({ marca: 'Vizzano', ref: '1483.100', status: 'feito', codigo: '1', fotos: FOTO, sentToAtacado: true }));
  assert.equal(faltaAtacado(explicito), false);
});

test('itens apagados pelo sistema antigo aparecem como arquivados, nunca somem', () => {
  const i = lerItem(row({ status: 'excluido', deletado: true, fotos: FOTO }));
  assert.equal(i.arquivado, true);
  assert.equal(finalizado(i) || aguardandoCodigo(i) || temPendencia(i), false);
});

test('preço aceita número e texto com vírgula', () => {
  assert.equal(lerItem(row({ preco: 119.9 })).preco, 119.9);
  assert.equal(lerItem(row({ preco: '1.299,90' })).preco, 1299.9);
  assert.equal(lerItem(row({})).preco, null);
});
