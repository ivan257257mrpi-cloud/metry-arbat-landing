import { SITE } from './config.js';

const FORM_NAMES = {
  contacts: 'Форма «Получите актуальные планировки, цены и условия»',
  presentation: 'Попап «Получить презентацию»',
  lots: 'Попап «Получить актуальные лоты, цены и условия»',
  work: 'Попап «Подобрать офис для работы»',
  invest: 'Попап «Обсудить покупку для сдачи»',
  docs: 'Попап «Запросить документы»',
};
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid'];

// UTM-метки из рекламы запоминаем на сессию, чтобы не потерять их при переходах по якорям
function getUtm() {
  const params = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('utm') || '{}'); } catch { /* нет доступа */ }
  UTM_KEYS.forEach((k) => { if (params.get(k)) saved[k] = params.get(k); });
  try { sessionStorage.setItem('utm', JSON.stringify(saved)); } catch { /* нет доступа */ }
  return saved;
}

// Маска +7 (___) ___-__-__
function formatPhone(value) {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);
  const p = d.slice(1);
  let out = '+7';
  if (p.length) out += ' (' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
}

function validate(form) {
  const name = form.elements.name;
  const phone = form.elements.phone;
  const email = form.elements.email;
  const errors = [];
  const bad = (el, msg) => { el.classList.add('is-invalid'); errors.push(msg); };
  [name, phone, email].forEach((el) => el.classList.remove('is-invalid'));
  if (name.value.trim().length < 2) bad(name, 'Укажите имя');
  if (phone.value.replace(/\D/g, '').length !== 11) bad(phone, 'Укажите телефон полностью');
  if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) bad(email, 'Проверьте email');
  return errors;
}

function downloadPresentation() {
  const a = document.createElement('a');
  a.href = SITE.presentationUrl;
  a.download = '';
  document.body.append(a);
  a.click();
  a.remove();
}

async function send(data) {
  // Демо-режим: при локальной разработке и на GitHub Pages PHP не работает — имитируем успешную отправку
  if (import.meta.env.DEV || location.hostname.endsWith('github.io')) {
    console.info('[демо] заявка не отправлена, PHP недоступен:', data);
    await new Promise((r) => setTimeout(r, 600));
    return;
  }
  const res = await fetch(SITE.formEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'send failed');
}

export function initForms(modal) {
  const utm = getUtm();
  document.querySelectorAll('[data-download]').forEach((a) => { a.href = SITE.presentationUrl; });

  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener('focus', () => { if (!input.value) input.value = '+7 ('; });
    input.addEventListener('blur', () => { if (input.value.replace(/\D/g, '').length <= 1) input.value = ''; });
    input.addEventListener('input', () => { input.value = formatPhone(input.value); });
  });

  document.querySelectorAll('form[data-form]').forEach((form) => {
    const error = form.querySelector('.form__error');
    const submit = form.querySelector('.form__submit');
    form.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.textContent = '';
      if (form.elements.company.value) return; // бот заполнил скрытое поле
      const errors = validate(form);
      if (errors.length) { error.textContent = errors.join('. ') + '.'; return; }

      const isPopup = form.dataset.form === 'popup';
      const kind = isPopup ? form.dataset.mode : 'contacts';
      const data = {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value,
        email: form.elements.email.value.trim(),
        form: FORM_NAMES[kind] ?? kind,
        page: location.href,
        ...utm,
      };

      submit.disabled = true;
      try {
        await send(data);
        modal.markSent();
        if (isPopup) {
          modal.showSuccess();
          if (kind === 'presentation') downloadPresentation();
        } else {
          const wrap = form.closest('.contact__form-wrap');
          wrap.querySelector('[data-form-box]').hidden = true;
          wrap.querySelector('[data-form-success]').hidden = false;
          downloadPresentation();
        }
        form.reset();
        window.ym?.(window.YM_ID, 'reachGoal', 'lead'); // цель Метрики, если счётчик подключён
      } catch {
        error.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните: 8 (800) 500-8-500.';
      } finally {
        submit.disabled = false;
      }
    });
  });
}
