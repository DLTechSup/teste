import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Key,
  Shield,
  Store,
  Copy,
  Check,
  Trash2,
  Lock,
  UserCheck,
  UserX,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Edit2,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserAccount } from '../types';
import { MasterAdminCredentialsCard } from './MasterAdminCredentialsCard';
import { AdminEditModal } from './AdminEditModal';

export const AdminUsersTab: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser } = useApp();
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [lastCreatedUser, setLastCreatedUser] = useState<UserAccount | null>(null);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Gerador de senha amigável
  const handleGeneratePassword = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let pass = '';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  // Copia as credenciais formatadas para WhatsApp
  const handleCopyCredentials = async (user: UserAccount) => {
    const roleText = user.role === 'admin' ? 'Administrador' : 'Equipe da Loja (Operador)';
    const text = 
      `👞 *Calçados 24h - Acesso ao Sistema*\n\n` +
      `Olá ${user.name}, segue o seu acesso para envio e consulta de códigos de calçados:\n\n` +
      `👤 *Nome:* ${user.name}\n` +
      `🔑 *Login:* ${user.username}\n` +
      `🔒 *Senha:* ${user.password}\n` +
      `🛡️ *Perfil:* ${roleText}\n\n` +
      `Acesse a plataforma pelo navegador no link da loja.`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedUserId(user.id);
      setTimeout(() => setCopiedUserId(null), 3000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedUserId(user.id);
      setTimeout(() => setCopiedUserId(null), 3000);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Informe o nome da pessoa ou da filial.');
      return;
    }
    if (!username.trim()) {
      setFormError('Informe o login de acesso.');
      return;
    }
    if (!password.trim()) {
      setFormError('Informe ou gere uma senha para o usuário.');
      return;
    }

    const cleanUser = username.trim().toLowerCase();
    const alreadyExists = users.some((u) => u.username.toLowerCase() === cleanUser);
    if (alreadyExists) {
      setFormError(`O login "${cleanUser}" já está em uso por outro usuário.`);
      return;
    }

    const created = addUser({
      name: name.trim(),
      username: cleanUser,
      password: password.trim(),
      role,
      active: true,
      notes: notes.trim() || undefined,
    });

    setLastCreatedUser(created);
    setName('');
    setUsername('');
    setPassword('');
    setNotes('');
    setRole('staff');
  };

  const handleDelete = (user: UserAccount) => {
    if (user.id === 'user-admin-master') {
      alert('O Administrador Master original não pode ser excluído.');
      return;
    }

    if (window.confirm(`Deseja realmente remover o usuário "${user.name}" (${user.username})?`)) {
      deleteUser(user.id);
      if (lastCreatedUser?.id === user.id) {
        setLastCreatedUser(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Controle de Acesso
            </span>
            <span className="text-xs text-indigo-300">• Exclusivo do Administrador</span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Gestão de Usuários & Equipes
          </h3>
          <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
            Crie acessos para funcionários da loja ou outros administradores. 
            Você define o login e a senha e clica em <strong>&ldquo;Copiar Credenciais&rdquo;</strong> para enviar diretamente por WhatsApp para a pessoa.
          </p>
        </div>
      </div>

      {/* Card Especial de Alteração de Login e Senha do Master Admin */}
      <MasterAdminCredentialsCard />

      {/* Grid: Formulário de Criação + Card de Último Criado */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Novo Usuário */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Cadastrar Novo Usuário
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preencha os dados e gere a senha para enviar à pessoa
              </p>
            </div>
          </div>

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome da Pessoa ou Filial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos - Filial Centro"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Login de Usuário <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="Ex: carlos.loja"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Senha de Acesso <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Gerar Automática
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite ou clique em gerar"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nível de Acesso (Perfil)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="staff">🏪 Equipe da Loja (Envio de códigos e consulta)</option>
                  <option value="admin">🛡️ Administrador (Acesso total ao Painel)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Observações internas (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Turno da manhã, Filial Shopping, etc."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Criar Usuário & Habilitar Acesso
              </button>
            </div>
          </form>
        </div>

        {/* Card Lateral de Feedback do Último Usuário Criado */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Envio Imediato
              </h4>
            </div>

            {lastCreatedUser ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Usuário criado com sucesso!</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                    Copie as credenciais abaixo e envie diretamente para a pessoa via WhatsApp.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Nome:</span>
                    <p className="font-bold text-slate-900 dark:text-white">{lastCreatedUser.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Login:</span>
                    <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{lastCreatedUser.username}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Senha:</span>
                    <p className="font-mono font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 inline-block">
                      {lastCreatedUser.password}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCredentials(lastCreatedUser)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    copiedUserId === lastCreatedUser.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 dark:shadow-none'
                  }`}
                >
                  {copiedUserId === lastCreatedUser.id ? (
                    <>
                      <Check className="w-4 h-4" /> Credenciais Copiadas!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copiar para WhatsApp
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                <Info className="w-8 h-8 mx-auto stroke-1 mb-2" />
                <p className="text-xs">
                  Quando você cadastrar um usuário, o botão de copiar mensagem pronta para WhatsApp aparecerá aqui.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            Total cadastrado: <strong>{users.length}</strong> conta(s) ativas no sistema.
          </div>
        </div>
      </div>

      {/* Lista de Usuários Cadastrados */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Usuários Autorizados no Sistema
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie quem pode enviar códigos e acessar a administração
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Usuário / Nome</th>
                <th className="py-2.5 px-3">Login</th>
                <th className="py-2.5 px-3">Senha</th>
                <th className="py-2.5 px-3">Perfil</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Cadastrado em</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const isMaster = u.id === 'user-admin-master';
                const isCopied = copiedUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                            u.role === 'admin'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {u.name.substring(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {u.name}
                          </span>
                          {u.notes && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                              {u.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                      @{u.username}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {u.password}
                    </td>

                    <td className="py-3 px-3">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <Store className="w-3 h-3" /> Loja
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <button
                        type="button"
                        disabled={isMaster}
                        onClick={() => updateUser(u.id, { active: !u.active })}
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          u.active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                        title={isMaster ? 'Admin Master sempre ativo' : 'Clique para alternar'}
                      >
                        {u.active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {u.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-600"
                          title={u.role === 'admin' ? 'Editar Administrador e Senha' : 'Editar Usuário e Senha'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyCredentials(u)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600'
                          }`}
                          title="Copiar dados formatados para WhatsApp"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Copiar Acesso</span>
                            </>
                          )}
                        </button>

                        {!isMaster && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Remover usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição de Usuário / Administrador */}
      {editingUser && (
        <AdminEditModal
          isOpen={Boolean(editingUser)}
          targetUser={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};
