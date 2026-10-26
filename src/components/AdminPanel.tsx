import React, { useState } from 'react';
import {
  PlusCircle,
  Inbox,
  Clock,
  AlertTriangle,
  CameraOff,
  BellRing,
  History,
  Copy,
  Check,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  Filter,
  ArrowUpDown,
  Printer,
  Send,
  Sparkles,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Info,
  X,
  Database,
  Users,
  Lock,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product, PhotoStatus, SortOption } from '../types';
import { AdminEditModal } from './AdminEditModal';
import {
  formatBRL,
  formatBlingPriceText,
  groupProductsByBrand,
  filterAndSortProducts,
  getGeneralPendencias,
  getCodeReceivedMissingPhotos,
  getPendenciasComCodigoSemFotos,
  getPendenciasSemCodigoSemFotos,
  getAllPendenciasSummary,
  getMissingAtacado,
  isWaitingCodeOnly,
  isPendencyProduct,
  isReceivedCodeReady,
} from '../utils/productUtils';
import { SAMPLE_PHOTO_PRESETS } from '../utils/seedData';
import { ConfirmationModal } from './ConfirmationModal';
import { EditProductModal } from './EditProductModal';
import { ImageViewerModal } from './ImageViewerModal';
import { ReportPrintModal } from './ReportPrintModal';
import { PendenciasReportModal } from './PendenciasReportModal';
import { AdminBackupTab } from './AdminBackupTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminLoginModal } from './AdminLoginModal';
import { BrandFilterSelect } from './BrandFilterSelect';
import { ImageUploadDropzone } from './ImageUploadDropzone';

type AdminTab =
  | 'recebidos'
  | 'esperando'
  | 'pendencias'
  | 'codigo_faltam_fotos'
  | 'falta_atacado'
  | 'historico'
  | 'backup'
  | 'usuarios';

