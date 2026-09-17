(() => {
  if (typeof RepDB === 'undefined') return;

  const special = {
    'ball-leg-curl': 'Flexão de pernas na bola suíça',
    'banded-hip-thrust': 'Elevação pélvica com faixa elástica',
    'banded-kneeling-hip-thrust': 'Elevação pélvica ajoelhado com faixa elástica',
    'barbell-calf-raise': 'Panturrilha em pé com barra',
    'barbell-front-raise': 'Elevação frontal com barra',
    'barbell-hip-thrust': 'Elevação pélvica com barra',
    'arnold-press': 'Desenvolvimento Arnold',
    'archer-pull-ups': 'Barra fixa arqueiro',
    'archer-push-ups': 'Flexão arqueiro',
    'assisted-dips': 'Mergulho assistido na máquina',
    'assisted-pull-ups': 'Barra fixa assistida',
    'ball-pike': 'Pike com bola suíça',
    'stability-ball-hip-bridge': 'Elevação pélvica na bola suíça',
    'stability-ball-knee-tuck': 'Flexão de joelhos na bola suíça',
    'stability-ball-push-up': 'Flexão de braços na bola suíça',
    'stability-ball-push-up-hands-on-ball': 'Flexão de braços com as mãos na bola suíça',
    'stability-ball-wall-squat': 'Agachamento na parede com bola suíça'
  };

  const replacements = [
    [/\bCurl de Piernas\b/gi, 'Flexão de pernas'], [/\bCurl de Pierna\b/gi, 'Flexão de perna'],
    [/\bCurl de Bíceps\b/gi, 'Rosca de bíceps'], [/\bCurl de Muñeca\b/gi, 'Rosca de punho'],
    [/\bCurl de Martillo\b/gi, 'Rosca martelo'], [/\bCurl de Concentración\b/gi, 'Rosca concentrada'],
    [/\bCurl de\b/gi, 'Rosca de'], [/\bEmpuje de Cadera\b/gi, 'Elevação pélvica'],
    [/\bEmpuje de Glúteo\b/gi, 'Elevação de glúteos'], [/\bElevación de Talones\b/gi, 'Panturrilha'],
    [/\bElevación Frontal\b/gi, 'Elevação frontal'], [/\bElevación Lateral\b/gi, 'Elevação lateral'],
    [/\bElevación Posterior\b/gi, 'Elevação posterior'], [/\bElevación de Piernas\b/gi, 'Elevação de pernas'],
    [/\bElevación de Pierna\b/gi, 'Elevação de perna'], [/\bExtensión de Piernas\b/gi, 'Cadeira extensora'],
    [/\bExtensión de Pierna\b/gi, 'Extensão de perna'], [/\bPrensa de Piernas\b/gi, 'Leg press'],
    [/\bSentadilla\b/gi, 'Agachamento'], [/\bZancadas\b/gi, 'Afundos'], [/\bZancada\b/gi, 'Afundo'],
    [/\bPeso Muerto Rumano\b/gi, 'Stiff'], [/\bPeso Muerto\b/gi, 'Levantamento terra'],
    [/\bRemo\b/gi, 'Remada'], [/\bJalón\b/gi, 'Puxada'], [/\bDominadas\b/gi, 'Barra fixa'],
    [/\bFlexiones\b/gi, 'Flexões'], [/\bFlexión\b/gi, 'Flexão'], [/\bPush-Ups?\b/gi, 'Flexão de braços'],
    [/\bPull-Ups?\b/gi, 'Barra fixa'], [/\bChin-Ups?\b/gi, 'Barra fixa supinada'], [/\bFondos\b/gi, 'Mergulho'],
    [/\bPelota de Estabilidad\b/gi, 'bola suíça'], [/\bBalón de Estabilidad\b/gi, 'bola suíça'],
    [/\bMancuernas\b/gi, 'halteres'], [/\bMancuerna\b/gi, 'halter'], [/\bBanda de Resistencia\b/gi, 'faixa elástica'],
    [/\bBanda\b/gi, 'faixa'], [/\bMáquina\b/gi, 'máquina'], [/\bcon\b/gi, 'com'], [/\bpara\b/gi, 'para'],
    [/\bsentado\b/gi, 'sentado'], [/\bsentada\b/gi, 'sentada'], [/\bde pie\b/gi, 'em pé'],
    [/\bArrodillado\b/gi, 'ajoelhado'], [/\bArrodillada\b/gi, 'ajoelhada'], [/\bInverso\b/gi, 'invertido'],
    [/\bInversa\b/gi, 'invertida'], [/\bAncho\b/gi, 'aberto'], [/\bAmplio\b/gi, 'aberto'],
    [/\bEstrecho\b/gi, 'fechado'], [/\bUna Pierna\b/gi, 'uma perna'], [/\bUn Brazo\b/gi, 'um braço'],
    [/\bDos Piernas\b/gi, 'duas pernas'], [/\bDos Brazos\b/gi, 'dois braços'], [/\bCore\b/gi, 'abdômen'],
    [/\bPecho\b/gi, 'peito'], [/\bEspalda\b/gi, 'costas'], [/\bHombros\b/gi, 'ombros'],
    [/\bTríceps\b/gi, 'tríceps'], [/\bBíceps\b/gi, 'bíceps'], [/\bCuádriceps\b/gi, 'quadríceps'],
    [/\bGlúteos\b/gi, 'glúteos'], [/\bIsquiotibiales\b/gi, 'posteriores de coxa'], [/\bPantorrillas\b/gi, 'panturrilhas'],
    [/\bMuñeca\b/gi, 'punho'], [/\bPress\b/gi, 'desenvolvimento'], [/\bHip Thrust\b/gi, 'elevação pélvica'],
    [/\bLeg Curl\b/gi, 'flexão de pernas'], [/\bLeg Raise\b/gi, 'elevação de pernas'],
    [/\bShoulder Press\b/gi, 'desenvolvimento de ombros'], [/\bChest Press\b/gi, 'supino'],
    [/\bBench Press\b/gi, 'supino'], [/\bDumbbell\b/gi, 'halteres'], [/\bBarbell\b/gi, 'barra'],
    [/\bKettlebell\b/gi, 'kettlebell'], [/\bCable\b/gi, 'polia'], [/\bMachine\b/gi, 'máquina'],
    [/\bStability Ball\b/gi, 'bola suíça'], [/\bBanded\b/gi, 'com faixa'], [/\bBodyweight\b/gi, 'peso corporal']
  ];

  // Tradução de textos em espanhol fornecidos pelo próprio RepDB.
  // Usamos o espanhol como base porque o dataset fornece descrições e instruções completas nesse idioma.
  const textReplacements = [
    [/\bEste ejercicio\b/gi, 'Este exercício'], [/\bEste movimiento\b/gi, 'Este movimento'],
    [/\bLa posición inicial\b/gi, 'A posição inicial'], [/\bPosición inicial\b/gi, 'Posição inicial'],
    [/\bPárate\b/gi, 'Fique em pé'], [/\bPonte de pie\b/gi, 'Fique em pé'], [/\bSiéntate\b/gi, 'Sente-se'],
    [/\bAcuéstate\b/gi, 'Deite-se'], [/\bArrodíllate\b/gi, 'Ajoelhe-se'], [/\bSujeta\b/gi, 'Segure'],
    [/\bAgarra\b/gi, 'Segure'], [/\bSostén\b/gi, 'Segure'], [/\bColoca\b/gi, 'Coloque'],
    [/\bMantén\b/gi, 'Mantenha'], [/\bMantenga\b/gi, 'Mantenha'], [/\bBaja\b/gi, 'Desça'],
    [/\bSube\b/gi, 'Suba'], [/\bLevanta\b/gi, 'Eleve'], [/\bEleva\b/gi, 'Eleve'],
    [/\bTira\b/gi, 'Puxe'], [/\bEmpuja\b/gi, 'Empurre'], [/\bPresiona\b/gi, 'Empurre'],
    [/\bRegresa\b/gi, 'Retorne'], [/\bVuelve\b/gi, 'Retorne'], [/\bRepite\b/gi, 'Repita'],
    [/\bEvita\b/gi, 'Evite'], [/\bUtiliza\b/gi, 'Utilize'], [/\bUsa\b/gi, 'Use'],
    [/\bRespira\b/gi, 'Respire'], [/\bInhala\b/gi, 'Inspire'], [/\bExhala\b/gi, 'Expire'],
    [/\blentamente\b/gi, 'lentamente'], [/\bcontrolado\b/gi, 'de forma controlada'],
    [/\bcontroladamente\b/gi, 'de forma controlada'], [/\bMantén la espalda\b/gi, 'Mantenha as costas'],
    [/\bespalda\b/gi, 'costas'], [/\bpecho\b/gi, 'peito'], [/\bhombros\b/gi, 'ombros'],
    [/\bbrazos\b/gi, 'braços'], [/\bbrazo\b/gi, 'braço'], [/\bmanos\b/gi, 'mãos'],
    [/\bmanos\b/gi, 'mãos'], [/\bcodos\b/gi, 'cotovelos'], [/\brodillas\b/gi, 'joelhos'],
    [/\bpiernas\b/gi, 'pernas'], [/\bpierna\b/gi, 'perna'], [/\bglúteos\b/gi, 'glúteos'],
    [/\bcuádriceps\b/gi, 'quadríceps'], [/\bisquiotibiales\b/gi, 'posteriores de coxa'],
    [/\bpantorrillas\b/gi, 'panturrilhas'], [/\babdomen\b/gi, 'abdômen'], [/\bcadera\b/gi, 'quadril'],
    [/\bmuñecas\b/gi, 'punhos'], [/\bmuñeca\b/gi, 'punho'], [/\bpies\b/gi, 'pés'],
    [/\bcabeza\b/gi, 'cabeça'], [/\bcuello\b/gi, 'pescoço'], [/\bbarra\b/gi, 'barra'],
    [/\bmancuernas\b/gi, 'halteres'], [/\bmancuerna\b/gi, 'halter'], [/\bpesas\b/gi, 'pesos'],
    [/\bpeso\b/gi, 'peso'], [/\bresistencia\b/gi, 'resistência'], [/\bbanda\b/gi, 'faixa'],
    [/\bbandas\b/gi, 'faixas'], [/\bcable\b/gi, 'polia'], [/\bmáquina\b/gi, 'máquina'],
    [/\bbola de estabilidad\b/gi, 'bola suíça'], [/\bpelota de estabilidad\b/gi, 'bola suíça'],
    [/\bcon\b/gi, 'com'], [/\by\b/gi, 'e'], [/\bo\b/gi, 'ou'], [/\bpara\b/gi, 'para'],
    [/\bdesde\b/gi, 'a partir de'], [/\bhasta\b/gi, 'até'], [/\bdurante\b/gi, 'durante'],
    [/\bmientras\b/gi, 'enquanto'], [/\bentre\b/gi, 'entre'], [/\bsobre\b/gi, 'sobre'],
    [/\bdebajo\b/gi, 'abaixo'], [/\bencima\b/gi, 'acima'], [/\bdelante\b/gi, 'à frente'],
    [/\bdetrás\b/gi, 'atrás'], [/\barriba\b/gi, 'para cima'], [/\babajo\b/gi, 'para baixo'],
    [/\bprimero\b/gi, 'primeiro'], [/\bluego\b/gi, 'depois'], [/\bfinalmente\b/gi, 'por fim'],
    [/\brepeticiones\b/gi, 'repetições'], [/\brepetición\b/gi, 'repetição'], [/\bposición\b/gi, 'posição'],
    [/\bmovimiento\b/gi, 'movimento'], [/\bejercicio\b/gi, 'exercício'], [/\bmovimientos\b/gi, 'movimentos'],
    [/\bEjercicios\b/gi, 'Exercícios'], [/\bfuerte\b/gi, 'forte'], [/\bfirme\b/gi, 'firme'],
    [/\bcorrecta\b/gi, 'correta'], [/\bcorrecto\b/gi, 'correto'], [/\bneutral\b/gi, 'neutra'],
    [/\bneutro\b/gi, 'neutro'], [/\bancho\b/gi, 'aberto'], [/\bestrecho\b/gi, 'fechado'],
    [/\bseparados\b/gi, 'afastados'], [/\bjuntos\b/gi, 'juntos'], [/\bapoyado\b/gi, 'apoiado'],
    [/\bapoyada\b/gi, 'apoiada'], [/\bapoyo\b/gi, 'apoio'], [/\bmanteniendo\b/gi, 'mantendo'],
    [/\bmantener\b/gi, 'manter'], [/\brealiza\b/gi, 'realize'], [/\brealizar\b/gi, 'realizar'],
    [/\bdebe\b/gi, 'deve'], [/\bdebes\b/gi, 'você deve'], [/\bpuedes\b/gi, 'você pode'],
    [/\bposible\b/gi, 'possível'], [/\bnecesario\b/gi, 'necessário']
  ];

  const clean = value => String(value || '').replace(/\s+/g, ' ').replace(/\s+([,.)])/g, '$1').trim();
  const translateSpanish = value => {
    let text = String(value || '');
    for (const [rx, replacement] of textReplacements) text = text.replace(rx, replacement);
    return clean(text);
  };

  function translateName(ex) {
    if (!ex) return '';
    if (special[ex.id]) return special[ex.id];
    let name = ex.name_es || ex.name_en || ex.id || '';
    for (const [rx, value] of replacements) name = name.replace(rx, value);
    name = name
      .replace(/\bPelota\b/gi, 'bola')
      .replace(/\bEstabilidad\b/gi, 'suíça')
      .replace(/\bPesa Rusa\b/gi, 'kettlebell')
      .replace(/\bMáquina Smith\b/gi, 'máquina Smith')
      .replace(/\bcon Máquina\b/gi, 'na máquina')
      .replace(/\bcom faixa\s+elástica\b/gi, 'com faixa elástica');
    return clean(name);
  }

  const originalLoad = RepDB.load;
  RepDB.load = async function () {
    const result = await originalLoad();
    result.forEach(ex => {
      ex.__trincaPtBrName = translateName(ex);
      ex.name_en = ex.__trincaPtBrName || ex.name_en;
      ex.__trincaPtBrDescription = translateSpanish(ex.description_es || ex.description_en || '');
      ex.__trincaPtBrInstructions = Array.isArray(ex.instructions_es) && ex.instructions_es.length
        ? ex.instructions_es.map(translateSpanish)
        : (ex.instructions_en || []).map(translateSpanish);
      ex.__trincaPtBrTips = Array.isArray(ex.tips_es) && ex.tips_es.length
        ? ex.tips_es.map(translateSpanish)
        : (ex.tips_en || []).map(translateSpanish);
      ex.description_en = ex.__trincaPtBrDescription || ex.description_en;
      if (ex.__trincaPtBrInstructions.length) ex.instructions_en = ex.__trincaPtBrInstructions;
      if (ex.__trincaPtBrTips.length) ex.tips_en = ex.__trincaPtBrTips;
    });
    return result;
  };

  const originalLocalized = RepDB.localized;
  RepDB.localized = function (ex) {
    const value = originalLocalized(ex);
    if (!ex) return value;
    return {
      ...value,
      name: ex.__trincaPtBrName || translateName(ex),
      description: ex.__trincaPtBrDescription || translateSpanish(ex.description_es || ex.description_en || ''),
      instructions: ex.__trincaPtBrInstructions || (ex.instructions_es || ex.instructions_en || []).map(translateSpanish),
      tips: ex.__trincaPtBrTips || (ex.tips_es || ex.tips_en || []).map(translateSpanish),
      bodyPart: RepDBPTBRLabel(ex.body_part),
      equipment: ex.is_bodyweight ? 'Peso corporal' : RepDBPTBRLabel(ex.equipment),
      primaryMuscles: (ex.primary_muscles || []).map(RepDBPTBRLabel),
      secondaryMuscles: (ex.secondary_muscles || []).map(RepDBPTBRLabel)
    };
  };

  function RepDBPTBRLabel(value) {
    return typeof RepDBPTBR !== 'undefined' ? RepDBPTBR.label(value) : String(value || '').replace(/_/g, ' ');
  }

  RepDB.name = translateName;
})();
