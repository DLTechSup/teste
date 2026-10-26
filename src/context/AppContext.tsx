import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  AppViewMode,
  Product,
  AppNotification,
  ScreenAlert,
  PhotoStatus,
  UserAccount,
  BackupPayload,
  SupabaseSyncState,
} from '../types';
import { INITIAL_PRODUCTS } from '../utils/seedData';
import { isPendencyProduct } from '../utils/productUtils';
import {
  fetchProductsFromSupabase,
  saveProductToSupabase,
  insertProductToSupabase,
  deleteProductFromSupabase,
} from '../services/supabase';

interface AppContextType {
  products: Product[];
  draftProducts: Product[];
  notifications: AppNotification[];
  unreadCount: number;
  activeRole: AppViewMode;
  setActiveRole: (role: AppViewMode) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  
  // Alertas Flutuantes na Tela (Notificações em tempo real)
  screenAlerts: ScreenAlert[];
  dismissScreenAlert: (id: string) => void;
  triggerScreenAlert: (alert: Omit<ScreenAlert, 'id' | 'timestamp'>) => void;
  
  // Supabase Sincronização
  supabaseSyncState: SupabaseSyncState;
  refreshSupabase: () => Promise<void>;
  
  // Autenticação & Usuários
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password: string) => { success: boolean; message: string; user?: UserAccount };
  logout: () => void;
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => boolean;
  
  // Backup e Restauração
  exportBackup: () => void;
  importBackup: (jsonString: string) => { success: boolean; count: number; message: string };
  
  // Ações de rascunho / staging
  addDraftProduct: (item: Omit<Product, 'id' | 'createdAt' | 'status'>) => void;
  removeDraftProduct: (id: string) => void;
  commitDraftProducts: () => void;
  
  // Ações de código da equipe remota
  submitProductCode: (productId: string, code: string, storeObservation?: string) => void;
  
  // Ações do administrador
  markProductDone: (productId: string) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleSiteAtacado: (id: string, field: 'sentToSite' | 'sentToAtacado') => void;
  
  // Notificações
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Reset
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PRODUCTS = 'shoeflow_products_v1';
const STORAGE_KEY_DRAFTS = 'shoeflow_drafts_v1';
const STORAGE_KEY_NOTIFS = 'shoeflow_notifs_v1';
const STORAGE_KEY_THEME = 'shoeflow_theme_v1';
const STORAGE_KEY_USERS = 'shoeflow_users_v1';
const STORAGE_KEY_SESSION = 'shoeflow_session_v1';
const STORAGE_KEY_DELETED = 'shoeflow_deleted_product_ids_v1';

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-admin-master',
    name: 'Administrador Master',
    username: 'admin',
    password: '123',
    role: 'admin',
    createdAt: '2026-10-22T08:00:00Z',
    active: true,
    notes: 'Acesso principal ao painel de administração.',
  },
  {
    id: 'user-staff-loja',
    name: 'Equipe Loja / Filial',
    username: 'loja',
    password: '123',
    role: 'staff',
    createdAt: '2026-10-22T08:30:00Z',
    active: true,
    notes: 'Acesso padrão da filial para envio de códigos.',
  },
];

