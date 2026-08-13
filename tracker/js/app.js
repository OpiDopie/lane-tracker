/* ============================================================
   app.js — boots the app, switches tabs, wires the top bar
   ============================================================ */

const App = {
  tab: 'home',

  init() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.goTo(btn.dataset.tab));
    });
    document.getElementById('btn-export').addEventListener('click', () => this.goTo('config'));

    const savedTab = localStorage.getItem('wlt_lastTab');
    this.goTo(savedTab && document.querySelector(`[data-tab="${savedTab}"]`) ? savedTab : 'home');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
      });
    }
  },

  goTo(tab) {
    this.tab = tab;
    localStorage.setItem('wlt_lastTab', tab);
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    this.rerender();
  },

  rerender() {
    const root = document.getElementById('view-root');
    root.innerHTML = '';
    const views = { home: HomeView, workout: WorkoutView, weight: WeightView, steps: StepsView, config: ConfigView };
    const view = views[this.tab] || HomeView;
    view.render(root);
    root.scrollTop = 0;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
