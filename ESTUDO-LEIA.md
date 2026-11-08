# Estúdio (vinikautor.com.br/estudo)

Página privada com os apps de estudo do Vinik. Não aparece no menu, no sitemap nem no Google.

## Como funciona
- `estudo/` é copiado para o site pelo `build.py`.
- `netlify/edge-functions/estudo-porteiro.js` pede a senha antes de entregar qualquer arquivo de `/estudo`. Depois de entrar, o aparelho fica liberado por um ano (ou até tocar em Sair).
- `estudo/apps.js` tem a lista de cards. Para fixar um link em todos os aparelhos, edite o `url` ali.
- `estudo/lexico/` é o Léxico **sem os livros**. Este repositório é público, então os PDFs e o texto extraído deles não podem ficar aqui. Em cada aparelho, abra o Léxico, toque em **Livros neste aparelho** e escolha o arquivo `lexico-livros.json.gz` (e, se quiser, os dois PDFs). Ficam guardados só no navegador daquele aparelho.

## Como trocar a senha
No computador, com Python:

```
python3 -c "import hashlib,secrets;s=input('nova senha: ');sal=secrets.token_hex(16);d=hashlib.pbkdf2_hmac('sha256',s.encode(),bytes.fromhex(sal),120000).hex();print('SAL =',sal);print('RESUMO =',hashlib.sha256(d.encode()).hexdigest())"
```

Copie os dois valores para `SAL` e `RESUMO` em `netlify/edge-functions/estudo-porteiro.js` e publique. Todos os aparelhos terão de entrar de novo.
