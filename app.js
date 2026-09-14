/**
 * Ezra Personal AI Dashboard & Master Clock
 * High precision live time, world clocks, focus timer, canvas particles, and sound synthesizer.
 */

// Application State
const state = {
  is24Hour: true,
  soundEnabled: false,
  startTime: Date.now(),
  theme: localStorage.getItem('ezra_theme') || 'cosmos',
  audioCtx: null,
  
  // Pomodoro
  pomodoro: {
    duration: 25 * 60,
    remaining: 25 * 60,
    interval: null,
    isRunning: false,
  },

  // Stopwatch
  stopwatch: {
    startTime: 0,
    elapsed: 0,
    interval: null,
    isRunning: false,
    laps: [],
  }
};

// DOM Elements
const elements = {
  hours: document.getElementById('clock-hours'),
  minutes: document.getElementById('clock-minutes'),
  seconds: document.getElementById('clock-seconds'),
  period: document.getElementById('clock-period'),
  millisProgress: document.getElementById('millis-progress'),
  dateDisplay: document.getElementById('date-display'),
  greetingIcon: document.getElementById('greeting-icon'),
  greetingText: document.getElementById('greeting-text'),
  timezoneDisplay: document.getElementById('timezone-display'),
  dayOfYear: document.getElementById('day-of-year'),
  weekNumber: document.getElementById('week-number'),
  unixTimestamp: document.getElementById('unix-timestamp'),
  uptimeCounter: document.getElementById('uptime-counter'),
  formatToggle: document.getElementById('format-toggle'),
  copyTimeBtn: document.getElementById('copy-time-btn'),
  themeSelect: document.getElementById('theme-select'),
  soundToggleBtn: document.getElementById('sound-toggle-btn'),
  toast: document.getElementById('toast'),
  
  // World Clocks
  timeTaipei: document.getElementById('time-taipei'),
  timeTokyo: document.getElementById('time-tokyo'),
  timeSF: document.getElementById('time-sf'),
  timeNY: document.getElementById('time-ny'),
  timeLondon: document.getElementById('time-london'),
  timeUTC: document.getElementById('time-utc'),

  // Productivity
  tabPomodoro: document.getElementById('tab-pomodoro'),
  tabStopwatch: document.getElementById('tab-stopwatch'),
  pomodoroView: document.getElementById('pomodoro-view'),
  stopwatchView: document.getElementById('stopwatch-view'),
  pomodoroDisplay: document.getElementById('pomodoro-display'),
  pomoStart: document.getElementById('pomo-start'),
  pomoReset: document.getElementById('pomo-reset'),
  swDisplay: document.getElementById('stopwatch-display'),
  swStart: document.getElementById('sw-start'),
  swLap: document.getElementById('sw-lap'),
  swReset: document.getElementById('sw-reset'),
  swLapsList: document.getElementById('sw-laps'),
};

// Initialize App
function initApp() {
  applyTheme(state.theme);
  setupEventListeners();
  initCanvas();
  updateClocks();
  setInterval(updateClocks, 40); // 25fps clock & millisecond progress update
  setInterval(updateSessionUptime, 1000);
}

// -------------------------------------------------------------
// CLOCK & TIME FUNCTIONS
// -------------------------------------------------------------
function updateClocks() {
  const now = new Date();

  // Primary Clock
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const millis = now.getMilliseconds();

  let period = '';
  if (!state.is24Hour) {
    period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
  }

  elements.hours.textContent = String(hours).padStart(2, '0');
  elements.minutes.textContent = String(minutes).padStart(2, '0');
  elements.seconds.textContent = String(seconds).padStart(2, '0');
  elements.period.textContent = period;

  // Milliseconds smooth bar
  const millisPercent = ((millis / 1000) * 100).toFixed(1);
  elements.millisProgress.style.width = `${millisPercent}%`;

  // Date primary display
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  elements.dateDisplay.textContent = now.toLocaleDateString(undefined, dateOptions);

  // Greeting
  updateGreeting(now.getHours());

  // Meta stats
  elements.timezoneDisplay.textContent = `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'}`;
  elements.dayOfYear.textContent = `Day ${getDayOfYear(now)} of ${isLeapYear(now.getFullYear()) ? 366 : 365}`;
  elements.weekNumber.textContent = `Week ${getISOWeek(now)}`;
  elements.unixTimestamp.textContent = `Epoch: ${Math.floor(now.getTime() / 1000)}`;

  // World Clocks
  updateWorldTime(elements.timeTaipei, 'Asia/Taipei');
  updateWorldTime(elements.timeTokyo, 'Asia/Tokyo');
  updateWorldTime(elements.timeSF, 'America/Los_Angeles');
  updateWorldTime(elements.timeNY, 'America/New_York');
  updateWorldTime(elements.timeLondon, 'Europe/London');
  updateWorldTime(elements.timeUTC, 'UTC');
}

