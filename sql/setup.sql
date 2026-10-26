-- =====================================================================
-- ShoeFlow 2 — configuração do Supabase
-- Cole no Supabase: SQL Editor > New query > Run.
-- SEGURO: este script só CRIA coisas novas. Ele não apaga, não altera
-- e não reescreve nenhum dado da tabela "itens".
-- Pode ser executado mais de uma vez sem problema.
-- =====================================================================

-- 1) Perfis de acesso (admin / loja), ligados aos usuários do Supabase Auth
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nome text,
  papel text not null default 'loja' check (papel in ('admin', 'loja')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

-- Função auxiliar: o usuário logado é admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'admin' and ativo
  );
$$;

drop policy if exists "perfis: ver o proprio ou admin ve todos" on public.perfis;
create policy "perfis: ver o proprio ou admin ve todos"
  on public.perfis for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "perfis: admin atualiza" on public.perfis;
create policy "perfis: admin atualiza"
  on public.perfis for update
  using (public.is_admin())
  with check (public.is_admin());

-- Cria o perfil automaticamente quando um usuário é adicionado (papel inicial: loja)
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, email, nome, papel)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)), 'loja')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- Cria perfil para usuários que já existiam antes deste script
insert into public.perfis (id, email, nome)
select u.id, u.email, split_part(u.email, '@', 1)
from auth.users u
on conflict (id) do nothing;

-- 2) Tempo real na tabela itens (só liga a transmissão de alterações; não mexe nos dados)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'itens'
  ) then
    alter publication supabase_realtime add table public.itens;
  end if;
end $$;

-- 3) Pasta de fotos (Storage). Leitura pública, envio só por usuário logado.
insert into storage.buckets (id, name, public)
values ('calcados', 'calcados', true)
on conflict (id) do nothing;

drop policy if exists "calcados: leitura publica" on storage.objects;
create policy "calcados: leitura publica"
  on storage.objects for select
  using (bucket_id = 'calcados');

drop policy if exists "calcados: envio logado" on storage.objects;
create policy "calcados: envio logado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'calcados');

-- =====================================================================
-- 4) DEFINIR O PRIMEIRO ADMINISTRADOR
-- Depois de criar seu usuário em Authentication > Users > Add user,
-- troque o e-mail abaixo, tire os dois traços do início e execute:
--
-- update public.perfis set papel = 'admin' where email = 'seu-email@exemplo.com';
-- =====================================================================

-- =====================================================================
-- 5) (OPCIONAL — LEIA ANTES) BLINDAR A TABELA ITENS
-- Hoje a tabela "itens" aceita leitura e escrita com a chave pública,
-- então quem tiver a chave consegue alterar dados sem login.
-- O bloco abaixo exige login para ler/escrever e PROÍBE delete para todos.
-- ATENÇÃO: se o seu site antigo acessa o banco sem login, ele vai parar
-- de funcionar depois disso. Só execute quando migrar tudo para o ShoeFlow 2.
--
-- alter table public.itens enable row level security;
-- drop policy if exists "itens: ler logado" on public.itens;
-- create policy "itens: ler logado" on public.itens for select to authenticated using (true);
-- drop policy if exists "itens: inserir logado" on public.itens;
-- create policy "itens: inserir logado" on public.itens for insert to authenticated with check (true);
-- drop policy if exists "itens: alterar logado" on public.itens;
-- create policy "itens: alterar logado" on public.itens for update to authenticated using (true) with check (true);
-- (Sem política de DELETE = ninguém consegue apagar linhas.)
-- =====================================================================
