(function(){
  let deferredPrompt=null;
  let installed=false;

  function button(){return document.getElementById('installBtn')}
  function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true}
  function showButton(){const b=button();if(b&&!installed&&!isStandalone())b.hidden=false}
  function hideButton(){const b=button();if(b)b.hidden=true}

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    showButton();
  });

  window.addEventListener('appinstalled',()=>{
    installed=true;
    deferredPrompt=null;
    hideButton();
  });

  document.addEventListener('click',async event=>{
    const b=event.target.closest?.('#installBtn');
    if(!b)return;
    event.preventDefault();
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
      navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('Service Worker não pôde ser registrado:',error));
    }
    if(isStandalone())hideButton();
  });
})();
