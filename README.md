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

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
};

const formatDateForInput = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatHours = (minutesTotal) => {
  const totalHours = minutesTotal / 60;

  if (totalHours >= 1) {
    return `${totalHours.toFixed(totalHours % 1 === 0 ? 0 : 1)}h`;
  }

  return `${minutesTotal}m`;
};

const renderStats = (dashboard) => {
  totalHoursEl.textContent = formatHours(dashboard.totalMinutes || 0);
  totalSessionsEl.textContent = `${dashboard.sessionsCount || 0} session${dashboard.sessionsCount === 1 ? '' : 's'}`;
  streakCountEl.textContent = `${dashboard.streak || 0} day${dashboard.streak === 1 ? '' : 's'}`;
  bestSubjectEl.textContent = dashboard.bestSubject || '—';
  bestSubjectMinutesEl.textContent = dashboard.bestSubject ? `${dashboard.bestSubjectMinutes} min` : '0 min';
  averageSessionEl.textContent = `${dashboard.average || 0} min`;
};

const renderWeeklyChart = (weekly = []) => {
  if (!weekly.length) {
    weeklyChart.innerHTML = '<div class="empty-state">No study data for the last 7 days.</div>';
    weeklyTotalEl.textContent = '0 min';
    return;
  }

  const maxMinutes = Math.max(...weekly.map((day) => day.minutes), 1);
  const totalWeekly = weekly.reduce((sum, day) => sum + (day.minutes || 0), 0);

  weeklyTotalEl.textContent = `${totalWeekly} min`;

  weeklyChart.innerHTML = weekly
    .map((day) => {
      const height = Math.max(12, (day.minutes / maxMinutes) * 100);
      return `
        <div class="day-segment">
          <div class="bar-wrap">
            <div class="bar" style="height: ${height}%"></div>
          </div>
          <span class="day-total">${day.minutes}m</span>
          <span class="day-label">${day.label}</span>
        </div>
      `;
    })
    .join('');
};

const renderSubjectBreakdown = (subjectBreakdown = []) => {
  const totalMinutes = subjectBreakdown.reduce((sum, item) => sum + item.minutes, 0) || 1;

  subjectList.innerHTML = subjectBreakdown.length
    ? subjectBreakdown
        .map((item) => {
          const width = Math.max((item.minutes / totalMinutes) * 100, 8);
          return `
            <div class="subject-row">
              <div class="subject-meta">
                <span>${item.subject}</span>
                <strong>${item.minutes} min</strong>
              </div>
              <div class="subject-bar">
                <div class="subject-fill" style="width: ${width}%"></div>
              </div>
            </div>
          `;
        })
        .join('')
    : '<div class="empty-state">No subjects yet. Add your first study session.</div>';
};

const renderSessions = (sessions = []) => {
  sessionCountBadge.textContent = String(sessions.length);

  if (!sessions.length) {
    sessionList.innerHTML = '<div class="empty-state">Your study history will appear here.</div>';
    return;
  }

  sessionList.innerHTML = sessions
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
                year: 'numeric'
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

const renderDashboard = (dashboard) => {
  renderStats(dashboard);
  renderWeeklyChart(dashboard.weekly || []);
  renderSubjectBreakdown(dashboard.subjectBreakdown || []);
  renderSessions(dashboard.sessions || []);
};

const loadDashboard = async () => {
  try {
    const dashboard = await api('/api/dashboard');
    renderDashboard(dashboard);
  } catch (error) {
    sessionList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    subject: subjectInput.value.trim(),
    minutes: Number(minutesInput.value),
    date: dateInput.value || formatDateForInput(),
    type: typeInput.value
  };

  if (!payload.subject || !payload.minutes || payload.minutes <= 0) {
    return;
  }

  try {
    await api('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    form.reset();
    dateInput.value = formatDateForInput();
    minutesInput.value = 45;
    typeInput.value = 'Revision';
    subjectInput.focus();
    await loadDashboard();
  } catch (error) {
    sessionList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
});

resetBtn.addEventListener('click', async () => {
  const confirmReset = window.confirm('Reset all study data?');
  if (!confirmReset) return;

  try {
    const dashboard = await api('/api/reset', { method: 'POST' });
    renderDashboard(dashboard);
  } catch (error) {
    sessionList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
});

sessionList.addEventListener('click', async (event) => {
  const button = event.target.closest('.delete-btn');
  if (!button) return;

  const { id } = button.dataset;

  try {
    await api(`/api/sessions/${id}`, { method: 'DELETE' });
    await loadDashboard();
  } catch (error) {
    sessionList.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
});

document.querySelectorAll('.chip-btn').forEach((button) => {
  button.addEventListener('click', () => {
    minutesInput.value = Number(button.dataset.minutes || 45);
  });
});

dateInput.value = formatDateForInput();
loadDashboard();
