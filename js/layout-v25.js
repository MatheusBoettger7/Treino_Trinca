(function(){
  function getScrollTop(){
    const se=document.scrollingElement;
    const body=document.body;
    const vv=window.visualViewport;
    return Math.max(
      Number(window.scrollY)||0,
      Number(se?.scrollTop)||0,
      Number(body?.scrollTop)||0,
      Number(vv?.pageTop)||0
    );
  }

  function updateStickyMetrics(){
    const top=document.querySelector('.top');
    const tabs=document.querySelector('.tabs');
    if(top)document.documentElement.style.setProperty('--top-sticky-h',Math.ceil(top.getBoundingClientRect().height)+'px');
    if(tabs)document.documentElement.style.setProperty('--tabs-sticky-h',Math.ceil(tabs.getBoundingClientRect().height)+'px');
  }

  let frame=0;
  function updateScrollState(){
    if(frame)return;
    frame=requestAnimationFrame(function(){
      frame=0;
      const hasWorkoutTimer=!!document.querySelector('.workout-timer-card');
      const scrolled=hasWorkoutTimer && getScrollTop()>90;
      document.documentElement.classList.toggle('layout-scrolled',scrolled);
      document.body.classList.toggle('layout-scrolled',scrolled);
    });
  }

  function updateLayout(){
    updateStickyMetrics();
    updateScrollState();
  }

  window.addEventListener('scroll',updateScrollState,{passive:true});
  document.addEventListener('scroll',updateScrollState,{passive:true,capture:true});
  document.scrollingElement?.addEventListener('scroll',updateScrollState,{passive:true});
  window.visualViewport?.addEventListener('scroll',updateScrollState,{passive:true});
  window.addEventListener('resize',updateLayout);
  window.addEventListener('orientationchange',updateLayout);

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