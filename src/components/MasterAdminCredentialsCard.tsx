import React, { useState } from 'react';
import {
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MasterAdminCredentialsCard: React.FC = () => {
  const { users, currentUser, updateUser } = useApp();

  // Encontra o usuário master ou o admin atual
  const masterUser =
    users.find((u) => u.id === 'user-admin-master') ||
    users.find((u) => u.role === 'admin') ||
    currentUser;

  const [username, setUsername] = useState(masterUser?.username || 'admin');
  const [password, setPassword] = useState(masterUser?.password || '123');
  const [confirmPassword, setConfirmPassword] = useState(masterUser?.password || '123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);

  if (!masterUser) {
    return null;
  }

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

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

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

    // Verifica se outro usuário já usa esse username (excluindo o próprio master)
    const existsOther = users.some(
      (u) => u.id !== masterUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (existsOther) {
      setErrorMessage(`O login "${cleanUsername}" já está em uso por outro usuário.`);
      return;
    }

    // Atualiza o cadastro
    updateUser(masterUser.id, {
      username: cleanUsername,
      password: cleanPassword,
    });

    setSuccessMessage(
      `Login e senha do Administrador Master alterados com sucesso! Novo login: "${cleanUsername}".`
    );
    setTimeout(() => {
      setSuccessMessage('');
    }, 6000);
  };

  const handleCopyNewCredentials = async () => {
    const text =
      `🔐 *Credenciais Atualizadas - Administrador Master*\n\n` +
      `👤 *Login:* ${username.trim().toLowerCase()}\n` +
      `🔑 *Senha:* ${password.trim()}\n` +
      `🛡️ *Perfil:* Administrador Geral\n\n` +
      `Guarde em local seguro para acessar o painel de gestão.`;

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
    <div className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-6 shadow-md relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Segurança Master
              </span>
              <span className="text-xs text-slate-400">Conta Principal</span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              Alterar Login e Senha do Administrador Master
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyNewCredentials}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Copiar credenciais atuais do Admin Master"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Credenciais</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
        Aqui você pode redefinir o usuário de login e a senha do Administrador Master para manter
        o sistema sempre protegido. Quando alterar, o novo acesso entrará em vigor imediatamente.
      </p>

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Novo Login */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Novo Login de Acesso (Usuário)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Ex: admin, master, gestor"
                className="w-full pl-8 pr-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Atual: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">@{masterUser.username}</span>
            </p>
          </div>

          {/* Nova Senha */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Nova Senha
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Gerar segura
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
              Atual: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{masterUser.password}</span>
            </p>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirmar Nova Senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite novamente a nova senha"
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] font-bold text-rose-500 mt-1">
                As senhas digitadas não conferem.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>Guarde suas novas credenciais para não perder o acesso de administrador.</span>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Salvar Novo Login e Senha
          </button>
        </div>
      </form>
    </div>
  );
};
