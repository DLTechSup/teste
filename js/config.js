// Configuração do banco (Supabase). A chave "anon" é pública por natureza;
// a segurança real vem do login e das regras (RLS) configuradas em sql/setup.sql.
export const SUPABASE_URL = 'https://pknrpljdwegytzprcoqw.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbnJwbGpkd2VneXR6cHJjb3F3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNzc4NTMsImV4cCI6MjEwNTk1Mzg1M30.wO7ASjzwoY2m-dzCLnKHfszRbjoVsZiPmhC73PCLGjM';

export const TABELA = 'itens';
export const BUCKET_FOTOS = 'calcados';
export const NOME_LOJA = 'Calçados 24h';
