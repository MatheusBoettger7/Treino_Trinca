(() => {
  if (typeof RepDB === 'undefined' || typeof RepDBPTBR === 'undefined') return;

  const originalLoad = RepDB.load;
  let installed = false;

  function applyPortuguese(exercises) {
    if (installed) return exercises;
    exercises.forEach(ex => {
      if (ex.__trincaPtBr) return;
      ex.__trincaPtBr = {
        name: ex.name_en,
        description: ex.description_en,
        instructions: Array.isArray(ex.instructions_en) ? ex.instructions_en.slice() : [],
        tips: Array.isArray(ex.tips_en) ? ex.tips_en.slice() : []
      };
      const pt = RepDBPTBR.localized(ex);
      ex.name_en = pt.name || ex.name_en;
      ex.description_en = pt.description || ex.description_en;
      ex.instructions_en = pt.instructions?.length ? pt.instructions : ex.instructions_en;
      ex.tips_en = pt.tips?.length ? pt.tips : ex.tips_en;
    });
    installed = true;
    return exercises;
  }

  RepDB.load = async function() {
    const result = await originalLoad();
    return applyPortuguese(result);
  };

  RepDB.label = value => RepDBPTBR.label(value);

  RepDB.search = function(query = '', body = '', equipment = '') {
    const q = String(query || '').trim();
    return RepDB.exercises.filter(ex => {
      if (body && ex.body_part !== body) return false;
      if (equipment && ex.equipment !== equipment) return false;
      if (!q) return true;
      const original = ex.__trincaPtBr || {};
      const haystack = [
        ex.id, original.name, original.description,
        ...(original.instructions || []), ...(original.tips || []),
        ex.name_en, ex.description_en, ...(ex.instructions_en || []), ...(ex.tips_en || []),
        ex.name_de, ex.name_es, ex.equipment, ex.body_part,
        ...(ex.primary_muscles || []), ...(ex.secondary_muscles || []),
        ...(ex.tags || []), ...(ex.goals || []), RepDBPTBR.label(ex.equipment), RepDBPTBR.label(ex.body_part),
        ...(ex.primary_muscles || []).map(RepDBPTBR.label), ...(ex.secondary_muscles || []).map(RepDBPTBR.label)
      ].join(' ');
      const normalized = RepDBPTBR.normalize(haystack);
      const terms = RepDBPTBR.normalize(q).split(/\s+/).filter(Boolean);
      return terms.every(term => normalized.includes(term));
    });
  };

  if (RepDB.loaded) applyPortuguese(RepDB.exercises);
})();