function updateWorldTime(element, timeZone) {
  if (!element) return;
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !state.is24Hour
  });
  element.textContent = timeString;
}

function updateGreeting(hour) {
  let greeting = 'Good day';
  let icon = '✨';

  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning, Ezra';
    icon = '☀️';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Good afternoon, Ezra';
    icon = '🌤️';
  } else if (hour >= 18 && hour < 22) {
    greeting = 'Good evening, Ezra';
    icon = '🌙';
  } else {
    greeting = 'Late Night Focus, Ezra';
    icon = '🦉';
  }

  elements.greetingIcon.textContent = icon;
  elements.greetingText.textContent = `${greeting}!`;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function updateSessionUptime() {
  const elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  elements.uptimeCounter.textContent = `${mins}m ${secs}s`;
}

// -------------------------------------------------------------
// EVENT LISTENERS & ACTIONS
// -------------------------------------------------------------
function setupEventListeners() {
  // 12/24 Hour format toggle
  elements.formatToggle.addEventListener('click', () => {
    state.is24Hour = !state.is24Hour;
    elements.formatToggle.textContent = state.is24Hour ? '24H' : '12H';
    elements.formatToggle.classList.toggle('active', !state.is24Hour);
    showToast(`Switched to ${state.is24Hour ? '24-Hour' : '12-Hour'} format`);
    updateClocks();
  });

  // Copy ISO Timestamp
  elements.copyTimeBtn.addEventListener('click', () => {
    const isoString = new Date().toISOString();
    navigator.clipboard.writeText(isoString).then(() => {
      showToast(`Copied ISO: ${isoString}`);
      playChime(880, 0.1);
    }).catch(() => {
      showToast(`Timestamp: ${isoString}`);
    });
  });

  // Theme selector
  elements.themeSelect.value = state.theme;
  elements.themeSelect.addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });

  // Sound Toggle
  elements.soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    const soundIcon = elements.soundToggleBtn.querySelector('.sound-icon');
    soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    if (state.soundEnabled) {
      playChime(523.25, 0.2); // C5 note
      showToast('Sound enabled');
    } else {
      showToast('Sound muted');
    }
  });

  // Productivity Tabs
  elements.tabPomodoro.addEventListener('click', () => {
    elements.tabPomodoro.classList.add('active');
    elements.tabStopwatch.classList.remove('active');
    elements.pomodoroView.classList.remove('hidden');
    elements.stopwatchView.classList.add('hidden');
  });

  elements.tabStopwatch.addEventListener('click', () => {
    elements.tabStopwatch.classList.add('active');
    elements.tabPomodoro.classList.remove('active');
    elements.stopwatchView.classList.remove('hidden');
    elements.pomodoroView.classList.add('hidden');
  });

  // Pomodoro Controls
  elements.pomoStart.addEventListener('click', togglePomodoro);
  elements.pomoReset.addEventListener('click', resetPomodoro);
  document.querySelectorAll('.preset-buttons .chip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.preset-buttons .chip-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const mins = parseInt(e.target.dataset.time, 10);
      setPomodoroDuration(mins);
    });
  });

  // Stopwatch Controls
  elements.swStart.addEventListener('click', toggleStopwatch);
  elements.swLap.addEventListener('click', recordLap);
  elements.swReset.addEventListener('click', resetStopwatch);
}

function applyTheme(themeName) {
  state.theme = themeName;
  document.body.setAttribute('data-theme', themeName);
  localStorage.setItem('ezra_theme', themeName);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(elements.toast._timeout);
  elements.toast._timeout = setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 2500);
}

// -------------------------------------------------------------
// AUDIO SYNTHESIS (Zero external dependencies)
// -------------------------------------------------------------
function playChime(freq = 600, duration = 0.15) {
  if (!state.soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!state.audioCtx) state.audioCtx = new AudioContext();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();

    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.15, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(state.audioCtx.destination);

    osc.start();
    osc.stop(state.audioCtx.currentTime + duration);
  } catch (e) {
    console.error(e);
  }
}

