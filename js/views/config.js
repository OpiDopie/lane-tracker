/* ============================================================
   views/config.js
   ============================================================ */

const ConfigView = {
  render(root) {
    const wrap = el('div', { class: 'view' });
    wrap.appendChild(el('div', { class: 'view-header' }, [
      el('h1', {}, 'Config'),
      el('p', { class: 'view-sub' }, 'Your goal, your plan, your data')
    ]));

    wrap.appendChild(this.buildGoalSection());
    wrap.appendChild(this.buildPlanSection());
    wrap.appendChild(this.buildDataSection());

    root.appendChild(wrap);
  },

  buildGoalSection() {
    const goal = Data.getGoal();
    const section = el('section', { class: 'config-section' });
    section.appendChild(el('h2', { class: 'section-title' }, 'Goal'));

    const startWeight = el('input', { type: 'number', step: '0.1', inputmode: 'decimal', placeholder: 'e.g. 210', value: goal.startWeight ?? '' });
    const goalWeight = el('input', { type: 'number', step: '0.1', inputmode: 'decimal', placeholder: 'e.g. 180', value: goal.goalWeight ?? '' });
    const startDate = el('input', { type: 'date', value: goal.startDate || todayStr() });
    const goalDate = el('input', { type: 'date', value: goal.goalDate || '' });

    const save = () => {
      const sw = parseFloat(startWeight.value);
      const gw = parseFloat(goalWeight.value);
      if ((startWeight.value && Number.isNaN(sw)) || (goalWeight.value && Number.isNaN(gw))) {
        toast('Enter valid numbers for weight');
        return;
      }
      Data.setGoal({
        startWeight: startWeight.value ? sw : null,
        goalWeight: goalWeight.value ? gw : null,
        startDate: startDate.value || null,
        goalDate: goalDate.value || null
      });
      toast('Goal saved');
    };

    const grid = el('div', { class: 'form-grid' }, [
      labeled('Starting weight (lbs)', startWeight),
      labeled('Goal weight (lbs)', goalWeight),
      labeled('Start date', startDate),
      labeled('Goal date', goalDate)
    ]);
    section.appendChild(grid);
    section.appendChild(el('button', { class: 'btn btn-primary', onclick: save }, 'Save goal'));
    return section;
  },

  buildPlanSection() {
    const plan = Data.getPlan();
    const section = el('section', { class: 'config-section' });
    section.appendChild(el('h2', { class: 'section-title' }, 'Workout plan'));
    section.appendChild(el('p', { class: 'view-sub small' }, 'Edit exercises, sets, reps and weight any time \u2014 changes save automatically.'));

    const daysWrap = el('div', { class: 'days-editor' });
    section.appendChild(daysWrap);

    const redrawDays = () => {
      daysWrap.innerHTML = '';
      plan.days.forEach((day, dayIdx) => {
        daysWrap.appendChild(this.buildDayEditor(plan, day, dayIdx, redrawDays));
      });
    };
    redrawDays();

    section.appendChild(el('button', {
      class: 'btn btn-ghost btn-block', onclick: () => {
        plan.days.push({ id: uid(), name: `Day ${plan.days.length + 1}`, exercises: [] });
        Data.setPlan(plan);
        redrawDays();
      }
    }, '+ Add day'));

    return section;
  },

  buildDayEditor(plan, day, dayIdx, redrawDays) {
    const card = el('div', { class: 'day-editor-card' });

    const nameInput = el('input', { class: 'day-name-input', value: day.name, onchange: (e) => {
      day.name = e.target.value || `Day ${dayIdx + 1}`;
      Data.setPlan(plan);
    } });

    const removeDayBtn = el('button', { class: 'row-delete', title: 'Remove day', onclick: () => {
      confirmModal('Remove this day?', `This deletes "${day.name}" and its exercises. This can\u2019t be undone.`, 'Remove', () => {
        plan.days.splice(dayIdx, 1);
        Data.setPlan(plan);
        redrawDays();
      });
    } }, '\u00d7');

    card.appendChild(el('div', { class: 'day-editor-head' }, [nameInput, removeDayBtn]));

    const exWrap = el('div', { class: 'exercise-editor-list' });
    const redrawExercises = () => {
      exWrap.innerHTML = '';
      day.exercises.forEach((ex, exIdx) => {
        exWrap.appendChild(this.buildExerciseEditor(plan, day, ex, exIdx, redrawExercises));
      });
    };
    redrawExercises();
    card.appendChild(exWrap);

    card.appendChild(el('button', {
      class: 'btn btn-ghost btn-small', onclick: () => {
        day.exercises.push({ id: uid(), name: '', sets: 3, reps: 10, weight: 0, unit: 'lbs', notes: '' });
        Data.setPlan(plan);
        redrawExercises();
      }
    }, '+ Add exercise'));

    return card;
  },

  buildExerciseEditor(plan, day, ex, exIdx, redrawExercises) {
    const save = () => Data.setPlan(plan);

    const nameInput = el('input', { class: 'ex-name-input', placeholder: 'Exercise name', value: ex.name, onchange: (e) => { ex.name = e.target.value; save(); } });
    const setsInput = el('input', { type: 'number', inputmode: 'numeric', placeholder: 'Sets', value: ex.sets ?? '', onchange: (e) => { ex.sets = e.target.value ? parseInt(e.target.value, 10) : null; save(); } });
    const repsInput = el('input', { type: 'number', inputmode: 'numeric', placeholder: 'Reps', value: ex.reps ?? '', onchange: (e) => { ex.reps = e.target.value ? parseInt(e.target.value, 10) : null; save(); } });
    const weightInput = el('input', { type: 'number', step: '0.5', inputmode: 'decimal', placeholder: 'Weight', value: ex.weight ?? '', onchange: (e) => { ex.weight = e.target.value ? parseFloat(e.target.value) : 0; save(); } });
    const notesInput = el('input', { class: 'ex-notes-input', placeholder: 'Notes (optional)', value: ex.notes || '', onchange: (e) => { ex.notes = e.target.value; save(); } });

    const removeBtn = el('button', { class: 'row-delete', title: 'Remove exercise', onclick: () => {
      day.exercises.splice(exIdx, 1);
      save();
      redrawExercises();
    } }, '\u00d7');

    return el('div', { class: 'exercise-editor-row' }, [
      el('div', { class: 'exercise-editor-top' }, [nameInput, removeBtn]),
      el('div', { class: 'exercise-editor-grid' }, [setsInput, repsInput, weightInput]),
      notesInput
    ]);
  },

  buildDataSection() {
    const section = el('section', { class: 'config-section' });
    section.appendChild(el('h2', { class: 'section-title' }, 'Your data'));
    section.appendChild(el('p', { class: 'view-sub small' }, 'Everything is stored only on this device. Back up regularly, especially before switching phones.'));

    const exportBtn = el('button', { class: 'btn btn-secondary', onclick: () => this.exportData() }, 'Download backup (.json)');

    const fileInput = el('input', { type: 'file', accept: 'application/json', class: 'hidden-file-input' });
    fileInput.addEventListener('change', (e) => this.importData(e));
    const importBtn = el('button', { class: 'btn btn-secondary', onclick: () => fileInput.click() }, 'Restore from backup');

    const resetBtn = el('button', { class: 'btn btn-danger', onclick: () => {
      confirmModal('Reset all data?', 'This permanently deletes your goal, plan, and logged history from this device.', 'Reset everything', () => {
        Data.resetAll();
        toast('All data cleared');
        App.goTo('home');
      });
    } }, 'Reset all data');

    section.appendChild(el('div', { class: 'button-row' }, [exportBtn, importBtn]));
    section.appendChild(fileInput);
    section.appendChild(resetBtn);
    return section;
  },

  exportData() {
    const dump = Data.exportAll();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lane-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Backup downloaded');
  },

  importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dump = JSON.parse(reader.result);
        Data.importAll(dump);
        toast('Backup restored');
        App.goTo('home');
      } catch (err) {
        toast('That file could not be read');
      }
    };
    reader.readAsText(file);
  }
};

function labeled(labelText, input) {
  return el('label', { class: 'field-label' }, [
    el('span', {}, labelText),
    input
  ]);
}
