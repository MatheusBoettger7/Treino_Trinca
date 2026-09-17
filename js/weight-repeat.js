(function(){
  const originalSave = typeof window.saveDraft === 'function' ? window.saveDraft : null;

  function getDraft(){
    try{
      const profile=localStorage.getItem('treinoTrincaProfile')||'masculino';
      const current=localStorage.getItem(`treinoTrincaCurrent_${profile}`)||'';
      const key=`treinoTrincaDraft_${profile}_${current}`;
      return {key,data:JSON.parse(localStorage.getItem(key)||'{}')};
    }catch{return {key:'',data:{}}}
  }

  function saveDraftData(draft){
    if(draft.key)localStorage.setItem(draft.key,JSON.stringify(draft.data));
  }

  function fieldInputRepeat(el){
    const draft=getDraft();
    const k=`${el.dataset.e}_${el.dataset.s}`;
    draft.data[k]={...(draft.data[k]||{}),[el.dataset.f]:el.value};
    saveDraftData(draft);
  }

  function repeatWhenFinished(el){
    if(!el || !el.dataset?.e || !el.dataset?.s || !el.dataset?.f)return;
    const value=String(el.value||'').trim();
    if(!value)return;

    const draft=getDraft();
    const exercise=String(el.dataset.e);
    const field=String(el.dataset.f);
    const sets=[...document.querySelectorAll(`input[data-e="${CSS.escape(exercise)}"][data-f="${CSS.escape(field)}"]`)];

    sets.forEach(input=>{
      if(input===el)return;
      if(String(input.value||'').trim())return;

      input.value=value;
      const k=`${input.dataset.e}_${input.dataset.s}`;
      draft.data[k]={...(draft.data[k]||{}),[field]:value};
    });

    saveDraftData(draft);
  }

  window.fieldInput=fieldInputRepeat;

  document.addEventListener('blur',function(ev){
    const el=ev.target;
    if(el?.matches?.('input[data-e][data-s][data-f]'))repeatWhenFinished(el);
  },true);

  document.addEventListener('keydown',function(ev){
    const el=ev.target;
    if(!el?.matches?.('input[data-e][data-s][data-f]'))return;
    if(ev.key==='Enter'){
      ev.preventDefault();
      repeatWhenFinished(el);
      el.blur();
    }
  },true);
})();
