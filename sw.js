const CACHE='treino-trinca-v24';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./css/app.css','./css/exercise-picker.css','./js/app.js','./js/mobile-fix.js','./js/editor-v16.js','./js/progress-enhanced.js','./js/exercise-details.js','./js/weight-repeat.js','./js/repdb.js','./js/repdb-ptbr.js','./js/repdb-ptbr-runtime.js','./js/repdb-ptbr-names.js','./js/pwa-install.js','./data/workouts.json'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  const isServiceWorkerScript=url.pathname.endsWith('/sw.js');
  const isNavigation=request.mode==='navigate';

  if(isServiceWorkerScript || isNavigation){
    event.respondWith(
      fetch(request,{cache:'no-store'})
        .catch(()=>isNavigation
          ? caches.match('./index.html')
          : Response.error())
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response=>{
        if(response.ok||response.type==='opaque'){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html')))
  );
});
