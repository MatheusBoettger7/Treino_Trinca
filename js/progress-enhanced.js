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
      return {maxKg:0,bestReps:0,volume:0,rirAvg:null,sessions:0,sets:logs.length};
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

  function formatN(value){return Math.round(Number(value)||0).toLocaleString("pt-BR");}
  function formatTime(totalSeconds){
    const sec=Math.max(0,Math.round(Number(totalSeconds)||0));
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    return h?`${h}h ${String(m).padStart(2,"0")}min`:`${m}min ${String(s).padStart(2,"0")}s`;
  }

  function exerciseSeries(name){
    return progressSessions().filter(s=>(s.exercises||[]).some(e=>e.name===name)).sort((a,b)=>new Date(a.date)-new Date(b.date)).map(s=>{
      const e=(s.exercises||[]).find(x=>x.name===name);
      const sets=(e?.sets||[]).filter(x=>num(x.kg)>0||num(x.reps)>0);
      if(!sets.length)return null;
      const valid=sets.filter(x=>num(x.kg)>0&&num(x.reps)>0);
      return {date:s.date,label:new Date(s.date).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),code:s.code||"",kg:valid.length?Math.max(...valid.map(x=>num(x.kg))):0,volume:Math.round(valid.reduce((sum,x)=>sum+num(x.kg)*num(x.reps),0)),reps:valid.reduce((sum,x)=>sum+num(x.reps),0)};
    }).filter(Boolean);
  }

  function svgTrend(series,key,label,suffix,stroke){
    const points=series.map(x=>({x:x.label,y:Number(x[key])||0})).filter(x=>x.y>0);
    if(!points.length)return "<div class=\"empty\">Dados insuficientes para este gráfico.</div>";
    const w=340,h=170,left=36,right=10,top=18,bottom=32;
    const values=points.map(p=>p.y),min=Math.min(...values),max=Math.max(...values),range=max-min||1;
    const xAt=i=>points.length===1?(w-left-right)/2+left:left+i*((w-left-right)/Math.max(points.length-1,1));
    const yAt=v=>top+(max-v)/range*(h-top-bottom);
    const path=points.map((p,i)=>`${i?"L":"M"} ${xAt(i).toFixed(1)} ${yAt(p.y).toFixed(1)}`).join(" ");
    return `<div class="trend-chart-wrap"><div class="trend-chart-title"><b>${esc(label)}</b><span class="muted small">${formatN(points[points.length-1].y)}${suffix}</span></div><svg class="trend-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><line x1="${left}" y1="${top}" x2="${left}" y2="${h-bottom}" stroke="#334155"/><line x1="${left}" y1="${h-bottom}" x2="${w-right}" y2="${h-bottom}" stroke="#334155"/><path d="${path}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${points.map((p,i)=>`<circle cx="${xAt(i)}" cy="${yAt(p.y)}" r="3.5" fill="${stroke}"/><text x="${xAt(i)}" y="${h-10}" text-anchor="middle" class="trend-label">${p.x}</text>`).join("")}</svg></div>`;
  }

  function exerciseEvolution(name){
    if(!name)return "";
    const series=exerciseSeries(name).slice(-10);
    if(!series.length)return "<div class=\"empty\">Registre cargas para visualizar a evolução.</div>";
    return `<div class="evolution-charts">${svgTrend(series,"kg","Carga máxima por treino"," kg","#60a5fa")}${svgTrend(series,"volume","Volume por treino"," kg","#f59e0b")}</div>`;
  }

  function workoutTrend(){
    const series=progressSessions().slice().sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(-10).map(s=>{
      let volume=0,sets=0;
      (s.exercises||[]).forEach(e=>(e.sets||[]).forEach(x=>{if(num(x.kg)>0&&num(x.reps)>0){sets++;volume+=num(x.kg)*num(x.reps);}}));
      return {date:s.date,label:new Date(s.date).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),volume:Math.round(volume),sets};
    });
    if(!series.some(x=>x.volume>0))return "";
    return `<div class="card"><h3>📈 Evolução dos treinos</h3><div class="muted small">Últimos 10 treinos registrados</div><div class="evolution-charts">${svgTrend(series,"volume","Volume total por treino"," kg","#60a5fa")}${svgTrend(series,"sets","Séries com carga registrada","","#22c55e")}</div></div>`;
  }

  function detailedStats(){
    const ss=progressSessions();
    let sets=0,reps=0,volume=0,totalDuration=0,workoutsWithData=0,bestSession=0;
    const unique=new Set(),daysSet=new Set();
    ss.forEach(s=>{
      if(s.durationSec)totalDuration+=Number(s.durationSec)||0;
      daysSet.add(new Date(s.date).toDateString());
      let sessionVolume=0,sessionHasData=false;
      (s.exercises||[]).forEach(e=>{
        if(e.name)unique.add(e.name);
        (e.sets||[]).forEach(x=>{if(num(x.kg)>0&&num(x.reps)>0){sets++;reps+=num(x.reps);volume+=num(x.kg)*num(x.reps);sessionVolume+=num(x.kg)*num(x.reps);sessionHasData=true;}});
      });
      if(sessionHasData)workoutsWithData++;
      bestSession=Math.max(bestSession,sessionVolume);
    });
    const avgDuration=ss.length?totalDuration/ss.length:0,avgVolume=workoutsWithData?volume/workoutsWithData:0,avgReps=sets?reps/sets:0;
    return `<div class="detail-stats-grid"><div><span>Treinos</span><b>${formatN(ss.length)}</b></div><div><span>Dias treinados</span><b>${formatN(daysSet.size)}</b></div><div><span>Séries registradas</span><b>${formatN(sets)}</b></div><div><span>Repetições</span><b>${formatN(reps)}</b></div><div><span>Volume acumulado</span><b>${formatN(volume)} kg</b></div><div><span>Volume médio/treino</span><b>${formatN(avgVolume)} kg</b></div><div><span>Reps médias/série</span><b>${avgReps?avgReps.toLocaleString("pt-BR",{maximumFractionDigits:1}):"—"}</b></div><div><span>Duração média</span><b>${avgDuration?formatTime(avgDuration):"—"}</b></div><div><span>Maior volume em um treino</span><b>${bestSession?formatN(bestSession)+" kg":"—"}</b></div><div><span>Exercícios registrados</span><b>${formatN(unique.size)}</b></div></div>`;
  }

  function prs(){
    const best={};
    progressSessions().forEach(s=>(s.exercises||[]).forEach(e=>(e.sets||[]).forEach(x=>{
      const kg=num(x.kg),reps=num(x.reps);
      if(!kg&&!reps)return;
      const name=e.name||"Exercício",current=best[name]||{maxKg:0,maxReps:0,bestVolume:0,maxKgDate:""};
      if(kg>current.maxKg){current.maxKg=kg;current.maxKgDate=s.date;}
      if(reps>current.maxReps)current.maxReps=reps;
      if(kg>0&&reps>0&&kg*reps>current.bestVolume)current.bestVolume=Math.round(kg*reps);
      best[name]=current;
    })));
    const entries=Object.entries(best).filter(([,v])=>v.maxKg||v.maxReps);
    if(!entries.length)return "<div class=\"empty\">Seus recordes aparecerão aqui quando você registrar cargas e repetições.</div>";
    return entries.sort((a,b)=>b[1].maxKg-a[1].maxKg).map(([name,v])=>{
      const date=v.maxKgDate?new Date(v.maxKgDate).toLocaleDateString("pt-BR"):"";
      return `<div class="pr-card"><div class="pr-card-head"><b>${esc(name)}</b>${date?`<span class="muted small">Melhor marca: ${date}</span>`:""}</div><div class="pr-grid"><div><span>Maior carga</span><b>${v.maxKg?v.maxKg+" kg":"—"}</b></div><div><span>Mais repetições</span><b>${v.maxReps||"—"}</b></div><div><span>Volume em uma série</span><b>${v.bestVolume?formatN(v.bestVolume)+" kg":"—"}</b></div></div></div>`;
    }).join("");
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
    const stats=weekStats(),recent=progressSessions().slice(-8).reverse(),exercises=allExercises();
    if(!window.__trincaSelectedExercise&&exercises.length)window.__trincaSelectedExercise=exercises[0];
    if(window.__trincaSelectedExercise&&!exercises.includes(window.__trincaSelectedExercise))window.__trincaSelectedExercise=exercises[0]||"";
    const selected=window.__trincaSelectedExercise||"",metric=lastMetric()||{},summary=selected?exerciseSummary(selected):null;
    c.innerHTML=`<div class="card"><h2>Resumo da semana</h2><div class="stats"><div class="stat"><b>${stats.sessions}</b><span class="small muted">treinos</span></div><div class="stat"><b>${stats.sets}</b><span class="small muted">séries</span></div><div class="stat"><b>${stats.volume.toLocaleString("pt-BR")}</b><span class="small muted">kg volume</span></div></div></div>
    ${workoutTrend()}
    <div class="card"><h3>📊 Estatísticas detalhadas</h3><div class="muted small">Resumo de todo o seu histórico deste perfil.</div>${detailedStats()}</div>
    <div class="card"><h3>Calendário · ${new Date().toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</h3><div class="calendar">${calendar()}</div></div>
    <div class="card"><h3>Peso e cintura</h3><div class="metric"><div><label>Peso (kg)</label><input id="peso" inputmode="decimal" placeholder="82,5" value="${esc(metric.weight||"")}"></div><div><label>Cintura (cm)</label><input id="cintura" inputmode="decimal" placeholder="88" value="${esc(metric.waist||"")}"></div></div><button class="primary" onclick="saveMetricEnhanced()">Salvar medidas</button>${chart()}</div>
    <div class="card"><h3>📈 Evolução por exercício</h3><div class="exercise-history-picker">${exercises.map(e=>`<button class="filter ${e===selected?"active":""}" data-exercise="${esc(e)}" onclick="selectExerciseEnhanced(this.dataset.exercise)">${esc(e)}</button>`).join("")||"<div class=\"empty\">Faça algum treino para criar o histórico.</div>"}</div>
      ${selected?`<div class="exercise-summary"><div class="exercise-summary-head"><strong>${esc(selected)}</strong><span class="muted small">${summary.sessions} treino${summary.sessions===1?"":"s"} · ${summary.sets} séries</span></div><div class="exercise-summary-grid"><div><span>Maior carga</span><b>${summary.maxKg?`${summary.maxKg} kg`:"—"}</b></div><div><span>Melhor repetição</span><b>${summary.bestReps||"—"}</b></div><div><span>Volume acumulado</span><b>${summary.volume?`${summary.volume.toLocaleString("pt-BR")} kg`:"—"}</b></div><div><span>RIR médio</span><b>${summary.rirAvg!=null?summary.rirAvg.toLocaleString("pt-BR"):"—"}</b></div></div></div>`:""}
      ${exerciseEvolution(selected)}
      ${exerciseHistory(selected)}
    </div>
    <div class="card"><h3>🏆 Recordes pessoais</h3>${prs()}</div>
    <div class="card"><h3>Últimos treinos</h3>${recent.length?recent.map(s=>`<div class="history"><b>Treino ${esc(s.code)}</b> · ${new Date(s.date).toLocaleDateString("pt-BR")}${s.durationSec!=null?` · ⏱️ ${fmt(s.durationSec)}`:""}</div>`).join(""):"<div class=\"empty\">Nenhum treino salvo ainda.</div>"}</div>
    <div class="card"><h3>Backup dos dados</h3><button class="secondary" onclick="exportDataEnhanced()">📤 Exportar</button><button class="secondary" onclick="document.getElementById(\"importFileEnhanced\").click()">📥 Importar</button><button class="secondary" onclick="clearDataEnhanced()">Limpar</button><input id="importFileEnhanced" type="file" accept="application/json,.json" hidden onchange="importDataEnhanced(event)"><div class="muted small">Exporte um arquivo antes de trocar de celular. A importação substitui os dados atuais.</div><div class="repdb-credit">Exercise data by <a href="https://repdb.co" target="_blank" rel="noopener">RepDB (repdb.co)</a>.</div></div>`;
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

  function collectWorkoutBackups(){
    const result={masculino:{},feminino:{}};
    ['masculino','feminino'].forEach(p=>{
      try{
        const saved=JSON.parse(localStorage.getItem(`treinoTrincaWorkouts_${p}`)||'{}');
        if(saved&&typeof saved==='object')result[p]=saved;
      }catch{}
    });
    return result;
  }

  function cloneSessions(){
    return Array.isArray(data.sessions)?data.sessions.map(s=>({
      ...s,
      exercises:Array.isArray(s.exercises)?s.exercises.map(e=>({
        ...e,
        sets:Array.isArray(e.sets)?e.sets.map(x=>({...x})):[]
      })):[]
    })):[];
  }

  function cloneMetrics(){
    return Array.isArray(data.metrics)?data.metrics.map(m=>({...m})):[];
  }

  function exportDataEnhanced(){
    const filename=`treino-trinca-backup-${new Date().toISOString().slice(0,10)}.json`;
    const payload={
      schemaVersion:3,
      exportedAt:new Date().toISOString(),
      profile,
      currentWorkout:current,
      data:{sessions:cloneSessions(),metrics:cloneMetrics()},
      workouts:collectWorkoutBackups()
    };
    const json=JSON.stringify(payload,null,2);

    if(window.AndroidBackup?.saveBackup){
      try{
        window.AndroidBackup.saveBackup(filename,json);
        return;
      }catch(error){
        console.warn('Exportação nativa indisponível; usando download do navegador.',error);
      }
    }

    const blob=new Blob([json],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function clearDraftStorage(){
    try{
      const prefixes=['treinoTrincaDraft_'];
      Object.keys(localStorage).forEach(key=>{
        if(prefixes.some(prefix=>key.startsWith(prefix)))localStorage.removeItem(key);
      });
    }catch{}
  }

  function importDataEnhanced(event){
    const file=event.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const imported=JSON.parse(reader.result);
        const source=imported?.data&&typeof imported.data==='object'?imported.data:imported;
        if(!Array.isArray(source.sessions)||!Array.isArray(source.metrics))throw Error();
        if(!confirm('Substituir seus dados atuais pelo backup?'))return;

        data={
          sessions:source.sessions.map(s=>({
            ...s,
            profile:s.profile||'masculino',
            exercises:Array.isArray(s.exercises)?s.exercises.map(e=>({
              ...e,
              sets:Array.isArray(e.sets)?e.sets.map(x=>({...x})):[]
            })):[]
          })),
          metrics:source.metrics.map(m=>({...m,profile:m.profile||'masculino'}))
        };

        if(imported?.workouts&&typeof imported.workouts==='object'){
          ['masculino','feminino'].forEach(p=>{
            const saved=imported.workouts[p];
            if(saved&&typeof saved==='object')localStorage.setItem(`treinoTrincaWorkouts_${p}`,JSON.stringify(saved));
            else localStorage.setItem(`treinoTrincaWorkouts_${p}`,'{}');
          });
        }

        if(imported?.profile==='masculino'||imported?.profile==='feminino'){
          localStorage.setItem(profileKey,imported.profile);
          const importedCurrent=typeof imported.currentWorkout==='string'?imported.currentWorkout:'';
          if(importedCurrent)localStorage.setItem(currentKey(imported.profile),importedCurrent);
        }

        localStorage.setItem(stateKey,JSON.stringify(data));
        localStorage.removeItem(activeKey);
        localStorage.removeItem(restEndKey);
        clearDraftStorage();
        window.__trincaSelectedExercise='';

        alert(`Backup importado com sucesso! ${data.sessions.length} treino(s) recuperado(s).`);
        location.reload();
      }catch(error){
        console.warn('Importação de backup falhou:',error);
        alert('Arquivo de backup inválido.');
      }finally{
        const input=document.getElementById('importFileEnhanced');
        if(input)input.value='';
      }
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