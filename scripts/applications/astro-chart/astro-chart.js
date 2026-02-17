/**
 * Today's Astrochart Panel – embeds Astro-Charts.com chart in the window
 */
const ASTRO_CHART_URL = 'https://astro-charts.com/chart-of-moment/';

class AstroChartPanel {
  constructor() {
    this.boxId = 'astro-box';
    this.iframeLoaded = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const box = document.getElementById(this.boxId);
    const closeBtn = document.getElementById('astro-box-close');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideBox());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && box && box.style.display !== 'none') {
        this.hideBox();
      }
    });
  }

  loadIframe() {
    if (this.iframeLoaded) return;
    const iframe = document.getElementById('astro-chart-iframe');
    if (iframe && iframe.src === 'about:blank') {
      iframe.src = ASTRO_CHART_URL;
      this.iframeLoaded = true;
    }
  }

  toggleVisibility() {
    const box = document.getElementById(this.boxId);
    if (!box) return;
    const isVisible = box.style.display !== 'none' && window.getComputedStyle(box).display !== 'none';
    if (isVisible) this.hideBox();
    else this.showBox();
  }

  showBox() {
    const box = document.getElementById(this.boxId);
    if (!box) return;
    this.loadIframe();
    box.style.display = 'block';
    box.style.opacity = '0';
    box.style.transform = 'translateX(-50%) translateY(-10px) scale(0.95)';
    void box.offsetHeight;
    requestAnimationFrame(() => {
      box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      box.style.opacity = '1';
      box.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    });
  }

  hideBox() {
    const box = document.getElementById(this.boxId);
    if (!box) return;
    box.style.opacity = '0';
    box.style.transform = 'translateX(-50%) translateY(-10px) scale(0.95)';
    setTimeout(() => { box.style.display = 'none'; }, 400);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { window.AstroChartPanel = new AstroChartPanel(); });
} else {
  window.AstroChartPanel = new AstroChartPanel();
}

window.openAstroChartWindow = () => {
  if (window.AstroChartPanel) window.AstroChartPanel.toggleVisibility();
};
