import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  RefreshCw,
  HardDrive,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BackupPayload } from '../types';

export const AdminBackupTab: React.FC = () => {
  const { products, draftProducts, users, exportBackup, importBackup } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Partial<BackupPayload> | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    exportBackup();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    setSuccessMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setErrorMessage('Por favor, selecione um arquivo válido no formato .json.');
      setSelectedFile(null);
      setParsedPreview(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setFileContent(text);
        const parsed = JSON.parse(text) as Partial<BackupPayload>;
        if (!parsed || !Array.isArray(parsed.products)) {
          setErrorMessage('O arquivo selecionado não contém uma estrutura de produtos válida.');
          setParsedPreview(null);
          return;
        }
        setParsedPreview(parsed);
      } catch {
        setErrorMessage('Falha ao ler o arquivo JSON. O arquivo pode estar corrompido.');
        setParsedPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = () => {
    if (!fileContent || !parsedPreview) return;

    const count = parsedPreview.products?.length || 0;
    const confirmed = window.confirm(
      `ATENÇÃO: Você está prestes a restabelecer ${count} produtos a partir do arquivo de backup.\n\n` +
      `Isso substituirá o catálogo atual pelos dados do backup.\n\n` +
      `Deseja prosseguir com a restauração?`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    setTimeout(() => {
      const result = importBackup(fileContent);
      setIsProcessing(false);
      if (result.success) {
        setSuccessMessage(result.message);
        setSelectedFile(null);
        setFileContent(null);
        setParsedPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setErrorMessage(result.message);
      }
    }, 400);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Informativo */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Segurança dos Dados
              </span>
              <span className="text-xs text-indigo-300">• Cópia de Segurança Local</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Database className="w-6 h-6 text-indigo-400" />
              Backup do Sistema & Restauração Completa
            </h3>
            <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
              Exporte todos os produtos, fotos, referências, rascunhos, histórico de códigos e contas de acesso. 
              Em caso de limpeza do navegador ou troca de computador, basta importar o arquivo para restabelecer todo o sistema instantaneamente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="px-5 py-3 rounded-2xl bg-white text-indigo-950 font-black text-xs hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              Exportar Backup Agora (.json)
            </button>
          </div>
        </div>

        {/* Estatísticas do que será exportado */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/60">
          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-800/40">
            <span className="text-[10px] uppercase text-indigo-300 font-bold block">Produtos Ativos</span>
            <span className="text-lg font-black text-white">{products.length} itens</span>
          </div>
          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-800/40">
            <span className="text-[10px] uppercase text-indigo-300 font-bold block">Fila de Rascunho</span>
            <span className="text-lg font-black text-white">{draftProducts.length} itens</span>
          </div>
          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-800/40">
            <span className="text-[10px] uppercase text-indigo-300 font-bold block">Usuários com Acesso</span>
            <span className="text-lg font-black text-white">{users.length} contas</span>
          </div>
          <div className="bg-indigo-950/60 rounded-xl p-3 border border-indigo-800/40">
            <span className="text-[10px] uppercase text-indigo-300 font-bold block">Formato Seguro</span>
            <span className="text-lg font-black text-white">JSON v1.0</span>
          </div>
        </div>
      </div>

      {/* Grid de Seções: Exportação e Restauração */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 1: Exportar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Exportar Cópia de Segurança
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Salve o arquivo no seu computador ou pendrive
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>O que está incluso no arquivo baixado:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Todos os modelos cadastrados com fotos, referências e marcas</li>
                  <li>Preços definidos no sistema (Valor no Bling)</li>
                  <li>Códigos de fotos recebidos da filial</li>
                  <li>Status de publicação no site e atacado</li>
                  <li>Fila de rascunhos em preparação</li>
                  <li>Lista de usuários e credenciais de acesso autorizadas</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>
                  Recomendação: Faça o download do backup ao final do expediente ou após conferir grandes lotes de calçados.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExport}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar Arquivo JSON de Backup
            </button>
          </div>
        </div>

        {/* Painel 2: Importar / Restabelecer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Restabelecer / Importar Arquivo de Backup
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Carregue um arquivo .json salvo anteriormente para recuperar os dados
                </p>
              </div>
            </div>

            {/* Alertas de sucesso ou erro */}
            {successMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Input de arquivo */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="backup-file-input"
            />

            {!selectedFile ? (
              <label
                htmlFor="backup-file-input"
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-850/50 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all mb-3 shadow-xs">
                  <FileJson className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Clique para selecionar o arquivo .json
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Ou arraste o arquivo de backup para esta área
                </span>
              </label>
            ) : (
              <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileJson className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[220px]">
                        {selectedFile.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFileContent(null);
                      setParsedPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Trocar arquivo
                  </button>
                </div>

                {parsedPreview && (
                  <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                    <p>
                      📦 <strong>Produtos a serem restaurados:</strong> {parsedPreview.products?.length || 0}
                    </p>
                    {parsedPreview.exportedAt && (
                      <p>
                        📅 <strong>Data da cópia:</strong>{' '}
                        {new Date(parsedPreview.exportedAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {parsedPreview.exportedBy && (
                      <p>
                        👤 <strong>Exportado por:</strong> {parsedPreview.exportedBy}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleRestore}
              disabled={!parsedPreview || isProcessing}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-200 dark:shadow-none cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Restaurando dados...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Restabelecer Todos os Produtos no Site
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
