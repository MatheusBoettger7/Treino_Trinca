(function(){
  function updateStickyMetrics(){
    const top=document.querySelector('.top');
    const tabs=document.querySelector('.tabs');
    if(top)document.documentElement.style.setProperty('--top-sticky-h',Math.ceil(top.getBoundingClientRect().height)+'px');
    if(tabs)document.documentElement.style.setProperty('--tabs-sticky-h',Math.ceil(tabs.getBoundingClientRect().height)+'px');
  }

  function updateScrollState(){
    const hasWorkoutTimer=!!document.querySelector('.workout-timer-card');
    document.body.classList.toggle('layout-scrolled',hasWorkoutTimer && window.scrollY>90);
  }

  function updateLayout(){
    updateStickyMetrics();
    updateScrollState();
  }

  window.addEventListener('scroll',updateScrollState,{passive:true});
  window.addEventListener('resize',updateLayout);

  const observeTarget=document.getElementById('content');
  if(window.ResizeObserver){
    const observer=new ResizeObserver(updateStickyMetrics);
    const top=document.querySelector('.top');
    const tabs=document.querySelector('.tabs');
    if(top)observer.observe(top);
    if(tabs)observer.observe(tabs);
  }

  if(observeTarget){
    new MutationObserver(function(){
      requestAnimationFrame(updateLayout);
    }).observe(observeTarget,{childList:true,subtree:true});
  }

  updateLayout();
})();