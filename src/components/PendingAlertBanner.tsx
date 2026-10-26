import React, { useState } from 'react';
import {
  AlertTriangle,
  CameraOff,
  ChevronDown,
  ChevronUp,
  Eye,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Product } from '../types';
import {
  getPendenciasComCodigoSemFotos,
  getPendenciasSemCodigoSemFotos,
} from '../utils/productUtils';

interface PendingAlertBannerProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
  onOpenPendenciasPage: () => void;
}

export const PendingAlertBanner: React.FC<PendingAlertBannerProps> = ({
  products,
  onViewProduct,
  onOpenPendenciasPage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const withCodeList = getPendenciasComCodigoSemFotos(products);
  const noCodeNoPhotosList = getPendenciasSemCodigoSemFotos(products);
  const totalCount = withCodeList.length + noCodeNoPhotosList.length;

  if (totalCount === 0) return null;

  return (
    <section
      aria-label="Alertas de Pendências de Fotos e Códigos"
      className="mb-8 border border-amber-300 dark:border-amber-700/60 bg-linear-to-b from-amber-50/95 to-amber-100/50 dark:from-slate-900/95 dark:to-slate-900/70 rounded-3xl p-5 sm:p-6 shadow-sm transition-all"
    >
      {/* Topo do Banner com Alerta Central e Botões */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-sm shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Quadro de Pendências Ativas ({totalCount} calçados)
              </h3>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                Atenção Equipe
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Para quem for atender os pedidos: existem <strong>2 tipos de pendências</strong> cadastradas para acompanhamento imediato.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={onOpenPendenciasPage}
            className="px-4 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Abrir Página de Pendências <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {isExpanded ? (
              <>
                Ocultar <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Ver Detalhes <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Os Dois Tipos de Pendências Lado a Lado na Home */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-amber-200/80 dark:border-slate-800">
        {/* Bloco 1: Com Código, Mas Sem Fotos */}
        <div
          onClick={onOpenPendenciasPage}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-amber-200 dark:border-amber-900/40 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <CameraOff className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400 block">
                  Pendência 1
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Tenho o código, mas NÃO tenho as fotos
                </h4>
              </div>
            </div>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              {withCodeList.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            O código já foi digitado pela equipe, mas o produto ainda precisa de fotos completas para subir ao catálogo.
          </p>
        </div>

        {/* Bloco 2: Sem Código e Sem Fotos */}
        <div
          onClick={onOpenPendenciasPage}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-rose-200 dark:border-rose-900/40 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-rose-700 dark:text-rose-400 block">
                  Pendência 2
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  NÃO tenho nem o código e nem as fotos
                </h4>
              </div>
            </div>
            <span className="text-xl font-black text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              {noCodeNoPhotosList.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Falta tudo: Calçados cadastrados no sistema que não possuem código de barras/referência nem fotos.
          </p>
        </div>
      </div>

      {/* Lista Expandida se o usuário quiser visualizar sem sair da Home */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-amber-200/80 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
          {/* Seção Com Código */}
          {withCodeList.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CameraOff className="w-3.5 h-3.5" />
                Itens com código aguardando fotos ({withCodeList.length})
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {withCodeList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                        {item.brand}
                      </span>
                      <strong className="text-slate-900 dark:text-white truncate block">
                        Ref: {item.reference}
                      </strong>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate">
                        Cód: {item.submittedCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewProduct(item)}
                      className="p-1.5 text-slate-400 hover:text-amber-700 rounded-lg hover:bg-amber-50 cursor-pointer"
                      title="Ver detalhes"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção Sem Código e Sem Fotos */}
          {noCodeNoPhotosList.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Itens sem código e sem fotos (Falta Tudo) ({noCodeNoPhotosList.length})
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {noCodeNoPhotosList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-rose-700 dark:text-rose-400 block">
                        {item.brand}
                      </span>
                      <strong className="text-slate-900 dark:text-white truncate block">
                        Ref: {item.reference}
                      </strong>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 block">
                        {item.photoStatus}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewProduct(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Ver detalhes"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
