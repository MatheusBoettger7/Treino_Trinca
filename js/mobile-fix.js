(function(){
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function renderExercisesFallback(){
    try{
      const holder=document.getElementById('exercises');
      if(!holder || holder.children.length || typeof workouts==='undefined') return;
      const w=workouts[current];
      if(!w || !Array.isArray(w.items)) return;
      const d=typeof draft==='function'?draft():{};
      holder.innerHTML='';
      w.items.forEach((it,i)=>{
        let rows='';
        for(let s=0;s<(Number(it.sets)||0);s++){
          const v=d[`${i}_${s}`]||{};
          rows+=`<span>${s+1}</span><input inputmode="decimal" placeholder="kg" value="${escapeHtml(v.kg||'')}" data-e="${i}" data-s="${s}" data-f="kg" class="kg" oninput="fieldInput(this)"><input inputmode="numeric" placeholder="reps" value="${escapeHtml(v.reps||'')}" data-e="${i}" data-s="${s}" data-f="reps" class="reps" oninput="fieldInput(this)"><button class="done ${v.done?'on':''}" data-e="${i}" data-s="${s}" onclick="doneSet(this)">✓</button>`;
        }
        let hint='';
        try{hint=typeof progression==='function'?progression(it.name):''}catch(e){}
        holder.insertAdjacentHTML('beforeend',`<div class="card exercise"><div class="exercise-head"><div><h3>${i+1}. ${escapeHtml(it.name)}</h3><div class="muted small">${it.sets} séries · ${escapeHtml(it.reps)}</div></div></div><div class="hint">${escapeHtml(hint)}</div><div class="sets"><span>Série</span><span>KG</span><span>Reps</span><span>OK</span>${rows}</div></div>`);
      });
    }catch(e){console.error('Treino Trinca mobile fallback:',e)}
  }
  window.addEventListener('load',()=>setTimeout(renderExercisesFallback,250));
  const observer=new MutationObserver(()=>setTimeout(renderExercisesFallback,0));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
})();
