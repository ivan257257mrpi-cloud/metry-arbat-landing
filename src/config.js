// Общие настройки сайта. Значения с пометкой ЗАГЛУШКА заменить перед запуском (см. ЧТО-ЗАМЕНИТЬ.md)
export const SITE = {
  // Бизнес-центр: метка на карте и точка для «Построить маршрут» (Яндекс Карты: «улица Арбат, 4с3»)
  coords: [55.752156, 37.59789],
  // ЗАГЛУШКА: API-ключ Яндекс Карт (developer.tech.yandex.ru, «JavaScript API и HTTP Геокодер»).
  // Пока ключ пустой, показывается карта OpenStreetMap.
  yandexMapsKey: '',
  // Обработчик заявок (кладётся рядом с index.html)
  formEndpoint: 'send.php',
  // ЗАГЛУШКА: файл презентации, положить в public/files/presentation.pdf
  presentationUrl: 'files/presentation.pdf',
  // Автопоказ попапа: через сколько секунд после загрузки (не чаще раза за сессию)
  popupDelaySec: 25,
};
