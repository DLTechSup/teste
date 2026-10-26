import React, { useState } from 'react';
import { X, Printer, Download, Filter, Image as ImageIcon, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../utils/productUtils';
import { downloadProductsReportPDF } from '../utils/pdfGenerator';

interface ReportPrintModalProps {
  isOpen: boolean;
  products: Product[];
  availableBrands: string[];
  initialBrand?: string;
  onClose: () => void;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  products,
  availableBrands,
  initialBrand = 'all',
  onClose,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedBrand(initialBrand);
    }
  }, [isOpen, initialBrand]);

  if (!isOpen) return null;

  // Filtra produtos completos (ou com código) para o relatório
  const targetProducts = products.filter((p) => {
    // Apenas produtos que possuem código e/ou foram feitos
    const hasCode = Boolean(p.submittedCode);
    const isCompletedOrReceived = p.status === 'completed' || p.status === 'code_received';
    if (!hasCode && !isCompletedOrReceived) return false;

    if (selectedBrand !== 'all') {
      return p.brand.toLowerCase() === selectedBrand.toLowerCase();
    }
    return true;
  });

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await downloadProductsReportPDF({
        products: targetProducts,
        brandFilter: selectedBrand,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full my-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header - Não impresso no papel via css print */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="report-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Relatório de Histórico & Códigos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere e imprima ou salve em PDF o catálogo com fotos, marcas, referências e códigos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar relatório"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Seleção / Filtro de Marca - Não impressa */}
        <div className="print:hidden px-6 py-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Modo do Relatório:
            </span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">📋 Imprimir Histórico Completo (Todas as Marcas)</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  🏷️ Relatório exclusivo da marca: {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Total listado: <strong className="text-indigo-600 dark:text-indigo-400">{targetProducts.length}</strong> itens
            </span>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
              title="Baixar arquivo PDF diretamente no computador"
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
        <div id="printable-report" className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 dark:bg-slate-900 dark:text-white print:p-0 print:m-0 print:bg-white print:text-black">
          {/* Cabeçalho do Relatório */}
          <div className="border-b-2 border-indigo-600 pb-4 mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/image_4442907a.png"
                  alt="Calçados 24h"
                  className="h-9 w-auto object-contain"
                />
                <span className="text-xs uppercase px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-800 print:border print:border-black print:bg-white print:text-black">
                  Relatório Oficial de Calçados
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-700 mt-1">
                {selectedBrand === 'all'
                  ? 'Catálogo Geral de Histórico e Códigos Recebidos'
                  : `Catálogo Específico da Marca: ${selectedBrand}`}
              </p>
            </div>

            <div className="text-right text-xs text-slate-500 dark:text-slate-400 print:text-black">
              <p>Data de emissão: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></p>
              <p>Total de referências: <strong>{targetProducts.length}</strong></p>
            </div>
          </div>

          {targetProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto stroke-1 mb-2" />
              <p className="text-sm font-semibold">Nenhum produto com código encontrado para este filtro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
              {targetProducts.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 print:border-slate-300 bg-white dark:bg-slate-850 p-3.5 flex flex-col justify-between shadow-xs print:shadow-none break-inside-avoid"
                >
                  <div className="flex gap-3.5 items-start">
                    {/* Imagem maior */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 print:border-slate-300">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={`${item.brand} ${item.reference}`}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-semibold">Sem foto</span>
                        </div>
                      )}
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Informações: Marca maior, Referência e Valor no Bling */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400 print:text-black block truncate">
                        {item.brand}
                      </span>

                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white print:text-black truncate mt-0.5">
                        Ref: {item.reference}
                      </h4>

                      <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 print:text-black mt-1">
                        Valor no Bling: <span className="text-emerald-700 dark:text-emerald-400 print:text-black">{formatBRL(item.price)}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {item.sentToSite && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                            ✓ No Site
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${
                            item.sentToAtacado
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {item.sentToAtacado ? '✓ Atacado OK' : '⚠️ Falta Atacado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Caixa de Código em Destaque no padrão Códigos Recebidos */}
                  <div className="mt-3 bg-indigo-50/70 dark:bg-slate-800/80 print:bg-slate-100 p-2.5 rounded-xl border border-indigo-100 dark:border-slate-700 print:border-slate-300 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-extrabold text-indigo-700 dark:text-indigo-400 print:text-slate-600 block">
                        Código das Fotos:
                      </span>
                      <span className="font-mono text-base sm:text-lg font-black text-indigo-950 dark:text-indigo-100 print:text-black tracking-wider">
                        {item.submittedCode || 'Aguardando Código'}
                      </span>
                    </div>

                    {item.completedAt && (
                      <span className="text-[10px] text-slate-500 print:text-slate-600 font-medium text-right">
                        Feito em: {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé impresso */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 print:border-slate-300 text-center text-[10px] text-slate-500 print:text-slate-600">
            ShoeFlow SaaS • Sistema de Gestão de Fluxo Remoto de Calçados & Equipes • Documento gerado automaticamente
          </div>
        </div>

        {/* Footer com botão de download de PDF e impressão */}
        <div className="print:hidden px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Clique em <strong>&ldquo;Baixar Arquivo PDF&rdquo;</strong> para salvar o documento diretamente em seu dispositivo.
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
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
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
