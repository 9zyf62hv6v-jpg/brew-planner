// client/src/components/onboarding/tourSteps.js

export const TOUR_STEPS = {
  owner: [
    {
      selector: '[data-tour="gantt"]',
      section: 'График',
      title: 'Быстрое создание варки',
      text: 'Двойной клик по свободной ячейке сразу открывает новую варку с выбранной ёмкостью и датой.',
      position: 'top',
    },
    {
      selector: '[data-tour="gantt"]',
      section: 'График',
      title: 'Перетаскивание варок',
      text: 'Тяни варку по неделям и танкам. Если танк занят или превышен объём — подсветится красным.',
      position: 'top',
    },
    {
      selector: '[data-tour="header-add"]',
      section: 'Шапка',
      title: 'Кнопка «Добавить»',
      text: 'Здесь можно создать варку, рецепт или танк вручную — без клика по графику.',
      position: 'bottom',
    },
    {
      selector: '[data-tour="header-display-mode"]',
      section: 'Режим',
      title: 'Варки и Розливы',
      text: '«Варки» — полный цикл ферментации. «Розливы» — когда пиво уходит в кеги и бутылки. В режиме «Розливы» таскай коробочку 📦 по неделям.',
      position: 'bottom',
    },
    {
      selector: '[data-tour="header-filter"]',
      section: 'Шапка',
      title: 'Фильтры',
      text: 'Отфильтруй варки по статусу, рецепту или танку — полезно, когда варок много.',
      position: 'bottom',
    },
    {
      selector: '[data-tour="sidebar-team"]',
      section: 'Меню',
      title: 'Команда',
      text: 'Приглашай пивоваров и наблюдателей по коду-приглашению, управляй ролями.',
      position: 'right',
    },
    {
      selector: '[data-tour="header-help"]',
      section: 'Помощь',
      title: 'Всегда рядом',
      text: 'Забыл, что где — открой «Помощь». Там же можно пройти обучение заново.',
      position: 'bottom',
    },
  ],

  brewer: [
    {
      selector: '[data-tour="gantt"]',
      section: 'График',
      title: 'Быстрое создание варки',
      text: 'Двойной клик по свободной ячейке — и новая варка уже на графике.',
      position: 'top',
    },
    {
      selector: '[data-tour="gantt"]',
      section: 'График',
      title: 'Перетаскивание варок',
      text: 'Тяни варки по неделям и танкам. Конфликты подсвечиваются автоматически.',
      position: 'top',
    },
    {
      selector: '[data-tour="header-display-mode"]',
      section: 'Режим',
      title: 'Варки и Розливы',
      text: 'Переключай вид: «Варки» — ферментация, «Розливы» — неделя, когда пиво уходит в кеги и бутылки.',
      position: 'bottom',
    },
    {
      selector: '[data-tour="header-filter"]',
      section: 'Шапка',
      title: 'Фильтры',
      text: 'Быстро найди нужную варку по статусу, рецепту или танку.',
      position: 'bottom',
    },
    {
      selector: '[data-tour="header-add"]',
      section: 'Шапка',
      title: 'Добавить варку',
      text: 'Кнопка «Добавить» создаёт новую варку с выбранными рецептом и танком.',
      position: 'bottom',
    },
  ],

  viewer: [
    {
      selector: '[data-tour="gantt"]',
      section: 'График',
      title: 'Просмотр варок',
      text: 'Ты видишь все варки команды. Изменять их может только владелец или пивовар.',
      position: 'top',
    },
    {
      selector: '[data-tour="header-display-mode"]',
      section: 'Режим',
      title: 'Варки и Розливы',
      text: 'Переключай вид: «Варки» — ферментация, «Розливы» — когда пиво уходит в кеги и бутылки (📦).',
      position: 'bottom',
    },
    {
      selector: '[data-tour="header-filter"]',
      section: 'Шапка',
      title: 'Фильтры',
      text: 'Отфильтруй список по статусу, рецепту или танку.',
      position: 'bottom',
    },
    {
      selector: '[data-tour="sidebar-team"]',
      section: 'Меню',
      title: 'Команда',
      text: 'Здесь видно, кто ещё работает с твоей пивоварней.',
      position: 'right',
    },
  ],
};