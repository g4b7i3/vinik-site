# Mundo Vinik (vinikautor.com.br/mundovinik)

App pessoal de escrita do Vinik: manuscrito, universo (fichas), enredo, diagramação, e-book e progresso.

## Como funciona
- `mundovinik/` é copiado para o site pelo `build.py`.
- `netlify/edge-functions/mundovinik-porteiro.js` pede a senha (a mesma do Estúdio) antes de abrir qualquer arquivo de `/mundovinik`. O aparelho fica liberado por 10 anos; o botão Sair, na Biblioteca, desliga.
- `netlify/functions/mundovinik-dados.mjs` guarda os livros no Netlify Blobs deste site (loja `mundovinik`) para sincronizar PC e celular. Não usa os bancos do Radar nem da Nexos.
- Cada aparelho guarda tudo também no navegador; sem internet, o app continua funcionando e sincroniza quando a conexão volta.
- Versões antigas dos capítulos (aba Versões) e ajustes de tela ficam só no aparelho.

## Revisão e furos com o Claude
`netlify/edge-functions/mundovinik-claude.js` chama a API do Claude. Para ligar:
1. Em https://console.anthropic.com, entre, ponha crédito em **Billing** e crie uma chave em **API Keys**. A API é cobrada à parte da assinatura do Claude.
2. Na Netlify, site vinikautor: **Site configuration → Environment variables → Add a variable**. Nome `ANTHROPIC_API_KEY`, valor: a chave.
3. **Deploys → Trigger deploy**.
Opcional: `CLAUDE_MODELO` troca o modelo (padrão `claude-sonnet-5-5`).

## Trocar a senha
Siga o ESTUDO-LEIA.md e troque `SAL` e `RESUMO` em `mundovinik-porteiro.js`, e o `RESUMO` também em `mundovinik-claude.js` e em `netlify/functions/mundovinik-dados.mjs`.
