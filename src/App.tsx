import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HomeStoreView } from './components/HomeStoreView';
import { AdminPanel } from './components/AdminPanel';
import { PendenciasPage } from './components/PendenciasPage';
import { GestaoBackupPage } from './components/GestaoBackupPage';
import { ScreenNotificationToast } from './components/ScreenNotificationToast';

const AppContent: React.FC = () => {
  const { activeRole } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-indigo-500 selection:text-white relative">
      <ScreenNotificationToast />
      <Header />
      <main className="flex-1">
        {activeRole === 'store' && <HomeStoreView />}
        {activeRole === 'admin' && <AdminPanel />}
        {activeRole === 'pendencias' && <PendenciasPage />}
        {activeRole === 'gestao_backup' && <GestaoBackupPage />}
      </main>
      <footer className="print:hidden border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>ShoeFlow SaaS • Gestão Integrada de Fluxo de Calçados & Equipes Remotas</p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
