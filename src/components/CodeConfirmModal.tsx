import React, { useState, useEffect } from 'react';
import { CheckCircle2, Edit3, Image as ImageIcon, Send, X, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../utils/productUtils';

interface CodeConfirmModalProps {
  isOpen: boolean;
  product: Product | null;
  initialCode: string;
  initialStoreObservation?: string;
  onConfirm: (code: string, storeObservation?: string) => void;
  onCancel: () => void;
}

export const CodeConfirmModal: React.FC<CodeConfirmModalProps> = ({
  isOpen,
  product,
  initialCode,
  initialStoreObservation = '',
  onConfirm,
  onCancel,
}) => {
  const [code, setCode] = useState(initialCode);
  const [storeObs, setStoreObs] = useState(initialStoreObservation);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCode(initialCode);
    setStoreObs(initialStoreObservation);
    setIsEditing(false);
    setError('');
  }, [initialCode, initialStoreObservation, isOpen]);

  if (!isOpen || !product) return null;

  const handleConfirm = () => {
    if (!code.trim()) {
      setError('Por favor, informe um código válido.');
      setIsEditing(true);
      return;
    }
    onConfirm(code.trim(), storeObs.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-confirm-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 id="code-confirm-title" className="font-bold text-slate-900 dark:text-white">
              Confirmação de Código
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5">
          {/* Card com Foto e Dados Principais */}
          <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              {product.photoUrl ? (
                <img
                  src={product.photoUrl}
                  alt={product.reference}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                {product.brand}
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                Ref: {product.reference}
              </h4>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Valor no Sistema: {formatBRL(product.price)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {product.observation || 'Sem observações'}
              </p>
            </div>
          </div>

          {/* Destaque do Código Digitado */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-4 text-center">
            <span className="text-xs uppercase font-semibold text-indigo-800 dark:text-indigo-300">
              Código digitado pela loja:
            </span>

            {isEditing ? (
              <div className="mt-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  autoFocus
                  placeholder="Digite o código correto"
                  className="w-full text-center font-mono text-xl font-bold py-2 px-3 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="font-mono text-2xl font-black text-indigo-950 dark:text-indigo-100 tracking-wider">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 ml-1 cursor-pointer"
                  title="Editar código"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Ajustar
                </button>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
              O código digitado acima está correto para este produto?
            </p>
          </div>

          {/* Observação enviada pela loja para o Administrador */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Observação / Recado para o Administrador:
            </span>
            {isEditing ? (
              <textarea
                rows={2}
                value={storeObs}
                onChange={(e) => setStoreObs(e.target.value)}
                placeholder="Adicione observações da loja (opcional)"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                {storeObs ? `"${storeObs}"` : 'Nenhuma observação adicional incluída.'}
              </p>
            )}
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Pronto' : 'Ajustar Código'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Confirmar e Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
