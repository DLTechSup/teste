import React, { useState } from 'react';
import {
  AlertTriangle,
  CameraOff,
  Search,
  Filter,
  ArrowLeft,
  Image as ImageIcon,
  Eye,
  Upload,
  Copy,
  Check,
  CheckCircle2,
  Tag,
  Shield,
  Store,
  Clock,
  Sparkles,
  Info,
  X,
  FileText,
  Send,
  Printer,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import {
  getAllPendenciasSummary,
  formatBRL,
  formatBlingPriceText,
  filterAndSortProducts,
} from '../utils/productUtils';
import { ImageViewerModal } from './ImageViewerModal';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { PendenciasReportModal } from './PendenciasReportModal';
import { BrandFilterSelect } from './BrandFilterSelect';

type PendencyFilterTab = 'all' | 'with_code' | 'no_code_no_photos';

export const PendenciasPage: React.FC = () => {
  const { products, setActiveRole, updateProduct, submitProductCode, markProductDone } = useApp();

  const [filterTab, setFilterTab] = useState<PendencyFilterTab>('all');
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modais
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingPhotoProduct, setEditingPhotoProduct] = useState<Product | null>(null);
  const [newPhotoValue, setNewPhotoValue] = useState('');
  const [newPhotoStatus, setNewPhotoStatus] = useState<'Ja tenho as fotos' | 'Somente foto de Capa'>('Ja tenho as fotos');
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Estados para digitação inline de código diretamente no card do produto
  const [inlineCodes, setInlineCodes] = useState<Record<string, string>>({});
  const [inlineObservations, setInlineObservations] = useState<Record<string, string>>({});
  const [justSubmittedIds, setJustSubmittedIds] = useState<Record<string, boolean>>({});

  // Resumo de pendências
  const summary = getAllPendenciasSummary(products);
  const withCodeList = summary.withCodeMissingPhotos;
  const noCodeNoPhotosList = summary.missingCodeAndPhotos;

  // Lista base dependendo da aba ativa
  let currentList: Product[] = [];
  if (filterTab === 'with_code') {
    currentList = withCodeList;
  } else if (filterTab === 'no_code_no_photos') {
    currentList = noCodeNoPhotosList;
  } else {
    currentList = summary.all;
  }

  // Marcas presentes nas pendências
  const availableBrands = Array.from(new Set(summary.all.map((p) => p.brand))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );

  // Filtragem por busca e marca
  const filteredProducts = currentList.filter((p) => {
    if (brandFilter !== 'all' && p.brand.toLowerCase() !== brandFilter.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchRef = p.reference.toLowerCase().includes(q);
      const matchCode = (p.submittedCode || '').toLowerCase().includes(q);
      const matchObs = (p.observation || '').toLowerCase().includes(q);
      const matchStoreObs = (p.storeObservation || '').toLowerCase().includes(q);
      if (!matchBrand && !matchRef && !matchCode && !matchObs && !matchStoreObs) {
        return false;
      }
    }
    return true;
  });

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Abrir modal de upload de foto
  const handleOpenPhotoModal = (product: Product) => {
    setEditingPhotoProduct(product);
    setNewPhotoValue(product.photoUrl || '');
    setNewPhotoStatus('Ja tenho as fotos');
  };

  const handleSavePhoto = () => {
    if (!editingPhotoProduct) return;
    updateProduct(editingPhotoProduct.id, {
      photoUrl: newPhotoValue.trim(),
      photoStatus: newPhotoValue.trim() ? newPhotoStatus : editingPhotoProduct.photoStatus,
      codeReceivedMissingPhotos: false,
    });
    setEditingPhotoProduct(null);
    setNewPhotoValue('');
  };

  // Envio direto e inline de código diretamente no card
  const handleInlineSubmit = (productId: string) => {
    const code = (inlineCodes[productId] || '').trim();
    if (!code) return;
    const obs = (inlineObservations[productId] || '').trim();
    submitProductCode(productId, code, obs);

    // Feedback visual imediato
    setJustSubmittedIds((prev) => ({ ...prev, [productId]: true }));
    setInlineCodes((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
    setInlineObservations((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    setTimeout(() => {
      setJustSubmittedIds((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Topo com Botão de Voltar, Identificação e Impressão de Relatório */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveRole('store')}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Loja / Home
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('admin')}
            className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer shadow-xs"
          >
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Painel do Administrador
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total de Pendências Ativas:
          </span>
          <span className="text-xs px-3 py-1 rounded-full font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
            {summary.total} calçado(s)
          </span>

          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Relatório (PDF)
          </button>
        </div>
      </div>

      {/* Banner Principal com Explicação Didática dos 2 Tipos de Pendências */}
      <div className="mb-8 rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              Gestão Centralizada de Pendências
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Página de Pendências & Acompanhamento
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Existem <strong>dois tipos de pendências</strong> cadastradas no sistema. Quem for atender ou processar os pedidos deve estar ciente da distinção exata entre o que já possui código e o que não possui nada:
            </p>
          </div>
        </div>

        {/* Cards Informativos dos 2 Tipos de Pendências */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Tipo 1: Com código, mas sem fotos */}
          <div
            onClick={() => setFilterTab('with_code')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'with_code'
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/30 text-amber-300">
                  <CameraOff className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                    Tipo 1 • Atenção Fotográfica
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Tenho o código, mas NÃO tenho as fotos
                  </h3>
                </div>
              </div>
              <span className="text-2xl font-black text-amber-300 shrink-0">
                {withCodeList.length}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
              O código das fotos já foi informado pela loja ou equipe, mas faltam fotos do calçado (fotos de sola, detalhes ou sessão pendente).
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-300">
              <span>Ver itens com código ({withCodeList.length}) →</span>
            </div>
          </div>

          {/* Tipo 2: Não tenho nem o código e nem as fotos */}
          <div
            onClick={() => setFilterTab('no_code_no_photos')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              filterTab === 'no_code_no_photos'
                ? 'bg-rose-500/25 border-rose-400 ring-2 ring-rose-400/50'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/30 text-rose-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 block">
                    Tipo 2 • Pendência Crítica
                  </span>
                  <h3 className="text-base font-bold text-white">
                    NÃO tenho nem o código e nem as fotos
                  </h3>
                </div>
              </div>
              <span className="text-2xl font-black text-rose-300 shrink-0">
                {noCodeNoPhotosList.length}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
              Atenção: Não há nenhuma foto cadastrada e também não temos o código das fotos. Falta tudo para este calçado ser publicado.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-300">
              <span>Ver pendências críticas ({noCodeNoPhotosList.length}) →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Abas de Navegação das Pendências, Busca e Filtro de Marca */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Abas de Filtro de Categoria */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
            }`}
          >
            Todas as Pendências ({summary.total})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('with_code')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterTab === 'with_code'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/40'
            }`}
          >
            <CameraOff className="w-3.5 h-3.5" />
            Com Código, Faltam Fotos ({withCodeList.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('no_code_no_photos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterTab === 'no_code_no_photos'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-950/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Sem Código e Sem Fotos ({noCodeNoPhotosList.length})
          </button>
        </div>

        {/* Busca e Filtro de Marca */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar marca, ref ou obs..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <BrandFilterSelect
            brands={availableBrands}
            selectedBrand={brandFilter}
            onSelectBrand={(b) => setBrandFilter(b)}
            variant="slate"
            label="Marca"
          />
        </div>
      </div>

      {/* Grid de Itens com Pendência */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <CheckCircle2 className="w-14 h-14 mx-auto stroke-1 text-emerald-500 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Nenhuma pendência encontrada com os filtros selecionados!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Todos os calçados desse critério estão com suas fotos e códigos em conformidade.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const hasCode = Boolean(product.submittedCode && product.submittedCode.trim().length > 0);
            const isNoCodeNoPhotos = !hasCode;
            const isCopied = copiedId === product.id;

            return (
              <div
                key={product.id}
                className={`rounded-2xl border p-4.5 shadow-xs transition-all flex flex-col justify-between ${
                  isNoCodeNoPhotos
                    ? 'bg-white dark:bg-slate-900 border-rose-300 dark:border-rose-900/60'
                    : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-900/60'
                }`}
              >
                <div>
                  {/* Etiqueta de Identificação Clara do Tipo de Pendência */}
                  <div className="mb-3">
                    {isNoCodeNoPhotos ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        Sem Código e Sem Fotos (Falta Tudo)
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                        <CameraOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        Tenho o Código • Faltam as Fotos
                      </div>
                    )}
                  </div>

                  {/* Detalhes com Foto Maior */}
                  <div className="flex gap-3.5">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {product.photoUrl ? (
                        <img
                          src={product.photoUrl}
                          alt={product.reference}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-100 dark:bg-slate-800">
                          <ImageIcon className="w-7 h-7 text-slate-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-400">Sem Foto</span>
                        </div>
                      )}

                      {product.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingProduct(product)}
                          className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          title="Visualizar Foto Ampliada"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400 block">
                        {product.brand}
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white break-words">
                        Ref: {product.reference}
                      </h4>
                      {product.price && product.price > 0 && (
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          Este produto está no Bling por {formatBRL(product.price)}
                        </p>
                      )}
                      <span className="text-[10px] px-2 py-0.5 mt-1.5 inline-block rounded-md font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Status foto: {product.photoStatus}
                      </span>
                      {product.missingColors && (
                        <div className="mt-1.5 text-[10px] text-amber-800 dark:text-amber-200 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          Cores que faltam: {product.missingColors}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Box de Código (se tiver) ou Alerta de Código Faltando */}
                  <div className="mt-3.5">
                    {hasCode ? (
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
                            Código das fotos
                          </span>
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white truncate block">
                            {product.submittedCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(product.submittedCode!, product.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                          }`}
                          title="Copiar código"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copiar
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            Digitar Código do Calçado:
                          </span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-100/70 dark:bg-rose-900/40 px-2 py-0.5 rounded-md">
                            Sem código
                          </span>
                        </div>

                        {/* Espaço para digitação imediata + botão Enviar direto no card */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={inlineCodes[product.id] || ''}
                              onChange={(e) =>
                                setInlineCodes((prev) => ({ ...prev, [product.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleInlineSubmit(product.id);
                                }
                              }}
                              placeholder="Digitar código das fotos"
                              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleInlineSubmit(product.id)}
                            disabled={!(inlineCodes[product.id] || '').trim()}
                            className="px-3.5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="Enviar código imediatamente"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Enviar
                          </button>
                        </div>

                        {/* Campo adicional para observação ou mensagem da loja */}
                        <input
                          type="text"
                          value={inlineObservations[product.id] || ''}
                          onChange={(e) =>
                            setInlineObservations((prev) => ({
                              ...prev,
                              [product.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineSubmit(product.id);
                            }
                          }}
                          placeholder="Obs / mensagem da filial (opcional)..."
                          className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    {/* Feedback visual quando enviado com sucesso */}
                    {justSubmittedIds[product.id] && (
                      <div className="mt-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Código enviado e notificado com sucesso!
                      </div>
                    )}
                  </div>

                  {/* Mensagem da Loja Completa */}
                  {product.storeObservation && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <strong className="text-[10px] uppercase text-indigo-600 dark:text-indigo-400 block mb-0.5">
                          Mensagem da loja:
                        </strong>
                        <div className="whitespace-pre-wrap break-words leading-relaxed text-slate-700 dark:text-slate-300">
                          {product.storeObservation}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observação de Cadastro do Administrador Completa */}
                  {product.observation && (
                    <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                      <strong className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                        Obs / Nota do cadastro:
                      </strong>
                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                        {product.observation}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações Rápidas de Resolução da Pendência */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoModal(product)}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {product.photoUrl ? 'Atualizar / Adicionar Fotos' : 'Fazer Upload da Foto'}
                  </button>

                  {hasCode && product.photoUrl && (
                    <button
                      type="button"
                      onClick={() => markProductDone(product.id)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Pendência resolvida! Marcar como feito"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Marcar Feito
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Atualização de Fotos com Upload e Drag & Drop */}
      {editingPhotoProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
                  Resolver Pendência de Fotos
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingPhotoProduct.brand} • Ref: {editingPhotoProduct.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPhotoProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <ImageUploadDropzone
                value={newPhotoValue}
                onChange={(val) => setNewPhotoValue(val)}
                label="Carregar Foto do Calçado (Arraste ou selecione)"
                helperText="Arraste uma foto JPG/PNG aqui para sanar a pendência."
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Novo Status da Foto
                </label>
                <select
                  value={newPhotoStatus}
                  onChange={(e) => setNewPhotoStatus(e.target.value as 'Ja tenho as fotos' | 'Somente foto de Capa')}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Ja tenho as fotos">Ja tenho as fotos (Completo)</option>
                  <option value="Somente foto de Capa">Somente foto de Capa (Temporário)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPhotoProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Salvar Foto & Atualizar Pendência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impressão e Exportação de Relatório de Pendências (PDF) */}
      <PendenciasReportModal
        isOpen={isReportOpen}
        products={products}
        availableBrands={availableBrands}
        initialBrand={brandFilter !== 'all' ? brandFilter : 'all'}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Visualizador de Imagem Grande */}
      {viewingProduct && (
        <ImageViewerModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}
    </div>
  );
};
