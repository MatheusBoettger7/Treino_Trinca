(function () {
  const MODAL_ID = 'workoutShareModal';

  function number(value) {
    return Number(String(value == null ? '' : value).replace(',', '.')) || 0;
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours) return hours + 'h ' + String(minutes).padStart(2, '0') + 'min';
    return Math.max(1, minutes) + ' min';
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString('pt-BR');
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function text(ctx, value, x, y, font, color, align) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.fillText(String(value), x, y);
  }

  function drawMetric(ctx, x, y, label, value, helper, accent, valueSize) {
    roundedRect(ctx, x, y, 448, 196, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.065)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    ctx.stroke();
    roundedRect(ctx, x + 26, y + 28, 7, 46, 4);
    ctx.fillStyle = accent;
    ctx.fill();
    text(ctx, label.toUpperCase(), x + 52, y + 57, '700 23px system-ui, sans-serif', '#aeb7c6');
    text(ctx, value, x + 30, y + 126, '800 ' + (valueSize || 53) + 'px system-ui, sans-serif', '#ffffff');
    text(ctx, helper, x + 30, y + 164, '500 20px system-ui, sans-serif', '#9ca6b5');
  }

  function drawWorkoutCard(session) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível criar a imagem do treino.');

    const blue = document.documentElement.dataset.theme === 'blue';
    const accent = blue ? '#3987ff' : '#ef4444';
    const accentSoft = blue ? 'rgba(57,135,255,0.22)' : 'rgba(239,68,68,0.22)';
    const profile = session.profile === 'feminino' ? 'FEMININO' : 'MASCULINO';
    const exercises = Array.isArray(session.exercises) ? session.exercises : [];
    const completedSets = exercises.reduce((total, exercise) =>
      total + (Array.isArray(exercise.sets) ? exercise.sets.filter(set => set && set.done).length : 0), 0);
    const plannedSets = exercises.reduce((total, exercise) =>
      total + (Array.isArray(exercise.sets) ? exercise.sets.length : 0), 0);
    const volume = exercises.reduce((total, exercise) =>
      total + (Array.isArray(exercise.sets) ? exercise.sets.reduce((sum, set) =>
        set && set.done && number(set.kg) > 0 && number(set.reps) > 0
          ? sum + number(set.kg) * number(set.reps)
          : sum, 0) : 0), 0);
    const hasVolume = volume > 0;
    const date = new Date(session.date || Date.now());
    const dateLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const weekCount = Math.max(1, Number(session.weeklyCount) || 1);
    const workoutCode = session.code || '';
    const workoutName = session.workoutName || ('Treino ' + workoutCode);

    const background = ctx.createLinearGradient(0, 0, 1080, 1920);
    background.addColorStop(0, '#141923');
    background.addColorStop(0.52, '#090c12');
    background.addColorStop(1, '#050609');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1080, 1920);

    const glow = ctx.createRadialGradient(900, 210, 30, 900, 210, 850);
    glow.addColorStop(0, accentSoft);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1100);

    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= 1080; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
    for (let y = 0; y <= 1920; y += 90) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(76, 78);
    ctx.scale(78 / 512, 78 / 512);
    roundedRect(ctx, 0, 0, 512, 512, 145);
    ctx.fillStyle = '#090a18';
    ctx.fill();

    ctx.fillStyle = '#58a8f5';
    roundedRect(ctx, 132, 152, 54, 208, 27);
    ctx.fill();
    roundedRect(ctx, 326, 152, 54, 208, 27);
    ctx.fill();
    roundedRect(ctx, 91, 210, 54, 92, 27);
    ctx.fill();
    roundedRect(ctx, 367, 210, 54, 92, 27);
    ctx.fill();
    roundedRect(ctx, 145, 224, 222, 64, 32);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(256, 256, 45, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    text(ctx, 'TREINO TRINCA', 184, 116, '800 31px system-ui, sans-serif', '#ffffff');
    text(ctx, 'EVOLUÇÃO QUE VOCÊ CONSTRÓI', 184, 151, '600 17px system-ui, sans-serif', '#8994a5');

    roundedRect(ctx, 76, 224, 420, 58, 29);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(108, 253, 7, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    text(ctx, 'TREINO CONCLUÍDO', 132, 262, '800 19px system-ui, sans-serif', '#e8edf5');

    const weekdayLabel = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
    text(ctx, weekdayLabel, 76, 398, '900 76px system-ui, sans-serif', '#ffffff');
    ctx.font = '600 38px system-ui, sans-serif';
    ctx.fillStyle = '#c5cedb';
    const nameWords = String(workoutName).split(/\s+/);
    let line = '';
    let lineY = 462;
    let lines = 0;
    nameWords.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > 900 && line && lines < 1) {
        ctx.fillText(line, 80, lineY);
        line = word;
        lineY += 48;
        lines++;
      } else {
        line = test;
      }
    });
    if (line) ctx.fillText(line, 80, lineY);

    text(ctx, profile + '  •  ' + dateLabel.toUpperCase(), 78, 565, '700 19px system-ui, sans-serif', '#8f9aab');

    roundedRect(ctx, 76, 610, 928, 80, 20);
    ctx.fillStyle = 'rgba(255,255,255,0.055)';
    ctx.fill();
    roundedRect(ctx, 76, 610, 8, 80, 4);
    ctx.fillStyle = accent;
    ctx.fill();
    text(ctx, 'TREINOS NA SEMANA', 108, 660, '700 20px system-ui, sans-serif', '#aeb7c6');
    text(ctx, weekCount + ' / 5', 970, 663, '850 34px system-ui, sans-serif', '#ffffff', 'right');

    drawMetric(ctx, 76, 730, 'Duração', formatDuration(session.durationSec), 'tempo total de treino', accent, 48);
    drawMetric(ctx, 556, 730, 'Exercícios', String(exercises.length), 'no treino de hoje', accent, 53);
    drawMetric(ctx, 76, 948, 'Séries concluídas', String(completedSets), 'de ' + plannedSets + ' séries previstas', accent, 53);
    drawMetric(ctx, 556, 948, 'Volume total', hasVolume ? formatNumber(volume) + ' kg' : '—', 'carga × repetições concluídas', accent, hasVolume && volume >= 10000 ? 39 : 48);

    text(ctx, 'SEU TREINO DE HOJE', 78, 1234, '850 29px system-ui, sans-serif', '#ffffff');
    text(ctx, 'Cada série conta. Continue evoluindo.', 78, 1274, '500 20px system-ui, sans-serif', '#8f9aab');

    const maxExercises = 6;
    exercises.slice(0, maxExercises).forEach((exercise, index) => {
      const y = 1310 + index * 76;
      roundedRect(ctx, 76, y, 928, 64, 15);
      ctx.fillStyle = 'rgba(255,255,255,0.045)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(112, y + 32, 17, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      text(ctx, String(index + 1), 112, y + 39, '800 19px system-ui, sans-serif', '#ffffff', 'center');

      const exerciseName = String(exercise.name || 'Exercício');
      const truncatedName = exerciseName.length > 34 ? exerciseName.slice(0, 31) + '…' : exerciseName;
      text(ctx, truncatedName, 151, y + 39, '700 23px system-ui, sans-serif', '#f1f5f9');
      const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
      const done = sets.filter(set => set && set.done).length;
      text(ctx, done + '/' + sets.length, 965, y + 39, '800 21px system-ui, sans-serif', done ? accent : '#9ca6b5', 'right');
    });

    if (exercises.length > maxExercises) {
      text(ctx, '+ ' + (exercises.length - maxExercises) + ' exercícios', 80, 1310 + maxExercises * 76, '650 19px system-ui, sans-serif', '#9ca6b5');
    }

    ctx.fillStyle = accent;
    ctx.fillRect(76, 1815, 928, 3);
    text(ctx, 'TREINO TRINCA', 78, 1868, '850 22px system-ui, sans-serif', '#ffffff');
    text(ctx, 'SEU RITMO. SUA EVOLUÇÃO.', 1002, 1868, '650 17px system-ui, sans-serif', '#8f9aab', 'right');

    return canvas;
  }

  function fileNameFor(session) {
    const day = String(session.date || new Date().toISOString()).slice(0, 10);
    return 'treino-trinca-' + (session.code || 'concluido') + '-' + day + '.png';
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'workout-share-overlay';
    modal.innerHTML = '<section class="workout-share-dialog" role="dialog" aria-modal="true" aria-labelledby="workoutShareTitle">' +
      '<header class="workout-share-header"><div><div class="workout-share-kicker">SEU RESULTADO</div><h2 id="workoutShareTitle">Compartilhar treino</h2></div>' +
      '<button type="button" class="workout-share-close" aria-label="Fechar">×</button></header>' +
      '<div class="workout-share-preview"><img id="workoutSharePreview" alt="Prévia da imagem do treino concluído"></div>' +
      '<div class="workout-share-actions"><button type="button" class="primary" id="workoutShareSend">Compartilhar imagem</button>' +
      '<button type="button" class="secondary" id="workoutShareDownload">Baixar imagem</button></div>' +
      '<p class="workout-share-note">Imagem vertical pronta para Stories ou para enviar aos seus amigos.</p></section>';

    document.body.appendChild(modal);
    modal.querySelector('.workout-share-close').addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });
    modal.querySelector('#workoutShareSend').addEventListener('click', shareCurrentImage);
    modal.querySelector('#workoutShareDownload').addEventListener('click', downloadCurrentImage);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });
    return modal;
  }

  let activeSession = null;
  let activeCanvas = null;
  let activeBlob = null;

  function openWorkoutShare(session) {
    if (!session || !Array.isArray(session.exercises)) {
      window.alert('Não foi possível localizar os dados deste treino.');
      return;
    }
    activeSession = session;
    activeCanvas = drawWorkoutCard(session);
    activeBlob = null;
    const modal = ensureModal();
    const preview = modal.querySelector('#workoutSharePreview');
    preview.src = activeCanvas.toDataURL('image/png');
    modal.classList.add('show');
    document.body.classList.add('workout-share-open');
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('show');
    document.body.classList.remove('workout-share-open');
  }

  function getBlob() {
    if (activeBlob) return Promise.resolve(activeBlob);
    if (!activeCanvas) return Promise.reject(new Error('A imagem do treino ainda não foi gerada.'));
    return new Promise((resolve, reject) => {
      activeCanvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Não foi possível gerar o arquivo da imagem.'));
          return;
        }
        activeBlob = blob;
        resolve(blob);
      }, 'image/png');
    });
  }

  function downloadCurrentImage() {
    if (!activeCanvas || !activeSession) return;
    const link = document.createElement('a');
    link.href = activeCanvas.toDataURL('image/png');
    link.download = fileNameFor(activeSession);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function shareCurrentImage() {
    if (!activeCanvas || !activeSession) return;
    const button = document.getElementById('workoutShareSend');
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Preparando imagem…';

    try {
      const blob = await getBlob();
      const name = fileNameFor(activeSession);
      const file = new File([blob], name, { type: 'image/png' });

      if (window.AndroidShare && typeof window.AndroidShare.shareImage === 'function') {
        const dataUrl = activeCanvas.toDataURL('image/png');
        window.AndroidShare.shareImage(name, dataUrl.split(',')[1]);
        return;
      }

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Treino concluído',
          text: 'Meu treino de hoje com o Treino Trinca 💪'
        });
        return;
      }

      downloadCurrentImage();
      button.textContent = 'Imagem baixada';
    } catch (error) {
      if (error && error.name !== 'AbortError') {
        console.error('Falha ao compartilhar o treino:', error);
        downloadCurrentImage();
        button.textContent = 'Imagem baixada';
      }
    } finally {
      if (button.isConnected) {
        window.setTimeout(() => {
          button.disabled = false;
          button.textContent = originalLabel;
        }, 1200);
      }
    }
  }

  window.openWorkoutShare = openWorkoutShare;
})();