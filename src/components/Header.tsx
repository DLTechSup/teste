import React, { useState } from 'react';
import {
  Bell,
  Moon,
  Sun,
  Shield,
  ShieldCheck,
  Store,
  RotateCcw,
  Check,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  AlertTriangle,
  Lock,
  LogOut,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllPendenciasSummary } from '../utils/productUtils';
import { AdminLoginModal } from './AdminLoginModal';

export const Header: React.FC = () => {
  const {
    products,
    activeRole,
    setActiveRole,
    darkMode,
    setDarkMode,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    resetToDemoData,
    currentUser,
    logout,
  } = useApp();

  const pendenciasCount = getAllPendenciasSummary(products).total;

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleAdminClick = () => {
    if (currentUser?.role === 'admin') {
      setActiveRole(activeRole === 'admin' ? 'store' : 'admin');
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Marca do SaaS (Calçados 24h) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-10 px-2.5 py-1 rounded-xl bg-white border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/image_4442907a.png"
                alt="Calçados 24h"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  Calçados <span className="text-red-600">24h</span>
                </span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                  SaaS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:block">
                Gestão de Fluxos Remotos & Calçados
              </p>
            </div>
          </div>

          {/* Navegação Pública / Equipes da Loja (Central) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveRole('store')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeRole === 'store'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span className="sm:hidden">Loja</span>
                <span className="hidden sm:inline">Loja / Home</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRole('pendencias')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer relative ${
                  activeRole === 'pendencias'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pendências</span>
                {pendenciasCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeRole === 'pendencias'
                        ? 'bg-white text-rose-700'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {pendenciasCount}
                  </span>
                )}
              </button>
            </div>

            {/* Acesso Restrito ao Administrador - Posicionado estrategicamente no canto */}
            {currentUser?.role === 'admin' ? (
              <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 p-1 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                <button
                  type="button"
                  onClick={() => setActiveRole('admin')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeRole === 'admin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                  }`}
                  title="Painel Operacional de Calçados"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Painel Admin</span>
                  <span className="sm:hidden">Painel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRole('gestao_backup')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeRole === 'gestao_backup'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                  }`}
                  title="Página exclusiva para Gestão de Usuários e Backup do Sistema"
                >
                  <span className="text-xs">💾</span>
                  <span className="hidden md:inline">Gestão & Backup</span>
                  <span className="md:hidden">Gestão</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 border border-rose-300/80 dark:border-rose-800 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Sair da conta de Administrador (Logout)"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="font-extrabold">Sair</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdminClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs group"
                title="Acesso restrito ao Administrador com login e senha"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                <span className="hidden sm:inline">Administração</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            {/* Notificações Bell com Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                aria-label="Abrir notificações"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Menu de Notificações */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Notificações do SaaS
                    </h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-center py-6 text-slate-400">
                      Nenhuma notificação no momento.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                          notif.read
                            ? 'bg-slate-50/50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-slate-800 dark:text-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                            {notif.type === 'code_submitted' && '📩 Código Recebido'}
                            {notif.type === 'product_completed' && '✅ Produto Finalizado'}
                            {notif.type === 'system' && '🚀 Sistema'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-900 dark:text-white font-semibold mt-0.5">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Alternador de Modo Escuro */}
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Alternar modo escuro"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={darkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700" />
            )}
          </button>

          {/* Restaurar Demonstração (Seed Data) */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Deseja restaurar os dados de demonstração originais?')) {
                resetToDemoData();
              }
            }}
            aria-label="Restaurar dados demo"
            className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Restaurar dados de exemplo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <AdminLoginModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
    />
  </>
  );
};
