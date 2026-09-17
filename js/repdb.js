const RepDB = (() => {
  const URL = 'https://exercise-dataset.com/exercises.json';
  let exercises = [];
  let byId = new Map();
  let loaded = false;
  let failed = false;

  async function load() {
    if (loaded || failed) return exercises;
    try {
      const response = await fetch(URL, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`RepDB HTTP ${response.status}`);
      const json = await response.json();
      exercises = Array.isArray(json.exercises) ? json.exercises : [];
      byId = new Map(exercises.map(ex => [ex.id, ex]));
      loaded = true;
    } catch (error) {
      failed = true;
      console.warn('RepDB não pôde ser carregado:', error);
    }
    return exercises;
  }

  function get(id) { return byId.get(id) || null; }

  function candidates(ids) {
    for (const id of (ids || [])) {
      const ex = get(id);
      if (ex) return ex;
    }
    return null;
  }

  function image(ex, phase = 'peak') {
    if (!ex?.images?.flat) return '';
    const path = ex.images.flat[phase] || ex.images.flat.main || ex.images.flat.peak || ex.images.flat.start;
    return path ? `https://exercise-dataset.com/${path}` : '';
  }

  function text(value) {
    return Array.isArray(value) ? value.join(' ') : (value || '');
  }

  function label(value) {
    return String(value || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function search(query = '', body = '', equipment = '') {
    const q = query.trim().toLowerCase();
    return exercises.filter(ex => {
      if (body && ex.body_part !== body) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (!q) return true;
      const haystack = [
        ex.id, ex.name_en, ex.name_de, ex.name_es,
        ex.description_en, ex.equipment, ex.body_part,
        ...(ex.primary_muscles || []), ...(ex.secondary_muscles || []),
        ...(ex.tags || []), ...(ex.goals || [])
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  return {
    URL,
    load,
    get,
    candidates,
    image,
    text,
    label,
    search,
    get loaded() { return loaded; },
    get failed() { return failed; },
    get exercises() { return exercises; }
  };
})();
