const state = {
  sounds: [],
  category: 'Alle',
  search: '',
  favorites: new Set(JSON.parse(localStorage.getItem('sounddeck:favorites') || '[]')),
  players: new Map(),
  boardMode: false,
  boardIds: []
};

const grid = document.querySelector('#grid');
const categoriesEl = document.querySelector('#categories');
const searchEl = document.querySelector('#search');
const selectionButton = document.querySelector('#selectionButton');
const selectionCount = document.querySelector('#selectionCount');
const panel = document.querySelector('#selectionPanel');
const closePanel = document.querySelector('#closePanel');
const selectionList = document.querySelector('#selectionList');
const clearSelection = document.querySelector('#clearSelection');
const copyBoardLink = document.querySelector('#copyBoardLink');
const copyHint = document.querySelector('#copyHint');
const boardNotice = document.querySelector('#boardNotice');

async function boot() {
  const params = new URLSearchParams(location.search);
  const board = params.get('board');
  if (board) {
    state.boardMode = true;
    state.boardIds = board.split(',').map(x => x.trim()).filter(Boolean);
  }

  const response = await fetch('data/sounds.json');
  const data = await response.json();
  state.sounds = data.sounds || [];
  renderCategories();
  renderSounds();
  renderSelectionCount();
  renderBoardNotice();
}

function saveFavorites() {
  localStorage.setItem('sounddeck:favorites', JSON.stringify([...state.favorites]));
}

function visibleSounds() {
  const q = state.search.trim().toLowerCase();
  return state.sounds.filter(sound => {
    const boardMatch = !state.boardMode || state.boardIds.includes(sound.id);
    const categoryMatch = state.category === 'Alle' || sound.category === state.category;
    const searchMatch = !q || sound.title.toLowerCase().includes(q) || sound.category.toLowerCase().includes(q);
    return boardMatch && categoryMatch && searchMatch;
  });
}

function renderBoardNotice() {
  if (!state.boardMode) {
    boardNotice.classList.add('hidden');
    return;
  }
  boardNotice.classList.remove('hidden');
  boardNotice.textContent = `Geteiltes Board mit ${state.boardIds.length} Sound${state.boardIds.length === 1 ? '' : 's'}.`;
}

function renderCategories() {
  const baseSounds = state.boardMode ? state.sounds.filter(s => state.boardIds.includes(s.id)) : state.sounds;
  const categories = ['Alle', ...Array.from(new Set(baseSounds.map(sound => sound.category))).sort()];
  if (!categories.includes(state.category)) state.category = 'Alle';
  categoriesEl.innerHTML = '';
  categories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = `chip ${state.category === category ? 'active' : ''}`;
    btn.type = 'button';
    btn.textContent = category;
    btn.addEventListener('click', () => {
      state.category = category;
      renderCategories();
      renderSounds();
    });
    categoriesEl.appendChild(btn);
  });
}

function playerFor(sound) {
  if (!state.players.has(sound.id)) {
    const audio = new Audio(sound.soundUrl);
    audio.preload = 'auto';
    state.players.set(sound.id, { audio, playing: false });
  }
  return state.players.get(sound.id);
}

function renderSounds() {
  const sounds = visibleSounds();
  grid.innerHTML = '';

  if (sounds.length === 0) {
    grid.innerHTML = '<div class="empty">Keine Sounds gefunden.</div>';
    return;
  }

  sounds.forEach(sound => {
    const player = playerFor(sound);
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <button class="favorite ${state.favorites.has(sound.id) ? 'active' : ''}" type="button" aria-label="${escapeHtml(sound.title)} favorisieren">★</button>
      <button class="sound-button ${player.playing ? 'playing' : ''}" type="button" aria-label="${escapeHtml(sound.title)} abspielen">
        <img src="${escapeHtml(sound.imageUrl)}" alt="" draggable="false" />
      </button>
      <p class="sound-title">${escapeHtml(sound.title)}</p>
      <p class="sound-category">${escapeHtml(sound.category)}</p>
      <div class="controls"><button class="stop" type="button">Stop</button></div>
    `;

    const playButton = card.querySelector('.sound-button');
    const favoriteButton = card.querySelector('.favorite');
    const stopButton = card.querySelector('.stop');

    player.audio.onended = () => {
      player.playing = false;
      renderSounds();
    };

    playButton.addEventListener('click', async () => {
      player.audio.currentTime = 0;
      await player.audio.play();
      player.playing = true;
      renderSounds();
    });

    stopButton.addEventListener('click', () => {
      player.audio.pause();
      player.audio.currentTime = 0;
      player.playing = false;
      renderSounds();
    });

    favoriteButton.addEventListener('click', () => {
      if (state.favorites.has(sound.id)) state.favorites.delete(sound.id);
      else state.favorites.add(sound.id);
      saveFavorites();
      renderSelectionCount();
      renderSounds();
    });

    grid.appendChild(card);
  });
}

function renderSelectionCount() {
  selectionCount.textContent = String(state.favorites.size);
}

function renderPanel() {
  const selected = state.sounds.filter(sound => state.favorites.has(sound.id));
  selectionList.innerHTML = '';
  copyHint.textContent = '';

  if (selected.length === 0) {
    selectionList.innerHTML = '<div class="empty">Noch keine Sounds ausgewählt.</div>';
    return;
  }

  selected.forEach(sound => {
    const item = document.createElement('div');
    item.className = 'selection-item';
    item.innerHTML = `<span>${escapeHtml(sound.title)}</span><button type="button">Entfernen</button>`;
    item.querySelector('button').addEventListener('click', () => {
      state.favorites.delete(sound.id);
      saveFavorites();
      renderSelectionCount();
      renderPanel();
      renderSounds();
    });
    selectionList.appendChild(item);
  });
}

selectionButton.addEventListener('click', () => {
  panel.classList.remove('hidden');
  renderPanel();
});

closePanel.addEventListener('click', () => panel.classList.add('hidden'));
panel.addEventListener('click', event => {
  if (event.target === panel) panel.classList.add('hidden');
});

clearSelection.addEventListener('click', () => {
  state.favorites.clear();
  saveFavorites();
  renderSelectionCount();
  renderPanel();
  renderSounds();
});

copyBoardLink.addEventListener('click', async () => {
  const ids = [...state.favorites];
  if (ids.length === 0) {
    copyHint.textContent = 'Wähle zuerst mindestens einen Sound aus.';
    return;
  }
  const url = `${location.origin}${location.pathname}?board=${ids.join(',')}`;
  await navigator.clipboard.writeText(url);
  copyHint.textContent = 'Board-Link wurde kopiert.';
});

searchEl.addEventListener('input', event => {
  state.search = event.target.value;
  renderSounds();
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

boot().catch(error => {
  grid.innerHTML = `<div class="empty">Fehler beim Laden: ${escapeHtml(error.message)}</div>`;
});
