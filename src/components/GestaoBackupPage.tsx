import React, { useState } from 'react';
import {
  Shield,
  Users,
  Database,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  CloudCheck,
  Server,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminBackupTab } from './AdminBackupTab';
import { AdminLoginModal } from './AdminLoginModal';
import { MasterAdminCredentialsCard } from './MasterAdminCredentialsCard';
import { SUPABASE_URL } from '../services/supabase';

export const GestaoBackupPage: React.FC = () => {
  const {
    currentUser,
    setActiveRole,
    supabaseSyncState,
    refreshSupabase,
    products,
    logout,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'usuarios' | 'master' | 'backup'>('usuarios');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await refreshSupabase();
    setIsRefreshing(false);
  };

  // Trava de segurança: Somente Administradores
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
          Gestão de Usuários & Backup
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Esta página é restrita ao administrador. Faça login para gerenciar usuários, criar acessos e exportar ou restaurar backups.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Fazer Login com Senha
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('store')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Voltar para a Loja
          </button>
        </div>

        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200 space-y-6">
      {/* Barra de Navegação Superior e Retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <button
            type="button"
            onClick={() => setActiveRole('admin')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors mb-2 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao Painel Operacional de Calçados
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-6 h-6" />
            </span>
            Página de Gestão de Usuários & Backup
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Espaço dedicado para criar acessos a colaboradores, enviar senhas por WhatsApp e manter cópias de segurança do sistema.
          </p>
        </div>

        {/* Status de Conexão com Supabase */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-2xl shadow-xs flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  supabaseSyncState.connected ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  supabaseSyncState.connected ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </span>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block leading-tight">
                  Supabase Conectado
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  {products.length} calçados ativos
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isRefreshing || supabaseSyncState.isSyncing}
              className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sincronizar com o banco de dados Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing || supabaseSyncState.isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-2xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer group"
            title="Sair do painel administrativo"
          >
            <LogOut className="w-4 h-4 text-rose-600 group-hover:-translate-x-0.5 transition-transform" />
            Sair
          </button>
        </div>
      </div>

      {/* Seletor de Seções da Página */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
        <button
          type="button"
          onClick={() => setActiveSection('usuarios')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === 'usuarios'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          👥 Gestão de Usuários & Equipes
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('master')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === 'master'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          🔑 Login e Senha do Admin Master
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('backup')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSection === 'backup'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          💾 Backup Completo (Exportar / Importar)
        </button>
      </div>

      {/* Conteúdo da Seção Selecionada */}
      <div className="pt-2">
        {activeSection === 'usuarios' && <AdminUsersTab />}
        {activeSection === 'master' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <MasterAdminCredentialsCard />
          </div>
        )}
        {activeSection === 'backup' && <AdminBackupTab />}
      </div>
    </div>
  );
};
