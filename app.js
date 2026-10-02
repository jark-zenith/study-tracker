const STORAGE_KEY = 'study-tracker-sessions-v1';

const demoSessions = [
  { id: crypto.randomUUID(), subject: 'Math', minutes: 50, date: '2026-10-01', type: 'Practice' },
  { id: crypto.randomUUID(), subject: 'Biology', minutes: 35, date: '2026-10-01', type: 'Reading' },
  { id: crypto.randomUUID(), subject: 'History', minutes: 40, date: '2026-09-30', type: 'Revision' },
  { id: crypto.randomUUID(), subject: 'Computer Science', minutes: 65, date: '2026-09-29', type: 'Homework' },
  { id: crypto.randomUUID(), subject: 'Chemistry', minutes: 45, date: '2026-09-28', type: 'Practice' },
  { id: crypto.randomUUID(), subject: 'Math', minutes: 55, date: '2026-09-27', type: 'Revision' },
  { id: crypto.randomUUID(), subject: 'Languages', minutes: 30, date: '2026-09-26', type: 'Reading' },
];

const form = document.getElementById('sessionForm');
const subjectInput = document.getElementById('subjectInput');
const minutesInput = document.getElementById('minutesInput');
const dateInput = document.getElementById('dateInput');
const typeInput = document.getElementById('typeInput');
const sessionList = document.getElementById('sessionList');
const weeklyChart = document.getElementById('weeklyChart');
const subjectList = document.getElementById('subjectList');
const resetBtn = document.getElementById('resetBtn');

const totalHoursEl = document.getElementById('totalHours');
const totalSessionsEl = document.getElementById('totalSessions');
const streakCountEl = document.getElementById('streakCount');
const bestSubjectEl = document.getElementById('bestSubject');
const bestSubjectMinutesEl = document.getElementById('bestSubjectMinutes');
const averageSessionEl = document.getElementById('averageSession');
const weeklyTotalEl = document.getElementById('weeklyTotal');
const sessionCountBadge = document.getElementById('sessionCountBadge');

const formatDateForInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadSessions = () => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoSessions));
    return [...demoSessions];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : [...demoSessions];
  } catch {
    return [...demoSessions];
  }
};

let sessions = loadSessions();

const saveSessions = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

const sortedSessions = () => [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

const getWeekDates = () => {
  const dates = [];
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - i);
    dates.push(current);
  }

  return dates;
};

const formatHours = (minutesTotal) => {
  const hours = minutesTotal / 60;

  if (hours >= 1) {
    return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
  }

  return `${minutesTotal}m`;
};

const getStudyStreak = () => {
  if (!sessions.length) return 0;

  const uniqueDates = new Set(
    sessions.map((session) => new Date(session.date).toISOString().slice(0, 10))
  );

  const today = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - i);
    const key = current.toISOString().slice(0, 10);

    if (uniqueDates.has(key)) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
};

const renderStats = () => {
  const totalMinutes = sessions.reduce((sum, session) => sum + Number(session.minutes || 0), 0);
  const totalHours = totalMinutes / 60;
  const average = sessions.length ? Math.round(totalMinutes / sessions.length) : 0;

  const bySubject = sessions.reduce((map, session) => {
    const key = session.subject;
    map[key] = (map[key] || 0) + Number(session.minutes || 0);
    return map;
  }, {});

  const best = Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0];

  totalHoursEl.textContent = totalHours >= 1 ? `${totalHours.toFixed(totalHours % 1 === 0 ? 0 : 1)}h` : `${totalMinutes}m`;
  totalSessionsEl.textContent = `${sessions.length} session${sessions.length === 1 ? '' : 's'}`;
  streakCountEl.textContent = `${getStudyStreak()} day${getStudyStreak() === 1 ? '' : 's'}`;
  bestSubjectEl.textContent = best ? best[0] : '—';
  bestSubjectMinutesEl.textContent = best ? `${best[1]} min` : '0 min';
  averageSessionEl.textContent = `${average} min`;
};

