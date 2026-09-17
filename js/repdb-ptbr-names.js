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
    'ball-pike': 'Pike com bola suíça',
    'stability-ball-hip-bridge': 'Elevação pélvica na bola suíça',
    'stability-ball-knee-tuck': 'Flexão de joelhos na bola suíça',
    'stability-ball-push-up': 'Flexão de braços na bola suíça',
    'stability-ball-push-up-hands-on-ball': 'Flexão de braços com as mãos na bola suíça',
    'stability-ball-wall-squat': 'Agachamento na parede com bola suíça'
  };

  const replacements = [
    [/\bCurl de Piernas\b/gi, 'Flexão de pernas'],
    [/\bCurl de Pierna\b/gi, 'Flexão de perna'],
    [/\bCurl de Bíceps\b/gi, 'Rosca de bíceps'],
    [/\bCurl de Muñeca\b/gi, 'Rosca de punho'],
    [/\bCurl de Martillo\b/gi, 'Rosca martelo'],
    [/\bCurl de Concentración\b/gi, 'Rosca concentrada'],
    [/\bCurl de\b/gi, 'Rosca de'],
    [/\bEmpuje de Cadera\b/gi, 'Elevação pélvica'],
    [/\bEmpuje de Glúteo\b/gi, 'Elevação de glúteos'],
    [/\bElevación de Talones\b/gi, 'Panturrilha'],
    [/\bElevación Frontal\b/gi, 'Elevação frontal'],
    [/\bElevación Lateral\b/gi, 'Elevação lateral'],
    [/\bElevación Posterior\b/gi, 'Elevação posterior'],
    [/\bElevación de Piernas\b/gi, 'Elevação de pernas'],
    [/\bElevación de Pierna\b/gi, 'Elevação de perna'],
    [/\bExtensión de Piernas\b/gi, 'Cadeira extensora'],
    [/\bExtensión de Pierna\b/gi, 'Extensão de perna'],
    [/\bPrensa de Piernas\b/gi, 'Leg press'],
    [/\bSentadilla\b/gi, 'Agachamento'],
    [/\bZancada\b/gi, 'Afundo'],
    [/\bZancadas\b/gi, 'Afundos'],
    [/\bPeso Muerto Rumano\b/gi, 'Stiff'],
    [/\bPeso Muerto\b/gi, 'Levantamento terra'],
    [/\bRemo\b/gi, 'Remada'],
    [/\bJalón\b/gi, 'Puxada'],
    [/\bDominadas\b/gi, 'Barra fixa'],
    [/\bFlexiones\b/gi, 'Flexões'],
    [/\bFlexión\b/gi, 'Flexão'],
    [/\bFondos\b/gi, 'Mergulho'],
    [/\bPelota de Estabilidad\b/gi, 'bola suíça'],
    [/\bBalón de Estabilidad\b/gi, 'bola suíça'],
    [/\bMancuernas\b/gi, 'halteres'],
    [/\bMancuerna\b/gi, 'halter'],
    [/\bBarra\b/gi, 'barra'],
    [/\bBanda de Resistencia\b/gi, 'faixa elástica'],
    [/\bBanda\b/gi, 'faixa'],
    [/\bMáquina\b/gi, 'máquina'],
    [/\bcon\b/gi, 'com'],
    [/\bpara\b/gi, 'para'],
    [/\bsentado\b/gi, 'sentado'],
    [/\bsentada\b/gi, 'sentada'],
    [/\bde pie\b/gi, 'em pé'],
    [/\bArrodillado\b/gi, 'ajoelhado'],
    [/\bArrodillada\b/gi, 'ajoelhada'],
    [/\bInverso\b/gi, 'invertido'],
    [/\bInversa\b/gi, 'invertida'],
    [/\bAncho\b/gi, 'aberto'],
    [/\bAmplio\b/gi, 'aberto'],
    [/\bEstrecho\b/gi, 'fechado'],
    [/\bUna Pierna\b/gi, 'uma perna'],
    [/\bUn Brazo\b/gi, 'um braço'],
    [/\bDos Piernas\b/gi, 'duas pernas'],
    [/\bDos Brazos\b/gi, 'dois braços'],
    [/\bCore\b/gi, 'abdômen'],
    [/\bPecho\b/gi, 'peito'],
    [/\bEspalda\b/gi, 'costas'],
    [/\bHombros\b/gi, 'ombros'],
    [/\bTríceps\b/gi, 'tríceps'],
    [/\bBíceps\b/gi, 'bíceps'],
    [/\bCuádriceps\b/gi, 'quadríceps'],
    [/\bGlúteos\b/gi, 'glúteos'],
    [/\bIsquiotibiales\b/gi, 'posteriores de coxa'],
    [/\bPantorrillas\b/gi, 'panturrilhas'],
    [/\bMuñeca\b/gi, 'punho'],
    [/\bPress\b/gi, 'desenvolvimento'],
    [/\bPush-Up\b/gi, 'flexão de braços'],
    [/\bPush Ups\b/gi, 'flexões de braços'],
    [/\bPull Ups\b/gi, 'barra fixa'],
    [/\bHip Thrust\b/gi, 'elevação pélvica'],
    [/\bLeg Curl\b/gi, 'flexão de pernas'],
    [/\bLeg Raise\b/gi, 'elevação de pernas'],
    [/\bShoulder Press\b/gi, 'desenvolvimento de ombros'],
    [/\bChest Press\b/gi, 'supino'],
    [/\bBench Press\b/gi, 'supino'],
    [/\bDumbbell\b/gi, 'halteres'],
    [/\bBarbell\b/gi, 'barra'],
    [/\bKettlebell\b/gi, 'kettlebell'],
    [/\bCable\b/gi, 'polia'],
    [/\bMachine\b/gi, 'máquina'],
    [/\bStability Ball\b/gi, 'bola suíça'],
    [/\bBanded\b/gi, 'com faixa'],
    [/\bBodyweight\b/gi, 'peso corporal']
  ];

  const clean = value => String(value || '').replace(/\s+/g, ' ').replace(/\s+([,)])/g, '$1').trim();

  function translateName(ex) {
    if (!ex) return '';
    if (special[ex.id]) return special[ex.id];

    // Spanish is the closest fully localized fallback supplied by RepDB.
    let name = ex.name_es || ex.name_en || ex.id || '';
    for (const [rx, value] of replacements) name = name.replace(rx, value);

    // A few common RepDB constructions need natural Brazilian Portuguese order.
    name = name
      .replace(/^Desenvolvimento Arnold$/i, 'Desenvolvimento Arnold')
      .replace(/^Elevação de Talones (.+)$/i, 'Panturrilha $1')
      .replace(/^Elevação Frontal (.+)$/i, 'Elevação frontal $1')
      .replace(/^Rosca de Martillo (.+)$/i, 'Rosca martelo $1')
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
    });
    return result;
  };

  const originalLocalized = RepDB.localized;
  RepDB.localized = function (ex) {
    const value = originalLocalized(ex);
    if (!ex) return value;
    return { ...value, name: ex.__trincaPtBrName || translateName(ex) };
  };

  RepDB.name = translateName;
})();
