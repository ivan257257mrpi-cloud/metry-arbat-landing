import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initSliders } from './sliders.js';
import { initLightbox } from './lightbox.js';
import { initModal } from './modal.js';
import { initForms } from './forms.js';
import { initMap } from './map.js';
import { SITE } from './config.js';

document.documentElement.classList.add('js');
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ----- Плавный скролл (как на референсе) -----
const lenis = reduceMotion ? null : new Lenis({ duration: 1.15, smoothWheel: true });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
export const scroll = {
  to(target) {
    const offset = -(document.getElementById('header')?.offsetHeight ?? 0) + 1;
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
  },
  stop: () => lenis?.stop(),
  start: () => lenis?.start(),
};

// ----- Якорные ссылки -----
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target && id !== 'top') return;
  e.preventDefault();
  closeMenu();
  scroll.to(target ?? document.body);
});

// ----- Шапка -----
const header = document.getElementById('header');
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  const menuOpen = header.classList.contains('menu-open');
  header.classList.toggle('is-hidden', !menuOpen && y > 600 && y > lastY);
  lastY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ----- Мобильное меню -----
const burger = header.querySelector('.burger');
function closeMenu() {
  if (!header.classList.contains('menu-open')) return;
  header.classList.remove('menu-open');
  burger.setAttribute('aria-expanded', 'false');
  scroll.start();
}
burger.addEventListener('click', () => {
  const open = !header.classList.contains('menu-open');
  header.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  open ? scroll.stop() : scroll.start();
});

// ----- Ссылки «Построить маршрут» -----
document.querySelectorAll('[data-route]').forEach((a) => {
  a.href = `https://yandex.ru/maps/?rtext=~${SITE.routeCoords[0]},${SITE.routeCoords[1]}&rtt=auto`;
});

// ----- Появление блоков -----
if (!reduceMotion) {
  // первый экран появляется сразу после загрузки
  gsap.to('.hero [data-reveal]', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: 0.09, delay: 0.15 });
  ScrollTrigger.batch('[data-reveal]:not(.hero [data-reveal])', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  });
  // лёгкий параллакс фото на первом экране
  gsap.to('.hero__media img', {
    yPercent: 12, scale: 1.12, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
} else {
  document.querySelectorAll('[data-reveal]').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
}

initSliders();
initLightbox(scroll);
const modal = initModal(scroll);
initForms(modal);
initMap(document.getElementById('map'));

// пересчёт позиций после загрузки картинок и шрифтов;
// блоки выше текущей позиции (например, после перезагрузки страницы в середине) показываем сразу
window.addEventListener('load', () => {
  ScrollTrigger.refresh();
  const bottom = window.innerHeight;
  const hidden = [...document.querySelectorAll('[data-reveal]')].filter((el) => el.getBoundingClientRect().top < bottom && getComputedStyle(el).opacity === '0');
  if (hidden.length) gsap.to(hidden, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.05 });
});
