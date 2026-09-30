import { SITE } from './config.js';

// Тексты попапа для разных кнопок (единая логика кнопок из ТЗ)
const MODES = {
  presentation: {
    title: 'Получите презентацию проекта на Арбате',
    text: ['Рендеры здания и офисов, планировки и устройство общих пространств — в одном PDF.', 'После отправки формы презентацию можно скачать сразу. Менеджер отдельно направит актуальные цены, свободные офисы и условия покупки.'],
    button: 'Получить презентацию',
    success: 'Презентацию можно скачать прямо сейчас. Менеджер свяжется с вами и направит актуальные цены и доступные офисы.',
    download: true,
  },
  lots: {
    title: 'Получите актуальные лоты, цены и условия',
    text: ['Менеджер направит свободные варианты, планировки, стоимость и действующие условия покупки.'],
    button: 'Получить подборку',
    success: 'Менеджер свяжется с вами и направит подборку доступных офисов, планировки, стоимость и условия покупки.',
  },
  work: {
    title: 'Подобрать офис для работы',
    text: ['Менеджер направит свободные варианты, планировки, стоимость и действующие условия покупки.'],
    button: 'Подобрать офис',
    success: 'Менеджер свяжется с вами и направит свободные офисы, планировки и условия покупки.',
  },
  invest: {
    title: 'Обсудить покупку для сдачи',
    text: ['Расчёт предполагаемого арендного дохода, расходов и условия управления зависят от выбранного офиса и предоставляются индивидуально.'],
    button: 'Обсудить покупку',
    success: 'Менеджер свяжется с вами, чтобы обсудить выбранный офис и условия управления.',
  },
  docs: {
    title: 'Получить документы по проекту',
    text: ['Оставьте контакты, и менеджер направит доступные документы и ответит на вопросы по объекту.'],
    button: 'Запросить документы',
    success: 'Менеджер свяжется с вами и направит доступные документы по проекту.',
  },
};

const storage = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* приватный режим */ } },
};

export function initModal(scroll) {
  const modal = document.getElementById('modal');
  const title = modal.querySelector('#modal-title');
  const text = modal.querySelector('.modal__text');
  const form = modal.querySelector('form');
  const submit = form.querySelector('.form__submit');
  const box = modal.querySelector('[data-form-box]');
  const success = modal.querySelector('[data-form-success]');
  let lastFocus = null;
  let mode = 'presentation';

  function open(name = 'presentation') {
    mode = MODES[name] ? name : 'presentation';
    const m = MODES[mode];
    title.textContent = m.title;
    text.replaceChildren(...m.text.map((t) => Object.assign(document.createElement('p'), { textContent: t })));
    submit.textContent = m.button;
    form.dataset.mode = mode;
    box.hidden = false;
    success.hidden = true;
    lastFocus = document.activeElement;
    modal.hidden = false;
    scroll.stop();
    storage.set('popupShown', '1');
    setTimeout(() => form.querySelector('input[name="name"]').focus(), 50);
  }

  function close() {
    modal.hidden = true;
    scroll.start();
    lastFocus?.focus?.();
  }

  function showSuccess() {
    const m = MODES[mode];
    success.querySelector('[data-success-text]').textContent = m.success;
    success.querySelector('[data-download]').hidden = !m.download;
    box.hidden = true;
    success.hidden = false;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-popup]');
    if (btn) { e.preventDefault(); open(btn.dataset.popup); }
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
    // держим фокус внутри попапа
    if (e.key === 'Tab' && !modal.hidden) {
      const f = [...modal.querySelectorAll('button, a[href], input:not(.hp)')].filter((el) => el.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  });

  // Автопоказ: один раз за сессию, после того как пользователь увидел первый экран
  setTimeout(() => {
    const busy = !modal.hidden || !document.getElementById('lightbox').hidden || document.querySelector('.header.menu-open');
    if (!busy && !storage.get('popupShown') && !storage.get('leadSent')) open('presentation');
  }, SITE.popupDelaySec * 1000);

  return { open, close, showSuccess, markSent: () => storage.set('leadSent', '1') };
}
