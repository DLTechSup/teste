import React, { useState } from 'react';
import { X, ArrowLeft, Send, Search, Image as ImageIcon, Eye, Tag, DollarSign, Info } from 'lucide-react';
import { Product } from '../types';
import { formatBRL, formatBlingPriceText, isWaitingCodeOnly } from '../utils/productUtils';
import { CodeConfirmModal } from './CodeConfirmModal';

interface BrandModalProps {
  brand: string | null;
  products: Product[];
  onClose: () => void;
  onSubmitCode: (productId: string, code: string, storeObservation?: string) => void;
  onViewImage: (product: Product) => void;
}

export const BrandModal: React.FC<BrandModalProps> = ({
  brand,
  products,
  onClose,
  onSubmitCode,
  onViewImage,
}) => {
  const [searchRef, setSearchRef] = useState('');
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [storeObsInputs, setStoreObsInputs] = useState<Record<string, string>>({});
  
  // Estado para o modal de confirmação de código
  const [pendingConfirm, setPendingConfirm] = useState<{
    product: Product;
    code: string;
    storeObservation: string;
  } | null>(null);

  if (!brand) return null;

  // Filtra produtos dessa marca que estão ESTRITAMENTE esperando código (sem pendências)
  const brandProducts = products.filter(
    (p) =>
      p.brand.toLowerCase() === brand.toLowerCase() &&
      isWaitingCodeOnly(p) &&
      (searchRef ? p.reference.toLowerCase().includes(searchRef.toLowerCase()) : true)
  );

  const handleInputChange = (productId: string, value: string) => {
    setCodeInputs((prev) => ({ ...prev, [productId]: value }));
  };

  const handleStoreObsChange = (productId: string, value: string) => {
    setStoreObsInputs((prev) => ({ ...prev, [productId]: value }));
  };

  const handleOpenConfirm = (product: Product) => {
    const code = (codeInputs[product.id] || '').trim();
    if (!code) {
      alert('Por favor, digite o código das fotos antes de enviar.');
      return;
    }
    const storeObservation = (storeObsInputs[product.id] || '').trim();
    setPendingConfirm({ product, code, storeObservation });
  };

  const handleFinalSubmit = (finalCode: string, finalStoreObs?: string) => {
    if (!pendingConfirm) return;
    onSubmitCode(pendingConfirm.product.id, finalCode, finalStoreObs);
    setCodeInputs((prev) => {
      const next = { ...prev };
      delete next[pendingConfirm.product.id];
      return next;
    });
    setStoreObsInputs((prev) => {
      const next = { ...prev };
      delete next[pendingConfirm.product.id];
      return next;
    });
    setPendingConfirm(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brand-modal-title"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full my-6 overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                aria-label="Voltar para a lista de marcas"
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400">
                  Marca de Calçados
                </span>
                <h2 id="brand-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  {brand}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {brandProducts.length} referências esperando código
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Barra de Busca rápida de referência */}
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchRef}
                onChange={(e) => setSearchRef(e.target.value)}
                placeholder="Buscar referência da marca..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Digite o código correspondente da etiqueta/EAN e envie
            </p>
          </div>

          {/* Grid de Referências */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/50">
            {brandProducts.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Tag className="w-12 h-12 mx-auto stroke-1 mb-2 text-slate-300 dark:text-slate-600" />
                <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  Nenhuma referência esperando código
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Todas as referências desta marca já tiveram seus códigos enviados ou processados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {brandProducts.map((product) => {
                  const currentInput = codeInputs[product.id] || '';

                  return (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Topo do card com imagem */}
                      <div>
                        <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                          {product.photoUrl ? (
                            <img
                              src={product.photoUrl}
                              alt={`Calçado ${product.brand} ${product.reference}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-10 h-10 stroke-1 mb-1" />
                              <span className="text-xs">Foto Pendente</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => onViewImage(product)}
                            aria-label={`Visualizar foto ampliada de ${product.reference}`}
                            className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                            title="Ampliar Imagem"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {product.price && product.price > 0 && (
                            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-emerald-950/85 text-emerald-200 text-xs font-bold backdrop-blur-xs border border-emerald-500/40">
                              Este produto está no Bling por {formatBRL(product.price)}
                            </div>
                          )}
                        </div>

                        {/* Informações: Referência Maior, Preço no sistema, Observações */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 block">
                                Referência
                              </span>
                              <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                {product.reference}
                              </h4>
                            </div>
                            <span className="text-[10px] px-2.5 py-1 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                              {product.photoStatus}
                            </span>
                          </div>

                          {/* Campo de observações do administrador (Completo sem cortar) */}
                          {product.observation && (
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                              <Info className="w-3.5 h-3.5 shrink-0 text-indigo-500 mt-0.5" />
                              <div className="whitespace-pre-wrap break-words leading-relaxed">
                                {product.observation}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Campo de Enviar Código e Observação da Loja */}
                      <div className="p-4 pt-0">
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Digitar Código do Calçado:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={currentInput}
                                onChange={(e) => handleInputChange(product.id, e.target.value)}
                                placeholder="Digitar código das fotos"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleOpenConfirm(product);
                                }}
                                className="flex-1 font-mono text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleOpenConfirm(product)}
                                className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Enviar
                              </button>
                            </div>
                          </div>

                          {/* Campo de Observação para a loja enviar ao Administrador */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Observação / mensagem para o Administrador (opcional):
                            </label>
                            <input
                              type="text"
                              value={storeObsInputs[product.id] || ''}
                              onChange={(e) => handleStoreObsChange(product.id, e.target.value)}
                              placeholder="Quer adicionar algo a mais sobre este calçado?"
                              className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Código com Prévia e Edição */}
      {pendingConfirm && (
        <CodeConfirmModal
          isOpen={true}
          product={pendingConfirm.product}
          initialCode={pendingConfirm.code}
          initialStoreObservation={pendingConfirm.storeObservation}
          onConfirm={handleFinalSubmit}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </>
  );
};
