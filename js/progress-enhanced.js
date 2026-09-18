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

  function exportDataEnhanced(){
    const payload={
      schemaVersion:2,
      exportedAt:new Date().toISOString(),
      profile,
      currentWorkout:current,
      data:{
        sessions:Array.isArray(data.sessions)?data.sessions.map(s=>({...s,exercises:Array.isArray(s.exercises)?s.exercises.map(e=>({...e,sets:Array.isArray(e.sets)?e.sets.map(x=>({...x})):[]})):[]})):[],
        metrics:Array.isArray(data.metrics)?data.metrics.map(m=>({...m})):[],
      },
      workouts:collectWorkoutBackups()
    };
    const json=JSON.stringify(payload,null,2);
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    a.download=`treino-trinca-backup-2026-09-18.json`;
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
        const source=imported?.data&&typeof imported.data==='object'?imported.data:imported;
        if(!Array.isArray(source.sessions)||!Array.isArray(source.metrics))throw Error();
        if(!confirm('Substituir seus dados atuais pelo backup?'))return;
        data={
          sessions:source.sessions.map(s=>({...s,profile:s.profile||'masculino',exercises:Array.isArray(s.exercises)?s.exercises.map(e=>({...e,sets:Array.isArray(e.sets)?e.sets.map(x=>({...x})):[]})):[]})),
          metrics:source.metrics.map(m=>({...m,profile:m.profile||'masculino'}))
        };
        if(imported?.workouts&&typeof imported.workouts==='object'){
          ['masculino','feminino'].forEach(p=>{
            const saved=imported.workouts[p];
            if(saved&&typeof saved==='object')localStorage.setItem(`treinoTrincaWorkouts_${p}`,JSON.stringify(saved));
          });
        }
        window.__trincaSelectedExercise='';
        localStorage.setItem(stateKey,JSON.stringify(data));
        renderProgressEnhanced(content);
        alert(`Backup importado com sucesso! ${data.sessions.length} treino(s) e ${data.sessions.reduce((n,s)=>n+(Array.isArray(s.exercises)?s.exercises.length:0),0)} exercício(s) recuperados.`);
      }catch{alert('Arquivo de backup inválido.');}
    };
    reader.readAsText(file);
  }

  function clearDataEnhanced(){
    if(confirm('Apagar todo o histórico?')){
      data={sessions:[],metrics:[]};