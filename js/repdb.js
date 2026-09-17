document.getElementById('appVersion')?.replaceChildren(document.createTextNode('v2026.09.17.10'));
const RepDB = (() => {
  const URL = 'https://huggingface.co/datasets/RepDB/exercise-dataset/raw/main/exercises.json';
  let exercises = [];
  let byId = new Map();
  let loaded = false;
  let failed = false;
  let loading = null;
  let ptbrLoading = null;

  function ensurePtBr() {
    if (typeof RepDBPTBR !== 'undefined') return Promise.resolve();
    if (ptbrLoading) return ptbrLoading;
    ptbrLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './js/repdb-ptbr.js?v=1';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    }).catch(error => console.warn('Camada PT-BR não pôde ser carregada:', error));
    return ptbrLoading;
  }

  function applyPortuguese(data) {
    if (typeof RepDBPTBR === 'undefined') return data;
    data.forEach(ex => {
      if (ex.__trincaPtBr) return;
      ex.__trincaPtBr = { name: ex.name_en, description: ex.description_en, instructions: Array.isArray(ex.instructions_en) ? ex.instructions_en.slice() : [], tips: Array.isArray(ex.tips_en) ? ex.tips_en.slice() : [] };
      const pt = RepDBPTBR.localized(ex);
      ex.name_en = pt.name || ex.name_en;
      ex.description_en = pt.description || ex.description_en;
      ex.instructions_en = pt.instructions?.length ? pt.instructions : ex.instructions_en;
      ex.tips_en = pt.tips?.length ? pt.tips : ex.tips_en;
    });
    return data;
  }

  async function load() {
    if (loaded) return exercises;
    if (loading) return loading;
    failed = false;
    loading = (async () => {
      try {
        await ensurePtBr();
        const response = await fetch(URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`RepDB HTTP ${response.status}`);
        const json = await response.json();
        exercises = Array.isArray(json.exercises) ? json.exercises : [];
        applyPortuguese(exercises);
        byId = new Map(exercises.map(ex => [ex.id, ex]));
        loaded = exercises.length > 0;
        if (!loaded) throw new Error('Catálogo RepDB vazio');
      } catch (error) {
        failed = true;
        console.warn('RepDB não pôde ser carregado:', error);
      } finally { loading = null; }
      return exercises;
    })();
    return loading;
  }

  function get(id) { return byId.get(id) || null; }
  function candidates(ids) { for (const id of (ids || [])) { const ex = get(id); if (ex) return ex; } return null; }
  function image(ex, phase = 'peak') {
    if (!ex?.images?.flat) return '';
    const path = ex.images.flat[phase] || ex.images.flat.main || ex.images.flat.peak || ex.images.flat.start;
    return path ? `https://exercise-dataset.com/${path}` : '';
  }
  function text(value) { return Array.isArray(value) ? value.join(' ') : (value || ''); }
  function label(value) { return typeof RepDBPTBR !== 'undefined' ? RepDBPTBR.label(value) : String(value || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
  function localized(ex) { return typeof RepDBPTBR !== 'undefined' ? RepDBPTBR.localized(ex) : { name: ex?.name_en || ex?.id || '', description: ex?.description_en || '', instructions: ex?.instructions_en || [], tips: ex?.tips_en || [], bodyPart: label(ex?.body_part), equipment: ex?.equipment || '', primaryMuscles: (ex?.primary_muscles || []).map(label), secondaryMuscles: (ex?.secondary_muscles || []).map(label) }; }
  function name(ex) { return localized(ex).name; }
  function search(query = '', body = '', equipment = '') {
    return exercises.filter(ex => {
      if (body && ex.body_part !== body) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (!query.trim()) return true;
      const original = ex.__trincaPtBr || {};
      const haystack = [ex.id, original.name, original.description, ...(original.instructions || []), ...(original.tips || []), ex.name_en, ex.description_en, ...(ex.instructions_en || []), ...(ex.tips_en || []), ex.name_de, ex.name_es, ex.equipment, ex.body_part, ...(ex.primary_muscles || []), ...(ex.secondary_muscles || []), ...(ex.tags || []), ...(ex.goals || []), label(ex.equipment), label(ex.body_part), ...(ex.primary_muscles || []).map(label), ...(ex.secondary_muscles || []).map(label)].join(' ');
      const normalized = typeof RepDBPTBR !== 'undefined' ? RepDBPTBR.normalize(haystack) : haystack.toLowerCase();
      return String(query).trim().toLowerCase().split(/\s+/).every(term => normalized.includes(term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
    });
  }
  return { URL, load, get, candidates, image, text, label, localized, name, search, get loaded() { return loaded; }, get failed() { return failed; }, get exercises() { return exercises; } };
})();
