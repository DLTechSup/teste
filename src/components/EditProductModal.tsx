import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import { Product, PhotoStatus } from '../types';
import { SAMPLE_PHOTO_PRESETS } from '../utils/seedData';

import { ImageUploadDropzone } from './ImageUploadDropzone';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onSave: (updates: Partial<Product>) => void;
  onClose: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  product,
  onSave,
  onClose,
}) => {
  const [brand, setBrand] = useState('');
  const [reference, setReference] = useState('');
  const [price, setPrice] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>('Ja tenho as fotos');
  const [missingColors, setMissingColors] = useState('');
  const [observation, setObservation] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');
  const [storeObservation, setStoreObservation] = useState('');
  const [sentToSite, setSentToSite] = useState(false);
  const [sentToAtacado, setSentToAtacado] = useState(false);
  const [codeReceivedMissingPhotos, setCodeReceivedMissingPhotos] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setBrand(product.brand);
      setReference(product.reference);
      setPrice(product.price ? product.price.toString() : '');
      setPhotoUrl(product.photoUrl || '');
      setPhotoStatus(product.photoStatus);
      setMissingColors(product.missingColors || '');
      setObservation(product.observation || '');
      setSubmittedCode(product.submittedCode || '');
      setStoreObservation(product.storeObservation || '');
      setSentToSite(Boolean(product.sentToSite));
      setSentToAtacado(Boolean(product.sentToAtacado));
      setCodeReceivedMissingPhotos(Boolean(product.codeReceivedMissingPhotos));
      setErrors({});
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!brand.trim()) newErrors.brand = 'Marca é obrigatória';
    if (!reference.trim()) newErrors.reference = 'Referência é obrigatória';
    
    let parsedPrice: number | undefined = undefined;
    if (price.trim()) {
      const p = parseFloat(price.replace(',', '.'));
      if (isNaN(p) || p <= 0) {
        newErrors.price = 'Informe um valor válido maior que 0 ou deixe em branco';
      } else {
        parsedPrice = p;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      brand: brand.trim(),
      reference: reference.trim(),
      price: parsedPrice,
      photoUrl: photoUrl.trim(),
      photoStatus,
      missingColors: photoStatus === 'Faltam as fotos' ? missingColors.trim() || undefined : undefined,
      observation: observation.trim(),
      submittedCode: submittedCode.trim() || undefined,
      storeObservation: storeObservation.trim() || undefined,
      sentToSite,
      sentToAtacado,
      codeReceivedMissingPhotos,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full my-8 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 id="edit-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Editar Calçado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajuste as informações, referências, fotos ou código enviado
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário de edição"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Marca e Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marca *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Beira Rio, Moleca"
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referência do Calçado *
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: 8320-100"
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {errors.reference && <p className="text-xs text-red-500 mt-1">{errors.reference}</p>}
            </div>
          </div>

          {/* Preço e Status das Fotos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor no Bling (R$) (Opcional)
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 119,90 (deixe em branco se não houver)"
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Status das Fotos *
              </label>
              <select
                value={photoStatus}
                onChange={(e) => setPhotoStatus(e.target.value as PhotoStatus)}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="Ja tenho as fotos">Ja tenho as fotos</option>
                <option value="Somente foto de Capa">Somente foto de Capa</option>
                <option value="Faltam as fotos">Faltam as fotos</option>
                <option value="Não tenho nenhuma foto">Não tenho nenhuma foto</option>
              </select>
            </div>
          </div>

          {/* Campo de Cores que faltam quando photoStatus === Faltam as fotos */}
          {photoStatus === 'Faltam as fotos' && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 animate-in fade-in">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                Quais as cores que faltam das fotos? (ex: Branco, Preto, Nude)
              </label>
              <input
                type="text"
                value={missingColors}
                onChange={(e) => setMissingColors(e.target.value)}
                placeholder="Ex: Falta cor nova Preto e Avelã..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          )}

          {/* Upload e Arrastar e Soltar de Foto */}
          <div>
            <ImageUploadDropzone
              value={photoUrl}
              onChange={(dataUrl) => setPhotoUrl(dataUrl)}
              label="Foto do Calçado (Arrastar e Soltar ou Selecionar)"
            />
          </div>

          {/* Código do Calçado (Editable!) */}
          <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
              Código do Calçado (Enviado pela Loja ou Gerado)
            </label>
            <input
              type="text"
              value={submittedCode}
              onChange={(e) => setSubmittedCode(e.target.value)}
              placeholder="Ex: 7891234567890 (código de barras / EAN / SKU)"
              className="w-full font-mono font-bold px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Você pode alterar ou corrigir o código a qualquer momento.
            </p>
          </div>

          {/* Observações do Administrador */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações do Administrador
            </label>
            <textarea
              rows={2}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Descreva pendências, especificações de numeração, detalhes de mostruário, etc."
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Mensagem / Observação da Loja */}
          <div>
            <label className="block text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-1">
              Observação / Mensagem Enviada pela Loja
            </label>
            <textarea
              rows={2}
              value={storeObservation}
              onChange={(e) => setStoreObservation(e.target.value)}
              placeholder="Mensagem ou aviso recebido da loja junto com o código"
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Opções de Site e Atacado */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={sentToSite}
                onChange={(e) => setSentToSite(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white block">Enviado ao Site</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Produto ativo no e-commerce</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 cursor-pointer">
              <input
                type="checkbox"
                checked={sentToAtacado}
                onChange={(e) => setSentToAtacado(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-white block">Enviado ao Atacado</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Se desmarcado, entra em lembretes</span>
              </div>
            </label>
          </div>

          {/* Opção especial: Código recebido mas faltam fotos */}
          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 cursor-pointer">
              <input
                type="checkbox"
                checked={codeReceivedMissingPhotos}
                onChange={(e) => setCodeReceivedMissingPhotos(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-medium">
                Marcar como: &ldquo;Código recebido, mas faltam fotos de catálogo&rdquo;
              </span>
            </label>
          </div>

          {/* Footer de ações */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
