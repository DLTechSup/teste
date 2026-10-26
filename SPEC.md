# ShoeFlow 2 — Especificação

## Objetivo
Sistema web para o fluxo de cadastro de calçados entre o **escritório (admin)** e a **loja (equipe remota)**:
admin cadastra marca/referência/foto → loja informa o código de cada referência → admin finaliza →
controle de Site e Atacado, pendências de fotos, relatórios.

## Regra nº 1 — nada é apagado
- O banco é a tabela `itens` (colunas `id`, `doc` jsonb, `atualizado`) já usada pelo site existente.
- O app **nunca** chama `delete`. "Arquivar" grava `doc.arquivado = true`; "Restaurar" grava `false`.
- Toda alteração lê o `doc` atual e grava `{...docAtual, ...camposAlterados}` — campos que o app não conhece são preservados.
- Itens marcados pelo sistema antigo (`deletado`, `removido`, `status: 'excluido'`) aparecem em **Arquivados** e podem ser restaurados.
- `sql/setup.sql` só **cria** coisas (tabela `perfis`, realtime, bucket de fotos). Não altera nem remove dados de `itens`.

## Formato do doc (compatível com o sistema antigo)
`marca, ref, codigo, status ('pendente'|'respondido'|'feito'), fotos[], obs, nota, notaPainel, motivoFoto,
faltamCores, preco, sentToSite, sentToAtacado, criado, cadastradoEm, respondidoEm, feitoEm, visto`
Campos novos (aditivos): `statusFotos`, `ignorarPendencia`, `arquivado`, `arquivadoEm`, `atualizadoPor`.

## Perfis
- **admin**: tudo.
- **loja**: vê marcas aguardando código e pendências; envia código + observação.
- Login com Supabase Auth (e-mail/senha). Papel guardado na tabela `perfis`.

## Telas
Admin: Painel (dashboard) · Cadastro · Códigos recebidos · Aguardando código · Pendências · Finalizados (Site/Atacado) · Arquivados · Equipe.
Loja: Enviar códigos (por marca) · Pendências.

## Novidades
- Tempo real (Supabase Realtime): código enviado pela loja aparece na hora no admin, com aviso e som.
- Dashboard: indicadores, códigos por semana, situação por marca, tempo médio até o código.
- Relatórios em página de impressão (salvar como PDF pelo navegador).

## Tecnologia
HTML + CSS + JavaScript (módulos ES), sem build. supabase-js e Chart.js via CDN. Hospeda no GitHub Pages.
Modo demonstração: abrir com `?demo` usa dados fictícios em memória (não toca no banco).
