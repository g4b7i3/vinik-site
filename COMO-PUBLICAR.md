# Como colocar o site vinikautor.com.br no ar

Tudo aqui é gratuito, exceto o domínio (cerca de R$ 40 por ano).

## 1. Registrar o domínio
1. Entre em https://registro.br e registre **vinikautor.com.br** com seu CPF.

## 2. Guardar o site no GitHub (necessário para o painel de notícias)
1. Crie uma conta gratuita em https://github.com.
2. Clique em **New repository**, dê o nome **vinik-site** e crie.
3. Na página do repositório, clique em **uploading an existing file** e arraste **todo o conteúdo desta pasta** (não a pasta em si). Clique em **Commit changes**.
4. Abra o arquivo `admin/config.yml`, troque `SEU-USUARIO` pelo seu usuário do GitHub e salve.

## 3. Publicar na Netlify
1. Crie uma conta em https://app.netlify.com entrando **com o GitHub**.
2. **Add new site → Import an existing project → GitHub →** escolha **vinik-site** → **Deploy**.
3. Em **Site configuration → Environment variables**, crie `SUBSTACK_FEED` com o endereço do feed do seu Substack, por exemplo `https://vinikautor.substack.com/feed` (confira o endereço exato da sua publicação).
4. Em **Domain management → Add a domain**, digite `vinikautor.com.br` e siga as instruções. A Netlify mostra os servidores (DNS) que você deve copiar no Registro.br, em **Alterar servidores DNS**. Leva algumas horas para valer.

## 4. Ativar o painel (vinikautor.com.br/admin)
1. No GitHub: **Settings (do seu perfil) → Developer settings → OAuth Apps → New OAuth App**.
   - Homepage URL: `https://vinikautor.com.br`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   Guarde o **Client ID** e gere um **Client secret**.
2. Na Netlify: **Site configuration → Access & security → OAuth → Install provider → GitHub**, cole o Client ID e o Client secret.
3. Pronto: abra **vinikautor.com.br/admin**, entre com o GitHub e edite.

No painel você pode:
- **Notícias:** publicar, editar e apagar posts (título, data, imagem, resumo e texto).
- **Avaliações dos leitores:** acrescentar avaliações novas aos cartões e atualizar as notas da Amazon.
- **Prêmios e seleções:** acrescentar novos concursos.

Cada vez que você salva no painel, o site se atualiza sozinho em cerca de um minuto.

## 5. Formulário de contato
Funciona automaticamente na Netlify. As mensagens aparecem em **Forms** no painel da Netlify. Para recebê-las por e-mail: **Forms → Form notifications → Add notification → Email notification** com vinikautor@gmail.com.

## 6. Substack
- Os posts do Substack aparecem na página de Notícias automaticamente (atualização a cada poucas horas).
- A caixa de inscrição do Substack aparece no site quando ele estiver no ar em vinikautor.com.br.
- Quando o conto gratuito estiver pronto: no Substack, **Settings → Emails → Welcome email**, coloque o conto (ou o link para ele). Todo novo inscrito recebe automaticamente. Depois troque o selo "Em breve · conto gratuito" no site.
