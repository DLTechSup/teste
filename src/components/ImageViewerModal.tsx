import React from 'react';
import { X, Image as ImageIcon, Tag, DollarSign, Info } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../utils/productUtils';

interface ImageViewerModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de Imagem do Calçado"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
              {product.brand}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Referência: {product.reference}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar visualizador"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Imagem Central */}
        <div className="relative bg-slate-950 flex items-center justify-center p-6 min-h-[320px] max-h-[460px]">
          {product.photoUrl ? (
            <img
              src={product.photoUrl}
              alt={`${product.brand} ${product.reference}`}
              className="max-h-[400px] max-w-full object-contain rounded-xl shadow-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 py-16">
              <ImageIcon className="w-16 h-16 stroke-1 mb-2" />
              <p className="text-sm font-medium">Nenhuma foto anexada a este produto</p>
              <span className="text-xs text-amber-400 mt-1">Status: {product.photoStatus}</span>
            </div>
          )}
        </div>

        {/* Detalhes do Produto */}
        <div className="p-6 space-y-4 bg-slate-50 dark:bg-slate-900/60">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Preço no Sistema</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {formatBRL(product.price)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Tag className="w-3.5 h-3.5" />
                <span>Status da Foto</span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                {product.photoStatus}
              </p>
            </div>
          </div>

          {product.submittedCode && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Código Enviado pela Loja
                </span>
                <p className="font-mono text-sm font-bold text-indigo-950 dark:text-indigo-100">
                  {product.submittedCode}
                </p>
              </div>
            </div>
          )}

          {product.observation && (
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>Observações do Administrador</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {product.observation}
              </p>
            </div>
          )}

          {product.storeObservation && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                <Info className="w-3.5 h-3.5 text-indigo-500" />
                <span>Mensagem Enviada pela Loja</span>
              </div>
              <p className="text-sm text-indigo-950 dark:text-indigo-100 whitespace-pre-wrap">
                {product.storeObservation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
