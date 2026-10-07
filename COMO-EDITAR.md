# Como editar o site (vinikautor.com.br/admin)

## Ativar o painel (só uma vez)
1. GitHub → foto do perfil → Settings → Developer settings → OAuth Apps → New OAuth App
   - Application name: Painel Vinik
   - Homepage URL: https://vinikautor.com.br
   - Authorization callback URL: https://api.netlify.com/auth/done
   Clique em Register application, copie o Client ID e gere um Client secret (copie também).
2. Netlify → projeto vinikautor → Project configuration → Access & security → OAuth → Install provider → GitHub → cole os dois códigos.
3. Abra vinikautor.com.br/admin e entre com o GitHub.

## O que dá para mudar no painel
- Páginas › Página inicial: foto do topo, botões, números, ORDEM e VISIBILIDADE das seções, títulos e textos, trailer, bloco do autor.
- Páginas › Sobre, Contato, Notícias (topo), Assinatura.
- Livros: editar os livros e CRIAR livros novos (cada um ganha página própria, entra no menu, na inicial e no rodapé).
- Conteúdo › Próximos lançamentos, Notícias, Avaliações, Prêmios.
- Configurações gerais: letreiro amarelo, cores, redes sociais, rodapé, textos do Google.

Formatação nos textos: *itálico*, **negrito**, [texto](link). Linha em branco = novo parágrafo.
Depois de clicar em Publicar, o site se atualiza em 1 a 2 minutos.

## Mudanças grandes (layout novo, seções novas)
Peça ao Claude. Ele manda um zip; descompacte e suba TUDO no GitHub (Add file → Upload files → Commit changes).
Arquivos com o mesmo nome são substituídos. A pasta content/ guarda o que você editou no painel —
se o zip novo trouxer content/, confira antes para não voltar textos antigos (ou peça o zip sem content/).
