/* ============================================================
   timer.js — a small stopwatch that excludes paused time,
   backed by Data.activeSession so a page refresh mid-workout
   doesn't lose progress.
   ============================================================ */

class WorkoutSession {
  constructor(day) {
    this.day = day;
    const existing = Data.getActiveSession();
    if (existing && existing.dayId === day.id) {
      this.state = existing;
    } else {
      this.state = {
        dayId: day.id,
        dayName: day.name,
        date: todayStr(),
        startedAt: null,
        status: 'idle', // idle | running | paused | done
        accumulatedMs: 0,   // total counted (running) time so far
        lastResumeAt: null, // timestamp of most recent start/resume
        completedExerciseIds: []
      };
      this.persist();
    }
    this._tickHandlers = [];
  }

  persist() {
    Data.setActiveSession(this.state);
  }

  onTick(fn) {
    this._tickHandlers.push(fn);
  }

  start() {
    if (this.state.status === 'running') return;
    this.state.status = 'running';
    if (!this.state.startedAt) this.state.startedAt = Date.now();
    this.state.lastResumeAt = Date.now();
    this.persist();
    this._runLoop();
  }

  pause() {
    if (this.state.status !== 'running') return;
    this.state.accumulatedMs += Date.now() - this.state.lastResumeAt;
    this.state.lastResumeAt = null;
    this.state.status = 'paused';
    this.persist();
    this._stopLoop();
  }

  resume() {
    this.start();
  }

  toggleExercise(exId) {
    const idx = this.state.completedExerciseIds.indexOf(exId);
    if (idx >= 0) this.state.completedExerciseIds.splice(idx, 1);
    else this.state.completedExerciseIds.push(exId);
    this.persist();
  }

  isComplete(exId) {
    return this.state.completedExerciseIds.includes(exId);
  }

  allComplete() {
    return this.day.exercises.length > 0 &&
      this.day.exercises.every(ex => this.state.completedExerciseIds.includes(ex.id));
  }

  currentElapsedMs() {
    let ms = this.state.accumulatedMs;
    if (this.state.status === 'running' && this.state.lastResumeAt) {
      ms += Date.now() - this.state.lastResumeAt;
    }
    return ms;
  }

  // finalize the session, save a workout log entry, clear active session
  finish() {
    if (this.state.status === 'running') {
      this.state.accumulatedMs += Date.now() - this.state.lastResumeAt;
      this.state.lastResumeAt = null;
    }
    this.state.status = 'done';
    const durationSeconds = Math.round(this.state.accumulatedMs / 1000);
    const log = {
      id: uid(),
      dayId: this.day.id,
      dayName: this.day.name,
      date: this.state.date,
      startedAt: this.state.startedAt ? new Date(this.state.startedAt).toISOString() : null,
      finishedAt: new Date().toISOString(),
      durationSeconds,
      totalExercises: this.day.exercises.length,
      completedExerciseIds: this.state.completedExerciseIds.slice()
    };
    Data.addWorkoutLog(log);
    Data.clearActiveSession();
    this._stopLoop();
    return log;
  }

  discard() {
    Data.clearActiveSession();
    this._stopLoop();
  }

  _runLoop() {
    this._stopLoop();
    this._interval = setInterval(() => {
      this._tickHandlers.forEach(fn => fn(this.currentElapsedMs()));
    }, 1000);
  }

  _stopLoop() {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
  }
}
