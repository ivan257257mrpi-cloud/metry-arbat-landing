// Просмотр фото из галерей на весь экран: стрелки, клавиатура, свайп.
export function initLightbox(scroll) {
  const box = document.getElementById('lightbox');
  const img = box.querySelector('img');
  let items = [];
  let index = 0;
  let lastFocus = null;

  const render = () => {
    const it = items[index];
    img.src = it.src;
    img.alt = it.alt;
  };
  const go = (d) => {
    index = (index + d + items.length) % items.length;
    render();
  };
  const open = (list, i) => {
    items = list;
    index = i;
    lastFocus = document.activeElement;
    render();
    box.hidden = false;
    scroll.stop();
    box.querySelector('.lightbox__close').focus();
  };
  const close = () => {
    box.hidden = true;
    img.removeAttribute('src');
    scroll.start();
    lastFocus?.focus();
  };

  document.addEventListener('click', (e) => {
    const photo = e.target.closest('[data-lightbox-group] .photo');
    if (!photo) return;
    const group = photo.closest('[data-lightbox-group]');
    const slides = [...group.querySelectorAll('.photo')];
    const list = slides.map((s) => {
      const im = s.querySelector('img');
      return { src: im.dataset.full || im.currentSrc || im.src, alt: im.alt };
    });
    open(list, slides.indexOf(photo));
  });

  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__prev').addEventListener('click', () => go(-1));
  box.querySelector('.lightbox__next').addEventListener('click', () => go(1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  let startX = null;
  box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    startX = null;
  });
}
