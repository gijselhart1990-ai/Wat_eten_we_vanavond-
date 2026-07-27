(() => {
  'use strict';

  const TASKS_KEY = 'focusboard-tasks-v1';
  const FOCUS_KEY = 'focusboard-focus-minutes-v1';
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const state = {
    tasks: loadTasks(),
    filter: 'all',
    sort: 'newest',
    focusMinutes: Number(localStorage.getItem(FOCUS_KEY)) || 0,
    timer: { duration: 25 * 60, remaining: 25 * 60, running: false, interval: null }
  };

  const refs = {
    form: $('#new-task-form'), title: $('#task-title'), titleError: $('#title-error'),
    list: $('#task-list'), empty: $('#task-empty'), sort: $('#sort-tasks'),
    progress: $('[data-progress-ring]'), progressNumber: $('[data-progress-number]'),
    summary: $('[data-summary-copy]'), timerDisplay: $('[data-timer-display]'),
    timerDial: $('[data-timer-dial]'), timerStatus: $('[data-timer-status]'),
    timerMessage: $('[data-timer-message]'), timerToggle: $('[data-timer-toggle]')
  };

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(TASKS_KEY));
      return Array.isArray(saved) ? saved.filter(isTask) : [];
    } catch { return []; }
  }

  function isTask(task) {
    return task && typeof task.id === 'string' && typeof task.title === 'string' && typeof task.done === 'boolean';
  }

  function saveTasks() {
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(state.tasks)); }
    catch { toast('Je taken konden niet lokaal worden bewaard.', true); }
  }

  function formatToday() {
    return new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  }

  function escapeHtml(value) {
    const node = document.createElement('span'); node.textContent = value; return node.innerHTML;
  }

  function getFilteredTasks() {
    let list = state.tasks.filter(task => state.filter === 'all' || (state.filter === 'done' ? task.done : !task.done));
    const priorityOrder = { belangrijk: 0, normaal: 1, klein: 2 };
    if (state.sort === 'priority') list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.createdAt - a.createdAt);
    if (state.sort === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title, 'nl'));
    if (state.sort === 'newest') list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }

  function renderTasks() {
    const tasks = getFilteredTasks();
    refs.list.innerHTML = tasks.map(task => `
      <li class="task-item ${task.done ? 'is-complete' : ''}" data-id="${task.id}">
        <button class="task-checkbox" type="button" data-toggle-task aria-pressed="${task.done}" aria-label="${task.done ? 'Markeer als open' : 'Markeer als afgerond'}: ${escapeHtml(task.title)}">✓</button>
        <div><p class="task-name">${escapeHtml(task.title)}</p><p class="task-meta">${escapeHtml(task.category || 'Werk')} · ${task.done ? 'Afgerond' : 'Nog te doen'}</p></div>
        <span class="priority-tag priority-${task.priority || 'normaal'}">${task.priority || 'normaal'}</span>
        <button class="delete-task" type="button" data-delete-task aria-label="Verwijder ${escapeHtml(task.title)}" title="Verwijder taak">×</button>
      </li>`).join('');
    refs.list.hidden = !tasks.length;
    refs.empty.hidden = tasks.length > 0 || (state.tasks.length > 0 && state.filter !== 'all');
    if (state.tasks.length > 0 && !tasks.length) refs.empty.innerHTML = '<span aria-hidden="true">⌁</span><h4>Geen taken in dit overzicht.</h4><p>Pas je filter aan of voeg een nieuw aandachtspunt toe.</p><button class="text-button" type="button" data-show-all>Laat alle taken zien <span aria-hidden="true">→</span></button>';
    updateSummary();
  }

  function updateSummary() {
    const done = state.tasks.filter(task => task.done).length;
    const open = state.tasks.length - done;
    const percentage = state.tasks.length ? Math.round((done / state.tasks.length) * 100) : 0;
    $$('[data-open-count]').forEach(el => { el.textContent = open; });
    $$('[data-done-count]').forEach(el => { el.textContent = done; });
    $$('[data-total-count]').forEach(el => { el.textContent = state.tasks.length; });
    $$('[data-focus-minutes]').forEach(el => { el.textContent = state.focusMinutes; });
    refs.progressNumber.textContent = `${percentage}%`;
    refs.progress.style.background = `conic-gradient(var(--sun) ${percentage * 3.6}deg, rgba(255,255,255,.15) 0deg)`;
    refs.progress.setAttribute('aria-label', `${percentage} procent afgerond`);
    refs.summary.textContent = state.tasks.length === 0 ? 'Voeg je eerste aandachtspunt toe om je dag vorm te geven.' : percentage === 100 ? 'Alles afgerond. Neem gerust een moment voor jezelf.' : `${open} ${open === 1 ? 'punt wacht' : 'punten wachten'} nog op je aandacht.`;
  }

  function addTask(event) {
    event.preventDefault();
    const title = refs.title.value.trim();
    const titleField = refs.title.closest('.form-field');
    if (!title) {
      refs.titleError.textContent = 'Schrijf kort op wat je wilt doen.';
      titleField.classList.add('has-error'); refs.title.focus(); return;
    }
    const formData = new FormData(refs.form);
    state.tasks.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title, category: formData.get('category'), priority: formData.get('priority'), done: false, createdAt: Date.now() });
    saveTasks(); refs.form.reset(); refs.titleError.textContent = ''; titleField.classList.remove('has-error');
    state.filter = 'all'; updateFilters(); renderTasks(); toast(`“${title}” staat op je lijst.`);
  }

  function toggleTask(taskElement) {
    const task = state.tasks.find(item => item.id === taskElement.dataset.id); if (!task) return;
    task.done = !task.done; saveTasks(); renderTasks(); toast(task.done ? 'Mooi. Dat is afgerond.' : 'De taak staat weer open.');
  }

  function deleteTask(taskElement) {
    const task = state.tasks.find(item => item.id === taskElement.dataset.id); if (!task) return;
    state.tasks = state.tasks.filter(item => item.id !== task.id); saveTasks(); renderTasks(); toast(`“${task.title}” is verwijderd.`);
  }

  function updateFilters() {
    $$('[data-filter]').forEach(button => {
      const active = button.dataset.filter === state.filter;
      button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', active);
    });
  }

  function toast(message, isError = false) {
    const toastEl = document.createElement('div'); toastEl.className = `toast${isError ? ' is-error' : ''}`; toastEl.textContent = message;
    $('.toast-region').append(toastEl); window.setTimeout(() => toastEl.remove(), 3700);
  }

  function renderTimer() {
    const { remaining, duration, running } = state.timer;
    const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    refs.timerDisplay.textContent = `${minutes}:${seconds}`;
    refs.timerDisplay.dateTime = `PT${remaining}S`;
    const elapsed = duration - remaining; const degrees = duration ? (elapsed / duration) * 360 : 0;
    refs.timerDial.style.borderTopColor = 'var(--sun)';
    refs.timerDial.style.background = `conic-gradient(var(--sun) ${degrees}deg, transparent ${degrees}deg)`;
    refs.timerDial.style.border = '10px solid #315c53';
    refs.timerToggle.innerHTML = running ? 'Pauzeer <span aria-hidden="true">Ⅱ</span>' : `${remaining === duration ? 'Start focus' : 'Ga verder'} <span aria-hidden="true">→</span>`;
    refs.timerStatus.textContent = running ? 'je bent gefocust bezig' : remaining === duration ? 'klaar wanneer jij dat bent' : 'even op adem komen';
  }

  function setDuration(minutes) {
    if (state.timer.running) return;
    state.timer.duration = minutes * 60; state.timer.remaining = minutes * 60;
    $$('[data-duration]').forEach(button => button.classList.toggle('is-active', Number(button.dataset.duration) === minutes));
    refs.timerMessage.textContent = `${minutes} minuten gereserveerd voor jouw aandacht.`; renderTimer();
  }

  function toggleTimer() {
    if (state.timer.running) { pauseTimer(); refs.timerMessage.textContent = 'Je sessie staat op pauze. Neem rustig de tijd.'; return; }
    state.timer.running = true; refs.timerMessage.textContent = 'Focusmodus aan. Je hoeft nu alleen maar te beginnen.';
    state.timer.interval = window.setInterval(tickTimer, 1000); renderTimer();
  }

  function pauseTimer() { window.clearInterval(state.timer.interval); state.timer.interval = null; state.timer.running = false; renderTimer(); }
  function tickTimer() {
    if (state.timer.remaining > 0) { state.timer.remaining -= 1; renderTimer(); return; }
    pauseTimer(); state.focusMinutes += Math.round(state.timer.duration / 60); localStorage.setItem(FOCUS_KEY, String(state.focusMinutes)); updateSummary();
    refs.timerMessage.textContent = 'Je focusblok is klaar. Goed gedaan — nu is pauze ook productief.'; toast('Focusblok afgerond. Tijd voor een korte pauze.');
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Focusboard', { body: 'Je focusblok is afgerond.' });
  }

  function resetTimer() { pauseTimer(); state.timer.remaining = state.timer.duration; refs.timerMessage.textContent = 'Opnieuw ingesteld. Start wanneer je er klaar voor bent.'; renderTimer(); }

  function bindEvents() {
    refs.form.addEventListener('submit', addTask);
    refs.title.addEventListener('input', () => { refs.titleError.textContent = ''; refs.title.closest('.form-field').classList.remove('has-error'); });
    refs.list.addEventListener('click', event => { const item = event.target.closest('.task-item'); if (!item) return; if (event.target.closest('[data-toggle-task]')) toggleTask(item); if (event.target.closest('[data-delete-task]')) deleteTask(item); });
    refs.empty.addEventListener('click', event => { if (event.target.closest('[data-focus-input]')) refs.title.focus(); if (event.target.closest('[data-show-all]')) { state.filter = 'all'; updateFilters(); renderTasks(); } });
    $$('[data-filter]').forEach(button => button.addEventListener('click', () => { state.filter = button.dataset.filter; updateFilters(); renderTasks(); }));
    refs.sort.addEventListener('change', () => { state.sort = refs.sort.value; renderTasks(); });
    $('[data-reset-tasks]').addEventListener('click', () => { if (!state.tasks.length) { toast('Je lijst is al leeg.'); return; } if (window.confirm('Wil je alle aandachtspunten verwijderen? Dit kan niet ongedaan worden gemaakt.')) { state.tasks = []; saveTasks(); renderTasks(); toast('Je lijst is weer leeg.'); } });
    $('[data-focus-input]').addEventListener('click', () => refs.title.focus());
    $$('[data-duration]').forEach(button => button.addEventListener('click', () => setDuration(Number(button.dataset.duration))));
    refs.timerToggle.addEventListener('click', toggleTimer); $('[data-timer-reset]').addEventListener('click', resetTimer);
    const menuButton = $('.menu-toggle'); const menu = $('.site-nav');
    menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!open)); menu.classList.toggle('is-open', !open); });
    $$('.site-nav a').forEach(link => link.addEventListener('click', () => { menuButton.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); }));
    window.addEventListener('scroll', () => $('[data-header]').classList.toggle('is-scrolled', window.scrollY > 10), { passive: true });
  }

  function initialize() {
    $('#today-label').textContent = formatToday();
    $('#hero-date').textContent = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).replace(/^./, char => char.toUpperCase());
    $('#year').textContent = new Date().getFullYear();
    bindEvents(); updateFilters(); renderTasks(); renderTimer();
  }
  initialize();
})();
