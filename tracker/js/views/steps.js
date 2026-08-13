/* ============================================================
   views/steps.js
   ============================================================ */

const StepsView = {
  render(root) {
    const wrap = el('div', { class: 'view' });
    wrap.appendChild(el('div', { class: 'view-header' }, [
      el('h1', {}, 'Steps'),
      el('p', { class: 'view-sub' }, 'Log your step count for the day')
    ]));

    const logs = Data.getStepLogs();
    const today = todayStr();
    const todayEntry = logs[today] || {};

    const stepsInput = el('input', {
      type: 'number', inputmode: 'numeric', placeholder: '0', class: 'big-input',
      value: todayEntry.steps !== undefined ? todayEntry.steps : ''
    });
    const milesInput = el('input', {
      type: 'number', step: '0.1', inputmode: 'decimal', placeholder: '0.0', class: 'mid-input',
      value: todayEntry.miles !== undefined ? todayEntry.miles : ''
    });

    const saveBtn = el('button', { class: 'btn btn-primary', onclick: () => {
      const steps = parseInt(stepsInput.value, 10);
      const miles = milesInput.value === '' ? null : parseFloat(milesInput.value);
      if (Number.isNaN(steps) || steps < 0) { toast('Enter a valid step count'); return; }
      Data.setStepEntry(today, steps, miles);
      toast('Steps saved for today');
      App.rerender();
    } }, 'Save today');

    wrap.appendChild(el('div', { class: 'entry-card' }, [
      el('label', { class: 'entry-label' }, `Today \u00b7 ${formatDateShort(today)}`),
      el('div', { class: 'entry-row' }, [
        stepsInput,
        el('span', { class: 'entry-unit' }, 'steps')
      ]),
      el('div', { class: 'entry-row' }, [
        milesInput,
        el('span', { class: 'entry-unit' }, 'miles (optional)')
      ]),
      saveBtn
    ]));

    const dates = Object.keys(logs).sort();
    const points = dates.slice(-30).map(d => ({ date: d, value: logs[d].steps }));
    wrap.appendChild(el('div', { class: 'chart-card' }, [
      el('div', { class: 'chart-card-head' }, [el('span', {}, 'Last 30 days')]),
      buildSparkline(points, { color: 'var(--accent-2)' })
    ]));

    const weeks = buildWeeklySummary(logs, v => v.steps);
    wrap.appendChild(el('h2', { class: 'section-title' }, 'Weekly average'));
    if (!weeks.length) {
      wrap.appendChild(emptyState('No entries yet', 'Log your steps each day to start seeing weekly trends.', null));
    } else {
      const list = el('div', { class: 'week-list' });
      weeks.forEach(w => list.appendChild(weekRow(w, 'steps', 'up')));
      wrap.appendChild(list);
    }

    if (dates.length) {
      wrap.appendChild(el('h2', { class: 'section-title' }, 'Recent entries'));
      const hist = el('div', { class: 'history-list' });
      dates.slice(-10).reverse().forEach(d => {
        const entry = logs[d];
        hist.appendChild(el('div', { class: 'history-row' }, [
          el('span', { class: 'history-day' }, formatWeekday(d)),
          el('span', { class: 'history-date' }, formatDateShort(d)),
          el('span', { class: 'history-time mono' }, `${entry.steps.toLocaleString()}${entry.miles ? ` \u00b7 ${fmtNum(entry.miles, 1)} mi` : ''}`),
          el('button', { class: 'row-delete', onclick: () => {
            Data.deleteStepEntry(d);
            App.rerender();
          } }, '\u00d7')
        ]));
      });
      wrap.appendChild(hist);
    }

    root.appendChild(wrap);
  }
};
