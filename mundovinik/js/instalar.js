/* Instalar o Mundo Vinik como aplicativo (celular e computador) */
const Instalar = {
  aviso: null,
  instalado() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; },
  ios() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); },
  botao() { return this.instalado() ? '' : `<button class="btn sm" id="instalar" title="Pôr o Mundo Vinik na tela inicial ou no computador">${ic('plus')} Instalar app</button>`; },
  ligar(el) { const b = el.querySelector('#instalar'); if (b) b.onclick = () => this.abrir(); },
  async abrir() {
    if (this.aviso) {
      this.aviso.prompt();
      const r = await this.aviso.userChoice.catch(() => null);
      this.aviso = null;
      if (r && r.outcome === 'accepted') { App.toast('Instalado. Procure o ícone Mundo Vinik.'); App.go(App.view); }
      return;
    }
    const passos = this.ios()
      ? `<ol><li>Abra este endereço no <b>Safari</b> (no Chrome do iPhone não aparece a opção).</li><li>Toque em <b>Compartilhar</b> (o quadrado com a seta para cima).</li><li>Escolha <b>Adicionar à Tela de Início</b> e confirme.</li></ol>`
      : /android/i.test(navigator.userAgent)
        ? `<ol><li>No <b>Chrome</b>, toque nos três pontinhos no canto de cima.</li><li>Escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).</li><li>Confirme. O ícone aparece junto dos outros apps.</li></ol>`
        : `<ol><li>No <b>Chrome</b> ou no <b>Edge</b>, procure o ícone de instalar no fim da barra de endereço (um monitor com seta).</li><li>Se não aparecer: menu de três pontinhos → <b>Transmitir, salvar e compartilhar</b> → <b>Instalar página como app</b> (no Edge: <b>Aplicativos</b> → <b>Instalar este site como aplicativo</b>).</li><li>Ele abre em janela própria e ganha atalho no menu Iniciar ou no Dock.</li></ol>`;
    App.modal(`<h3>Instalar o Mundo Vinik</h3>${passos}<p class="muted">Seus livros ficam guardados na sua conta do site. Em cada aparelho novo, entre com a mesma senha e tudo aparece igual.</p><div class="acts"><button class="btn pri" data-close>Entendi</button></div>`);
  }
};
addEventListener('beforeinstallprompt', e => { e.preventDefault(); Instalar.aviso = e; });
addEventListener('appinstalled', () => { Instalar.aviso = null; });
