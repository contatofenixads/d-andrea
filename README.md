# D’Andrea Company — site industrial
+
+Adaptação do site clonado para o conteúdo público de https://dandrea.com.br/.
+
+## Editar conteúdo
+`content/site.json` contém as 4 categorias, 24 soluções, descrições completas, imagens, contatos e todos os blocos da história da D’Andrea.
+`scripts/build.py` gera as páginas estáticas mantendo a composição industrial da referência (cabeçalho, hero com formulário, destaque em abas, catálogo, categorias, história e contato).
+`dist/assets/dandrea.css` controla o visual. As fontes da referência foram mantidas.
+`dist/assets/dandrea.js` controla navegação, abas, filtros, busca, ampliação de imagens e formulários.
+
+Após editar o conteúdo: `python scripts/build.py`.
+Prévia: `python -m http.server 8765 --directory dist`.
+
+## Escopo
+39 páginas: início, catálogo geral, 24 detalhes de soluções, 4 categorias (mais aliases da origem), história e contato (mais aliases).
+Conteúdo fonte em português: início, história, conversão de papel, embalagens, tissue, complementares e contato.
+As imagens foram armazenadas em `dist/media`. Vídeos direcionam ao canal oficial usado no site fonte. Telefones e endereços foram copiados como publicados.
+As páginas antigas da marca anterior redirecionam para o catálogo, história ou contato.
+
+## Limitações verificadas
+O link de política de privacidade do site fonte retorna HTTP 404; o texto não foi inventado. O link oficial foi mantido no rodapé.
+Os formulários permanecem demonstrativos, sem armazenamento, envio de dados ou confirmação falsa de envio. A integração com recebimento comercial depende de configuração futura.
+Foram removidas as alegações, avaliações, clientes, catálogo e contatos da empresa anterior.
+O layout foi adaptado ao conteúdo real: seções sem equivalente na D’Andrea foram substituídas por soluções, história e contatos.
+