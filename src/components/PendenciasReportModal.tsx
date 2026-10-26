import React, { useState } from 'react';
import { X, Printer, Filter, Image as ImageIcon, AlertTriangle, CameraOff, FileWarning, Check, Download, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { formatBRL, getAllPendenciasSummary } from '../utils/productUtils';
import { downloadPendenciasReportPDF } from '../utils/pdfGenerator';

interface PendenciasReportModalProps {
  isOpen: boolean;
  products: Product[];
  availableBrands: string[];
  initialBrand?: string;
  onClose: () => void;
}

export const PendenciasReportModal: React.FC<PendenciasReportModalProps> = ({
  isOpen,
  products,
  availableBrands,
  initialBrand = 'all',
  onClose,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [selectedType, setSelectedType] = useState<'all' | 'withCode' | 'noCode'>('all');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedBrand(initialBrand);
    }
  }, [isOpen, initialBrand]);

  if (!isOpen) return null;

  const summary = getAllPendenciasSummary(products);

  // Filtra de acordo com a marca e com o tipo de pendência
  const filteredItems = summary.all.filter((p) => {
    if (selectedBrand !== 'all' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }

    const hasCode = Boolean(p.submittedCode && p.submittedCode.trim().length > 0);
    if (selectedType === 'withCode' && !hasCode) {
      return false;
    }
    if (selectedType === 'noCode' && hasCode) {
      return false;
    }

    return true;
  });

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await downloadPendenciasReportPDF({
        products,
        brandFilter: selectedBrand,
        typeFilter: selectedType,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF de pendências:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pendencias-report-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full my-6 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header - Não impresso no papel */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/70 dark:bg-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <h3 id="pendencias-report-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Relatório de Pendências para Envio à Loja (PDF)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Imprima ou salve em PDF o documento com fotos, marcas, referências e a descrição exata do que está faltando.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar relatório de pendências"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros e Disparo de Impressão - Não impressa */}
        <div className="print:hidden px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filtro Marca */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Marca:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as Marcas ({summary.all.length})</option>
                {availableBrands.map((b) => {
                  const count = summary.all.filter((p) => p.brand.toLowerCase() === b.toLowerCase()).length;
                  if (count === 0) return null;
                  return (
                    <option key={b} value={b}>
                      {b} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filtro Tipo de Pendência */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tipo:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as 'all' | 'withCode' | 'noCode')}
                className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Todas as Pendências ({summary.all.length})</option>
                <option value="withCode">Com código, faltam fotos ({summary.withCodeMissingPhotos.length})</option>
                <option value="noCode">Falta código e faltam fotos ({summary.missingCodeAndPhotos.length})</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Listando <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? 'item' : 'itens'}
            </span>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-rose-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
              title="Baixar arquivo PDF de pendências para enviar à loja"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Baixar Arquivo PDF
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Imprimir"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível do Relatório */}
        <div id="printable-pendencias-report" className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 dark:bg-slate-900 dark:text-white print:p-0 print:m-0 print:bg-white print:text-black">
          {/* Cabeçalho Oficial do Documento */}
          <div className="border-b-2 border-amber-600 pb-4 mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/image_4442907a.png"
                alt="Logo ShoeFlow"
                className="h-10 w-auto object-contain print:h-9"
              />
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 print:text-black">
                  Relatório de Pendências - Catálogo de Calçados
                </h1>
                <p className="text-xs text-slate-600 print:text-slate-700 font-medium">
                  {selectedBrand === 'all'
                    ? 'Todas as marcas com pendências de fotos e/ou código'
                    : `Pendências exclusivas da marca: ${selectedBrand}`}
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500 print:text-slate-700">
              <p className="font-bold text-amber-700 print:text-amber-900">DOCUMENTO OPERACIONAL</p>
              <p>Emitido em: {currentDate}</p>
              <p className="font-semibold text-slate-800 print:text-black">Total: {filteredItems.length} itens</p>
            </div>
          </div>

          {/* Resumo de Tipos de Pendência */}
          <div className="mb-6 grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-amber-50 print:bg-amber-50/60 border border-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <CameraOff className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Já tem o código, mas faltam as fotos:</strong>{' '}
                {filteredItems.filter((p) => p.submittedCode).length} itens
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>
                <strong>Falta o código e falta as fotos:</strong>{' '}
                {filteredItems.filter((p) => !p.submittedCode).length} itens
              </span>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm font-semibold">Nenhuma pendência encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
              {filteredItems.map((item, idx) => {
                const hasCode = Boolean(item.submittedCode && item.submittedCode.trim().length > 0);
                const pendencyLabel = hasCode
                  ? 'Já tem código • Faltam fotos'
                  : 'Falta código e fotos';
                const pendencyBadgeColor = hasCode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-rose-100 text-rose-900 border-rose-300';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 flex flex-col justify-between shadow-xs print:shadow-none break-inside-avoid print:border-slate-400"
                  >
                    <div>
                      {/* Foto e Dados no estilo Códigos Recebidos */}
                      <div className="flex gap-3.5 items-start">
                        {/* Imagem maior */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 flex items-center justify-center">
                          {item.photoUrl ? (
                            <img
                              src={item.photoUrl}
                              alt={item.reference}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                              <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Sem foto</span>
                            </div>
                          )}
                          <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Dados: Marca maior, Referência e Valor no Bling */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm uppercase font-black tracking-wider text-indigo-700 dark:text-indigo-400 block truncate">
                            {item.brand}
                          </span>

                          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white print:text-black truncate mt-0.5">
                            Ref: {item.reference}
                          </h4>

                          <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 print:text-black mt-1">
                            Valor no Bling: <span className="text-emerald-700 dark:text-emerald-400 print:text-black">{formatBRL(item.price)}</span>
                          </p>

                          {/* Badge de tipo de pendência */}
                          <div className="mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black border inline-block ${pendencyBadgeColor}`}>
                              {pendencyLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Código das Fotos / Aviso de falta de código */}
                      <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 print:bg-slate-100 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600">
                          Código:
                        </span>
                        {hasCode ? (
                          <span className="font-mono text-sm sm:text-base font-black text-indigo-900 dark:text-indigo-200 print:text-black">
                            {item.submittedCode}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            ⚠️ Digitar código da caixa
                          </span>
                        )}
                      </div>

                      {/* O que providenciar */}
                      {(item.observation || item.storeObservation) && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-950 dark:text-amber-200">
                          <strong className="font-bold">Providenciar: </strong>
                          {item.observation || item.storeObservation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rodapé da Página Impressa */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between items-center print:mt-6">
            <span>ShoeFlow - Sistema de Gestão e Triagem de Calçados</span>
            <span>Favor agilizar o envio das fotos e códigos pendentes para publicação no site</span>
          </div>
        </div>

        {/* Footer com botões de Fechar e Download Direto do PDF */}
        <div className="print:hidden px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clique em <strong>&ldquo;Baixar Arquivo PDF&rdquo;</strong> para gerar e salvar o arquivo no seu computador para envio à loja.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-rose-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Baixar Arquivo PDF (.pdf)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
