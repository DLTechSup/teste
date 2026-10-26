import React from 'react';
import {
  Inbox,
  AlertTriangle,
  X,
  CheckCircle2,
  ExternalLink,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ScreenNotificationToast: React.FC = () => {
  const { screenAlerts, dismissScreenAlert, setActiveRole, currentUser } = useApp();

  if (screenAlerts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full"
    >
      {screenAlerts.map((alert) => {
        const isCodeReceived = alert.type === 'code_received';

        const handleView = () => {
          dismissScreenAlert(alert.id);
          if (isCodeReceived) {
            if (currentUser?.role === 'admin') {
              setActiveRole('admin');
            } else {
              setActiveRole('store');
            }
          } else {
            setActiveRole('pendencias');
          }
        };

        return (
          <div
            key={alert.id}
            role="alert"
            className={`pointer-events-auto bg-white dark:bg-slate-900 border-2 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 transition-all ${
              isCodeReceived
                ? 'border-emerald-500/80 shadow-emerald-500/10'
                : 'border-amber-500/80 shadow-amber-500/10'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Ícone Indicador */}
              <div
                className={`p-2.5 rounded-xl shrink-0 shadow-xs ${
                  isCodeReceived
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isCodeReceived ? (
                  <Inbox className="w-5 h-5 animate-bounce" />
                ) : (
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                )}
              </div>

              {/* Conteúdo do Alerta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                      isCodeReceived
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {isCodeReceived ? 'Código Recebido' : 'Pendência Respondida'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Agora</span>
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1 leading-snug">
                  {alert.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {alert.message}
                </p>

                {alert.code && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Código:</span>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {alert.code}
                    </span>
                  </div>
                )}

                {/* Ações */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleView}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                      isCodeReceived
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    <span>{isCodeReceived ? 'Ver em Recebidos' : 'Ver em Pendências'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissScreenAlert(alert.id)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Dispensar
                  </button>
                </div>
              </div>

              {/* Botão Fechar */}
              <button
                type="button"
                onClick={() => dismissScreenAlert(alert.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Fechar alerta"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
