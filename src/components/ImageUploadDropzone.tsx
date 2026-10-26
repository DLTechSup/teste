import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ImageUploadDropzoneProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  required?: boolean;
  helperText?: string;
}

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  value,
  onChange,
  label = 'Foto do Calçado',
  helperText,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie apenas arquivos de imagem (PNG, JPG, WEBP, etc.).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        onChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {value && (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Foto carregada
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {value ? (
        /* Preview da Foto Carregada */
        <div className="relative rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-slate-50 dark:bg-slate-850 p-2 overflow-hidden group">
          <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <img
              src={value}
              alt="Prévia do calçado"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Trocar
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Remover
              </button>
            </div>
          </div>
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 mt-1.5">
            Clique em trocar ou arraste outra imagem por cima
          </p>
        </div>
      ) : (
        /* Zona de Arrastar e Soltar / Upload */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 hover:border-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Arraste e solte a foto aqui
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            ou clique para selecionar do seu computador ou celular
          </p>
          <span className="mt-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            PNG, JPG, WEBP • Alta Resolução
          </span>
        </div>
      )}
    </div>
  );
};
