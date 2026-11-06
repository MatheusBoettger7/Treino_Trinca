function setPreferredRestDuration(seconds){
 if(![60,90,120].includes(seconds))return;
 localStorage.setItem('treinoTrincaRestDuration',String(seconds));
 renderSettings(document.getElementById('content'));
}
function renderSettings(c){
 const theme=getTheme();
 const rest=getRestDuration();
 const p=profiles;
 const currentProfile=profile;
 const sessionsCount=sessions().length;
 const themeButtons=['red','blue'].map(t=>'<button class="theme-setting '+(theme===t?'selected':'')+'" onclick="applyTheme(&#39;'+t+'&#39;);renderSettings(document.getElementById(&#39;content&#39;))"><span class="theme-dot '+(t==='red'?'red-dot':'blue-dot')+'"></span>'+(t==='red'?'Vermelho':'Azul')+'</button>').join('');
 const restButtons=[60,90,120].map(v=>'<button class="secondary '+(rest===v?'active':'')+'" onclick="setPreferredRestDuration('+v+')">'+v+'s</button>').join('');
 const profileButtons=Object.keys(p).map(k=>'<button class="listbtn '+(currentProfile===k?'selected-workout':'')+'" onclick="switchProfile(&#39;'+k+'&#39;)">'+p[k].emoji+' '+p[k].label+(currentProfile===k?' · Atual':'')+'</button>').join('');
 c.innerHTML='<div class="card settings-header"><h2>⚙️ Configurações</h2><p class="muted small">Personalize o Treino Trinca para sua rotina.</p></div>'+
 '<h3 class="section-title">Aparência</h3><div class="card settings-card"><b>Tema do aplicativo</b><div class="muted small">Escolha a cor principal da interface</div><div class="settings-theme-options">'+themeButtons+'</div></div>'+
 '<h3 class="section-title">Treinamento</h3><div class="card settings-card"><b>Descanso padrão entre séries</b><div class="muted small">Usado quando o exercício não tiver intervalo próprio.</div><div class="settings-rest-options">'+restButtons+'</div><div class="settings-note">Os intervalos específicos de cada exercício aparecem na ficha.</div></div>'+
 '<h3 class="section-title">Perfil de treino</h3><div class="card settings-card"><div class="muted small">Alterne entre os programas sem apagar o histórico dos outros perfis.</div>'+profileButtons+'</div>'+
 '<h3 class="section-title">Biblioteca</h3><div class="card settings-card settings-library-card"><div><b>Biblioteca de exercícios</b><div class="muted small">Pesquise o catálogo de exercícios, consulte os movimentos e encontre referências para montar seus treinos.</div></div><button class="secondary" onclick="show(&#39;exercicios&#39;)">🏋️ Abrir exercícios</button></div>'+'<h3 class="section-title">Dados e progresso</h3><div class="card settings-card"><div class="settings-row"><div><b>Histórico de treinos</b><div class="muted small">'+sessionsCount+' treinos neste perfil</div></div><button class="secondary compact-btn" onclick="show(&#39;prog&#39;)">Ver</button></div><div class="settings-note">Seus registros, cargas e repetições permanecem salvos neste dispositivo.</div></div>'+
 '<h3 class="section-title">Backup e dados</h3><div class="card settings-card settings-backup-card"><b>Backup completo</b><div class="muted small">Exporte seus dados para guardar uma cópia ou importe um arquivo para restaurar o aplicativo.</div><div class="settings-backup-actions"><button class="secondary" onclick="exportDataEnhanced()">📤 Exportar backup</button><button class="secondary" onclick="openImportFileEnhanced()">📥 Importar backup</button><button class="secondary" onclick="clearDataEnhanced()">Limpar histórico</button></div><input id="importFileEnhanced" type="file" accept="application/json,.json" hidden onchange="importDataEnhanced(event)"><div class="settings-note">O backup inclui histórico, medidas, treinos personalizados e configurações. A importação substitui os dados atuais.</div></div>'+
 '<h3 class="section-title">Sobre</h3><div class="card settings-card settings-about-card"><div class="settings-about-brand">Treino Trinca</div><p class="settings-about-description">Seu espaço para planejar, registrar e acompanhar cada etapa da sua evolução. Organize seus programas de treino, escolha o tema que combina com você, ajuste os intervalos de descanso e registre cargas e repetições para acompanhar seu progresso.</p><p class="settings-about-description">Consistência se constrói treino após treino. Consulte seu histórico, compare sua evolução e mantenha uma cópia dos seus dados com as opções de backup e restauração.</p><div class="settings-about-signoff">Treine no seu ritmo. Evolua a cada série.</div></div>';
}
(function(){
 if(typeof window.renderWorkout!=='function')return;
 const original=window.renderWorkout;
 window.renderWorkout=function(c){
  original(c);
  const w=workouts?.[current];
  const hero=c.querySelector('.hero');
  if(w?.description&&hero){
   const key='treinoTrincaDescriptionOpen_'+profile+'_'+current;
   const saved=localStorage.getItem(key);
   const details=document.createElement('details');
   details.className='workout-description-disclosure';
   details.open=saved===null?!activeWorkout():saved==='1';
   const summary=document.createElement('summary');
   summary.textContent='Orientações do treino';
   const body=document.createElement('div');
   body.className='workout-description-content';
   body.textContent=w.description;
   details.appendChild(summary);
   details.appendChild(body);
   details.addEventListener('toggle',()=>localStorage.setItem(key,details.open?'1':'0'));
   hero.appendChild(details);
  }
  if(w?.items){
   w.items.forEach((item,i)=>{
    if(!item.group)return;
    const card=c.querySelectorAll('.exercise')[i];
    if(card){
     const tag=document.createElement('span');
     tag.className='badge exercise-group';
     tag.textContent=item.group;
     card.prepend(tag);
    }
   });
  }
 };
})();
