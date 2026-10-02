const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'study-tracker.db');

app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }

  console.log('Connected to SQLite database');
});

const isoDate = (date) => date.toISOString().slice(0, 10);

const seedSessions = () => {
  const today = new Date();
  const sessions = [
    { subject: 'Math', minutes: 50, date: isoDate(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 0)), type: 'Practice' },
    { subject: 'Biology', minutes: 35, date: isoDate(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 1)), type: 'Reading' },
    { subject: 'History', minutes: 40, date: isoDate(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 2)), type: 'Revision' },
    { subject: 'Computer Science', minutes: 65, date: isoDate(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3)), type: 'Homework' },
    { subject: 'Chemistry', minutes: 45, date: isoDate(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5)), type: 'Practice' },
    { subject: 'Math', minutes: 55, date: isoDate(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 6)), type: 'Revision' },
    { subject: 'Languages', minutes: 30, date: isoDate(new Date(today.getTime() - 1000 * 60 * 60 * 24 * 8)), type: 'Reading' }
  ];

  return sessions.map((session) => ({
    ...session,
    id: crypto.randomUUID(),
  }));
};

const ensureDatabase = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        minutes INTEGER NOT NULL CHECK(minutes > 0),
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `, (error) => {
      if (error) {
        console.error('Table creation failed:', error.message);
        return;
      }

      db.get('SELECT COUNT(*) AS count FROM sessions', (countError, result) => {
        if (countError) {
          console.error('Count query failed:', countError.message);
          return;
        }

        if (result.count === 0) {
          const sampleData = seedSessions();
          const insertStatement = db.prepare('INSERT INTO sessions (id, subject, minutes, date, type) VALUES (?, ?, ?, ?, ?)');

          sampleData.forEach((session) => {
            insertStatement.run(session.id, session.subject, session.minutes, session.date, session.type);
          });

          insertStatement.finalize();
          console.log('Seed data inserted');
        }
      });
    });
  });
};

ensureDatabase();

const getWeekDates = () => {
  const today = new Date();
  const dates = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }

  return dates;
};

const computeStats = (rows) => {
  const totalMinutes = rows.reduce((sum, row) => sum + Number(row.minutes || 0), 0);
  const average = rows.length ? Math.round(totalMinutes / rows.length) : 0;

  const bySubject = rows.reduce((acc, row) => {
    const key = row.subject;
    acc[key] = (acc[key] || 0) + Number(row.minutes || 0);
    return acc;
  }, {});

  const bestSubject = Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0];
  const streakDates = new Set(rows.map((row) => row.date));
  let streak = 0;
  const current = new Date();

  for (let i = 0; i < 365; i += 1) {
    const date = new Date(current);
    date.setDate(current.getDate() - i);
    const key = date.toISOString().slice(0, 10);

    if (streakDates.has(key)) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
  }

  const weekly = getWeekDates().map((day) => {
    const key = isoDate(day);
    const minutes = rows
      .filter((row) => row.date === key)
      .reduce((sum, row) => sum + Number(row.minutes || 0), 0);

    return {
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes
    };
  });

  const subjectBreakdown = Object.entries(bySubject)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  return {
    totalMinutes,
    totalHours: totalMinutes / 60,
    average,
    sessionsCount: rows.length,
    streak,
    bestSubject: bestSubject ? bestSubject[0] : null,
    bestSubjectMinutes: bestSubject ? bestSubject[1] : 0,
    weekly,
    subjectBreakdown,
    sessions: rows.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  };
};

app.get('/api/dashboard', (req, res) => {
  db.all('SELECT * FROM sessions ORDER BY date DESC, created_at DESC', (error, rows) => {
    if (error) {
      return res.status(500).json({ error: 'Could not fetch sessions' });
    }

    return res.json(computeStats(rows));
  });
});

app.post('/api/sessions', (req, res) => {
  const { subject, minutes, date, type } = req.body || {};
  const cleanSubject = String(subject || '').trim();
  const cleanMinutes = Number(minutes);
  const cleanDate = String(date || '').trim();
  const cleanType = String(type || 'Revision').trim();

  if (!cleanSubject || !cleanDate || !Number.isFinite(cleanMinutes) || cleanMinutes <= 0) {
    return res.status(400).json({ error: 'Subject, valid minutes, and date are required.' });
  }

  const session = {
    id: crypto.randomUUID(),
    subject: cleanSubject,
    minutes: cleanMinutes,
    date: cleanDate,
    type: cleanType || 'Revision'
  };

  db.run(
    'INSERT INTO sessions (id, subject, minutes, date, type) VALUES (?, ?, ?, ?, ?)',
    [session.id, session.subject, session.minutes, session.date, session.type],
    (insertError) => {
      if (insertError) {
        return res.status(500).json({ error: 'Could not create session' });
      }

      return res.status(201).json({ session });
    }
  );
});

app.delete('/api/sessions/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM sessions WHERE id = ?', [id], (error) => {
    if (error) {
      return res.status(500).json({ error: 'Could not delete session' });
    }

    return res.json({ success: true });
  });
});

app.post('/api/reset', (req, res) => {
  const sampleData = seedSessions();

  db.run('DELETE FROM sessions', (deleteError) => {
    if (deleteError) {
      return res.status(500).json({ error: 'Could not reset database' });
    }

    const insertStatement = db.prepare('INSERT INTO sessions (id, subject, minutes, date, type) VALUES (?, ?, ?, ?, ?)');

    sampleData.forEach((session) => {
      insertStatement.run(session.id, session.subject, session.minutes, session.date, session.type);
    });

    insertStatement.finalize();

    db.all('SELECT * FROM sessions ORDER BY date DESC, created_at DESC', (readError, rows) => {
      if (readError) {
        return res.status(500).json({ error: 'Could not load reset data' });
      }

      return res.json(computeStats(rows));
    });
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  return res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Study Tracker API running on http://localhost:${PORT}`);
});
