# ShoeFlow 2

Sistema de cadastro de calçados entre **escritório (admin)** e **loja**: o escritório cadastra, a loja informa o código, o escritório finaliza e controla Site/Atacado. Tudo ao vivo.

Feito em HTML + CSS + JavaScript puro. **Não precisa de npm, build nem Node** — é só subir os arquivos.

## Ver funcionando agora (sem tocar no banco)
Abra o `index.html` por um servidor (ou já no GitHub Pages) com `?demo` no fim do endereço:
`https://SEU-USUARIO.github.io/shoeflow/?demo`
Entre como administrador ou como loja. Os dados são fictícios e o banco real não é usado.

## Colocar no ar com o seu banco (uma vez só)

1. **Supabase → SQL Editor**: cole todo o conteúdo de `sql/setup.sql` e clique em *Run*.
   Ele só cria coisas novas (tabela de perfis, tempo real e pasta de fotos). **Não altera nem apaga nada da tabela `itens`.**
2. **Supabase → Authentication → Users → Add user**: crie o seu usuário (e-mail e senha).
3. Volte ao SQL Editor e rode, trocando o e-mail:
   `update public.perfis set papel = 'admin' where email = 'seu-email@exemplo.com';`
4. **GitHub**: suba esta pasta num repositório e ative o GitHub Pages (branch `main`, pasta raiz).
5. Entre com seu e-mail e senha. Na tela **Equipe** você cria o acesso da loja.
   (Para criar acessos pela tela, o cadastro por e-mail precisa estar ativado no Supabase; se ele exigir confirmação, a pessoa recebe um e-mail.)

## Garantias sobre os dados
- O sistema **nunca apaga** nada. "Arquivar" só marca o item; ele vai para **Arquivados** e pode ser restaurado.
- Itens que o sistema antigo marcou como excluídos aparecem em **Arquivados** — nada sumiu.
- Cada alteração lê o registro atual e grava só os campos mudados; campos que o site antigo usa são preservados.
- O site antigo continua funcionando junto, lendo o mesmo banco.

## Segurança (importante)
Hoje a tabela `itens` aceita escrita com a chave pública do Supabase, ou seja, o login protege a **tela**, mas não o **banco**.
O final do `sql/setup.sql` tem um bloco opcional (comentado) que exige login no banco e proíbe delete para todos.
Só rode esse bloco quando o site antigo não for mais usado, porque ele deixaria de conseguir acessar o banco.

## O que tem
| Admin | Loja |
|---|---|
| Painel com indicadores e gráficos | Marcas aguardando código, com progresso |
| Cadastro com fila, foto arrastar/colar, aviso de referência repetida | Digitar código e **Enter** já vai para o próximo |
| Códigos recebidos → "Feito" | Avisar falta de fotos e mandar observação |
| Aguardando código, Pendências (2 tipos), Finalizados com Site/Atacado | Pendências para responder |
| Relatórios para imprimir/salvar em PDF | Aviso na hora quando o escritório cadastra |
| Arquivados (restaurar) e Equipe (papéis e acessos) | |

Tempo real: quando a loja envia um código, aparece um aviso com som no painel do admin na hora.

## Arquivos
```
index.html          página única
css/app.css         visual (claro/escuro), animações
js/app.js           sessão, rotas, tempo real
js/regras.js        regras de negócio (pendências, atacado...) — testadas
js/db.js            acesso ao Supabase (sem nenhum delete)
js/demo.js          dados fictícios do modo ?demo
js/views/           telas
js/config.js        endereço e chave do Supabase, nome da loja
sql/setup.sql       configuração do banco (só aditiva)
tests/              testes das regras: node --test tests/
```