export const AdminPanel: React.FC = () => {
  const {
    products,
    draftProducts,
    addDraftProduct,
    removeDraftProduct,
    commitDraftProducts,
    markProductDone,
    updateProduct,
    deleteProduct,
    toggleSiteAtacado,
    setActiveRole,
    currentUser,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('recebidos');
  const [selectedReceivedBrand, setSelectedReceivedBrand] = useState<string>('all');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  const ADMIN_TAB_LIST: AdminTab[] = [
    'recebidos',
    'esperando',
    'pendencias',
    'codigo_faltam_fotos',
    'falta_atacado',
    'historico',
  ];

  const handlePrevTab = () => {
    const idx = ADMIN_TAB_LIST.indexOf(activeTab);
    const prev = (idx - 1 + ADMIN_TAB_LIST.length) % ADMIN_TAB_LIST.length;
    setActiveTab(ADMIN_TAB_LIST[prev]);
  };

  const handleNextTab = () => {
    const idx = ADMIN_TAB_LIST.indexOf(activeTab);
    const next = (idx + 1) % ADMIN_TAB_LIST.length;
    setActiveTab(ADMIN_TAB_LIST[next]);
  };

  // Estados do formulário de novo cadastro (Staging)
  const [newBrand, setNewBrand] = useState('');
  const [newReference, setNewReference] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoStatus, setNewPhotoStatus] = useState<PhotoStatus>('Ja tenho as fotos');
  const [newMissingColors, setNewMissingColors] = useState('');
  const [newObservation, setNewObservation] = useState('');
  const [newSentToSite, setNewSentToSite] = useState(true);
  const [newSentToAtacado, setNewSentToAtacado] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Feedback de cópia do código
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Digitação rápida de código inline na Central de Pendências
  const [adminInlineCodes, setAdminInlineCodes] = useState<Record<string, string>>({});

  // Modais
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetBrand, setReportTargetBrand] = useState('all');
  const [isPendenciasReportModalOpen, setIsPendenciasReportModalOpen] = useState(false);
  const [pendenciasReportBrand, setPendenciasReportBrand] = useState('all');
  const [isAdminEditModalOpen, setIsAdminEditModalOpen] = useState(false);

  // Filtros de Pendências
  const [pendenciasTypeFilter, setPendenciasTypeFilter] = useState<'all' | 'withCode' | 'noCode'>('all');
  const [pendenciasBrandFilter, setPendenciasBrandFilter] = useState('all');

  // Alerta recorrente de atacado
  const [showAtacadoAlertBanner, setShowAtacadoAlertBanner] = useState(true);

  // Modal de Confirmação Genérico
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'primary' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Filtros para o Histórico e outras abas
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  // Listas especializadas
  // Códigos recebidos: calçados que receberam código E já possuem fotos completas (sem pendência de fotos)
  const receivedCodesList = products.filter(isReceivedCodeReady);
  const waitingCodesList = products.filter(isWaitingCodeOnly);
  const generalPendenciasList = getGeneralPendencias(products);
  const codeReceivedMissingPhotosList = getCodeReceivedMissingPhotos(products);
  const missingAtacadoList = getMissingAtacado(products);
  const historyList = products.filter((p) => p.status === 'completed');
  const pendenciasSummary = getAllPendenciasSummary(products);

  // Todas as marcas existentes
  const allBrands = Array.from(
    new Set([...products.map((p) => p.brand), ...draftProducts.map((p) => p.brand)])
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Copiar código com feedback
  const handleCopyCode = async (product: Product) => {
    if (!product.submittedCode) return;
    try {
      await navigator.clipboard.writeText(product.submittedCode);
      setCopiedCodeId(product.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch {
      // Fallback simples
      const textArea = document.createElement('textarea');
      textArea.value = product.submittedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCodeId(product.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  // Submissão do formulário de novo item para a Fila de Envio (Drafts)
  const handleAddDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!newBrand.trim()) errors.brand = 'Informe a marca';
    if (!newReference.trim()) errors.reference = 'Informe a referência do calçado';
    
    let parsed: number | undefined = undefined;
    if (newPrice.trim()) {
      const p = parseFloat(newPrice.replace(',', '.'));
      if (isNaN(p) || p <= 0) {
        errors.price = 'Informe um preço válido maior que 0 ou deixe em branco';
      } else {
        parsed = p;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    addDraftProduct({
      brand: newBrand.trim(),
      reference: newReference.trim(),
      price: parsed,
      photoUrl: newPhotoUrl.trim(),
      photoStatus: newPhotoStatus,
      missingColors: newPhotoStatus === 'Faltam as fotos' ? newMissingColors.trim() || undefined : undefined,
      observation: newObservation.trim(),
      sentToSite: newSentToSite,
      sentToAtacado: newSentToAtacado,
    });

    // Limpa apenas referência, preço e observação para agilizar inserção de múltiplas referências da mesma marca!
    setNewReference('');
    setNewPrice('');
    setNewMissingColors('');
    setNewObservation('');
    setNewPhotoUrl('');
    setFormErrors({});
  };

  // Confirmação para enviar drafts para a Home
  const handleCommitDrafts = () => {
    if (draftProducts.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Enviar Itens para a Tela Principal (Home)?',
      message: `Você tem ${draftProducts.length} produto(s) na fila. Ao confirmar, eles ficarão imediatamente visíveis na Home e as equipes das lojas poderão enviar os códigos.`,
      confirmText: 'Confirmar e Enviar para Home',
      variant: 'primary',
      onConfirm: () => {
        commitDraftProducts();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setActiveTab('esperando');
      },
    });
  };

  // Notificação toast temporária ao marcar Feito
  const [justDoneToast, setJustDoneToast] = useState<{
    id: string;
    brand: string;
    ref: string;
    missingAtacado: boolean;
  } | null>(null);

  // Marcar produto como Feito diretamente: vai imediatamente para o Histórico, sem bloqueios
  const handleMarkDone = (product: Product) => {
    markProductDone(product.id);
    setJustDoneToast({
      id: product.id,
      brand: product.brand,
      ref: product.reference,
      missingAtacado: !product.sentToAtacado,
    });
    setTimeout(() => {
      setJustDoneToast(null);
    }, 4500);
  };

  // Confirmação para Deletar produto
  const handleDeleteProduct = (product: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Produto do Sistema?',
      message: `Tem certeza que deseja excluir o produto ${product.brand} - Ref ${product.reference}? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir Permanentemente',
      variant: 'danger',
      onConfirm: () => {
        deleteProduct(product.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Confirmação para deletar draft
  const handleDeleteDraft = (id: string, ref: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remover da Fila de Cadastro?',
      message: `Deseja remover o rascunho da referência ${ref}?`,
      confirmText: 'Remover',
      variant: 'danger',
      onConfirm: () => {
        removeDraftProduct(id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Trava de segurança: Somente administradores logados têm acesso às opções do painel de controle
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-xs">
          <Shield className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
          Acesso Restrito
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Painel de Controle da Administração
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Somente o administrador possui login e senha para ter acesso às opções do painel de controle, relatórios, cadastros e backup.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setShowAdminLoginModal(true)}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Fazer Login de Administrador
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('store')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Voltar para a Tela da Loja
          </button>
        </div>

        <AdminLoginModal
          isOpen={showAdminLoginModal}
          onClose={() => setShowAdminLoginModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Topo do Painel de Administração */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400">
            Painel de Controle
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Administração do SaaS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastre calçados, receba códigos da loja, trate pendências, atacado e relatórios em PDF.
          </p>
        </div>

        {/* Botões de Ações do Topo */}
        <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
          <button
            type="button"
            onClick={() => setIsAdminEditModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            title="Trocar senha de administrador ou editar dados de acesso"
          >
            <KeyRound className="w-4 h-4 text-amber-500" />
            Trocar Senha / Perfil Admin
          </button>

          <button
            type="button"
            onClick={() => {
              setReportTargetBrand('all');
              setIsReportModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Imprimir Relatório em PDF
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer group"
            title="Sair do painel administrativo e voltar para a visualização da Loja"
          >
            <LogOut className="w-4 h-4 text-rose-600 group-hover:-translate-x-0.5 transition-transform" />
            Sair da Administração
          </button>
        </div>
      </div>

      {/* Layout com Coluna Lateral Fixa de Novo Cadastro à Esquerda e Painel de Gestão à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Lateral Fixa: Formulário de Novo Cadastro e Fila de Rascunho */}
        <aside className="lg:col-span-4 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs lg:sticky lg:top-20 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Novo Cadastro
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pronto para adicionar novos calçados
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddDraft} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marca do Calçado *
              </label>
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Ex: Beira Rio, Moleca, Vizzano"
                list="brands-datalist"
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <datalist id="brands-datalist">
                {allBrands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {formErrors.brand && (
                <p className="text-xs text-red-500 mt-1">{formErrors.brand}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referência do Calçado *
              </label>
              <input
                type="text"
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                placeholder="Ex: 8320-100"
                className="w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {formErrors.reference && (
                <p className="text-xs text-red-500 mt-1">{formErrors.reference}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preço Sistema *
                </label>
                <input
                  type="text"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Ex: 119,90 (opcional)"
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {formErrors.price && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Fotos *
                </label>
                <select
                  value={newPhotoStatus}
                  onChange={(e) => setNewPhotoStatus(e.target.value as PhotoStatus)}
                  className="w-full px-2 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Ja tenho as fotos">Ja tenho as fotos</option>
                  <option value="Somente foto de Capa">Somente foto de Capa</option>
                  <option value="Faltam as fotos">Faltam as fotos</option>
                  <option value="Não tenho nenhuma foto">Não tenho nenhuma foto</option>
                </select>
              </div>
            </div>

            {/* Campo dinâmico quando faltam as fotos */}
            {newPhotoStatus === 'Faltam as fotos' && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 animate-in fade-in">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Quais as cores que faltam das fotos? (ex: Branco, Preto, Nude)
                </label>
                <input
                  type="text"
                  value={newMissingColors}
                  onChange={(e) => setNewMissingColors(e.target.value)}
                  placeholder="Ex: Falta cor nova Preto e Avelã..."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            )}

            {/* Upload com Arrastar e Soltar (Drag & Drop) */}
            <div>
              <ImageUploadDropzone
                value={newPhotoUrl}
                onChange={(val) => setNewPhotoUrl(val)}
                label="Foto do Calçado (Upload / Arrastar)"
                helperText="Arraste uma foto aqui ou clique para selecionar do seu computador"
              />
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">Sugestões rápidas:</span>
                {SAMPLE_PHOTO_PRESETS.slice(0, 3).map((p) => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => setNewPhotoUrl(p.url)}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações adicionais */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações Adicionais
              </label>
              <textarea
                rows={2}
                value={newObservation}
                onChange={(e) => setNewObservation(e.target.value)}
                placeholder="Ex: Do 35 ao 39; verificar modelo do solado..."
                className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Checkboxes de Site e Atacado */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <label className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSentToSite}
                  onChange={(e) => setNewSentToSite(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  Enviar ao Site
                </span>
              </label>
              <label className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-850 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newSentToAtacado}
                  onChange={(e) => setNewSentToAtacado(e.target.checked)}
                  className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  Enviar ao Atacado
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar à Fila de Cadastro
            </button>
          </form>

          {/* Fila de Espera Temporária / Staging */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-900 dark:text-white">
                  Fila de Espera
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  {draftProducts.length}
                </span>
              </div>

              {draftProducts.length > 0 && (
                <button
                  type="button"
                  onClick={handleCommitDrafts}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Enviar todos os produtos da fila para a Home"
                >
                  <Send className="w-3 h-3" />
                  Enviar à Home
                </button>
              )}
            </div>

            {draftProducts.length === 0 ? (
              <div className="text-center py-5 px-3 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-850/50">
                <Layers className="w-6 h-6 mx-auto stroke-1 mb-1 text-slate-400" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Fila de cadastro vazia
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Preencha o formulário acima para adicionar múltiplos calçados antes de enviá-los à Home.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {draftProducts.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 border border-slate-300 dark:border-slate-700">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.reference}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400 m-auto" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block truncate">
                          {item.brand}
                        </span>
                        <h5 className="font-bold text-slate-900 dark:text-white truncate">
                          Ref: {item.reference}
                        </h5>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {formatBRL(item.price)} • {item.photoStatus}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(item.id, item.reference)}
                      aria-label={`Remover ${item.reference} da fila`}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      title="Remover da fila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Coluna Principal: Navegação das Abas de Gestão e Visualização */}
        <section className="lg:col-span-8 xl:col-span-8 space-y-5">
          {/* Toast informativo de produto finalizado e transferido para o Histórico */}
          {justDoneToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold">
                    {justDoneToast.brand} (Ref: {justDoneToast.ref})
                  </span>{' '}
                  foi marcado como Feito e transferido para o <strong>Histórico de Finalizados</strong>!
                  {justDoneToast.missingAtacado && (
                    <span className="block text-[11px] text-amber-800 dark:text-amber-300 font-semibold mt-0.5">
                      ⚠️ Lembrete Atacado: este calçado continua no alerta de Falta Enviar ao Atacado para você concluir quando desejar.
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('historico')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer shrink-0 transition-colors"
              >
                Ver no Histórico →
              </button>
            </div>
          )}

          {/* Alerta Recorrente de Falta Enviar ao Atacado */}
          {missingAtacadoList.length > 0 && showAtacadoAlertBanner && (
            <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-950 dark:text-amber-200 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                  <BellRing className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    ⚠️ Lembrete de Atacado: Existem {missingAtacadoList.length} produto(s) no site que ainda NÃO foram enviados ao Atacado!
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Este lembrete serve apenas para lembrá-lo de concluir no atacado. Os produtos feitos vão normalmente para o Histórico como finalizados.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('falta_atacado')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Ver Falta Atacado
                </button>
                <button
                  type="button"
                  onClick={() => setShowAtacadoAlertBanner(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  title="Dispensar aviso temporariamente"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Navegação por Abas do Administrador Organizada em DUAS FILAS + Setas para Frente/Trás */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Barra superior de controle com setas e link para a nova página de Gestão & Backup */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Opções de Triagem (2 filas para fácil visualização):
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevTab}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Aba anterior (Seta para trás)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">Anterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextTab}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Próxima aba (Seta para frente)"
                  >
                    <span className="text-[10px] hidden sm:inline">Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Botão de Atalho para a Nova Página Dedicada de Gestão & Backup */}
              <button
                type="button"
                onClick={() => setActiveRole('gestao_backup')}
                className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group"
                title="Abrir página dedicada para Gestão de Usuários e Backup do Sistema"
              >
                <span>💾</span>
                <span>Nova Página: Gestão & Backup</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* FILA 1: Entrada & Triagem Inicial (3 opções) */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1.5">
                Fila 1: Entrada & Triagem Inicial
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Opção 1: Códigos Recebidos */}
                <button
                  type="button"
                  onClick={() => setActiveTab('recebidos')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                    activeTab === 'recebidos'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Inbox className="w-4 h-4 shrink-0" />
                    <span className="truncate">Códigos Recebidos</span>
                  </span>
                  {receivedCodesList.length > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                        activeTab === 'recebidos'
                          ? 'bg-white text-indigo-700'
                          : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {receivedCodesList.length}
                    </span>
                  )}
                </button>

                {/* Opção 2: Esperando Código */}
                <button
                  type="button"
                  onClick={() => setActiveTab('esperando')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                    activeTab === 'esperando'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="truncate">Esperando Código</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                      activeTab === 'esperando'
                        ? 'bg-white text-indigo-700'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {waitingCodesList.length}
                  </span>
                </button>

                {/* Opção 3: Pendências */}
                <button
                  type="button"
                  onClick={() => setActiveTab('pendencias')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                    activeTab === 'pendencias'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-750 border-amber-200 dark:border-amber-900/60'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="truncate">Central Pendências</span>
                  </span>
                  {pendenciasSummary.total > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                        activeTab === 'pendencias'
                          ? 'bg-white text-amber-800'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                      }`}
                    >
                      {pendenciasSummary.total}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* FILA 2: Acompanhamento, Atacado & Histórico (3 opções) */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1.5">
                Fila 2: Acompanhamento, Atacado & Histórico
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Opção 4: Código Recebido, Faltam Fotos */}
                <button
                  type="button"
                  onClick={() => setActiveTab('codigo_faltam_fotos')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                    activeTab === 'codigo_faltam_fotos'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <CameraOff className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="truncate">Faltam Fotos</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                      activeTab === 'codigo_faltam_fotos'
                        ? 'bg-white text-amber-800'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {codeReceivedMissingPhotosList.length}
                  </span>
                </button>

                {/* Opção 5: Falta Atacado */}
                <button
                  type="button"
                  onClick={() => setActiveTab('falta_atacado')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                    activeTab === 'falta_atacado'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <BellRing className="w-4 h-4 shrink-0 text-amber-500" />
                    <span className="truncate">Falta Atacado</span>
                  </span>
                  {missingAtacadoList.length > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                        activeTab === 'falta_atacado'
                          ? 'bg-white text-indigo-700'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
                      }`}
                    >
                      {missingAtacadoList.length}
                    </span>
                  )}
                </button>

                {/* Opção 6: Histórico de Finalizados */}
                <button
                  type="button"
                  onClick={() => setActiveTab('historico')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                    activeTab === 'historico'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <History className="w-4 h-4 shrink-0" />
                    <span className="truncate">Histórico Feito</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                      activeTab === 'historico'
                        ? 'bg-white text-indigo-700'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {historyList.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ABA 1: CÓDIGOS RECEBIDOS (AGRUPADOS POR MARCA + CÓDIGO BEM VISÍVEL) */}
          {/* ============================================================== */}
          {activeTab === 'recebidos' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    Códigos Enviados pelas Lojas Remotas
                  </h3>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80">
                    Clique no código para copiar automaticamente. Ao finalizar a conferência, clique em &ldquo;Feito&rdquo; para enviar ao histórico.
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-indigo-200/80 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200 shrink-0">
                  {receivedCodesList.length} código(s) pendente(s)
                </span>
              </div>

              {receivedCodesList.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto stroke-1 text-emerald-500 mb-2" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Tudo em dia! Nenhum código aguardando conferência
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Quando a equipe da loja preencher o código de barras ou referência e confirmar na Home, ele aparecerá aqui agrupado por marca.
                  </p>
                </div>
              ) : (
                (() => {
                  const groupedReceived = groupProductsByBrand(receivedCodesList);
                  const receivedBrands = Object.keys(groupedReceived);

                  // Lista filtrada ou completa dependendo da marca selecionada
                  const displayedBrands =
                    selectedReceivedBrand === 'all'
                      ? receivedBrands
                      : receivedBrands.filter((b) => b.toLowerCase() === selectedReceivedBrand.toLowerCase());

                  return (
                    <div className="space-y-5">
                      {/* Agrupamento por Marca: Dropdown Vertical Limpo com Busca */}
                      <div className="flex items-center justify-between pb-1">
                        <BrandFilterSelect
                          brands={receivedBrands}
                          selectedBrand={selectedReceivedBrand}
                          onSelectBrand={setSelectedReceivedBrand}
                          counts={Object.fromEntries(receivedBrands.map((b) => [b, groupedReceived[b]?.length || 0]))}
                          totalCount={receivedCodesList.length}
                          variant="indigo"
                          label="Marca"
                        />
                        <span className="text-xs text-slate-500 font-semibold">
                          Exibindo {displayedBrands.length} marca(s)
                        </span>
                      </div>

                      {/* Agrupamento das referências por marca */}
                      <div className="space-y-6">
                        {displayedBrands.map((brandName) => {
                          const items = groupedReceived[brandName] || [];
                          if (items.length === 0) return null;

                          return (
                            <div
                              key={brandName}
                              className="bg-slate-50/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs"
                            >
                              {/* Cabeçalho da Marca Agrupada */}
                              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase shadow-xs">
                                    {brandName.substring(0, 2)}
                                  </div>
                                  <div>
                                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                                      {brandName}
                                    </h4>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      {items.length} {items.length === 1 ? 'referência recebida' : 'referências recebidas'}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full">
                                  {items.length} pendente(s)
                                </span>
                              </div>

                              {/* Grid compacta de referências da marca */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {items.map((product) => {
                                  const isCopied = copiedCodeId === product.id;

                                  return (
                                    <div
                                      key={product.id}
                                      className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                      <div>
                                        {/* Foto maior e dados principais compactados */}
                                        <div className="flex gap-3">
                                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 group">
                                            {product.photoUrl ? (
                                              <img
                                                src={product.photoUrl}
                                                alt={product.reference}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400">
                                                <ImageIcon className="w-6 h-6 mb-1" />
                                                <span className="text-[9px] font-semibold">Sem foto</span>
                                              </div>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => setViewingProduct(product)}
                                              aria-label={`Visualizar imagem de ${product.reference}`}
                                              className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                              title="Visualizar Imagem"
                                            >
                                              <Eye className="w-5 h-5" />
                                            </button>
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400 block truncate">
                                              {product.brand}
                                            </span>
                                            <h5 className="text-sm sm:text-base font-black text-slate-900 dark:text-white break-words">
                                              Ref: {product.reference}
                                            </h5>
                                            {product.price && product.price > 0 && (
                                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                Este produto está no Bling por {formatBRL(product.price)}
                                              </p>
                                            )}
                                            <span className="text-[10px] text-slate-400 block mt-1">
                                              Recebido às{' '}
                                              {new Date(product.submittedAt || product.createdAt).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Espaço Compactado com Código Bem Maior e Visível */}
                                        <div className="mt-3 bg-indigo-50/70 dark:bg-slate-800 p-2.5 rounded-xl border border-indigo-100 dark:border-slate-700 flex items-center justify-between gap-2">
                                          <div className="min-w-0">
                                            <span className="text-[9px] uppercase font-extrabold text-indigo-700 dark:text-indigo-400 block">
                                              Código das fotos:
                                            </span>
                                            <span className="font-mono text-lg sm:text-xl font-black text-indigo-950 dark:text-indigo-100 tracking-wider truncate block">
                                              {product.submittedCode}
                                            </span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleCopyCode(product)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                              isCopied
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                            }`}
                                            title="Copiar código automaticamente"
                                          >
                                            {isCopied ? (
                                              <>
                                                <Check className="w-3.5 h-3.5" /> Copiado!
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3.5 h-3.5" /> Copiar
                                              </>
                                            )}
                                          </button>
                                        </div>

                                        {/* Pergunta de fotos quando o calçado tem pendência de foto */}
                                        {isPendencyProduct(product) && (
                                          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                                            <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold mb-1.5">
                                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                              <span>Você recebeu o código! Você já tem as fotos deste calçado?</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  updateProduct(product.id, {
                                                    photoStatus: 'Ja tenho as fotos',
                                                    codeReceivedMissingPhotos: false,
                                                  });
                                                }}
                                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all"
                                              >
                                                ✓ Sim, já tenho as fotos
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  updateProduct(product.id, {
                                                    codeReceivedMissingPhotos: true,
                                                  });
                                                }}
                                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 cursor-pointer transition-all"
                                              >
                                                ✕ Não, faltam fotos
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Mensagem enviada pela Loja */}
                                        {product.storeObservation && (
                                          <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-1.5">
                                            <Info className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                              <strong className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                                                Mensagem da loja:
                                              </strong>
                                              <div className="whitespace-pre-wrap break-words leading-relaxed">
                                                {product.storeObservation}
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* Observação Completa do Administrador */}
                                        {product.observation && (
                                          <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
                                            <strong className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                                              Obs / Nota do cadastro:
                                            </strong>
                                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                                              {product.observation}
                                            </div>
                                          </div>
                                        )}

                                        {/* Opções de Enviado ao Site e Enviado ao Atacado */}
                                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                                          <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer text-[11px]">
                                            <input
                                              type="checkbox"
                                              checked={product.sentToSite}
                                              onChange={() => toggleSiteAtacado(product.id, 'sentToSite')}
                                              className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                              Enviado ao Site
                                            </span>
                                          </label>
                                          <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer text-[11px]">
                                            <input
                                              type="checkbox"
                                              checked={product.sentToAtacado}
                                              onChange={() => toggleSiteAtacado(product.id, 'sentToAtacado')}
                                              className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                              Enviado ao Atacado
                                            </span>
                                          </label>
                                        </div>
                                      </div>

                                      {/* Ações e Botão Feito */}
                                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => setViewingProduct(product)}
                                            aria-label={`Visualizar foto de ${product.reference}`}
                                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                            title="Visualizar Imagem"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingProduct(product)}
                                            aria-label={`Editar ${product.reference}`}
                                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                            title="Editar dados ou código"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteProduct(product)}
                                            aria-label={`Excluir ${product.reference}`}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                            title="Excluir"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleMarkDone(product)}
                                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                          title="Marcar como feito e mover para o Histórico"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Feito
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

      {/* ============================================================== */}
      {/* ABA 2: ESPERANDO CÓDIGO (AGRUPADO EM ORDEM ALFABÉTICA POR MARCA) */}
      {/* ============================================================== */}
      {activeTab === 'esperando' && (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Produtos Enviados à Home Aguardando Código
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organizados em ordem alfabética de marcas e agrupados por referência.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
              Total: {waitingCodesList.length} referências
            </span>
          </div>

          {waitingCodesList.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <Clock className="w-12 h-12 mx-auto stroke-1 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum calçado aguardando código no momento.
              </p>
            </div>
          ) : (
            (() => {
              const grouped = groupProductsByBrand(waitingCodesList);
              return (
                <div className="space-y-8">
                  {Object.entries(grouped).map(([brandName, brandItems]) => (
                    <div
                      key={brandName}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black flex items-center justify-center">
                            {brandName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {brandName}
                            </h4>
                            <span className="text-xs text-slate-500">
                              {brandItems.length} referências nesta marca
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {brandItems.map((prod) => (
                          <div
                            key={prod.id}
                            className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex flex-col justify-between"
                          >
                            <div>
                              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-2.5">
                                {prod.photoUrl ? (
                                  <img
                                    src={prod.photoUrl}
                                    alt={prod.reference}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-slate-400 m-auto" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setViewingProduct(prod)}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                                  title="Visualizar foto"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Tipografia ampliada: Referência bem visível */}
                              <h5 className="text-sm sm:text-base font-black text-slate-900 dark:text-white break-words">
                                Ref: {prod.reference}
                              </h5>
                              {prod.price && prod.price > 0 && (
                                <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  Este produto está no Bling por {formatBRL(prod.price)}
                                </p>
                              )}
                              <div className="mt-1.5">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-750 text-slate-700 dark:text-slate-300 inline-block">
                                  Status: {prod.photoStatus}
                                </span>
                              </div>

                              {/* Campo de Observação maior conforme solicitado */}
                              {prod.observation && (
                                <div className="mt-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                                  <span className="font-bold block text-[10px] uppercase text-slate-400 mb-0.5">
                                    Observação:
                                  </span>
                                  <p className="whitespace-pre-wrap break-words leading-relaxed">{prod.observation}</p>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingProduct(prod)}
                                aria-label={`Editar ${prod.reference}`}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod)}
                                aria-label={`Excluir ${prod.reference}`}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: PENDÊNCIAS (FOTOS E CÓDIGOS - RELATÓRIO PDF PARA LOJA) */}
      {/* ============================================================== */}
      {activeTab === 'pendencias' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Painel Central de Pendências (Fotos & Códigos)
              </h3>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-1 max-w-xl">
                Consolidação dos 2 tipos de pendências para cobrança direta da loja: modelos com código recebido mas sem fotos, e modelos sem código e sem fotos.
              </p>
            </div>

            {/* Botão de Imprimir Relatório de Pendências PDF */}
            <button
              type="button"
              onClick={() => {
                setPendenciasReportBrand(pendenciasBrandFilter);
                setIsPendenciasReportModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-2xl shadow-md shadow-amber-200 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório de Pendências (PDF)
            </button>
          </div>

          {/* Filtros Internos da Aba de Pendências */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Filtro por Tipo */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setPendenciasTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pendenciasTypeFilter === 'all'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todas ({pendenciasSummary.total})
              </button>
              <button
                type="button"
                onClick={() => setPendenciasTypeFilter('withCode')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pendenciasTypeFilter === 'withCode'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Com Código, Faltam Fotos ({pendenciasSummary.withCodeMissingPhotos.length})
              </button>
              <button
                type="button"
                onClick={() => setPendenciasTypeFilter('noCode')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pendenciasTypeFilter === 'noCode'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Falta Código e Faltam Fotos ({pendenciasSummary.missingCodeAndPhotos.length})
              </button>
            </div>

            {/* Filtro por Marca: Dropdown Vertical Limpo */}
            <BrandFilterSelect
              brands={allBrands}
              selectedBrand={pendenciasBrandFilter}
              onSelectBrand={setPendenciasBrandFilter}
              variant="amber"
              label="Marca"
            />
          </div>

          {/* Lista com o mesmo layout de Códigos Recebidos (Foto, Marca, Ref, Código, Status) */}
          {(() => {
            const listToFilter =
              pendenciasTypeFilter === 'withCode'
                ? pendenciasSummary.withCodeMissingPhotos
                : pendenciasTypeFilter === 'noCode'
                ? pendenciasSummary.missingCodeAndPhotos
                : pendenciasSummary.all;

            const filteredPendencias = listToFilter.filter((item) => {
              if (pendenciasBrandFilter !== 'all' && item.brand.toLowerCase() !== pendenciasBrandFilter.toLowerCase()) {
                return false;
              }
              return true;
            });

            if (filteredPendencias.length === 0) {
              return (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto stroke-1 text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nenhuma pendência encontrada para este filtro.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPendencias.map((product) => {
                  const hasCode = Boolean(product.submittedCode && product.submittedCode.trim().length > 0);
                  const isCopied = copiedCodeId === product.id;

                  return (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-slate-850 rounded-2xl border border-amber-300 dark:border-amber-900/60 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Topo com Foto grande, Marca, Referência e Preço */}
                        <div className="flex gap-3">
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 group">
                            {product.photoUrl ? (
                              <img
                                src={product.photoUrl}
                                alt={product.reference}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400 bg-amber-50/40 dark:bg-amber-950/20">
                                <ImageIcon className="w-6 h-6 mb-1 text-amber-500" />
                                <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                  Sem Foto
                                </span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setViewingProduct(product)}
                              aria-label={`Visualizar imagem de ${product.reference}`}
                              className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Visualizar Imagem"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400 block truncate">
                              {product.brand}
                            </span>
                            <h5 className="text-sm sm:text-base font-black text-slate-900 dark:text-white break-words">
                              Ref: {product.reference}
                            </h5>
                            {product.price && product.price > 0 && (
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                Este produto está no Bling por {formatBRL(product.price)}
                              </p>
                            )}

                            {/* Badge Explícito do Tipo de Pendência */}
                            <div className="mt-1.5">
                              {hasCode ? (
                                <span className="text-[11px] px-2 py-0.5 rounded-md font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 inline-block">
                                  ⚠️ Já tem o código, mas faltam as fotos
                                </span>
                              ) : (
                                <span className="text-[11px] px-2 py-0.5 rounded-md font-extrabold bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 inline-block">
                                  ❌ Falta o código e falta as fotos
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bloco de Código: se tiver, exibe grande com cópia; se não, permite digitar inline */}
                        <div className="mt-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          {hasCode ? (
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase font-extrabold text-slate-400 block">
                                  Código de barras / Referência:
                                </span>
                                <span className="font-mono text-base sm:text-lg font-black text-indigo-900 dark:text-indigo-200 truncate block">
                                  {product.submittedCode}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopyCode(product)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                  isCopied
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                }`}
                                title="Copiar código automaticamente"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Copiado!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" /> Copiar
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                                  Digitar código do calçado:
                                </span>
                                <span className="text-[10px] text-rose-600 italic">Código pendente</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={adminInlineCodes[product.id] || ''}
                                  onChange={(e) =>
                                    setAdminInlineCodes((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const val = (adminInlineCodes[product.id] || '').trim();
                                      if (val) {
                                        updateProduct(product.id, {
                                          submittedCode: val,
                                          status: 'code_received',
                                        });
                                        setAdminInlineCodes((prev) => {
                                          const next = { ...prev };
                                          delete next[product.id];
                                          return next;
                                        });
                                      }
                                    }
                                  }}
                                  placeholder="Digitar código das fotos"
                                  className="flex-1 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = (adminInlineCodes[product.id] || '').trim();
                                    if (val) {
                                      updateProduct(product.id, {
                                        submittedCode: val,
                                        status: 'code_received',
                                      });
                                      setAdminInlineCodes((prev) => {
                                        const next = { ...prev };
                                        delete next[product.id];
                                        return next;
                                      });
                                    }
                                  }}
                                  disabled={!(adminInlineCodes[product.id] || '').trim()}
                                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                                >
                                  <Send className="w-3.5 h-3.5" /> Enviar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Observação: O que está faltando */}
                        {(product.observation || product.storeObservation) && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200">
                            <strong className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                              O que precisa providenciar:
                            </strong>
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{product.observation || product.storeObservation}</p>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setViewingProduct(product)}
                          className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Foto
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(product)}
                            className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                          >
                            Anexar Foto / Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            aria-label={`Excluir pendência de ${product.reference}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 4: CÓDIGO RECEBIDO, FALTAM FOTOS (MAIOR VISIBILIDADE) */}
      {/* ============================================================== */}
      {activeTab === 'codigo_faltam_fotos' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <CameraOff className="w-4 h-4 text-amber-600" />
                Código Recebido, mas Faltam Fotos
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                Calçados com código já enviado pela loja, mas que mandaram somente 1 foto de estoque e faltam os ângulos de catálogo.
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 shrink-0">
              {codeReceivedMissingPhotosList.length} calçados
            </span>
          </div>

          {codeReceivedMissingPhotosList.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <CheckCircle2 className="w-12 h-12 mx-auto stroke-1 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nenhum calçado nesta condição especial.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {codeReceivedMissingPhotosList.map((p) => {
                const isCopied = copiedCodeId === p.id;
                return (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 dark:border-amber-800/80 p-4 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex gap-3">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.reference} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-400 m-auto" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">
                            {p.brand}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            Ref: {p.reference}
                          </h4>
                          {p.price && p.price > 0 && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                              Este produto está no Bling por {formatBRL(p.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Código bem maior e visível */}
                      <div className="mt-3 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">
                            Código das fotos:
                          </span>
                          <span className="font-mono text-base sm:text-lg font-black text-indigo-900 dark:text-indigo-200 truncate block">
                            {p.submittedCode}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyCode(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          }`}
                          title="Copiar código"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copiar
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200">
                        <span className="font-semibold block text-[10px]">Alerta de Fotos:</span>
                        {p.observation || 'Loja enviou apenas 1 foto de estoque. Faltam ângulos para o e-commerce.'}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(p)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkDone(p)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
                      >
                        Feito
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 5: LEMBRETES - FALTA ENVIAR AO ATACADO */}
      {/* ============================================================== */}
      {activeTab === 'falta_atacado' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-amber-950 dark:text-amber-200 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-600 animate-pulse" />
                Produtos Pendentes de Envio ao Site de Atacado
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Estes produtos foram marcados para o Site E-commerce, porém ainda <strong>não</strong> foram marcados como enviados ao site de Atacado. Marque a opção assim que cadastrá-los no atacado para zerar as pendências.
              </p>
            </div>

            {missingAtacadoList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  missingAtacadoList.forEach((item) => {
                    toggleSiteAtacado(item.id, 'sentToAtacado');
                  });
                }}
                className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Marcar Todos como Enviados ao Atacado
              </button>
            )}
          </div>

          {missingAtacadoList.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <CheckCircle2 className="w-12 h-12 mx-auto stroke-1 text-emerald-500 mb-2" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Tudo sincronizado!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Todos os produtos ativos no site já foram enviados ao atacado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {missingAtacadoList.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt={p.reference} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400 block truncate">
                        {p.brand}
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                        Ref: {p.reference}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {p.price && p.price > 0 && (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60">
                            {formatBRL(p.price)}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800/80">
                          Pendente Atacado
                        </span>
                      </div>
                      {p.submittedCode && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block truncate mt-1">
                          Cód: {p.submittedCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Pendente no atacado
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSiteAtacado(p.id, 'sentToAtacado')}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Marcar Atacado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 6: HISTÓRICO COMPLETO & RELATÓRIOS EM PDF */}
      {/* ============================================================== */}
      {activeTab === 'historico' && (
        <div className="space-y-6">
          {/* Barra de Pesquisa, Filtro por Marca, Ordenação e Botão de Imprimir Relatório */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Barra de pesquisa */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar histórico por marca, ref ou código..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filtro por marca: Dropdown Vertical */}
              <BrandFilterSelect
                brands={allBrands}
                selectedBrand={brandFilter}
                onSelectBrand={setBrandFilter}
                variant="slate"
                label="Marca"
              />

              {/* Ordenação */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="date_desc">Mais Recentes</option>
                  <option value="date_asc">Mais Antigos</option>
                  <option value="name_asc">Marca A-Z</option>
                  <option value="name_desc">Marca Z-A</option>
                </select>
              </div>
            </div>

            {/* Botão de Relatório PDF com rótulo dinâmico da marca */}
            <button
              type="button"
              onClick={() => {
                setReportTargetBrand(brandFilter);
                setIsReportModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              {brandFilter !== 'all'
                ? `Imprimir Relatório: ${brandFilter} (PDF)`
                : 'Imprimir Relatório Completo (Todas as Marcas) (PDF)'}
            </button>
          </div>

          {/* Lista de Itens do Histórico */}
          {(() => {
            const filteredHistory = filterAndSortProducts(historyList, {
              search: searchQuery,
              brand: brandFilter,
              sort: sortOption,
            });

            if (filteredHistory.length === 0) {
              return (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                  <History className="w-12 h-12 mx-auto stroke-1 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nenhum produto finalizado encontrado no histórico.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Foto */}
                      <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-2">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.reference}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400 m-auto" />
                        )}
                        <button
                          type="button"
                          onClick={() => setViewingProduct(item)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                          title="Visualizar Imagem"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Marca e Referência */}
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
                        {item.brand}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white break-words">
                        Ref: {item.reference}
                      </h4>
                      {item.price && item.price > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Este produto está no Bling por {formatBRL(item.price)}
                        </p>
                      )}

                      {/* Código abaixo da imagem conforme especificado */}
                      <div className="mt-2 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Código
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate block">
                          {item.submittedCode || '-'}
                        </span>
                      </div>

                      {/* Status de Finalizado e Atacado */}
                      <div className="mt-2 flex flex-col gap-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Finalizado no Site
                        </span>
                        {item.sentToAtacado ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 w-fit">
                            <Check className="w-2.5 h-2.5 text-indigo-600" /> Enviado ao Atacado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleSiteAtacado(item.id, 'sentToAtacado')}
                            className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 w-fit cursor-pointer transition-colors"
                            title="Clique para marcar como enviado ao Atacado"
                          >
                            <BellRing className="w-2.5 h-2.5 text-amber-600" /> Falta Atacado (Marcar)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(item.completedAt || item.createdAt).toLocaleDateString('pt-BR')}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(item)}
                          aria-label={`Editar ${item.reference}`}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(item)}
                          aria-label={`Excluir ${item.reference}`}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 7: BACKUP & RESTAURAÇÃO (EXPORTAR / IMPORTAR) */}
      {/* ============================================================== */}
      {activeTab === 'backup' && <AdminBackupTab />}

      {/* ============================================================== */}
      {/* ABA 8: GESTÃO DE USUÁRIOS & CREDENCIAIS */}
      {/* ============================================================== */}
      {activeTab === 'usuarios' && <AdminUsersTab />}
        </section>
      </div>

      {/* Modal de Edição Completa */}
      {editingProduct && (
        <EditProductModal
          isOpen={true}
          product={editingProduct}
          onSave={(updates) => updateProduct(editingProduct.id, updates)}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Modal de Visualização de Imagem */}
      {viewingProduct && (
        <ImageViewerModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}

      {/* Modal de Impressão de Relatório de Histórico em PDF */}
      <ReportPrintModal
        isOpen={isReportModalOpen}
        products={products}
        availableBrands={allBrands}
        initialBrand={reportTargetBrand}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Modal de Impressão de Relatório de Pendências em PDF para Envio à Loja */}
      <PendenciasReportModal
        isOpen={isPendenciasReportModalOpen}
        products={products}
        availableBrands={allBrands}
        initialBrand={pendenciasReportBrand}
        onClose={() => setIsPendenciasReportModalOpen(false)}
      />

      {/* Modal de Confirmação de Segurança Genérico */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modal de Edição de Administrador e Alteração de Senha */}
      <AdminEditModal
        isOpen={isAdminEditModalOpen}
        onClose={() => setIsAdminEditModalOpen(false)}
      />
    </div>
  );
};
