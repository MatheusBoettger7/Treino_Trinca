(function(){
  function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  // Corrige os IDs de imagens para os IDs reais do catálogo RepDB.
  // Mantido separado do editor para não interferir na edição dos treinos.
  function repairExerciseMedia(){
    if(typeof mediaMap==='undefined')return;
    const fixes={
      'Remada':['barbell-row'],
      'Agachamento':['squat'],
      'Supino reto':['bench-press'],
      'Stiff / terra romeno':['romanian-deadlift'],
      'Elevação lateral':['lateral-raise'],
      'Rosca direta':['barbell-curl'],
      'Tríceps na polia':['tricep-pushdown'],
      'Panturrilha':['machine-calf-raise'],
      'Abdominal na polia':['cable-crunch'],
      'Leg press':['leg-press'],
      'Supino inclinado com halteres':['incline-db-press'],
      'Puxada alta':['lat-pulldown'],
      'Mesa flexora':['leg-curl'],
      'Desenvolvimento com halteres':['dumbbell-shoulder-press'],
      'Crossover':['cable-fly'],
      'Rosca martelo':['hammer-curl'],
      'Tríceps francês':['overhead-tricep-extension'],
      'Panturrilha sentado':['seated-calf-raise'],
      'Elevação de pernas':['hanging-leg-raise'],
      'Hack squat':['hack-squat'],
      'Supino máquina':['chest-press-machine'],
      'Remada baixa':['seated-cable-row'],
      'Cadeira extensora':['leg-extension'],
      'Face pull':['face-pull'],
      'Rosca Scott':['preacher-curl'],
      'Tríceps corda':['tricep-pushdown'],
      'Abdominal máquina':['machine-seated-crunch'],
      'Remada sentada':['seated-cable-row'],
      'Desenvolvimento máquina':['machine-shoulder-press'],
      'Abdominal':['crunches'],
      'Cardio moderado':['incline-treadmill-walk'],
      'Elevação pélvica':['hip-thrust'],
      'Agachamento búlgaro':['bulgarian-split-squat'],
      'Coice na polia':['glute-kickback'],
      'Abdutora':['hip-abduction'],
      'Stiff com halteres ou barra':['romanian-deadlift']
    };
    Object.keys(fixes).forEach(name=>{if(mediaMap[name])mediaMap[name]=fixes[name]});
  }

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

  repairExerciseMedia();
  window.addEventListener('load',()=>{repairExerciseMedia();setTimeout(renderExercisesFallback,250)});
  const observer=new MutationObserver(()=>{repairExerciseMedia();setTimeout(renderExercisesFallback,0)});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5000);
})();
