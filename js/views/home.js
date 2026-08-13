/* ============================================================
   views/home.js
   ============================================================ */

const HomeView = {
  render(root) {
    const wrap = el('div', { class: 'view home-view' });
    wrap.appendChild(el('div', { class: 'view-header' }, [
      el('h1', {}, 'Lane'),
      el('p', { class: 'view-sub' }, formatDateLong(todayStr()))
    ]));

    const goal = Data.getGoal();
    const weightLogs = Data.getWeightLogs();
    const status = computeGoalStatus(goal, weightLogs);

    wrap.appendChild(this.buildGoalCard(status));
    wrap.appendChild(this.buildWeeklyCards());

    const active = Data.getActiveSession();
    if (active) {
      wrap.appendChild(el('button', { class: 'resume-banner', onclick: () => App.goTo('workout') }, [
        el('span', {}, `Workout in progress \u2014 ${active.dayName}`),
        el('span', { class: 'resume-arrow' }, '\u2192')
      ]));
    }

    root.appendChild(wrap);
  },

  buildGoalCard(status) {
    const card = el('div', { class: 'card goal-card' });

    if (!status.configured) {
      card.appendChild(el('h3', {}, 'Set your goal'));
      card.appendChild(el('p', { class: 'view-sub small' }, 'Add a starting weight, goal weight and target date in Config to see your progress here.'));
      card.appendChild(el('button', { class: 'btn btn-primary', onclick: () => App.goTo('config') }, 'Set up goal'));
      return card;
    }

    const { currentWeight, startWeight, goalWeight, progressPct, rateStatus, projectedDate, goalDate } = status;
    const totalToChange = Math.abs(goalWeight - startWeight);
    const changedSoFar = Math.abs(currentWeight - startWeight);
    const remaining = Math.abs(goalWeight - currentWeight);

    card.appendChild(el('div', { class: 'goal-card-top' }, [
      el('div', {}, [
        el('div', { class: 'goal-current mono' }, `${fmtNum(currentWeight, 1)} lbs`),
        el('div', { class: 'goal-current-label' }, 'current weight')
      ]),
      statusPill(rateStatus, goalDate, projectedDate)
    ]));

    card.appendChild(buildLaneBar(startWeight, goalWeight, currentWeight, progressPct, rateStatus));

    card.appendChild(el('div', { class: 'goal-stats-row' }, [
      goalStat(fmtNum(changedSoFar, 1), status.direction < 0 ? 'lbs lost' : 'lbs gained'),
      goalStat(fmtNum(remaining, 1), 'lbs to go'),
      goalStat(formatDateShort(goalDate), 'target date')
    ]));

    return card;
  },

  buildWeeklyCards() {
    const wrap = el('div', { class: 'stat-cards' });
    const weightWeeks = buildWeeklySummary(Data.getWeightLogs(), v => v);
    const stepWeeks = buildWeeklySummary(Data.getStepLogs(), v => v.steps);

    const w = weightWeeks[0];
    const s = stepWeeks[0];

    wrap.appendChild(el('div', { class: 'card mini-card', onclick: () => App.goTo('weight') }, [
      el('span', { class: 'mini-card-label' }, 'This week \u00b7 weight'),
      el('span', { class: 'mini-card-value mono' }, w && w.avg !== null ? `${fmtNum(w.avg, 1)} lbs` : '\u2014'),
      el('span', { class: `mini-card-change mono ${w && w.change < 0 ? 'change-good' : (w && w.change > 0 ? 'change-bad' : '')}` }, w && w.change !== null ? `${fmtSigned(w.change, 1)} vs last wk` : 'Log to see trend')
    ]));

    wrap.appendChild(el('div', { class: 'card mini-card', onclick: () => App.goTo('steps') }, [
      el('span', { class: 'mini-card-label' }, 'This week \u00b7 steps'),
      el('span', { class: 'mini-card-value mono' }, s && s.avg !== null ? Math.round(s.avg).toLocaleString() : '\u2014'),
      el('span', { class: `mini-card-change mono ${s && s.change > 0 ? 'change-good' : (s && s.change < 0 ? 'change-bad' : '')}` }, s && s.change !== null ? `${fmtSigned(s.change, 0)} vs last wk` : 'Log to see trend')
    ]));

    return wrap;
  }
};

function goalStat(value, label) {
  return el('div', { class: 'goal-stat' }, [
    el('span', { class: 'goal-stat-value mono' }, value),
    el('span', { class: 'goal-stat-label' }, label)
  ]);
}

