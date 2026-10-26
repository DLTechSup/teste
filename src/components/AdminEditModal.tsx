import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Copy,
  Check,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAccount } from '../types';

interface AdminEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: UserAccount | null;
}

export const AdminEditModal: React.FC<AdminEditModalProps> = ({
  isOpen,
  onClose,
  targetUser: propTargetUser,
}) => {
  const { users, currentUser, updateUser } = useApp();

  // Se nenhum usuário específico foi passado, assume o Admin Master ou o admin logado
  const effectiveUser =
    propTargetUser ||
    (currentUser?.role === 'admin' ? currentUser : null) ||
    users.find((u) => u.id === 'user-admin-master') ||
    users.find((u) => u.role === 'admin') ||
    users[0];

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (effectiveUser && isOpen) {
      setName(effectiveUser.name || '');
      setUsername(effectiveUser.username || '');
      setPassword(effectiveUser.password || '');
      setConfirmPassword(effectiveUser.password || '');
      setNotes(effectiveUser.notes || '');
      setErrorMessage('');
      setSuccessMessage('');
      setShowPassword(false);
    }
  }, [effectiveUser, isOpen]);

  if (!isOpen || !effectiveUser) return null;

  const isMaster = effectiveUser.id === 'user-admin-master';

  const handleGeneratePassword = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
    setConfirmPassword(pass);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = password.trim();

    if (!cleanName) {
      setErrorMessage('O nome do administrador não pode ficar em branco.');
      return;
    }

    if (!cleanUsername) {
      setErrorMessage('O login de administrador não pode ficar em branco.');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage('O login deve ter pelo menos 3 caracteres.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('A senha não pode ficar em branco.');
      return;
    }

    if (cleanPassword.length < 3) {
      setErrorMessage('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setErrorMessage('A confirmação de senha não confere com a nova senha digitada.');
      return;
    }

    // Verifica se outro usuário já possui esse username
    const existsOther = users.some(
      (u) => u.id !== effectiveUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (existsOther) {
      setErrorMessage(`O login "${cleanUsername}" já está em uso por outro usuário.`);
      return;
    }

    // Atualiza o cadastro
    updateUser(effectiveUser.id, {
      name: cleanName,
      username: cleanUsername,
      password: cleanPassword,
      notes: notes.trim() || undefined,
    });

    setSuccessMessage(
      `Dados do Administrador e Senha atualizados com sucesso! Novo login: "${cleanUsername}".`
    );

    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const handleCopyNewCredentials = async () => {
    const text =
      `🔐 *Credenciais do Administrador*\n\n` +
      `👤 *Nome:* ${name.trim()}\n` +
      `👤 *Login:* ${username.trim().toLowerCase()}\n` +
      `🔑 *Senha:* ${password.trim()}\n` +
      `🛡️ *Perfil:* Administrador\n\n` +
      `Guarde em local seguro para acessar a administração.`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-sm shadow-amber-200 dark:shadow-none">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {isMaster ? 'Administrador Master' : 'Administrador'}
                </span>
                <span className="text-xs text-slate-400">Segurança & Acesso</span>
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                Editar Administrador / Trocar Senha
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Nome do Administrador */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nome de Exibição *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Danilo / Administrador Geral"
              className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Login de Acesso (Username) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Login de Acesso (Usuário) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Ex: admin"
                className="w-full pl-8 pr-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Login atual: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">@{effectiveUser.username}</span>
            </p>
          </div>

          {/* Nova Senha */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Senha do Administrador *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Gerar Senha Segura
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a nova senha"
                className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Senha atual: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{effectiveUser.password}</span>
            </p>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Confirmar Senha *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite novamente para confirmar"
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] font-bold text-rose-500 mt-1">
                As senhas não conferem.
              </p>
            )}
          </div>

          {/* Observações / Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Acesso exclusivo da gerência"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>
              Ao alterar, o novo login e senha entrarão em vigor imediatamente para todas as sessões administrativas.
            </span>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleCopyNewCredentials}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Credenciais</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
