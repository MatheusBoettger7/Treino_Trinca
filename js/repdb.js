const RepDB = (() => {
  const URL = 'https://raw.githubusercontent.com/gugeldev/exercicios-bd-ptbr/main/exercises/exercises-ptbr-full-translation.json';
  const IMAGE_BASE = 'https://exercise-dataset.com/';
  const IMAGE_MAP_URL = './data/repdb-image-map.json';
  let exercises = [];
  let byId = new Map();
  let loaded = false;
  let failed = false;
  let loading = null;
  let imageMap = null;
  let imageMapLoading = null;

  function slug(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizeExercise(ex) {
    const images = Array.isArray(ex.images) ? ex.images : [];
    const startPath = images.find(x => /\/0\.jpg$/i.test(x)) || images[0] || '';
    const peakPath = images.find(x => /\/1\.jpg$/i.test(x)) || images[1] || startPath;

    return {
      id: ex.id,
      name_en: ex.name || ex.id,
      description_en: Array.isArray(ex.instructions) && ex.instructions.length ? ex.instructions[0] : '',
      instructions_en: Array.isArray(ex.instructions) ? ex.instructions.slice() : [],
      tips_en: [],
      category: ex.category || '',
      difficulty: ex.level || '',
      force_type: ex.force || '',
      mechanic: ex.mechanic || '',
      equipment: ex.equipment || '',
      body_part: '',
      primary_muscles: Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles.slice() : [],
      secondary_muscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles.slice() : [],
      goals: [],
      tags: [],
      __ptbr: true,
      __images: { start: startPath, peak: peakPath }
    };
  }

  function indexExercise(ex) {
    byId.set(ex.id, ex);
    byId.set(slug(ex.id), ex);
    const imagePath = ex.__images?.start || '';
    const imageId = imagePath.split('/')[0];
    if (imageId) {
      byId.set(imageId, ex);
      byId.set(slug(imageId), ex);
    }
  }

  async function loadImageMap() {
    if (imageMap) return imageMap;
    if (imageMapLoading) return imageMapLoading;
    imageMapLoading = fetch(IMAGE_MAP_URL, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .catch(() => null)
      .then(value => { imageMap = value; return imageMap; });
    return imageMapLoading;
  }

  async function load() {
    if (loaded) return exercises;
    if (loading) return loading;

    failed = false;
    loading = (async () => {
      try {
        await loadImageMap();
        const response = await fetch(URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('PT-BR HTTP ' + response.status);

        const json = await response.json();
        if (!Array.isArray(json)) throw new Error('Dataset PT-BR inválido');

        exercises = json.map(normalizeExercise).filter(ex => ex.id && ex.name_en);
        byId = new Map();
        exercises.forEach(indexExercise);

        loaded = exercises.length > 0;
        if (!loaded) throw new Error('Catálogo PT-BR vazio');
      } catch (error) {
        failed = true;
        console.warn('Base de exercícios PT-BR não pôde ser carregada:', error);
      } finally {
        loading = null;
      }

      return exercises;
    })();

    return loading;
  }

  function get(id) {
    return byId.get(id) || byId.get(slug(id)) || null;
  }

  function candidates(ids) {
    for (const id of (ids || [])) {
      const ex = get(id);
      if (ex) return ex;
    }
    return null;
  }

  function image(ex, phase = 'peak') {
    if (!ex) return '';

    const local = imageMap?.exercises?.[ex.id]?.images || {};
    const localPath = local[phase] || local.peak || local.start || local.main;
    if (localPath) return localPath;

    if (!ex.__images) return '';
    const path = phase === 'start' ? ex.__images.start : ex.__images.peak;
    return path ? IMAGE_BASE + path : '';
  }

  function text(value) {
    return Array.isArray(value) ? value.join(' ') : (value || '');
  }

  function label(value) {
    const labels = {
      'peso-do-corpo': 'Peso corporal',
      'maquina': 'Máquina',
      'halteres': 'Halteres',
      'barra': 'Barra',
      'cabo': 'Cabo',
      'barra-w': 'Barra W',
      'kettlebells': 'Kettlebells',
      'faixa': 'Faixa elástica',
      'forca': 'Força',
      'alongamento': 'Alongamento',
      'cardio': 'Cardio',
      'pliometria': 'Pliometria',
      'iniciante': 'Iniciante',
      'intermediario': 'Intermediário',
      'avancado': 'Avançado',
      'composto': 'Composto',
      'isolado': 'Isolado',
      'abdominais': 'Abdômen',
      'peito': 'Peito',
      'ombros': 'Ombros',
      'triceps': 'Tríceps',
      'biceps': 'Bíceps',
      'gluteos': 'Glúteos',
      'isquiotibiais': 'Posteriores de coxa',
      'quadriceps': 'Quadríceps',
      'panturrilhas': 'Panturrilhas',
      'dorsais': 'Dorsais',
      'antebracos': 'Antebraços',
      'trapezio': 'Trapézio'
    };
    return labels[String(value || '')] || String(value || '').replace(/_/g, ' ');
  }

  function localized(ex) {
    if (!ex) return {
      name: '',
      description: '',
      instructions: [],
      tips: [],
      bodyPart: '',
      equipment: '',
      primaryMuscles: [],
      secondaryMuscles: []
    };

    return {
      name: ex.name_en || ex.id || '',
      description: ex.description_en || '',
      instructions: ex.instructions_en || [],
      tips: ex.tips_en || [],
      bodyPart: ex.body_part || '',
      equipment: label(ex.equipment),
      primaryMuscles: (ex.primary_muscles || []).map(label),
      secondaryMuscles: (ex.secondary_muscles || []).map(label)
    };
  }

  function name(ex) {
    return ex?.name_en || ex?.id || '';
  }

  function search(query = '', body = '', equipment = '') {
    const q = String(query || '').trim().toLowerCase();
    return exercises.filter(ex => {
      if (body && ex.body_part !== body) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (!q) return true;

      const haystack = [
        ex.id,
        ex.name_en,
        ex.description_en,
        ...(ex.instructions_en || []),
        ...(ex.primary_muscles || []),
        ...(ex.secondary_muscles || []),
        ex.equipment,
        ex.category,
        ex.difficulty
      ].join(' ').toLowerCase();

      return q.split(/\s+/).every(term => haystack.includes(term));
    });
  }

  return {
    URL,
    IMAGE_MAP_URL,
    load,
    get,
    candidates,
    image,
    text,
    label,
    localized,
    name,
    search,
    get loaded() { return loaded; },
    get failed() { return failed; },
    get exercises() { return exercises; }
  };
})();