// -------------------------------------------------------------
// POMODORO FOCUS TIMER
// -------------------------------------------------------------
function setPomodoroDuration(mins) {
  clearInterval(state.pomodoro.interval);
  state.pomodoro.isRunning = false;
  state.pomodoro.duration = mins * 60;
  state.pomodoro.remaining = mins * 60;
  elements.pomoStart.textContent = 'Start Focus';
  elements.pomoStart.classList.remove('btn-secondary');
  elements.pomoStart.classList.add('btn-primary');
  renderPomodoroDisplay();
}

function togglePomodoro() {
  if (state.pomodoro.isRunning) {
    clearInterval(state.pomodoro.interval);
    state.pomodoro.isRunning = false;
    elements.pomoStart.textContent = 'Resume';
  } else {
    state.pomodoro.isRunning = true;
    elements.pomoStart.textContent = 'Pause';
    state.pomodoro.interval = setInterval(() => {
      if (state.pomodoro.remaining > 0) {
        state.pomodoro.remaining--;
        renderPomodoroDisplay();
      } else {
        clearInterval(state.pomodoro.interval);
        state.pomodoro.isRunning = false;
        elements.pomoStart.textContent = 'Start Focus';
        playChime(784, 0.4); // G5 chime
        showToast('🎉 Focus session completed! Great job.');
      }
    }, 1000);
  }
}

function resetPomodoro() {
  clearInterval(state.pomodoro.interval);
  state.pomodoro.isRunning = false;
  state.pomodoro.remaining = state.pomodoro.duration;
  elements.pomoStart.textContent = 'Start Focus';
  renderPomodoroDisplay();
}

function renderPomodoroDisplay() {
  const m = Math.floor(state.pomodoro.remaining / 60);
  const s = state.pomodoro.remaining % 60;
  elements.pomodoroDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// -------------------------------------------------------------
// STOPWATCH
// -------------------------------------------------------------
function toggleStopwatch() {
  if (state.stopwatch.isRunning) {
    clearInterval(state.stopwatch.interval);
    state.stopwatch.isRunning = false;
    state.stopwatch.elapsed += Date.now() - state.stopwatch.startTime;
    elements.swStart.textContent = 'Resume';
    elements.swLap.disabled = true;
  } else {
    state.stopwatch.isRunning = true;
    state.stopwatch.startTime = Date.now();
    elements.swStart.textContent = 'Pause';
    elements.swLap.disabled = false;
    state.stopwatch.interval = setInterval(() => {
      const current = state.stopwatch.elapsed + (Date.now() - state.stopwatch.startTime);
      renderStopwatchDisplay(current);
    }, 30);
  }
}

function recordLap() {
  if (!state.stopwatch.isRunning) return;
  const current = state.stopwatch.elapsed + (Date.now() - state.stopwatch.startTime);
  const lapTimeStr = formatStopwatch(current);
  state.stopwatch.laps.unshift(lapTimeStr);

  const lapItem = document.createElement('div');
  lapItem.className = 'sw-lap-item';
  lapItem.innerHTML = `<span>Lap ${state.stopwatch.laps.length}</span><span>${lapTimeStr}</span>`;
  elements.swLapsList.prepend(lapItem);
  playChime(659.25, 0.08); // E5 note
}

function resetStopwatch() {
  clearInterval(state.stopwatch.interval);
  state.stopwatch.isRunning = false;
  state.stopwatch.elapsed = 0;
  state.stopwatch.laps = [];
  elements.swStart.textContent = 'Start';
  elements.swLap.disabled = true;
  elements.swDisplay.textContent = '00:00.00';
  elements.swLapsList.innerHTML = '';
}

function formatStopwatch(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function renderStopwatchDisplay(ms) {
  elements.swDisplay.textContent = formatStopwatch(ms);
}

// -------------------------------------------------------------
// DYNAMIC CANVAS BACKGROUND PARTICLES
// -------------------------------------------------------------
function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(Math.floor(width / 25), 45);

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.4 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw lines between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - dist / 130)})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particle points
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    }

    requestAnimationFrame(draw);
  }

  draw();
}

// Start on DOM loaded
document.addEventListener('DOMContentLoaded', initApp);
