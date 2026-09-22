(function(){
  let deferredPrompt=null;
  let installed=false;
  let hadController=false;

  const APP_URL='https://matheusboettger7.github.io/Treino_Trinca/';
  const CHROME_PACKAGE='com.android.chrome';

  function isIOS(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent||'') ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }

  function isIOSSafari(){
    const ua=navigator.userAgent||'';
    return isIOS() && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  }

  function ensureIOSDialog(){
    let dialog=document.getElementById('iosInstallDialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='iosInstallDialog';
    dialog.className='ios-install-dialog';
    dialog.innerHTML='<div class="ios-install-content">'+
      '<div class="ios-install-title">📲 Adicionar o Treino Trinca</div>'+
      '<p>O iPhone não usa o mesmo botão automático de instalação do Android. Para colocar o Treino Trinca na tela inicial:</p>'+
      '<ol>'+
      '<li>Abra o Treino Trinca no <b>Safari</b>.</li>'+
      '<li>Toque em <b>Compartilhar</b> ⬆️.</li>'+
      '<li>Toque em <b>Adicionar à Tela de Início</b>.</li>'+
      '<li>Deixe <b>Abrir como App da Web</b> ativado e toque em <b>Adicionar</b>.</li>'+
      '</ol>'+
      '<p>Depois disso, o Treino Trinca abrirá em uma janela própria, como um aplicativo.</p>'+
      '<button type="button" id="iosInstallClose">Entendi</button>'+
      '</div>';
    document.body.appendChild(dialog);
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    document.getElementById('iosInstallClose').addEventListener('click',()=>dialog.close());
    return dialog;
  }

  function button(){return document.getElementById('installBtn')}
  function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true}
  function isSamsungInternet(){return /SamsungBrowser/i.test(navigator.userAgent||'') && /Android/i.test(navigator.userAgent||'')}
  function showButton(){
    const b=button();
    if(!b||installed||isStandalone())return;
    if(isIOS()){
      b.textContent='📲 Adicionar à Tela de Início';
      b.title='Abra o menu Compartilhar do iPhone e escolha Adicionar à Tela de Início.';
      b.hidden=false;
      return;
    }
    if(isSamsungInternet()){
      b.textContent='📲 Instalar pelo Chrome';
      b.title='No Samsung Internet, a instalação do PWA pode ser bloqueada pelo Play Protect. Abra no Chrome para instalar.';
    }
    b.hidden=false;
  }
  function hideButton(){const b=button();if(b)b.hidden=true}

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();

    // O Samsung Internet atualmente pode gerar um WebAPK com target SDK
    // incompatível com as verificações do Play Protect. Não guardamos o
    // prompt desse navegador: oferecemos a instalação pelo Chrome.
    if(isSamsungInternet()){
      deferredPrompt=null;
      showButton();
      return;
    }

    deferredPrompt=event;
    showButton();
  });

  window.addEventListener('appinstalled',()=>{
    installed=true;
    deferredPrompt=null;
    hideButton();
  });

  function openInChrome(){
    const intent='intent://matheusboettger7.github.io/Treino_Trinca/#Intent;scheme=https;package='+CHROME_PACKAGE+';end';
    try{
      window.location.href=intent;
      window.setTimeout(()=>{window.location.href=APP_URL},1200);
    }catch{
      window.location.href=APP_URL;
    }
  }

  document.addEventListener('click',async event=>{
    const b=event.target.closest?.('#installBtn');
    if(!b)return;
    event.preventDefault();

    if(isIOS()){
      ensureIOSDialog().showModal();
      return;
    }

    if(isSamsungInternet()){
      openInChrome();
      return;
    }

    if(!deferredPrompt){
      if(isStandalone())hideButton();
      return;
    }

    const promptEvent=deferredPrompt;
    deferredPrompt=null;
    try{
      await promptEvent.prompt();
      await promptEvent.userChoice;
    }catch(error){
      console.warn('Instalação do Treino Trinca não pôde ser iniciada:',error);
    }finally{
      hideButton();
    }
  },true);

  window.addEventListener('load',()=>{
    if('serviceWorker' in navigator){
      hadController=!!navigator.serviceWorker.controller;

      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        if(!hadController)return;
        if(sessionStorage.getItem('tt-sw-reloaded')==='1')return;
        sessionStorage.setItem('tt-sw-reloaded','1');
        window.location.reload();
      });

      navigator.serviceWorker.register('./sw.js?v=24').then(registration=>{
        registration.update().catch(()=>{});
      }).catch(error=>console.warn('Service Worker não pôde ser registrado:',error));
    }

    if(isStandalone())hideButton();
    else if(isIOS())showButton();
    else if(isSamsungInternet())showButton();
  });
})();