/* ============================================================
   views/weight.js
   ============================================================ */

const WeightView = {
  render(root) {
    const wrap = el('div', { class: 'view' });
    wrap.appendChild(el('div', { class: 'view-header' }, [
      el('h1', {}, 'Weight'),
      el('p', { class: 'view-sub' }, 'Log first thing in the morning, before food or water')
    ]));

    const logs = Data.getWeightLogs();
    const today = todayStr();

    // entry card
    const input = el('input', {
      type: 'number', step: '0.1', inputmode: 'decimal', placeholder: '0.0',
      class: 'big-input', value: logs[today] !== undefined ? logs[today] : ''
    });
    const saveBtn = el('button', { class: 'btn btn-primary', onclick: () => {
      const v = parseFloat(input.value);
      if (Number.isNaN(v) || v <= 0) { toast('Enter a valid weight'); return; }
      Data.setWeightEntry(today, v);
      toast('Weight saved for today');
      App.rerender();
    } }, 'Save today');

    wrap.appendChild(el('div', { class: 'entry-card' }, [
      el('label', { class: 'entry-label' }, `Today \u00b7 ${formatDateShort(today)}`),
      el('div', { class: 'entry-row' }, [
        input,
        el('span', { class: 'entry-unit' }, 'lbs')
      ]),
      saveBtn
    ]));

    // chart
    const dates = Object.keys(logs).sort();
    const points = dates.slice(-30).map(d => ({ date: d, value: logs[d] }));
    const goal = Data.getGoal();
    wrap.appendChild(el('div', { class: 'chart-card' }, [
      el('div', { class: 'chart-card-head' }, [
        el('span', {}, 'Last 30 days'),
      ]),
      buildSparkline(points, { goalValue: goal.goalWeight })
    ]));

    // weekly summary
    const weeks = buildWeeklySummary(logs, v => v);
    wrap.appendChild(el('h2', { class: 'section-title' }, 'Weekly average'));
    if (!weeks.length) {
      wrap.appendChild(emptyState('No entries yet', 'Log your weight each morning to start seeing weekly trends.', null));
    } else {
      const list = el('div', { class: 'week-list' });
      weeks.forEach(w => {
        list.appendChild(weekRow(w, 'lbs'));
      });
      wrap.appendChild(list);
    }

    // history (recent raw entries, editable)
    if (dates.length) {
      wrap.appendChild(el('h2', { class: 'section-title' }, 'Recent entries'));
      const hist = el('div', { class: 'history-list' });
      dates.slice(-10).reverse().forEach(d => {
        hist.appendChild(el('div', { class: 'history-row' }, [
          el('span', { class: 'history-day' }, formatWeekday(d)),
          el('span', { class: 'history-date' }, formatDateShort(d)),
          el('span', { class: 'history-time mono' }, `${fmtNum(logs[d], 1)} lbs`),
          el('button', { class: 'row-delete', onclick: () => {
            Data.deleteWeightEntry(d);
            App.rerender();
          } }, '\u00d7')
        ]));
      });
      wrap.appendChild(hist);
    }

    root.appendChild(wrap);
  }
};

function weekRow(w, unit, goodDirection = 'down') {
  const label = `${formatDateShort(w.start)} \u2013 ${formatDateShort(w.end)}`;
  let changeClass = '';
  if (w.change !== null && w.change !== 0) {
    const isGood = goodDirection === 'down' ? w.change < 0 : w.change > 0;
    changeClass = isGood ? 'change-good' : 'change-bad';
  }
  return el('div', { class: 'week-row' }, [
    el('div', { class: 'week-row-main' }, [
      el('span', { class: 'week-row-label' }, label),
      el('span', { class: 'week-row-avg mono' }, w.avg !== null ? `${fmtNum(w.avg, 1)} ${unit}` : 'No data')
    ]),
    el('span', { class: `week-row-change mono ${changeClass}` }, w.change !== null ? `${fmtSigned(w.change, 1)} ${unit}` : '')
  ]);
}
