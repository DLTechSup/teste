# ShoeFlow 2

Sistema de cadastro de calçados entre **escritório (admin)** e **loja**: o escritório cadastra, a loja informa o código, o escritório finaliza e controla Site/Atacado. Tudo ao vivo.

Feito em HTML + CSS + JavaScript puro. **Não precisa de npm, build nem Node** — é só subir os arquivos.

## Como funciona
- **Loja:** o endereço abre direto na página da loja, **sem login**. Ela vê os modelos aguardando código (foto, campo de código e campo de observação) e um alerta fixo com as pendências.
- **Administração:** botão "Administração" no topo → pede **e-mail e senha**.

## Ver funcionando agora (sem tocar no banco)
Abra com `?demo` no fim do endereço, por exemplo `https://SEU-USUARIO.github.io/shoeflow/?demo`.
Os dados são fictícios e o banco real não é usado.

## Colocar no ar com o seu banco (uma vez só)

1. **Supabase → SQL Editor**: cole todo o conteúdo de `sql/setup.sql` e clique em *Run*.
   Ele só cria coisas novas (tabela de perfis, tempo real e pasta de fotos). **Não altera nem apaga nada da tabela `itens`.**
2. **Supabase → Authentication → Users → Add user**: crie o seu usuário de administrador (e-mail e senha).
3. Volte ao SQL Editor e rode, trocando o e-mail:
   `update public.perfis set papel = 'admin' where email = 'seu-email@exemplo.com';`
4. **GitHub**: suba esta pasta num repositório e ative o GitHub Pages (branch `main`, pasta raiz).
5. Para outros administradores, use a tela **Equipe** e mude o acesso para "Administrador".

## Garantias sobre os dados
- O sistema **nunca apaga** nada. "Arquivar" só marca o item; ele vai para **Arquivados** e pode ser restaurado.
- Itens que o sistema antigo marcou como excluídos aparecem em **Arquivados** — nada sumiu.
- Cada alteração lê o registro atual e grava só os campos mudados; campos que o site antigo usa são preservados.
- O site antigo continua funcionando junto, lendo o mesmo banco.

## Segurança
Como a loja entra sem login, a tabela `itens` continua aceitando leitura e alteração pela chave pública (igual ao site antigo).
O item 5 do `sql/setup.sql` (recomendado) **proíbe apagar linhas** no próprio banco, para qualquer sistema. Ele não muda nenhum dado.

## O que tem
| Admin (com login) | Loja (sem login) |
|---|---|
| Painel com indicadores e gráficos | Todos os modelos aguardando código, com foto, código e observação |
| Cadastro com fila, campo Modelo, foto arrastar/colar, aviso de referência repetida | Digitar código e **Enter** já vai para o próximo |
| Códigos recebidos em destaque — **clique no código para copiar** | Alerta fixo de pendências no topo |
| Aguardando código = tudo que você enviou e ainda não tem código | Pendências: sem código e sem fotos / com código faltando fotos |
| Relatórios com **foto, marca, modelo e referência** (imprimir ou salvar PDF) | Filtro por marca e busca por referência |
| Pendências, Finalizados com Site/Atacado, Arquivados, Equipe | Aviso na hora quando o escritório cadastra |

Modelos cadastrados como "Nenhuma foto", "Somente foto de capa" ou "Faltam fotos" vão direto para as **Pendências** da loja.

Tempo real: quando a loja envia um código, aparece um aviso com som no painel do admin na hora.

## Arquivos
```
index.html          página única
img/                logo da Calçados 24h (fundo claro e escuro)
css/app.css         visual (claro/escuro), animações
js/app.js           sessão, rotas, tempo real
js/regras.js        regras de negócio (pendências, atacado...) — testadas
js/db.js            acesso ao Supabase (sem nenhum delete)
js/demo.js          dados fictícios do modo ?demo
js/views/           telas
js/config.js        endereço e chave do Supabase, nome da loja
sql/setup.sql       configuração do banco (só aditiva)
tests/              testes das regras: node --test tests/regras.test.mjs
```
