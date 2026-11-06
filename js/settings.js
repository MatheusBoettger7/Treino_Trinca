function setPreferredRestDuration(seconds){if(![60,90,120].includes(seconds))return;localStorage.setItem('treinoTrincaRestDuration',String(seconds));renderSettings(document.getElementById('content'));}
function renderSettings(c){
 const theme=typeof getTheme==='function'?getTheme():'red';
 const rest=typeof getRestDuration==='function'?getRestDuration():120;
 const p=typeof profiles==='object'?profiles:{};
 const currentProfile=localStorage.getItem('treinoTrincaProfile')||'masculino';
 const sessions=(()=>{try{const d=JSON.parse(localStorage.getItem('treinoTrincaData')||'{}');return(d.sessions||[]).filter(x=>(x.profile||'masculino')===currentProfile).length}catch(e){return 0}})();
 const themeButtons=['red','blue'].map(t=>'<button class="theme-setting '+(theme===t?'selected':'')+'" onclick="applyTheme(&#39;'+t+'&#39;);renderSettings(document.getElementById(&#39;content&#39;))"><span class="theme-dot '+(t==='red'?'red-dot':'blue-dot')+'"></span>'+(t==='red'?'Vermelho':'Azul')+'</button>').join('');
 const restButtons=[60,90,120].map(v=>'<button class="secondary '+(rest===v?'active':'')+'" onclick="setPreferredRestDuration('+v+')">'+v+'s</button>').join('');
 const profileButtons=Object.keys(p).map(k=>'<button class="listbtn '+(currentProfile===k?'selected-workout':'')+'" onclick="switchProfile(&#39;'+k+'&#39;)">'+p[k].emoji+' '+p[k].label+(currentProfile===k?' · Atual':'')+'</button>').join('');
 c.innerHTML='<div class="card settings-header"><h2>⚙️ Configurações</h2><p class="muted small">Personalize o Treino Trinca para sua rotina.</p></div>'+
 '<h3 class="section-title">Aparência</h3><div class="card settings-card"><b>Tema do aplicativo</b><div class="muted small">Escolha a cor principal da interface</div><div class="settings-theme-options">'+themeButtons+'</div></div>'+
 '<h3 class="section-title">Treinamento</h3><div class="card settings-card"><b>Descanso padrão entre séries</b><div class="muted small">Usado quando o exercício não tiver intervalo próprio.</div><div class="settings-rest-options">'+restButtons+'</div><div class="settings-note">Os intervalos específicos de cada exercício aparecem na ficha.</div></div>'+
 '<h3 class="section-title">Perfil de treino</h3><div class="card settings-card"><div class="muted small">Alterne entre programas sem apagar o histórico dos outros perfis.</div>'+profileButtons+'</div>'+
 '<h3 class="section-title">Dados e progresso</h3><div class="card settings-card"><div class="settings-row"><div><b>Histórico de treinos</b><div class="muted small">'+sessions+' treinos neste perfil</div></div><button class="secondary compact-btn" onclick="show(&#39;prog&#39;)">Ver</button></div><div class="settings-note">Seus registros, cargas e repetições permanecem salvos neste dispositivo.</div></div>'+
 '<h3 class="section-title">Sobre</h3><div class="card settings-card"><div class="settings-row"><b>Treino Trinca</b><span class="muted small">v2026.11.06.82</span></div><div class="settings-note">Versão experimental. O programa Equipe A7 é independente dos treinos atuais.</div></div>';
}
(function(){
 if(typeof window.renderWorkout==='function'){
  const original=window.renderWorkout;
  window.renderWorkout=function(c){original(c);const w=workouts?.[current];const hero=c.querySelector('.hero');if(w?.description&&hero){const d=document.createElement('div');d.className='workout-description';d.textContent=w.description;hero.appendChild(d)}if(w?.items){w.items.forEach((item,i)=>{if(!item.group)return;const cards=c.querySelectorAll('.exercise');const card=cards[i];if(card){const tag=document.createElement('span');tag.className='badge exercise-group';tag.textContent=item.group;card.prepend(tag)}})}};
 }
})();
