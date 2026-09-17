(function(){
  const APP_VERSION='v2026.09.17.14';
  let deferredPrompt=null;
  let installed=false;

  function button(){return document.getElementById('installBtn')}
  function isStandalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true}
  function showButton(){const b=button();if(b&&!installed&&!isStandalone())b.hidden=false}
  function hideButton(){const b=button();if(b)b.hidden=true}

  async function clearOldCaches(){
    if(!('caches' in window))return;
    try{
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
    }catch(error){
      console.warn('Não foi possível limpar o cache do Treino Trinca:',error);
    }
  }

  async function unregisterOldServiceWorkers(){
    if(!('serviceWorker' in navigator))return;
    try{
      const registrations=await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration=>registration.unregister()));
    }catch(error){
      console.warn('Não foi possível atualizar o Service Worker do Treino Trinca:',error);
    }
  }

  async function ensureLatestVersion(){
    const marker=document.getElementById('appVersion');
    if(!marker)return;

    const displayed=(marker.textContent||'').trim();
    if(displayed===APP_VERSION)return;

    try{
      const response=await fetch('./index.html?tt-version='+encodeURIComponent(APP_VERSION)+'&t='+Date.now(),{
        cache:'no-store',
        credentials:'same-origin'
      });
      if(!response.ok)return;

      const html=await response.text();
      const match=html.match(/id=["']appVersion["'][^>]*>([^<]+)</i);
      const serverVersion=match?match[1].trim():'';

      if(serverVersion===APP_VERSION && displayed!==APP_VERSION){
        await unregisterOldServiceWorkers();
        await clearOldCaches();
        sessionStorage.removeItem('tt-sw-reloaded');
        window.location.replace('./?tt-version='+encodeURIComponent(APP_VERSION)+'&t='+Date.now());
      }
    }catch(error){
      console.warn('Não foi possível verificar a versão do Treino Trinca:',error);
    }
  }

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
    ensureLatestVersion();

    if('serviceWorker' in navigator){
      let reloaded=false;

      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        if(reloaded)return;
        if(sessionStorage.getItem('tt-sw-reloaded')==='1')return;
        reloaded=true;
        sessionStorage.setItem('tt-sw-reloaded','1');
        window.location.reload();
      });

      navigator.serviceWorker.register('./sw.js?v=24',{updateViaCache:'none'}).then(registration=>{
        registration.update().catch(()=>{});
      }).catch(error=>console.warn('Service Worker não pôde ser registrado:',error));
    }

    if(isStandalone())hideButton();
  });
})();