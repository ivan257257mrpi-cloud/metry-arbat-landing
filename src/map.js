import { SITE } from './config.js';
import { PLACES, ICONS } from './places.js';

// Карта окружения с фильтрами. Если задан ключ Яндекс Карт — Яндекс Карты API v3,
// иначе временно OpenStreetMap (Leaflet), чтобы карта работала до получения ключа.
export function initMap(el) {
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    (SITE.yandexMapsKey ? yandexMap(el) : leafletMap(el)).then(bindFilters).catch((e) => {
      console.error('Карта не загрузилась', e);
      el.innerHTML = '<p class="map-note">Не удалось загрузить карту</p>';
    });
  }, { rootMargin: '400px' });
  io.observe(el);
}

function pinElement(place) {
  const div = document.createElement('div');
  div.className = 'map-pin';
  div.innerHTML = ICONS[place.cat] + '<span class="map-tip"></span>';
  div.querySelector('.map-tip').textContent = place.name;
  div.addEventListener('click', () => div.classList.toggle('is-open'));
  return div;
}

function mainPinElement() {
  const div = document.createElement('div');
  div.className = 'map-pin map-pin--main';
  div.textContent = 'Бизнес-центр · Арбат, 4/3';
  return div;
}

function bindFilters(api) {
  const buttons = document.querySelectorAll('.map-filters [data-cat]');
  const show = (cat) => {
    buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.cat === cat));
    api.setVisible((p) => cat === 'all' || p.cat === cat);
  };
  buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.cat)));
  show('all');
}

// ---------- Яндекс Карты v3 ----------
async function yandexMap(el) {
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(SITE.yandexMapsKey)}&lang=ru_RU`;
    s.onload = resolve;
    s.onerror = reject;
    document.head.append(s);
  });
  await window.ymaps3.ready;
  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapControls } = window.ymaps3;
  const { YMapZoomControl } = await window.ymaps3.import('@yandex/ymaps3-default-ui-theme');
  const lngLat = ([lat, lng]) => [lng, lat];

  const map = new YMap(el, { location: { center: lngLat(SITE.coords), zoom: 15 }, behaviors: ['drag', 'pinchZoom', 'dblClick'] });
  map.addChild(new YMapDefaultSchemeLayer({ theme: 'light' }));
  map.addChild(new YMapDefaultFeaturesLayer());
  map.addChild(new YMapControls({ position: 'right' }).addChild(new YMapZoomControl({})));

  const markers = PLACES.map((p) => ({ p, m: new YMapMarker({ coordinates: lngLat(p.at) }, pinElement(p)), on: false }));
  map.addChild(new YMapMarker({ coordinates: lngLat(SITE.coords), zIndex: 1000 }, mainPinElement()));

  return {
    setVisible(fn) {
      markers.forEach((x) => {
        const want = fn(x.p);
        if (want && !x.on) map.addChild(x.m);
        if (!want && x.on) map.removeChild(x.m);
        x.on = want;
      });
    },
  };
}

// ---------- OpenStreetMap (временная замена) ----------
async function leafletMap(el) {
  const L = (await import('leaflet')).default;
  await import('leaflet/dist/leaflet.css');
  const map = L.map(el, { center: SITE.coords, zoom: 15, scrollWheelZoom: false, zoomControl: false });
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    className: 'map-tiles',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  // масштаб колесом — только при зажатом Ctrl, чтобы не мешать прокрутке страницы
  el.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); map.scrollWheelZoom.enable(); } else map.scrollWheelZoom.disable(); }, { passive: false });

  const icon = () => L.divIcon({ className: '', iconSize: [0, 0] });
  const markers = PLACES.map((p) => {
    const m = L.marker(p.at, { icon: icon() });
    m.on('add', () => m.getElement().replaceChildren(pinElement(p)));
    return { p, m };
  });
  const main = L.marker(SITE.coords, { icon: icon(), zIndexOffset: 1000 }).addTo(map);
  main.getElement().replaceChildren(mainPinElement());

  return {
    setVisible(fn) {
      markers.forEach(({ p, m }) => (fn(p) ? m.addTo(map) : m.remove()));
    },
  };
}
