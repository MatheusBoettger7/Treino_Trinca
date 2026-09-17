(function(){
  const storageKey=p=>`treinoTrincaWorkouts_${p}`;
  let editing=null;
  let pickerIndex=null;

  function loadSaved(){try{return JSON.parse(localStorage.getItem(storageKey(profile))||'{}')}catch{return{}}}
  function saveSaved(x){localStorage.setItem(storageKey(profile),JSON.stringify(x))}
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function escLocal(v){return typeof esc==='function'?esc(v):String(v??'')}
  function isBase(k){return profiles[profile].codes.includes(k)}
  function applySaved(){const saved=loadSaved();Object.keys(saved).forEach(k=>{workouts[k]=saved[k]})}
  function allCodes(){const base=profiles[profile].codes.slice();Object.keys(workouts).forEach(k=>{if(!base.includes(k))base.push(k)});return base}

  function syncRepDBLinks(){
    if(typeof mediaMap==='undefined')return;
    Object.values(workouts||{}).forEach(w=>{
      (w?.items||[]).forEach(it=>{
        if(it?.repdbId&&it?.name)mediaMap[it.name]=[it.repdbId,...(mediaMap[it.name]||[]).filter(x=>x!==it.repdbId)];
      });
    });
  }

  function renderListV16(c){
    const p=profiles[profile],codes=allCodes();
    c.innerHTML=`<div class="card"><h2>Treinos ${p.emoji}</h2><div class="muted small">Perfil atual: ${escLocal(p.label)}</div><p class="muted small">Personalize exercícios, séries e repetições sem alterar o treino original.</p><button type="button" class="primary compact-btn" data-editor-action="new">➕ Criar treino</button></div><h3 class="section-title">Meus treinos</h3>${codes.map(k=>{const w=workouts[k];if(!w)return'';return `<div class="workout-list-row"><button type="button" class="listbtn ${k===current?'selected-workout':''}" data-editor-action="select" data-code="${escLocal(k)}"><b>Treino ${escLocal(k)}</b> — ${escLocal(w.name||'')} ${k===current?'· Atual':''}<br><span class="muted small">${w.items?.length||0} exercícios</span></button><button type="button" class="secondary edit-workout-btn" title="Editar" data-editor-action="edit" data-code="${escLocal(k)}">✏️</button><button type="button" class="secondary compact-btn" title="Duplicar" data-editor-action="duplicate" data-code="${escLocal(k)}">📋</button>${!isBase(k)?`<button type="button" class="secondary delete-workout-btn" title="Excluir" data-editor-action="delete" data-code="${escLocal(k)}">🗑️</button>`:''}</div>`}).join('')}`;
  }

  function newWorkoutV16(){const code=`${profile==='masculino'?'M':'E'}${Date.now().toString().slice(-6)}`;const w={id:code,name:'Novo treino',items:[]};workouts[code]=w;const saved=loadSaved();saved[code]=w;saveSaved(saved);editWorkoutV16(code)}
  function duplicateWorkoutV16(code){const src=workouts[code];if(!src)return;const id=`${profile==='masculino'?'M':'E'}${Date.now().toString().slice(-6)}`;const w=clone(src);w.id=id;w.name=`${src.name||'Treino'} (cópia)`;workouts[id]=w;const saved=loadSaved();saved[id]=w;saveSaved(saved);setCurrent(id);editWorkoutV16(id)}
  function deleteWorkoutV16(code){if(isBase(code)){alert('Os treinos padrão não podem ser excluídos.');return}if(!confirm(`Excluir o treino ${code}?`))return;delete workouts[code];const saved=loadSaved();delete saved[code];saveSaved(saved);if(current===code)setCurrent(profiles[profile].codes[0]);renderListV16(content)}

  function rowHtml(it,i,total){return `<div class="editor-exercise"><div class="editor-exercise-title"><strong>${i+1}. ${escLocal(it.name)}</strong>${it.repdbId?'<span class="editor-linked">🔗 RepDB</span>':''}</div><div class="editor-grid"><label>Exercício<input id="ename_${i}" value="${escLocal(it.name)}" data-editor-field="name" data-index="${i}"></label><label>Séries<input type="number" min="1" max="20" id="esets_${i}" value="${Number(it.sets)||1}" data-editor-field="sets" data-index="${i}"></label><label>Repetições<input id="ereps_${i}" value="${escLocal(it.reps||'')}" data-editor-field="reps" data-index="${i}"></label></div><div class="editor-order"><button type="button" class="secondary" data-editor-action="pick" data-index="${i}">🔎 Escolher da biblioteca</button>${i?`<button type="button" class="secondary" data-editor-action="move" data-index="${i}" data-delta="-1">↑</button>`:''}${i<total-1?`<button type="button" class="secondary" data-editor-action="move" data-index="${i}" data-delta="1">↓</button>`:''}<button type="button" class="secondary" data-editor-action="remove" data-index="${i}">🗑️ Remover</button></div></div>`}

  function editWorkoutV16(code){const w=workouts[code];if(!w)return;editing=clone(w);renderEditor()}
  function renderEditor(){if(!editing)return;const c=document.getElementById('content');c.innerHTML=`<div class="card"><h2>✏️ Editar Treino ${escLocal(editing.id)}</h2><label class="editor-name-label">Nome do treino<input id="editorWorkoutName" value="${escLocal(editing.name||'')}" data-editor-field="workout-name"></label><div class="muted small" style="margin-top:8px">Edite exercícios, séries/repetições e altere a ordem. Use a biblioteca RepDB para vincular um exercício e carregar automaticamente sua imagem.</div></div><div id="editorExercises">${editing.items.map((it,i)=>rowHtml(it,i,editing.items.length)).join('')||'<div class="empty">Nenhum exercício. Use uma das opções abaixo para adicionar.</div>'}</div><div class="card editor-actions"><button type="button" class="primary" data-editor-action="pick" data-index="-1">🔎 Adicionar da biblioteca</button><button type="button" class="secondary" style="width:100%;margin-top:8px" data-editor-action="add">➕ Adicionar manualmente</button><button type="button" class="primary" data-editor-action="save">💾 Salvar treino</button><button type="button" class="secondary" style="width:100%;margin-top:8px" data-editor-action="cancel">Cancelar</button>${isBase(editing.id)?`<button type="button" class="secondary" style="width:100%;margin-top:8px" data-editor-action="reset" data-code="${escLocal(editing.id)}">↩️ Restaurar padrão</button>`:''}</div>`}

  function updateField(el){
    if(!editing)return;
    const i=Number(el.dataset.index),field=el.dataset.editorField;
    if(field==='workout-name'){editing.name=el.value;return}
    if(!editing.items[i])return;
    editing.items[i][field]=field==='sets'?Math.max(1,Number(el.value)||1):el.value;
    if(field==='name')delete editing.items[i].repdbId;
  }

  function moveExerciseV16(i,delta){if(!editing)return;const j=i+delta;if(j<0||j>=editing.items.length)return;[editing.items[i],editing.items[j]]=[editing.items[j],editing.items[i]];renderEditor()}
  function removeExerciseV16(i){if(!editing)return;editing.items.splice(i,1);renderEditor()}
  function addExerciseV16(){if(!editing)return;editing.items.push({name:'Novo exercício',sets:3,reps:'8–12'});renderEditor();const el=document.getElementById(`ename_${editing.items.length-1}`);el?.focus();el?.select()}

  function pickerDialog(){return document.getElementById('repdbExercisePicker')}

  function pickerResults(query=''){
    const holder=document.getElementById('repdbPickerResults');
    if(!holder||typeof RepDB==='undefined'||!RepDB.loaded)return;
    const list=RepDB.search(query).slice(0,40);
    const count=document.getElementById('repdbPickerCount');
    if(count)count.textContent=`${list.length} resultados`;
    holder.innerHTML=list.map(ex=>{
      const localized=RepDB.localized(ex);
      const img=RepDB.image(ex,'peak')||RepDB.image(ex,'start')||'';
      const muscles=[...(localized.primaryMuscles||[]),...(localized.secondaryMuscles||[]).slice(0,2)].filter(Boolean).join(', ');
      const equipment=localized.equipment||'Peso corporal';
      const bodyPart=localized.bodyPart||'';
      const description=localized.description||'';
      return `<button type="button" class="repdb-picker-item" data-picker-select="${escLocal(ex.id)}"><div class="repdb-picker-text"><strong>${escLocal(localized.name||ex.id)}</strong><span>${escLocal(bodyPart)}${equipment?` · ${escLocal(equipment)}`:''}</span>${muscles?`<small>${escLocal(muscles)}</small>`:''}${description?`<small class="repdb-picker-description">${escLocal(description)}</small>`:''}</div>${img?`<img src="${img}" alt="" referrerpolicy="no-referrer">`:''}</button>`;
    }).join('')||'<div class="empty">Nenhum exercício encontrado.</div>';
  }

  async function openExercisePickerV16(index){
    if(!editing)return;
    pickerIndex=index;
    let dialog=pickerDialog();
    if(!dialog){
      document.body.insertAdjacentHTML('beforeend',`<dialog id="repdbExercisePicker" class="repdb-picker-dialog"><div class="repdb-picker-content"><div class="repdb-picker-header"><div><h2>🔎 Biblioteca de exercícios</h2><div class="muted small">Escolha um exercício do RepDB para adicionar ou substituir.</div></div><button type="button" class="secondary" data-picker-action="close">✕</button></div><input id="repdbPickerSearch" class="editor-search" placeholder="🔍 Buscar exercício"><div id="repdbPickerCount" class="muted small" style="margin-top:8px">Carregando...</div><div id="repdbPickerResults" class="repdb-picker-results"></div><div class="repdb-credit">Exercise data by <a href="https://repdb.co" target="_blank" rel="noopener">RepDB</a></div></div></dialog>`);
      dialog=pickerDialog();
    }
    dialog.showModal();
    const input=document.getElementById('repdbPickerSearch');
    input.value='';
    if(typeof RepDB!=='undefined'&&!RepDB.loaded)await RepDB.load();
    if(typeof RepDB==='undefined'||!RepDB.loaded){
      document.getElementById('repdbPickerCount').textContent='Não foi possível carregar a biblioteca RepDB.';
      document.getElementById('repdbPickerResults').innerHTML='<div class="empty">Verifique sua conexão e tente novamente.</div>';
      return;
    }
    pickerResults('');
    input.focus();
  }

  function closeExercisePicker(){const d=pickerDialog();if(d?.open)d.close();pickerIndex=null}
  function selectRepDBExercise(id){
    if(!editing||typeof RepDB==='undefined')return;
    const ex=RepDB.get(id);if(!ex)return;
    const localized=RepDB.localized(ex);
    const item={name:String(localized.name||ex.name_en||ex.id),sets:3,reps:'8–12',repdbId:ex.id};
    if(pickerIndex===-1)editing.items.push(item);
    else if(editing.items[pickerIndex]){
      item.sets=editing.items[pickerIndex].sets||3;
      item.reps=editing.items[pickerIndex].reps||'8–12';
      editing.items[pickerIndex]={...editing.items[pickerIndex],...item};
    }
    if(typeof mediaMap!=='undefined')mediaMap[item.name]=[item.repdbId,...(mediaMap[item.name]||[]).filter(x=>x!==item.repdbId)];
    closeExercisePicker();
    renderEditor();
  }

  function saveWorkoutV16(){
    if(!editing)return;
    editing.items=editing.items.filter(x=>x&&String(x.name||'').trim()).map(x=>({name:String(x.name).trim(),sets:Math.max(1,Number(x.sets)||1),reps:String(x.reps||'').trim()||'8–12',...(x.repdbId?{repdbId:String(x.repdbId)}:{})}));
    workouts[editing.id]=clone(editing);
    const saved=loadSaved();saved[editing.id]=clone(editing);saveSaved(saved);
    syncRepDBLinks();
    setCurrent(editing.id);editing=null;show('treinos');
  }

  function resetWorkoutV16(code){if(!isBase(code))return;const saved=loadSaved();delete saved[code];saveSaved(saved);const defaults=window.__trincaDefaults?.[code];if(defaults)workouts[code]=clone(defaults);else{location.reload();return}syncRepDBLinks();editWorkoutV16(code)}

  document.addEventListener('click',function(ev){
    const pickerBtn=ev.target.closest('[data-picker-action]');
    if(pickerBtn){ev.preventDefault();ev.stopPropagation();if(pickerBtn.dataset.pickerAction==='close')closeExercisePicker();return}
    const pickerItem=ev.target.closest('[data-picker-select]');
    if(pickerItem){ev.preventDefault();ev.stopPropagation();selectRepDBExercise(pickerItem.dataset.pickerSelect);return}
    const btn=ev.target.closest('[data-editor-action]');
    if(!btn)return;
    const action=btn.dataset.editorAction,code=btn.dataset.code,i=Number(btn.dataset.index);
    ev.preventDefault();ev.stopPropagation();
    if(action==='new')newWorkoutV16();
    else if(action==='select'){setCurrent(code);show('hoje')}
    else if(action==='edit')editWorkoutV16(code)
    else if(action==='duplicate')duplicateWorkoutV16(code)
    else if(action==='delete')deleteWorkoutV16(code)
    else if(action==='pick')openExercisePickerV16(i)
    else if(action==='move')moveExerciseV16(i,Number(btn.dataset.delta))
    else if(action==='remove')removeExerciseV16(i)
    else if(action==='add')addExerciseV16()
    else if(action==='save')saveWorkoutV16()
    else if(action==='cancel'){editing=null;show('treinos')}
    else if(action==='reset')resetWorkoutV16(code)
  },true);

  document.addEventListener('input',function(ev){
    const el=ev.target;
    if(el.matches('[data-editor-field]'))updateField(el);
    if(el.id==='repdbPickerSearch')pickerResults(el.value);
  },true);

  function install(){
    if(!window.__trincaDefaults)window.__trincaDefaults={};
    Object.keys(workouts).forEach(k=>{if(isBase(k)&&!window.__trincaDefaults[k])window.__trincaDefaults[k]=clone(workouts[k])});
    applySaved();
    syncRepDBLinks();
    window.renderList=renderListV16;
    if(tab==='treinos')renderListV16(content);
    if(tab==='hoje'&&typeof renderWorkout==='function'&&workouts[current])renderWorkout(content);
  }
  window.newWorkoutV16=newWorkoutV16;window.duplicateWorkoutV16=duplicateWorkoutV16;window.deleteWorkoutV16=deleteWorkoutV16;window.editWorkoutV16=editWorkoutV16;window.moveExerciseV16=moveExerciseV16;window.removeExerciseV16=removeExerciseV16;window.addExerciseV16=addExerciseV16;window.saveWorkoutV16=saveWorkoutV16;window.resetWorkoutV16=resetWorkoutV16;window.openExercisePickerV16=openExercisePickerV16;
  const timer=setInterval(()=>{if(typeof workouts!=='undefined'&&Object.keys(workouts).length){clearInterval(timer);install()}},100);
})();
