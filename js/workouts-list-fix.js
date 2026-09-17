(function(){
  function refreshTreinos(){
    if(typeof renderListV16==='function') return;
    if(typeof workouts==='undefined'||typeof profiles==='undefined') return;
    const c=document.getElementById('content');
    if(!c)return;
    const p=profiles[profile];
    const codes=p.codes.slice();
    Object.keys(workouts).forEach(k=>{if(!codes.includes(k))codes.push(k)});
    const escLocal=v=>typeof esc==='function'?esc(v):String(v??'');
    c.innerHTML=`<div class="card"><h2>Treinos ${p.emoji}</h2><div class="muted small">Perfil atual: ${escLocal(p.label)}</div><p class="muted small">Selecione qualquer treino para começar.</p></div><h3 class="section-title">Meus treinos</h3>${codes.map(k=>{const w=workouts[k];if(!w)return'';return `<div class="workout-list-row"><button type="button" class="listbtn ${k===current?'selected-workout':''}" onclick="setCurrent('${escLocal(k)}');show('hoje')"><b>Treino ${escLocal(k)}</b> — ${escLocal(w.name||'')} ${k===current?'· Atual':''}<br><span class="muted small">${w.items?.length||0} exercícios</span></button></div>`}).join('')}`;
  }
  const wait=setInterval(()=>{
    if(typeof workouts!=='undefined'&&Object.keys(workouts).length&&typeof show==='function'){
      clearInterval(wait);
      const originalShow=window.show;
      if(typeof originalShow==='function'){
        window.show=function(x){originalShow(x);if(x==='treinos')setTimeout(refreshTreinos,0)};
      }
    }
  },100);
})();
