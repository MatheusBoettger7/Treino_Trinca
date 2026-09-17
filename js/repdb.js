const RepDB = (() => {
  const URL = 'https://huggingface.co/datasets/RepDB/exercise-dataset/raw/main/exercises.json';
  let exercises = [];
  let byId = new Map();
  let loaded = false;
  let failed = false;
  let loading = null;

  async function load() {
    if (loaded) return exercises;
    if (loading) return loading;
    failed = false;
    loading = (async () => {
      try {
        const response = await fetch(URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`RepDB HTTP ${response.status}`);
        const json = await response.json();
        exercises = Array.isArray(json.exercises) ? json.exercises : [];
        byId = new Map(exercises.map(ex => [ex.id, ex]));
        loaded = exercises.length > 0;
        if (!loaded) throw new Error('Catálogo RepDB vazio');
      } catch (error) {
        failed = true;
        console.warn('RepDB não pôde ser carregado:', error);
      } finally {
        loading = null;
      }
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
      return typeof RepDBPTBR !== 'undefined' ? RepDBPTBR.matches(ex, query) : [ex.id, ex.name_en, ex.name_de, ex.name_es, ex.description_en, ex.equipment, ex.body_part, ...(ex.primary_muscles || []), ...(ex.secondary_muscles || []), ...(ex.tags || []), ...(ex.goals || [])].join(' ').toLowerCase().includes(query.trim().toLowerCase());
    });
  }
  return { URL, load, get, candidates, image, text, label, localized, name, search, get loaded() { return loaded; }, get failed() { return failed; }, get exercises() { return exercises; } };
})();
