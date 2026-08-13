/* ============================================================
   storage.js — all persistence lives here (localStorage).
   Everything else in the app reads/writes through this module.
   ============================================================ */

const STORE = {
  plan: 'wlt_plan',
  workoutLogs: 'wlt_workoutLogs',
  weightLogs: 'wlt_weightLogs',
  stepLogs: 'wlt_stepLogs',
  goal: 'wlt_goal',
  activeSession: 'wlt_activeSession'
};

const DEFAULT_PLAN = {
  days: [
    {
      id: 'day-1',
      name: 'Day 1',
      exercises: [
        { id: uid(), name: 'Exercise name', sets: 3, reps: 10, weight: 0, unit: 'lbs', notes: '' }
      ]
    }
  ]
};

const DEFAULT_GOAL = {
  startWeight: null,
  goalWeight: null,
  startDate: null,
  goalDate: null
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Storage read failed for', key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Storage write failed for', key, e);
    return false;
  }
}

const Data = {
  getPlan() {
    return readJSON(STORE.plan, DEFAULT_PLAN);
  },
  setPlan(plan) {
    writeJSON(STORE.plan, plan);
  },

  getGoal() {
    return readJSON(STORE.goal, DEFAULT_GOAL);
  },
  setGoal(goal) {
    writeJSON(STORE.goal, goal);
  },

  getWeightLogs() {
    return readJSON(STORE.weightLogs, {});
  },
  setWeightEntry(dateStr, weight) {
    const logs = Data.getWeightLogs();
    logs[dateStr] = weight;
    writeJSON(STORE.weightLogs, logs);
  },
  deleteWeightEntry(dateStr) {
    const logs = Data.getWeightLogs();
    delete logs[dateStr];
    writeJSON(STORE.weightLogs, logs);
  },

  getStepLogs() {
    return readJSON(STORE.stepLogs, {});
  },
  setStepEntry(dateStr, steps, miles) {
    const logs = Data.getStepLogs();
    logs[dateStr] = { steps: steps, miles: miles };
    writeJSON(STORE.stepLogs, logs);
  },
  deleteStepEntry(dateStr) {
    const logs = Data.getStepLogs();
    delete logs[dateStr];
    writeJSON(STORE.stepLogs, logs);
  },

  getWorkoutLogs() {
    return readJSON(STORE.workoutLogs, []);
  },
  addWorkoutLog(entry) {
    const logs = Data.getWorkoutLogs();
    logs.unshift(entry);
    writeJSON(STORE.workoutLogs, logs);
  },

  getActiveSession() {
    return readJSON(STORE.activeSession, null);
  },
  setActiveSession(session) {
    writeJSON(STORE.activeSession, session);
  },
  clearActiveSession() {
    localStorage.removeItem(STORE.activeSession);
  },

  exportAll() {
    const dump = {};
    Object.entries(STORE).forEach(([k, key]) => {
      const raw = localStorage.getItem(key);
      if (raw !== null) dump[k] = JSON.parse(raw);
    });
    dump._exportedAt = new Date().toISOString();
    return dump;
  },
  importAll(dump) {
    Object.entries(STORE).forEach(([k, key]) => {
      if (dump[k] !== undefined) {
        localStorage.setItem(key, JSON.stringify(dump[k]));
      }
    });
  },
  resetAll() {
    Object.values(STORE).forEach(key => localStorage.removeItem(key));
  }
};