// Som de notificação sutil com Web Audio API
function playChime(type: 'success' | 'alert' | 'complete') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'complete') {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.24); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Silently continue if audio context is blocked
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Carrega produtos salvos ou inicializa
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return INITIAL_PRODUCTS;
  });

  // Fila de cadastro (staging)
  const [draftProducts, setDraftProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return [];
  });

  // Notificações
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return [
      {
        id: 'notif-init-1',
        type: 'code_submitted',
        title: 'Código recebido!',
        message: 'A filial enviou o código para a referência 6288-100 da Vizzano.',
        timestamp: '2026-10-22T10:15:00Z',
        read: false,
        productId: 'prod-viz-1',
      },
      {
        id: 'notif-init-2',
        type: 'product_completed',
        title: 'Produto finalizado no site',
        message: 'Olympikus Corre-3 foi processado e já consta no catálogo ativo.',
        timestamp: '2026-10-21T10:05:00Z',
        read: true,
        productId: 'prod-oly-1',
      },
    ];
  });

  const [activeRole, setActiveRole] = useState<AppViewMode>('store');

  // Alertas visuais flutuantes em tempo real na tela
  const [screenAlerts, setScreenAlerts] = useState<ScreenAlert[]>([]);
  const knownCodesRef = useRef<Map<string, string>>(new Map());
  const isFirstLoadRef = useRef(true);

  // Registro de IDs excluídos pelo administrador para evitar ressuscitação após exclusão
  const deletedIdsRef = useRef<Set<string>>((() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DELETED);
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // Ignora erro
    }
    return new Set<string>();
  })());

  const dismissScreenAlert = (id: string) => {
    setScreenAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const triggerScreenAlert = (alertData: Omit<ScreenAlert, 'id' | 'timestamp'>) => {
    const newAlert: ScreenAlert = {
      ...alertData,
      id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
    };
    setScreenAlerts((prev) => [newAlert, ...prev]);
    playChime('success');

    // Auto-remove após 9 segundos
    setTimeout(() => {
      dismissScreenAlert(newAlert.id);
    }, 9000);
  };

  // Estado de sincronização com o banco de dados Supabase
  const [supabaseSyncState, setSupabaseSyncState] = useState<SupabaseSyncState>({
    connected: false,
    count: 0,
    isSyncing: true,
    error: null,
  });

  const refreshSupabase = async () => {
    try {
      setSupabaseSyncState((prev) => ({ ...prev, isSyncing: true }));
      const result = await fetchProductsFromSupabase();
      
      // Filtra produtos excluídos
      const activeProducts = result.products.filter((p) => !deletedIdsRef.current.has(p.id));

      if (!result.error && activeProducts.length > 0) {
        // Se não for a primeira carga inicial, verifica se chegaram novos códigos remotamente
        if (!isFirstLoadRef.current) {
          activeProducts.forEach((p) => {
            const code = (p.submittedCode || '').trim();
            const prevCode = knownCodesRef.current.get(p.id) || '';
            if (code && code !== prevCode) {
              const isPend = isPendencyProduct(p);
              triggerScreenAlert({
                type: isPend ? 'pendency_responded' : 'code_received',
                title: isPend
                  ? `Pendência ${p.brand} respondida!`
                  : `Código do produto ${p.brand} recebido!`,
                message: isPend
                  ? `Pendência do produto ${p.brand} (Ref: ${p.reference}) respondida! Código: "${code}".`
                  : `Código do produto ${p.brand} (Ref: ${p.reference}) recebido: "${code}".`,
                brand: p.brand,
                reference: p.reference,
                code,
                photoUrl: p.photoUrl,
                productId: p.id,
              });
            }
          });
        }

        // Atualiza mapa de códigos conhecidos
        const newMap = new Map<string, string>();
        activeProducts.forEach((p) => {
          if (p.submittedCode) {
            newMap.set(p.id, p.submittedCode.trim());
          }
        });
        knownCodesRef.current = newMap;
        isFirstLoadRef.current = false;

        setProducts(activeProducts);
        setSupabaseSyncState({
          connected: true,
          count: activeProducts.length,
          lastSync: new Date().toISOString(),
          isSyncing: false,
          error: null,
        });
      } else {
        setSupabaseSyncState((prev) => ({
          ...prev,
          connected: !result.error,
          count: activeProducts.length || prev.count,
          isSyncing: false,
          error: result.error,
        }));
      }
    } catch (e: any) {
      setSupabaseSyncState((prev) => ({
        ...prev,
        connected: false,
        isSyncing: false,
        error: e?.message || 'Falha na conexão',
      }));
    }
  };

  // Carrega produtos existentes do Supabase e agenda atualização periódica em tempo real
  useEffect(() => {
    refreshSupabase();

    const interval = setInterval(() => {
      refreshSupabase();
    }, 12000); // 12s para capturar respostas remotas de lojas

    return () => clearInterval(interval);
  }, []);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return false;
  });

  // Sincroniza tema dark no elemento html raiz
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(darkMode));
  }, [darkMode]);

  // Usuários do sistema
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return DEFAULT_USERS;
  });

  // Sessão atual do usuário
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return null;
  });

  // Persiste usuários
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  // Persiste sessão do usuário
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  }, [currentUser]);

  // Autenticação
  const login = (username: string, password: string) => {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    const found = users.find(
      (u) => u.username.toLowerCase() === trimmedUser && u.password === trimmedPass
    );

    if (!found) {
      return { success: false, message: 'Usuário ou senha incorretos.' };
    }

    if (!found.active) {
      return { success: false, message: 'Este usuário está inativo. Contate o administrador.' };
    }

    setCurrentUser(found);
    playChime('success');
    return { success: true, message: `Bem-vindo de volta, ${found.name}!`, user: found };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    if (activeRole === 'admin' || activeRole === 'gestao_backup') {
      setActiveRole('store');
    }
    playChime('alert');
  };

  const addUser = (userData: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      username: userData.username.trim().toLowerCase(),
    };
    setUsers((prev) => [...prev, newUser]);
    playChime('success');
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === id) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id: string): boolean => {
    // Impede deletar o admin master original
    if (id === 'user-admin-master') {
      return false;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      logout();
    }
    return true;
  };

  // Exportar Backup completo em JSON
  const exportBackup = () => {
    try {
      const payload: BackupPayload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser ? `${currentUser.name} (${currentUser.username})` : 'Administrador',
        products,
        draftProducts,
        users,
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateTag = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `calcados24h-backup-${dateTag}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const notif: AppNotification = {
        id: 'notif-' + Date.now(),
        type: 'system',
        title: 'Backup Exportado com Sucesso',
        message: `Arquivo baixado contendo ${products.length} produtos e ${users.length} usuários.`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
      playChime('complete');
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
    }
  };

  // Importar Backup JSON com restauração segura
  const importBackup = (jsonString: string): { success: boolean; count: number; message: string } => {
    try {
      const data = JSON.parse(jsonString) as Partial<BackupPayload>;
      if (!data || !Array.isArray(data.products)) {
        return {
          success: false,
          count: 0,
          message: 'Arquivo inválido. O formato do arquivo de backup não é compatível.',
        };
      }

      setProducts(data.products);
      if (Array.isArray(data.draftProducts)) {
        setDraftProducts(data.draftProducts);
      }
      if (Array.isArray(data.users) && data.users.length > 0) {
        setUsers(data.users);
      }

      const notif: AppNotification = {
        id: 'notif-' + Date.now(),
        type: 'system',
        title: 'Backup Restaurado com Sucesso',
        message: `${data.products.length} produtos foram restabelecidos com sucesso no sistema.`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
      playChime('complete');

      return {
        success: true,
        count: data.products.length,
        message: `Backup restaurado com sucesso! ${data.products.length} produtos e catálogo restabelecidos.`,
      };
    } catch {
      return {
        success: false,
        count: 0,
        message: 'Falha ao processar o arquivo. Verifique se é um arquivo .json válido.',
      };
    }
  };

  // Adiciona produto ao rascunho / fila de envio
  const addDraftProduct = (item: Omit<Product, 'id' | 'createdAt' | 'status'>) => {
    const newDraft: Product = {
      ...item,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setDraftProducts((prev) => [newDraft, ...prev]);
    playChime('success');
  };

  // Remove produto da fila de envio
  const removeDraftProduct = (id: string) => {
    setDraftProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Confirma e envia todos os produtos da fila à tela principal (Home)
  const commitDraftProducts = () => {
    if (draftProducts.length === 0) return;

    const activated: Product[] = draftProducts.map((p) => ({
      ...p,
      status: 'waiting_code',
      createdAt: new Date().toISOString(),
    }));

    setProducts((prev) => [...activated, ...prev]);
    setDraftProducts([]);

    // Salva com segurança cada novo item no Supabase
    activated.forEach((item) => {
      insertProductToSupabase(item).catch((err) => {
        console.warn('Erro ao inserir item no Supabase:', err);
      });
    });

    // Cria notificação informativa
    const notif: AppNotification = {
      id: 'notif-' + Date.now(),
      type: 'system',
      title: 'Produtos enviados à Home',
      message: `${activated.length} novo(s) produto(s) agora estão aguardando código na tela principal.`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
    playChime('complete');
  };

  // Envio de código pela loja/equipe remota
  const submitProductCode = (productId: string, code: string, storeObservation?: string) => {
    const existing = products.find((p) => p.id === productId);
    const targetBrand = existing?.brand || '';
    const targetRef = existing?.reference || '';
    const photoUrl = existing?.photoUrl;

    const updatedProduct: Product | undefined = existing
      ? {
          ...existing,
          status: 'code_received',
          submittedCode: code.trim(),
          submittedAt: new Date().toISOString(),
          storeObservation: storeObservation?.trim() || undefined,
        }
      : undefined;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            status: 'code_received',
            submittedCode: code.trim(),
            submittedAt: new Date().toISOString(),
            storeObservation: storeObservation?.trim() || undefined,
          };
        }
        return p;
      })
    );

    // Sincroniza atualização no banco Supabase
    if (updatedProduct) {
      saveProductToSupabase(updatedProduct).catch((err) => {
        console.warn('Erro ao sincronizar código no Supabase:', err);
      });
    }

    const obsText = storeObservation?.trim() ? ` Obs loja: "${storeObservation.trim()}"` : '';
    const isPend = updatedProduct ? isPendencyProduct(updatedProduct) : false;

    const alertTitle = isPend
      ? `Pendência ${targetBrand} respondida!`
      : `Código do produto ${targetBrand} recebido!`;
    const alertMessage = isPend
      ? `Pendência do calçado ${targetBrand} (Ref: ${targetRef}) respondida! Código das fotos: "${code.trim()}".${obsText}`
      : `Código do calçado ${targetBrand} (Ref: ${targetRef}) recebido: "${code.trim()}".${obsText}`;

    // Alerta visual flutuante na tela (Toast)
    triggerScreenAlert({
      type: isPend ? 'pendency_responded' : 'code_received',
      title: alertTitle,
      message: alertMessage,
      brand: targetBrand,
      reference: targetRef,
      code: code.trim(),
      photoUrl,
      productId,
    });

    // Notificação persistente no sino do topo
    const notif: AppNotification = {
      id: 'notif-' + Date.now(),
      type: 'code_submitted',
      title: alertTitle,
      message: alertMessage,
      timestamp: new Date().toISOString(),
      read: false,
      productId,
    };
    setNotifications((prev) => [notif, ...prev]);
    playChime('success');
  };

  // Administrador marca produto como Feito
  const markProductDone = (productId: string) => {
    let targetBrand = '';
    let targetRef = '';
    let targetProduct: Product | null = null;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          targetBrand = p.brand;
          targetRef = p.reference;
          const updated: Product = {
            ...p,
            status: 'completed',
            completedAt: new Date().toISOString(),
          };
          targetProduct = updated;
          return updated;
        }
        return p;
      })
    );

    // Sincroniza marcação de finalizado no banco Supabase
    if (targetProduct) {
      saveProductToSupabase(targetProduct).catch((err) => {
        console.warn('Erro ao sincronizar status feito no Supabase:', err);
      });
    }

    // Notificação para a tela principal / home
    const notif: AppNotification = {
      id: 'notif-' + Date.now(),
      type: 'product_completed',
      title: 'Produto finalizado pelo Administrador',
      message: `${targetBrand} (${targetRef}) foi marcado como Feito e enviado ao site e histórico!`,
      timestamp: new Date().toISOString(),
      read: false,
      productId,
    };
    setNotifications((prev) => [notif, ...prev]);
    playChime('complete');
  };

  // Edição completa de qualquer produto
  const updateProduct = (id: string, updates: Partial<Product>) => {
    let targetProduct: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          targetProduct = updated;
          return updated;
        }
        return p;
      })
    );

    if (targetProduct) {
      saveProductToSupabase(targetProduct).catch((err) => {
        console.warn('Erro ao atualizar produto no Supabase:', err);
      });
    }
  };

  // Exclusão definitiva: remove localmente, persiste no filtro e atualiza no banco Supabase
  const deleteProduct = (id: string) => {
    deletedIdsRef.current.add(id);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(Array.from(deletedIdsRef.current)));
    } catch {
      // Ignora erro
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));

    deleteProductFromSupabase(id).catch((err) => {
      console.warn('Erro ao deletar produto no Supabase:', err);
    });
  };

  // Toggle rápido Site e Atacado
  const toggleSiteAtacado = (id: string, field: 'sentToSite' | 'sentToAtacado') => {
    let targetProduct: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: !p[field] };
          targetProduct = updated;
          return updated;
        }
        return p;
      })
    );

    if (targetProduct) {
      saveProductToSupabase(targetProduct).catch((err) => {
        console.warn('Erro ao alternar atacado no Supabase:', err);
      });
    }
  };

  // Notificações
  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Reset para demonstração limpa
  const resetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setDraftProducts([]);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_DRAFTS);
    playChime('alert');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        products,
        draftProducts,
        notifications,
        unreadCount,
        activeRole,
        setActiveRole,
        darkMode,
        setDarkMode,
        supabaseSyncState,
        refreshSupabase,
        currentUser,
        users,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        exportBackup,
        importBackup,
        addDraftProduct,
        removeDraftProduct,
        commitDraftProducts,
        submitProductCode,
        markProductDone,
        updateProduct,
        deleteProduct,
        toggleSiteAtacado,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
        screenAlerts,
        dismissScreenAlert,
        triggerScreenAlert,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
