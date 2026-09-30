import Swiper from 'swiper';
import { Navigation, Mousewheel, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';

export const sliders = {};

export function initSliders() {
  document.querySelectorAll('[data-slider]').forEach((el) => {
    const name = el.dataset.slider;
    const swiper = new Swiper(el, {
      modules: [Navigation, Mousewheel, Keyboard, A11y],
      slidesPerView: 'auto',
      spaceBetween: 16,
      grabCursor: true,
      speed: 700,
      // горизонтальная прокрутка тачпадом/колесом с Shift, вертикальный скролл страницы не перехватываем
      mousewheel: { forceToAxis: true },
      keyboard: { enabled: true, onlyInViewport: true },
      navigation: {
        prevEl: document.querySelector(`[data-nav-prev="${name}"]`),
        nextEl: document.querySelector(`[data-nav-next="${name}"]`),
      },
      a11y: { prevSlideMessage: 'Предыдущий слайд', nextSlideMessage: 'Следующий слайд' },
      breakpoints: { 900: { spaceBetween: 20 } },
    });
    sliders[name] = swiper;
  });

  // Вкладки над галереями: оставляем в слайдере только кадры выбранной категории
  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const swiper = sliders[tabs.dataset.tabs];
    if (!swiper) return;
    const all = [...swiper.wrapperEl.children];
    const show = (cat) => {
      tabs.querySelectorAll('[data-tab]').forEach((t) => {
        const on = t.dataset.tab === cat;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      swiper.wrapperEl.replaceChildren(...all.filter((s) => s.dataset.cat === cat));
      swiper.update();
      swiper.slideTo(0, 0);
    };
    tabs.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (t) show(t.dataset.tab);
    });
    show(tabs.querySelector('[data-tab].is-active').dataset.tab);
  });

  // Вкладки планировок: показываем один этаж
  document.querySelectorAll('[data-plan-tabs]').forEach((tabs) => {
    const panes = [...tabs.parentElement.querySelectorAll('[data-pane]')];
    tabs.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (!t) return;
      tabs.querySelectorAll('[data-tab]').forEach((b) => {
        b.classList.toggle('is-active', b === t);
        b.setAttribute('aria-selected', String(b === t));
      });
      panes.forEach((p) => { p.hidden = p.dataset.pane !== t.dataset.tab; });
    });
  });
}
