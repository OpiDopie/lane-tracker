/* ============================================================
   views/workout.js
   ============================================================ */

const WorkoutView = {
  session: null,

  render(root) {
    const plan = Data.getPlan();
    const active = Data.getActiveSession();

    if (active) {
      const day = plan.days.find(d => d.id === active.dayId);
      if (day) {
        this.renderSession(root, day);
        return;
      }
    }
    this.renderList(root, plan);
  },

  renderList(root, plan) {
    const wrap = el('div', { class: 'view workout-view' });
    wrap.appendChild(el('div', { class: 'view-header' }, [
      el('h1', {}, 'Workout'),
      el('p', { class: 'view-sub' }, 'Pick today\u2019s day to start')
    ]));

    if (!plan.days.length) {
      wrap.appendChild(emptyState(
        'No workout days yet',
        'Add your plan in the Config tab \u2014 days, exercises, sets and reps.',
        'Go to Config',
        () => App.goTo('config')
      ));
      root.appendChild(wrap);
      return;
    }

    const logs = Data.getWorkoutLogs();
    const list = el('div', { class: 'day-list' });
    plan.days.forEach(day => {
      const lastLog = logs.find(l => l.dayId === day.id);
      const card = el('button', { class: 'day-card', onclick: () => this.startDay(day) }, [
        el('div', { class: 'day-card-main' }, [
          el('span', { class: 'day-card-name' }, day.name),
          el('span', { class: 'day-card-meta' }, `${day.exercises.length} exercise${day.exercises.length === 1 ? '' : 's'}`)
        ]),
        el('div', { class: 'day-card-side' }, [
          lastLog ? el('span', { class: 'day-card-last' }, `Last: ${formatDateShort(lastLog.date)} \u00b7 ${formatDuration(lastLog.durationSeconds)}`) : el('span', { class: 'day-card-last dim' }, 'Not done yet'),
          el('svg', { viewBox: '0 0 24 24', fill: 'none', class: 'chevron' }, [])
        ])
      ]);
      const chevron = card.querySelector('.chevron');
      chevron.innerHTML = '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      list.appendChild(card);
    });
    wrap.appendChild(list);

    // recent sessions
    if (logs.length) {
      wrap.appendChild(el('h2', { class: 'section-title' }, 'Recent sessions'));
      const hist = el('div', { class: 'history-list' });
      logs.slice(0, 6).forEach(l => {
        hist.appendChild(el('div', { class: 'history-row' }, [
          el('span', { class: 'history-day' }, l.dayName),
          el('span', { class: 'history-date' }, formatDateShort(l.date)),
          el('span', { class: 'history-time mono' }, formatDuration(l.durationSeconds)),
          el('span', { class: 'history-count' }, `${l.completedExerciseIds.length}/${l.totalExercises}`)
        ]));
      });
      wrap.appendChild(hist);
    }

    root.appendChild(wrap);
  },

  startDay(day) {
    Data.clearActiveSession();
    this.renderSession(document.getElementById('view-root'), day, true);
  },

  renderSession(root, day, fresh = false) {
    root.innerHTML = '';
    const session = new WorkoutSession(day);
    this.session = session;

    const wrap = el('div', { class: 'view session-view' });

    wrap.appendChild(el('div', { class: 'session-header' }, [
      el('button', { class: 'text-btn', onclick: () => this.exitSession(session) }, '\u2190 Days'),
      el('h1', {}, day.name)
    ]));

    const timeDisplay = el('div', { class: 'timer-display mono' }, formatDuration(session.currentElapsedMs() / 1000));
    const statusDot = el('span', { class: `status-dot status-${session.state.status}` });
    wrap.appendChild(el('div', { class: 'timer-card' }, [
      el('div', { class: 'timer-row' }, [statusDot, timeDisplay]),
      this.buildControls(session, timeDisplay, statusDot)
    ]));

    const exList = el('div', { class: 'exercise-list' });
    day.exercises.forEach(ex => {
      exList.appendChild(this.buildExerciseRow(session, ex, exList));
    });
    wrap.appendChild(exList);

    root.appendChild(wrap);

    session.onTick(ms => {
      timeDisplay.textContent = formatDuration(ms / 1000);
    });
    if (session.state.status === 'running') session._runLoop();

    if (fresh) {
      // nothing extra; user presses Start explicitly
    }
  },

  buildControls(session, timeDisplay, statusDot) {
    const controls = el('div', { class: 'timer-controls' });

    const refreshButtons = () => {
      controls.innerHTML = '';
      statusDot.className = `status-dot status-${session.state.status}`;
      if (session.state.status === 'idle') {
        controls.appendChild(el('button', { class: 'btn btn-primary', onclick: () => { session.start(); refreshButtons(); } }, 'Start'));
      } else if (session.state.status === 'running') {
        controls.appendChild(el('button', { class: 'btn btn-secondary', onclick: () => { session.pause(); refreshButtons(); } }, 'Pause'));
        controls.appendChild(el('button', { class: 'btn btn-danger', onclick: () => this.confirmFinish(session) }, 'Finish'));
      } else if (session.state.status === 'paused') {
        controls.appendChild(el('button', { class: 'btn btn-primary', onclick: () => { session.resume(); refreshButtons(); } }, 'Resume'));
        controls.appendChild(el('button', { class: 'btn btn-danger', onclick: () => this.confirmFinish(session) }, 'Finish'));
      }
    };
    refreshButtons();
    this._refreshButtons = refreshButtons;
    return controls;
  },

  buildExerciseRow(session, ex, container) {
    const done = session.isComplete(ex.id);
    const row = el('button', {
      class: `exercise-row ${done ? 'is-done' : ''}`,
      onclick: () => {
        session.toggleExercise(ex.id);
        const newRow = this.buildExerciseRow(session, ex, container);
        row.replaceWith(newRow);
        this.checkAllDone(session);
      }
    }, [
      el('span', { class: 'exercise-check' }),
      el('div', { class: 'exercise-info' }, [
        el('span', { class: 'exercise-name' }, ex.name),
        el('span', { class: 'exercise-meta' }, formatExerciseMeta(ex))
      ])
    ]);
    return row;
  },

  checkAllDone(session) {
    if (session.allComplete()) {
      this.confirmFinish(session, true);
    }
  },

  confirmFinish(session, autoTriggered = false) {
    const log = session.finish();
    this.showSummary(log, autoTriggered);
  },

  showSummary(log, autoTriggered) {
    const root = document.getElementById('view-root');
    root.innerHTML = '';
    const wrap = el('div', { class: 'view summary-view' });
    wrap.appendChild(el('div', { class: 'summary-badge' }, autoTriggered ? 'Workout complete \uD83C\uDFC1' : 'Workout saved'));
    wrap.appendChild(el('div', { class: 'summary-time mono' }, formatDuration(log.durationSeconds)));
    wrap.appendChild(el('p', { class: 'summary-sub' }, `${log.dayName} \u00b7 ${log.completedExerciseIds.length}/${log.totalExercises} exercises \u00b7 ${formatDateShort(log.date)}`));
    wrap.appendChild(el('button', { class: 'btn btn-primary btn-block', onclick: () => App.goTo('workout') }, 'Back to workouts'));
    root.appendChild(wrap);
  },

  exitSession(session) {
    if (session.state.status === 'idle' && session.state.completedExerciseIds.length === 0) {
      session.discard();
      App.goTo('workout');
      return;
    }
    confirmModal(
      'Leave workout?',
      'Your progress and timer stay saved \u2014 you can resume this session later from the Workout tab.',
      'Leave',
      () => App.goTo('workout')
    );
  }
};

function formatExerciseMeta(ex) {
  const parts = [];
  if (ex.sets) parts.push(`${ex.sets} sets`);
  if (ex.reps) parts.push(`${ex.reps} reps`);
  if (ex.weight) parts.push(`${ex.weight} ${ex.unit || 'lbs'}`);
  if (ex.notes) parts.push(ex.notes);
  return parts.join(' \u00b7 ') || 'Tap when complete';
}