const renderWeeklyChart = () => {
  const days = getWeekDates();
  const totalByDay = days.map((day) => {
    const dateKey = day.toISOString().slice(0, 10);
    const minutes = sessions
      .filter((session) => new Date(session.date).toISOString().slice(0, 10) === dateKey)
      .reduce((sum, session) => sum + Number(session.minutes || 0), 0);

    return { day, minutes };
  });

  const maxMinutes = Math.max(...totalByDay.map((item) => item.minutes), 1);
  const weeklyTotal = totalByDay.reduce((sum, item) => sum + item.minutes, 0);
  weeklyTotalEl.textContent = `${weeklyTotal} min`;

  weeklyChart.innerHTML = totalByDay
    .map(({ day, minutes }) => {
      const height = Math.max(12, (minutes / maxMinutes) * 100);
      const label = day.toLocaleDateString('en-US', { weekday: 'short' });
      return `
        <div class="day-segment">
          <div class="bar-wrap">
            <div class="bar" style="height: ${height}%"></div>
          </div>
          <span class="day-total">${minutes}m</span>
          <span class="day-label">${label}</span>
        </div>
      `;
    })
    .join('');
};

const renderSubjectBreakdown = () => {
  const bySubject = sessions.reduce((map, session) => {
    const key = session.subject;
    map[key] = (map[key] || 0) + Number(session.minutes || 0);
    return map;
  }, {});

  const totalMinutes = Object.values(bySubject).reduce((sum, value) => sum + value, 0) || 1;
  const entries = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);

  subjectList.innerHTML = entries.length
    ? entries
        .map(([subject, minutes]) => {
          const percentage = Math.max((minutes / totalMinutes) * 100, 8);
          return `
            <div class="subject-row">
              <div class="subject-meta">
                <span>${subject}</span>
                <strong>${minutes} min</strong>
              </div>
              <div class="subject-bar">
                <div class="subject-fill" style="width: ${percentage}%"></div>
              </div>
            </div>
          `;
        })
        .join('')
    : '<div class="empty-state">No subjects yet. Add your first study session.</div>';
};

const renderSessions = () => {
  const items = sortedSessions();
  sessionCountBadge.textContent = String(items.length);

  if (!items.length) {
    sessionList.innerHTML = '<div class="empty-state">Your study history will appear here.</div>';
    return;
  }

  sessionList.innerHTML = items
    .map(
      (session) => `
        <div class="session-item">
          <div class="session-main">
            <div class="session-top">
              <span class="session-title">${session.subject}</span>
              <span class="session-tag">${session.type}</span>
            </div>
            <div class="session-meta">
              ${session.minutes} min • ${new Date(session.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
          <div class="session-actions">
            <button class="delete-btn" data-id="${session.id}" type="button">Delete</button>
          </div>
        </div>
      `
    )
    .join('');
};

const updateDashboard = () => {
  renderStats();
  renderWeeklyChart();
  renderSubjectBreakdown();
  renderSessions();
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const subject = subjectInput.value.trim();
  const minutes = Number(minutesInput.value);
  const date = dateInput.value || formatDateForInput();
  const type = typeInput.value;

  if (!subject || !minutes || minutes <= 0) {
    return;
  }

  sessions.unshift({
    id: crypto.randomUUID(),
    subject,
    minutes,
    date,
    type,
  });

  saveSessions();
  form.reset();
  dateInput.value = formatDateForInput();
  minutesInput.value = 45;
  typeInput.value = 'Revision';
  subjectInput.focus();
  updateDashboard();
});

resetBtn.addEventListener('click', () => {
  const confirmReset = window.confirm('Reset all study data?');
  if (!confirmReset) return;

  sessions = [...demoSessions];
  saveSessions();
  updateDashboard();
});

sessionList.addEventListener('click', (event) => {
  const button = event.target.closest('.delete-btn');
  if (!button) return;

  const { id } = button.dataset;
  sessions = sessions.filter((session) => session.id !== id);
  saveSessions();
  updateDashboard();
});

document.querySelectorAll('.chip-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const minutes = Number(button.dataset.minutes || 45);
    minutesInput.value = minutes;
  });
});

dateInput.value = formatDateForInput();
updateDashboard();
