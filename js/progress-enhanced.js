(function(){
  function progressSessions(){
    return typeof sessions==='function' ? sessions() : [];
  }

  function weekStats(){
    const start=new Date();
    start.setHours(0,0,0,0);
    start.setDate(start.getDate()-((start.getDay()+6)%7));
    const ss=progressSessions().filter(s=>new Date(s.date)>=start);
    let sets=0,volume=0;
    ss.forEach(s=>(s.exercises||[]).forEach(e=>(e.sets||[]).forEach(x=>{
      if(num(x.kg)||num(x.reps)){sets++;volume+=num(x.kg)*num(x.reps)}
    })));
    return{sessions:ss.length,sets,volume:Math.round(volume)};
  }

  function calendar(){
    const now=new Date();
    const first=new Date(now.getFullYear(),now.getMonth(),1);
    const total=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    const trained=new Set(progressSessions().map(s=>new Date(s.date).toDateString()));
    let out='';
    for(let i=0;i<first.getDay();i++)out+='<div></div>';
    for(let d=1;d<=total;d++){
      const x=new Date(now.getFullYear(),now.getMonth(),d);
      out+=`<div class="cal-day ${trained.has(x.toDateString())?'trained':''}">${d}</div>`;
    }
    return out;
  }

  function chart(){
    const ms=Array.isArray(data?.metrics)?data.metrics.filter(m=>(m.profile||'masculino')===profile).slice(-12):[];
    if(!ms.length)return '<div class="empty">Registre peso e cintura para visualizar o gráfico.</div>';

    const weights=ms.map(m=>num(m.weight)).filter(Boolean);
    const waists=ms.map(m=>num(m.waist)).filter(Boolean);
    const wMin=weights.length?Math.min(...weights):0;
    const wMax=weights.length?Math.max(...weights):1;
    const cMin=waists.length?Math.min(...waists):0;
    const cMax=waists.length?Math.max(...waists):1;

    const path=(key,min,max)=>{
      const range=max-min||1;
      return ms.map((m,i)=>{
        const v=num(m[key]);
        if(!v)return '';
        const x=10+i*(280/Math.max(ms.length-1,1));
        const y=130-((v-min)/range)*105;
        return `${i?'L':'M'} ${x} ${y}`;
      }).filter(Boolean).join(' ');
    };

    const last=ms[ms.length-1]||{};
    return `<svg class="chart" viewBox="0 0 300 150" role="img" aria-label="Gráfico de evolução">
      <line x1="10" y1="130" x2="290" y2="130" stroke="#334155"/>
      <path d="${weights.length?path('weight',wMin,wMax):''}" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${waists.length?path('waist',cMin,cMax):''}" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="legend">
      <span><i class="dot" style="background:#60a5fa"></i>Peso</span>
      <span><i class="dot" style="background:#f59e0b"></i>Cintura</span>
      <span>Último: ${last.weight||'—'} kg · ${last.waist||'—'} cm</span>
    </div>`;
  }

  function allExercises(){
    return [...new Set(progressSessions().flatMap(s=>(s.exercises||[]).map(e=>e.name)))]
      .filter(Boolean);
  }

  function exerciseLogs(name){
    if(!name)return [];
    return progressSessions()
      .filter(s=>(s.exercises||[]).some(e=>e.name===name))
      .sort((a,b)=>new Date(a.date)-new Date(b.date))
      .flatMap(s=>(s.exercises||[])
        .filter(e=>e.name===name)
        .flatMap(e=>(e.sets||[])
          .filter(x=>num(x.kg)>0||num(x.reps)>0)
          .map(x=>({date:s.date,code:s.code,kg:x.kg||'',reps:x.reps||'',rir:x.rir??x.RIR??''}))
        )
      );
  }

  function exerciseSummary(name){
    const logs=exerciseLogs(name);
    const valid=logs.filter(x=>num(x.kg)>0&&num(x.reps)>0);
    if(!valid.length){
      return {
        maxKg:0,
        bestReps:0,
        volume:0,
        rirAvg:null,
        sessions:0,
        sets:logs.length
      };
    }

    const maxKg=Math.max(...valid.map(x=>num(x.kg)));
    const bestReps=Math.max(...valid.map(x=>num(x.reps)));
    const volume=Math.round(valid.reduce((sum,x)=>sum+(num(x.kg)*num(x.reps)),0));
    const rirValues=logs.map(x=>num(x.rir)).filter(x=>x>0||x===0 && String(x.rir).trim()!=='');
    const rirAvg=rirValues.length ? Math.round((rirValues.reduce((a,b)=>a+b,0)/rirValues.length)*10)/10 : null;
    const sessionKeys=new Set(valid.map(x=>`${x.date}|${x.code||''}`));

    return {maxKg,bestReps,volume,rirAvg,sessions:sessionKeys.size,sets:logs.length};
  }

  function exerciseHistory(name){
    const logs=exerciseLogs(name);
    if(!name)return '<div class="empty">Faça algum treino para gerar o histórico por exercício.</div>';
    if(!logs.length)return '<div class="empty">Nenhum histórico para este exercício.</div>';

    let html='';
    let currentKey='';
    logs.forEach(item=>{
      const key=`${item.date}|${item.code||''}`;
      if(key!==currentKey){
        currentKey=key;
        html+=`<div class="history exercise-history-session"><b>${new Date(item.date).toLocaleDateString('pt-BR')}</b>${item.code?` · Treino ${esc(item.code)}`:''}</div>`;
      }
      html+=`<div class="exercise-history-set"><span>${item.kg||'—'} kg × ${item.reps||'—'}</span>${item.rir!==''?`<span class="muted small">RIR ${esc(item.rir)}</span>`:''}</div>`;
    });
    return `<div class="exercise-history-list">${html}</div>`;
  }

  function prs(){
    const best={};
    progressSessions().forEach(s=>(s.exercises||[]).forEach(e=>(e.sets||[]).forEach(x=>{
      const kg=num(x.kg),reps=num(x.reps);
      if(!kg||!reps)return;
      const old=best[e.name];
      if(!old||kg>old.kg||(kg===old.kg&&reps>old.reps))best[e.name]={kg,reps};
    })));
    const entries=Object.entries(best);
    if(!entries.length)return '<div class="empty">Seus recordes aparecerão aqui quando você registrar cargas.</div>';
    return entries
      .sort((a,b)=>b[1].kg-a[1].kg)
      .map(([name,v])=>`<div class="pr"><span>${esc(name)}</span><b>${v.kg} kg · ${v.reps} reps</b></div>`)
      .join('');
  }

  function metricsForProfile(){
    return Array.isArray(data?.metrics) ? data.metrics.filter(m=>(m.profile||'masculino')===profile) : [];
  }

  function lastMetric(){
    const list=metricsForProfile();
    return list.length?list[list.length-1]:null;
  }

  function renderExerciseHistoryCard(exercises,selected){
    const summary=exerciseSummary(selected);
    return `<div class="card"><h3>Histórico por exercício</h3>
      <div class="exercise-history-picker">${exercises.map(e=>`<button class="filter ${e===selected?'active':''}" onclick='selectExerciseEnhanced(${JSON.stringify(e)})'>${esc(e)}</button>`).join('')||'<div class="empty">Faça algum treino para criar o histórico.</div>'}</div>
      ${selected?`<div class="exercise-summary">
        <div class="exercise-summary-head"><strong>${esc(selected)}</strong><span class="muted small">${summary.sessions} treino${summary.sessions===1?'':'s'} · ${summary.sets} séries</span></div>
        <div class="exercise-summary-grid">
          <div><span>Maior carga</span><b>${summary.maxKg?`${summary.maxKg} kg`:'—'}</b></div>
          <div><span>Melhor repetição</span><b>${summary.bestReps||'—'}</b></div>
          <div><span>Volume acumulado</span><b>${summary.volume?`${summary.volume.toLocaleString('pt-BR')} kg`:'—'}</b></div>
          <div><span>RIR médio</span><b>${summary.rirAvg!=null?summary.rirAvg.toLocaleString('pt-BR'):'—'}</b></div>
        </div>
      </div>`:''}
      ${exerciseHistory(selected)}
    </div>`;
  }

  function renderProgressEnhanced(c){
    const stats=weekStats();
    const recent=progressSessions().slice(-8).reverse();
    const exercises=allExercises();
    if(!window.__trincaSelectedExercise&&exercises.length)window.__trincaSelectedExercise=exercises[0];
    if(window.__trincaSelectedExercise&&!exercises.includes(window.__trincaSelectedExercise))window.__trincaSelectedExercise=exercises[0]||'';
    const selected=window.__trincaSelectedExercise||'';
    const metric=lastMetric()||{};

    c.innerHTML=`<div class="card"><h2>Resumo da semana</h2><div class="stats">
      <div class="stat"><b>${stats.sessions}</b><span class="small muted">treinos</span></div>
      <div class="stat"><b>${stats.sets}</b><span class="small muted">séries</span></div>
      <div class="stat"><b>${stats.volume.toLocaleString('pt-BR')}</b><span class="small muted">kg volume</span></div>
    </div></div>

    <div class="card"><h3>Calendário · ${new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</h3><div class="calendar">${calendar()}</div></div>

    <div class="card"><h3>Peso e cintura</h3><div class="metric">
      <div><label>Peso (kg)</label><input id="peso" inputmode="decimal" placeholder="82,5" value="${esc(metric.weight||'')}"></div>
      <div><label>Cintura (cm)</label><input id="cintura" inputmode="decimal" placeholder="88" value="${esc(metric.waist||'')}"></div>
    </div><button class="primary" onclick="saveMetricEnhanced()">Salvar medidas</button>${chart()}</div>

    ${renderExerciseHistoryCard(exercises,selected)}

    <div class="card"><h3>🏆 Recordes pessoais</h3>${prs()}</div>

    <div class="card"><h3>Últimos treinos</h3>${recent.length?recent.map(s=>`<div class="history"><b>Treino ${esc(s.code)}</b> · ${new Date(s.date).toLocaleDateString('pt-BR')}${s.durationSec!=null?` · ⏱️ ${fmt(s.durationSec)}`:''}</div>`).join(''):'<div class="empty">Nenhum treino salvo ainda.</div>'}</div>

    <div class="card"><h3>Backup dos dados</h3>
      <button class="secondary" onclick="exportDataEnhanced()">📤 Exportar</button>
      <button class="secondary" onclick="document.getElementById('importFileEnhanced').click()">📥 Importar</button>
      <button class="secondary" onclick="clearDataEnhanced()">Limpar</button>
      <input id="importFileEnhanced" type="file" accept="application/json" hidden onchange="importDataEnhanced(event)">
      <div class="muted small">Exporte um arquivo antes de trocar de celular. A importação substitui os dados atuais.</div>
      <div class="repdb-credit">Exercise data by <a href="https://repdb.co" target="_blank" rel="noopener">RepDB (repdb.co)</a>.</div>
    </div>`;
  }

  function selectExerciseEnhanced(name){
    window.__trincaSelectedExercise=name||'';
    renderProgressEnhanced(content);
  }

  function saveMetricEnhanced(){
    const weight=(document.getElementById('peso')?.value||'').replace(',','.').trim();
    const waist=(document.getElementById('cintura')?.value||'').replace(',','.').trim();
    if(!weight&&!waist){alert('Preencha pelo menos uma medida.');return}
    if(!Array.isArray(data.metrics))data.metrics=[];
    data.metrics.push({date:new Date().toISOString(),profile,weight,waist});
    localStorage.setItem(stateKey,JSON.stringify(data));
    renderProgressEnhanced(content);
  }

  function exportDataEnhanced(){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    a.download='treino-trinca-backup.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function importDataEnhanced(event){
    const file=event.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const imported=JSON.parse(reader.result);
        if(!Array.isArray(imported.sessions)||!Array.isArray(imported.metrics))throw Error();
        if(!confirm('Substituir seus dados atuais pelo backup?'))return;
        data={
          sessions:imported.sessions.map(s=>({...s,profile:s.profile||'masculino'})),
          metrics:imported.metrics.map(m=>({...m,profile:m.profile||'masculino'}))
        };
        window.__trincaSelectedExercise='';
        localStorage.setItem(stateKey,JSON.stringify(data));
        renderProgressEnhanced(content);
        alert('Backup importado com sucesso!');
      }catch{alert('Arquivo de backup inválido.');}
    };
    reader.readAsText(file);
  }

  function clearDataEnhanced(){
    if(confirm('Apagar todo o histórico?')){
      data={sessions:[],metrics:[]};
      window.__trincaSelectedExercise='';
      localStorage.setItem(stateKey,JSON.stringify(data));
      renderProgressEnhanced(content);
    }
  }

  window.renderProgress=renderProgressEnhanced;
  window.selectExerciseEnhanced=selectExerciseEnhanced;
  window.saveMetricEnhanced=saveMetricEnhanced;
  window.exportDataEnhanced=exportDataEnhanced;
  window.importDataEnhanced=importDataEnhanced;
  window.clearDataEnhanced=clearDataEnhanced;
})();
