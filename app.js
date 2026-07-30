const state = {
  sounds: [],
  boards: [],
  selectedBoard: 'all',
  selectedCategory: 'Alle',
  search: '',
  players: new Map()
};

const grid = document.querySelector('#grid');
const categoriesEl = document.querySelector('#categories');
const boardsEl = document.querySelector('#boards');
const searchEl = document.querySelector('#search');

async function boot() {
  const response = await fetch('data/sounds.json');
  const data = await response.json();
  state.sounds = data.sounds;
  state.boards = data.boards;
  renderBoards();
  renderCategories();
  renderSounds();
}

function filteredSounds() {
  const q = state.search.trim().toLowerCase();
  return state.sounds.filter(sound => {
    const boardMatch = state.selectedBoard === 'all' || sound.boards.includes(state.selectedBoard);
    const catMatch = state.selectedCategory === 'Alle' || sound.category === state.selectedCategory;
    const searchMatch = !q || sound.title.toLowerCase().includes(q) || sound.category.toLowerCase().includes(q);
    return boardMatch && catMatch && searchMatch;
  });
}

function renderBoards() {
  boardsEl.innerHTML = '';
  state.boards.forEach(board => {
    const count = board.id === 'all'
      ? state.sounds.length
      : state.sounds.filter(sound => sound.boards.includes(board.id)).length;
    const btn = document.createElement('button');
    btn.className = `board ${state.selectedBoard === board.id ? 'active' : ''}`;
    btn.type = 'button';
    btn.innerHTML = `<strong>${board.name}</strong><br><small>${count} Sounds</small>`;
    btn.addEventListener('click', () => {
      state.selectedBoard = board.id;
      renderBoards();
      renderCategories();
      renderSounds();
    });
    boardsEl.appendChild(btn);
  });
}

function renderCategories() {
  const boardSounds = state.sounds.filter(sound => state.selectedBoard === 'all' || sound.boards.includes(state.selectedBoard));
  const categories = ['Alle', ...Array.from(new Set(boardSounds.map(sound => sound.category))).sort()];
  if (!categories.includes(state.selectedCategory)) state.selectedCategory = 'Alle';
  categoriesEl.innerHTML = '';
  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = `chip ${state.selectedCategory === category ? 'active' : ''}`;
    btn.type = 'button';
    btn.textContent = category;
    btn.addEventListener('click', () => {
      state.selectedCategory = category;
      renderCategories();
      renderSounds();
    });
    categoriesEl.appendChild(btn);
  });
}

function getPlayer(sound) {
  if (!state.players.has(sound.id)) {
    const audio = new Audio(sound.soundUrl);
    audio.preload = 'auto';
    audio.volume = sound.defaultVolume;
    audio.loop = sound.defaultLoop;
    state.players.set(sound.id, { audio, volume: sound.defaultVolume, loop: sound.defaultLoop, playing: false });
  }
  return state.players.get(sound.id);
}

function renderSounds() {
  const sounds = filteredSounds();
  grid.innerHTML = '';
  if (sounds.length === 0) {
    grid.innerHTML = '<div class="empty">Keine Sounds gefunden.</div>';
    return;
  }

  sounds.forEach(sound => {
    const player = getPlayer(sound);
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <button class="sound-button ${player.playing ? 'playing' : ''}" type="button" aria-label="${escapeHtml(sound.title)} abspielen">
        <img src="${sound.imageUrl}" alt="" draggable="false" />
      </button>
      <div class="meta">
        <h3>${escapeHtml(sound.title)}</h3>
        <p>${escapeHtml(sound.category)}</p>
      </div>
      <div class="controls">
        <label>Lautstärke: <span class="volume-value">${Math.round(player.volume * 100)}%</span>
          <input class="volume" type="range" min="0" max="1" step="0.05" value="${player.volume}" />
        </label>
        <div class="row">
          <label><input class="loop" type="checkbox" ${player.loop ? 'checked' : ''} /> Loop</label>
          <button class="stop" type="button">Stop</button>
        </div>
      </div>
    `;

    const playBtn = card.querySelector('.sound-button');
    const volumeInput = card.querySelector('.volume');
    const volumeValue = card.querySelector('.volume-value');
    const loopInput = card.querySelector('.loop');
    const stopBtn = card.querySelector('.stop');

    player.audio.onended = () => {
      player.playing = false;
      renderSounds();
    };

    playBtn.addEventListener('click', async () => {
      player.audio.currentTime = 0;
      player.audio.volume = player.volume;
      player.audio.loop = player.loop;
      await player.audio.play();
      player.playing = true;
      renderSounds();
    });

    volumeInput.addEventListener('input', (event) => {
      player.volume = Number(event.target.value);
      player.audio.volume = player.volume;
      volumeValue.textContent = `${Math.round(player.volume * 100)}%`;
    });

    loopInput.addEventListener('change', (event) => {
      player.loop = event.target.checked;
      player.audio.loop = player.loop;
    });

    stopBtn.addEventListener('click', () => {
      player.audio.pause();
      player.audio.currentTime = 0;
      player.playing = false;
      renderSounds();
    });

    grid.appendChild(card);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

searchEl.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderSounds();
});

boot().catch(error => {
  grid.innerHTML = `<div class="empty">Fehler beim Laden: ${escapeHtml(error.message)}</div>`;
});