function statusPill(rateStatus, goalDate, projectedDate) {
  const map = {
    'on-track': { text: 'On track', cls: 'pill-good' },
    'off-track': { text: 'Off track', cls: 'pill-bad' },
    'stalled': { text: 'No movement', cls: 'pill-bad' },
    'insufficient': { text: 'Log more days', cls: 'pill-neutral' }
  };
  const info = map[rateStatus] || map.insufficient;
  const pill = el('span', { class: `status-pill ${info.cls}` }, info.text);
  if (rateStatus === 'on-track' && projectedDate) {
    return el('div', { class: 'status-pill-wrap' }, [pill, el('span', { class: 'status-pill-sub' }, `Est. ${formatDateShort(projectedDate)}`)]);
  }
  if (rateStatus === 'off-track' && projectedDate) {
    return el('div', { class: 'status-pill-wrap' }, [pill, el('span', { class: 'status-pill-sub' }, `At this rate: ${formatDateShort(projectedDate)}`)]);
  }
  return el('div', { class: 'status-pill-wrap' }, [pill]);
}

function buildLaneBar(startWeight, goalWeight, currentWeight, progressPct, rateStatus) {
  const wrap = el('div', { class: 'lane-wrap' });
  const track = el('div', { class: 'lane-track' });

  for (let i = 0; i < 14; i++) {
    track.appendChild(el('span', { class: 'lane-dash' }));
  }

  const fillClass = rateStatus === 'off-track' || rateStatus === 'stalled' ? 'lane-fill-bad' : 'lane-fill-good';
  const fill = el('div', { class: `lane-fill ${fillClass}` });
  fill.style.width = `${Math.max(4, progressPct)}%`;

  const marker = el('div', { class: 'lane-marker' }, el('span', { class: 'lane-marker-dot' }));
  marker.style.left = `${Math.min(97, Math.max(0, progressPct))}%`;

  track.appendChild(fill);
  track.appendChild(marker);
  wrap.appendChild(track);

  wrap.appendChild(el('div', { class: 'lane-labels' }, [
    el('span', {}, `${fmtNum(startWeight, 0)}`),
    el('span', { class: 'lane-flag' }, `\u{1F3C1} ${fmtNum(goalWeight, 0)}`)
  ]));

  return wrap;
}

function computeGoalStatus(goal, weightLogs) {
  if (!goal.startWeight || !goal.goalWeight || !goal.startDate || !goal.goalDate) {
    return { configured: false };
  }
  const dates = Object.keys(weightLogs).sort();
  const currentWeight = dates.length ? weightLogs[dates[dates.length - 1]] : goal.startWeight;
  const direction = goal.goalWeight < goal.startWeight ? -1 : 1;
  const totalChange = goal.goalWeight - goal.startWeight;
  const progressFraction = totalChange !== 0 ? (currentWeight - goal.startWeight) / totalChange : 0;
  const progressPct = Math.min(100, Math.max(0, progressFraction * 100));

  let rateStatus = 'insufficient';
  let projectedDate = null;

  const recentCutoff = addDays(new Date(), -14);
  const recentDates = dates.filter(d => parseDateStr(d) >= recentCutoff);
  const usableDates = recentDates.length >= 2 ? recentDates : dates;

  if (usableDates.length >= 2) {
    const firstD = usableDates[0];
    const lastD = usableDates[usableDates.length - 1];
    const dDays = daysBetween(firstD, lastD);
    if (dDays > 0) {
      const rate = (weightLogs[lastD] - weightLogs[firstD]) / dDays;
      if ((direction < 0 && rate < 0) || (direction > 0 && rate > 0)) {
        const remaining = goal.goalWeight - weightLogs[lastD];
        const daysNeeded = remaining / rate;
        projectedDate = addDays(parseDateStr(lastD), Math.round(daysNeeded));
        rateStatus = projectedDate <= parseDateStr(goal.goalDate) ? 'on-track' : 'off-track';
      } else if (rate === 0) {
        rateStatus = 'stalled';
      } else {
        rateStatus = 'off-track';
      }
    }
  }

  return {
    configured: true,
    currentWeight,
    startWeight: goal.startWeight,
    goalWeight: goal.goalWeight,
    goalDate: goal.goalDate,
    direction,
    progressPct,
    rateStatus,
    projectedDate
  };
}
