# Mundo Vinik (vinikautor.com.br/mundovinik)

App pessoal de escrita do Vinik: manuscrito, universo (fichas), enredo, diagramação, e-book e progresso.

## Como funciona
- `mundovinik/` é copiado para o site pelo `build.py`.
- `netlify/edge-functions/mundovinik-porteiro.js` pede a senha antes de abrir qualquer arquivo de `/mundovinik`. A senha é só do Mundo Vinik (não é a do Estúdio). O aparelho fica liberado por 10 anos; o botão Sair, na Biblioteca, desliga.
- Na primeira vez, o app abre na tela `nova-senha.html` para criar a senha. Ela fica guardada como resumo (sem volta) no Netlify Blobs, loja `mundovinik`, chave `acesso`.
- `netlify/functions/mundovinik-dados.mjs` guarda os livros no Netlify Blobs deste site (loja `mundovinik`) para sincronizar PC e celular. Não usa os bancos do Radar nem da Nexos.
- Cada aparelho guarda tudo também no navegador; sem internet, o app continua funcionando e sincroniza quando a conexão volta.
- Versões antigas dos capítulos (aba Versões) e ajustes de tela ficam só no aparelho.

## Revisão e furos com o Claude
`netlify/edge-functions/mundovinik-claude.js` chama a API do Claude. Para ligar:
1. Em https://console.anthropic.com, entre, ponha crédito em **Billing** e crie uma chave em **API Keys**. A API é cobrada à parte da assinatura do Claude.
2. Na Netlify, site vinikautor: **Site configuration → Environment variables → Add a variable**. Nome `ANTHROPIC_API_KEY`, valor: a chave.
3. **Deploys → Trigger deploy**.
Opcional: `CLAUDE_MODELO` troca o modelo (padrão `claude-sonnet-5-5`).

## Trocar ou recuperar a senha
- Trocar: Biblioteca → Trocar senha (pede a atual).
- Esqueceu: apague a chave `acesso` da loja `mundovinik` no Netlify Blobs (painel da Netlify → Blobs, ou peça ao Claude). O app volta a abrir na tela de criar senha. Os livros não são apagados.
