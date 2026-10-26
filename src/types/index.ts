export type PhotoStatus =
  | 'Não tenho nenhuma foto'
  | 'Faltam as fotos'
  | 'Ja tenho as fotos'
  | 'Somente foto de Capa';

export type AppViewMode = 'store' | 'admin' | 'pendencias' | 'gestao_backup';

export interface SupabaseSyncState {
  connected: boolean;
  count: number;
  lastSync?: string;
  isSyncing: boolean;
  error?: string | null;
}

export type PendencyType = 'with_code_missing_photos' | 'missing_code_and_photos';

export type ProductLifecycle =
  | 'draft'          // Em fila de cadastro do administrador antes de enviar à Home
  | 'waiting_code'   // Enviado à Home esperando a loja/equipe enviar o código
  | 'code_received'  // A loja enviou o código, aguardando administrador processar
  | 'completed';     // Administrador clicou em Feito -> foi para o histórico e produtos finalizados

export interface Product {
  id: string;
  brand: string;           // Marca (ex: Beira Rio, Moleca, Vizzano)
  reference: string;       // Referência do calçado (ex: 8320-100)
  price?: number;          // Valor no sistema Bling (R$) - Opcional, só aparece quando informado
  photoUrl: string;        // Foto principal do calçado
  photoStatus: PhotoStatus;// Status das fotos
  observation: string;     // Observações adicionais
  status: ProductLifecycle;
  
  // Cores faltantes quando photoStatus === 'Faltam as fotos'
  missingColors?: string;

  // Informações de código
  submittedCode?: string;
  submittedAt?: string;
  storeObservation?: string; // Observação enviada pela loja junto com o código
  
  // Lembrete e Atacado
  sentToSite: boolean;     // Enviado ao Site
  sentToAtacado: boolean;  // Enviado ao Atacado (se não marcado e sentToSite for true/ativo -> falta atacado)
  
  // Condição especial: código recebido, mas mandaram só 1 foto de estoque
  codeReceivedMissingPhotos?: boolean;
  
  createdAt: string;
  completedAt?: string;
}

export interface AppNotification {
  id: string;
  type: 'code_submitted' | 'product_completed' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  productId?: string;
}

export interface ScreenAlert {
  id: string;
  type: 'code_received' | 'pendency_responded';
  title: string;
  message: string;
  brand: string;
  reference: string;
  code?: string;
  timestamp: string;
  photoUrl?: string;
  productId?: string;
}

export type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'staff';
  createdAt: string;
  active: boolean;
  notes?: string;
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  exportedBy?: string;
  products: Product[];
  draftProducts: Product[];
  users?: UserAccount[];
}
