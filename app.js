const cfg = window.SOUNDDECK_CONFIG || {};
const hasSupabase = cfg.SUPABASE_URL && cfg.SUPABASE_URL.startsWith('http') && cfg.SUPABASE_PUBLISHABLE_KEY && cfg.SUPABASE_PUBLISHABLE_KEY.startsWith('sb_');
const sb = hasSupabase ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;

const state = {
  sounds: [],
  category: 'Alle',
  search: '',
  favorites: new Set(JSON.parse(localStorage.getItem('sounddeck:favorites') || '[]')),
  loops: new Set(JSON.parse(localStorage.getItem('sounddeck:loops') || '[]')),
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

  state.sounds = await loadSounds();
  renderCategories();
  renderSounds();
  renderSelectionCount();
  renderBoardNotice();
}

async function loadSounds() {
  if (sb) {
    const { data, error } = await sb.from('sounds').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length) {
      return data.map(s => ({
        id: s.id,
        title: s.name,
        category: s.category,
        soundUrl: s.audio_url,
        imageUrl: s.image_url
      }));
    }
  }
  const response = await fetch('data/sounds.json');
  const data = await response.json();
  return data.sounds || [];
}

function saveFavorites() {
  localStorage.setItem('sounddeck:favorites', JSON.stringify([...state.favorites]));
}

function saveLoops() {
  localStorage.setItem('sounddeck:loops', JSON.stringify([...state.loops]));
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
  const base = state.boardMode ? state.sounds.filter(s => state.boardIds.includes(s.id)) : state.sounds;
  const categories = ['Alle', ...Array.from(new Set(base.map(s => s.category))).sort()];
  if (!categories.includes(state.category)) state.category = 'Alle';
  categoriesEl.innerHTML = '';
  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = `chip ${state.category === category ? 'active' : ''}`;
    button.type = 'button';
    button.textContent = category;
    button.onclick = () => {
      state.category = category;
      renderCategories();
      renderSounds();
    };
    categoriesEl.appendChild(button);
  });
}

function playerFor(sound) {
  if (!state.players.has(sound.id)) {
    const audio = new Audio(sound.soundUrl);
    audio.preload = 'auto';
    audio.loop = state.loops.has(sound.id);
    state.players.set(sound.id, { audio, playing: false });
  }
  return state.players.get(sound.id);
}

function renderSounds() {
  const sounds = visibleSounds();
  grid.innerHTML = '';

  if (!sounds.length) {
    grid.innerHTML = '<div class="empty">Keine Sounds gefunden.</div>';
    return;
  }

  sounds.forEach(sound => {
    const player = playerFor(sound);
    player.audio.loop = state.loops.has(sound.id);

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <button class="favorite ${state.favorites.has(sound.id) ? 'active' : ''}" type="button" aria-label="${escapeHtml(sound.title)} merken">★</button>
      <button class="sound-button ${player.playing ? 'playing' : ''}" type="button" aria-label="${escapeHtml(sound.title)} abspielen">
        <img src="${escapeHtml(sound.imageUrl)}" alt="" draggable="false" />
      </button>
      <p class="sound-title">${escapeHtml(sound.title)}</p>
      <p class="sound-category">${escapeHtml(sound.category)}</p>
      <div class="controls">
        <button class="loop-toggle ${state.loops.has(sound.id) ? 'active' : ''}" type="button">Loop</button>
        <button class="stop" type="button">Stop</button>
      </div>
    `;

    const playButton = card.querySelector('.sound-button');
    const favoriteButton = card.querySelector('.favorite');
    const loopButton = card.querySelector('.loop-toggle');
    const stopButton = card.querySelector('.stop');

    player.audio.onended = () => {
      player.playing = false;
      renderSounds();
    };

    playButton.onclick = async () => {
      player.audio.currentTime = 0;
      player.audio.loop = state.loops.has(sound.id);
      await player.audio.play();
      player.playing = true;
      renderSounds();
    };

    stopButton.onclick = () => {
      player.audio.pause();
      player.audio.currentTime = 0;
      player.playing = false;
      renderSounds();
    };

    loopButton.onclick = () => {
      if (state.loops.has(sound.id)) state.loops.delete(sound.id);
      else state.loops.add(sound.id);
      saveLoops();
      player.audio.loop = state.loops.has(sound.id);
      renderSounds();
    };

    favoriteButton.onclick = () => {
      if (state.favorites.has(sound.id)) state.favorites.delete(sound.id);
      else state.favorites.add(sound.id);
      saveFavorites();
      renderSelectionCount();
      renderSounds();
    };

    grid.appendChild(card);
  });
}

function renderSelectionCount() {
  selectionCount.textContent = String(state.favorites.size);
}

function renderPanel() {
  const selected = state.sounds.filter(s => state.favorites.has(s.id));
  selectionList.innerHTML = '';
  copyHint.textContent = '';

  if (!selected.length) {
    selectionList.innerHTML = '<div class="empty">Noch keine Sounds ausgewählt.</div>';
    return;
  }

  selected.forEach(sound => {
    const item = document.createElement('div');
    item.className = 'selection-item';
    item.innerHTML = `<span>${escapeHtml(sound.title)}</span><button type="button">Entfernen</button>`;
    item.querySelector('button').onclick = () => {
      state.favorites.delete(sound.id);
      saveFavorites();
      renderSelectionCount();
      renderPanel();
      renderSounds();
    };
    selectionList.appendChild(item);
  });
}

selectionButton.onclick = () => {
  panel.classList.remove('hidden');
  renderPanel();
};
closePanel.onclick = () => panel.classList.add('hidden');
panel.onclick = event => {
  if (event.target === panel) panel.classList.add('hidden');
};
clearSelection.onclick = () => {
  state.favorites.clear();
  saveFavorites();
  renderSelectionCount();
  renderPanel();
  renderSounds();
};
copyBoardLink.onclick = async () => {
  const ids = [...state.favorites];
  if (!ids.length) {
    copyHint.textContent = 'Wähle zuerst mindestens einen Sound aus.';
    return;
  }
  const url = `${location.origin}${location.pathname}?board=${ids.join(',')}`;
  await navigator.clipboard.writeText(url);
  copyHint.textContent = 'Board-Link wurde kopiert.';
};
searchEl.oninput = event => {
  state.search = event.target.value;
  renderSounds();
};

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
