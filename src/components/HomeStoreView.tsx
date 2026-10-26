import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Store,
  Layers,
  Image as ImageIcon,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, SortOption } from '../types';
import {
  getWaitingCodeCountByBrand,
  getGeneralPendencias,
  getAllPendenciasSummary,
  groupProductsByBrand,
  formatBRL,
  formatBlingPriceText,
  isWaitingCodeOnly,
} from '../utils/productUtils';
import { PendingAlertBanner } from './PendingAlertBanner';
import { BrandModal } from './BrandModal';
import { ImageViewerModal } from './ImageViewerModal';

export const HomeStoreView: React.FC = () => {
  const { products, submitProductCode, setActiveRole } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'waiting' | 'completed'>('waiting');
  const [sortOption, setSortOption] = useState<SortOption>('name_asc');
  const [activeBrandModal, setActiveBrandModal] = useState<string | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Produtos e contagens
  const waitingCounts = getWaitingCodeCountByBrand(products);
  const pendencias = getGeneralPendencias(products);
  const pendenciasSummary = getAllPendenciasSummary(products);
  const completedProducts = products.filter((p) => p.status === 'completed');
  const totalWaitingRefs = products.filter(isWaitingCodeOnly).length;

  // Lista de todas as marcas com produtos
  const groupedAll = groupProductsByBrand(products);
  const allBrandNames = Object.keys(groupedAll);

  // Marcas que possuem referências esperando código
  const brandsWithWaiting = allBrandNames.filter(
    (b) => (waitingCounts[b] || 0) > 0
  );

  // Filtragem e ordenação das marcas exibidas
  const filteredBrands = (selectedCategoryTab === 'waiting' ? brandsWithWaiting : allBrandNames)
    .filter((brandName) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchesBrand = brandName.toLowerCase().includes(q);
      const matchesRef = groupedAll[brandName]?.some((p) =>
        p.reference.toLowerCase().includes(q)
      );
      return matchesBrand || matchesRef;
    })
    .sort((a, b) => {
      if (sortOption === 'name_asc') return a.localeCompare(b, 'pt-BR');
      if (sortOption === 'name_desc') return b.localeCompare(a, 'pt-BR');
      // Por contagem de espera
      const countA = waitingCounts[a] || 0;
      const countB = waitingCounts[b] || 0;
      return countB - countA;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Banner de Boas-Vindas & Indicadores Rápidos */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-xs text-indigo-200 border border-white/15">
            <Store className="w-3.5 h-3.5 text-indigo-300" />
            Portal da Loja & Equipe Remota
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Envio Ágil de Códigos de Calçados
          </h1>
          <p className="text-sm text-indigo-200 max-w-2xl leading-relaxed">
            Selecione a marca abaixo para visualizar as fotos e referências cadastradas pelo administrador e envie os códigos correspondentes.
          </p>
        </div>

        {/* Mini Cards de Métricas (Aguardando, Marcas, Finalizados e Alerta Pendências) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full md:w-auto shrink-0">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/10 text-center">
            <span className="text-[11px] sm:text-xs text-indigo-200 block font-medium">Aguardando</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5 sm:mt-1 block">
              {totalWaitingRefs}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/10 text-center">
            <span className="text-[11px] sm:text-xs text-indigo-200 block font-medium">Marcas</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5 sm:mt-1 block">
              {brandsWithWaiting.length}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/10 text-center">
            <span className="text-[11px] sm:text-xs text-indigo-200 block font-medium">Finalizados</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 sm:mt-1 block">
              {completedProducts.length}
            </span>
          </div>
          {/* Card de Alerta Pendências Clicável */}
          <button
            type="button"
            onClick={() => setActiveRole('pendencias')}
            className="bg-rose-500/25 hover:bg-rose-500/35 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-rose-400/40 text-center transition-all cursor-pointer group hover:scale-105 active:scale-95"
            title="Clique para abrir e ver todas as pendências"
          >
            <div className="flex items-center justify-center gap-1 text-[11px] sm:text-xs text-rose-200 font-bold">
              <AlertTriangle className="w-3 h-3 text-rose-300" />
              <span>Pendências</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-rose-300 mt-0.5 sm:mt-1 block group-hover:scale-110 transition-transform">
              {pendenciasSummary.total}
            </span>
          </button>
        </div>
      </div>

      {/* Alerta de Pendências (Em Destaque com os 2 Tipos de Pendências) */}
      <PendingAlertBanner
        products={products}
        onViewProduct={(product) => setViewingProduct(product)}
        onOpenPendenciasPage={() => setActiveRole('pendencias')}
      />

      {/* Barra de Filtros, Categorias, Busca e Ordenação */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Abas de Categoria */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('waiting')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedCategoryTab === 'waiting'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Marcas Esperando Código ({brandsWithWaiting.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategoryTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectedCategoryTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Produtos Feitos / No Site ({completedProducts.length})
          </button>
        </div>

        {/* Busca e Ordenação */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar marca ou referência..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="name_asc">Nome Marca (A-Z)</option>
              <option value="name_desc">Nome Marca (Z-A)</option>
              <option value="date_desc">Mais Esperando Código</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal conforme a aba */}
      {selectedCategoryTab === 'waiting' ? (
        <div>
          {filteredBrands.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
              <Tag className="w-12 h-12 mx-auto stroke-1 text-slate-400 mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Nenhuma marca aguardando código
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No momento não há novos produtos aguardando código da equipe. O administrador pode cadastrar novos itens na aba de Administrador.
              </p>
              <button
                type="button"
                onClick={() => setActiveRole('admin')}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
              >
                Ir ao Painel de Administrador
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBrands.map((brandName) => {
                const waitingCount = waitingCounts[brandName] || 0;
                const brandItems = groupedAll[brandName] || [];
                const waitingItems = brandItems.filter(isWaitingCodeOnly);

                return (
                  <div
                    key={brandName}
                    onClick={() => setActiveBrandModal(brandName)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      {/* Topo do Card de Marca */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-black text-indigo-700 dark:text-indigo-300 text-lg group-hover:scale-105 transition-transform">
                            {brandName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                              Marca
                            </span>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {brandName}
                            </h3>
                          </div>
                        </div>

                        {/* Tag de quantidade esperando código */}
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            {waitingCount} {waitingCount === 1 ? 'referência' : 'referências'}
                          </span>
                        </div>
                      </div>

                      {/* Miniaturas das Fotos das referências desta marca */}
                      <div className="mt-5">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                          Referências aguardando código:
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {waitingItems.slice(0, 4).map((item) => (
                            <div
                              key={item.id}
                              className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                              title={`Ref: ${item.reference} - ${formatBRL(item.price)}`}
                            >
                              {item.photoUrl ? (
                                <img
                                  src={item.photoUrl}
                                  alt={item.reference}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <ImageIcon className="w-5 h-5 stroke-1" />
                                </div>
                              )}
                              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-mono font-bold text-center truncate px-0.5">
                                {item.reference}
                              </span>
                            </div>
                          ))}

                          {waitingItems.length > 4 && (
                            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                              +{waitingItems.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ação de Abrir Página da Marca */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span>Abrir e Digitar Códigos</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Aba de Produtos Feitos / Enviados ao Site */
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Produtos Feitos & Enviados ao Site pelo Administrador
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calçados já finalizados pelo administrador com códigos confirmados e liberados no catálogo.
              </p>
            </div>
          </div>

          {completedProducts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <CheckCircle className="w-12 h-12 mx-auto stroke-1 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum produto finalizado ainda.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Quando o administrador marcar os códigos recebidos como &ldquo;Feito&rdquo;, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {completedProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.reference}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-400 m-auto" />
                      )}
                      <button
                        type="button"
                        onClick={() => setViewingProduct(p)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                        title="Ver foto ampliada"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2.5">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
                        {p.brand}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        Ref: {p.reference}
                      </h4>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatBRL(p.price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] uppercase font-semibold text-slate-400 block">
                      Código Validado
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {p.submittedCode || '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal da Marca Selecionada para Inserção de Códigos */}
      {activeBrandModal && (
        <BrandModal
          brand={activeBrandModal}
          products={products}
          onClose={() => setActiveBrandModal(null)}
          onSubmitCode={(id, code, obs) => submitProductCode(id, code, obs)}
          onViewImage={(prod) => setViewingProduct(prod)}
        />
      )}

      {/* Visualizador de Imagem Ampliada */}
      {viewingProduct && (
        <ImageViewerModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}
    </div>
  );
};
