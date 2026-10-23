import { useState, useEffect } from 'react';
import {
  Beer, Calendar, FlaskConical, Package, Users, Activity, Wrench,
  BarChart3, Check, ArrowRight, Menu, X, Sparkles, Zap, Lock,
  ArrowUp, Star, TrendingUp, Award, Mail, Globe, Send,
} from 'lucide-react';;

const FEATURES = [
  {
    icon: Calendar, title: 'Диаграмма Ганта',
    text: 'Планируй варки по неделям. Перетаскивай, следи за конфликтами, видь занятость ЦКТ.',
    color: 'text-orange-500 bg-orange-50',
  },
  {
    icon: Beer, title: 'Рецепты с расчётами',
    text: 'Солод, хмель, дрожжи. Автоматический расчёт IBU, OG, FG, ABV прямо в браузере.',
    color: 'text-green-600 bg-green-50',
  },
  {
    icon: Activity, title: 'QA-журнал',
    text: 'Замеры pH, плотности и температуры. График ферментации. Экспорт в CSV.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Package, title: 'Склад продукции',
    text: 'Кеги, бутылки, банки. Остатки по каждой варке, локации и даты розлива.',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    icon: Users, title: 'Команда и роли',
    text: 'Приглашай пивоваров и наблюдателей. Разные права: владелец, пивовар, наблюдатель.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Wrench, title: 'Калькуляторы',
    text: 'IBU, ABV, карбонизация, разведение. Всё что нужно пивовару — в одном месте.',
    color: 'text-cyan-600 bg-cyan-50',
  },
  {
    icon: FlaskConical, title: 'Задачи команды',
    text: '«Помыть ЦКТ-05», «Принять солод» — с приоритетами, сроками и привязкой к варке.',
    color: 'text-red-500 bg-red-50',
  },
  {
    icon: BarChart3, title: 'Аналитика',
    text: 'Планируй загрузку мощностей, следи за производством и запасами в реальном времени.',
    color: 'text-indigo-600 bg-indigo-50',
  },
];

const STEPS = [
  {
    num: '01', title: 'Зарегистрируйся',
    text: 'Минута — и у тебя своя пивоварня в системе с 10 ЦКТ и готовыми рецептами.',
  },
  {
    num: '02', title: 'Настрой под себя',
    text: 'Добавь свои танки, рецепты, пригласи команду по коду-приглашению.',
  },
  {
    num: '03', title: 'Планируй и вари',
    text: 'Планируй варки, веди QA-журнал, отслеживай склад — всё в одном окне.',
  },
];

const STATS = [
  { value: '50+', label: 'Пивоварен', icon: Users },
  { value: '1200+', label: 'Варок', icon: Beer },
  { value: '3 мес', label: 'В работе', icon: Award },
  { value: '100%', label: 'Бесплатно', icon: TrendingUp },
];

const PRICING = [
  {
    name: 'Домашняя',
    price: '0 ₽',
    period: 'навсегда',
    description: 'Для домашних пивоваров и небольших экспериментов',
    features: [
      'До 5 ЦКТ',
      'Безлимит рецептов',
      'QA-журнал измерений',
      'Экспорт в CSV',
      '1 пользователь',
    ],
    cta: 'Начать',
    highlight: false,
  },
  {
    name: 'Пивоварня',
    price: '0 ₽',
    period: 'навсегда',
    description: 'Для крафтовых пивоварен и небольших производств',
    features: [
      'Безлимит ЦКТ',
      'Команда до 10 человек',
      'Роли: владелец, пивовар, наблюдатель',
      'Склад продукции',
      'Задачи и календарь',
      'Все калькуляторы',
    ],
    cta: 'Начать бесплатно',
    highlight: true,
  },
  {
    name: 'Скоро',
    price: '?',
    period: 'в разработке',
    description: 'Расширенные тарифы для крупных производств',
    features: [
      'Всё из «Пивоварни»',
      'Безлимит команды',
      'API для интеграций',
      'Приоритетная поддержка',
      'Кастомные отчёты',
    ],
    cta: 'Узнать первым',
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: 'Алексей М.',
    company: 'Пивоварня «Медведь»',
    text: 'Перешли с Excel — небо и земля. Раньше планировали варки вслепую, сейчас видим всю загрузку ЦКТ на 3 месяца вперёд.',
    avatar: 'АМ',
    color: '#4CAF50',
  },
  {
    name: 'Ирина С.',
    company: 'Крафт-бар «Дубль»',
    text: 'QA-журнал — топ. Все замеры в одном месте, график ферментации сразу показывает, если что-то пошло не так.',
    avatar: 'ИС',
    color: '#2196F3',
  },
  {
    name: 'Дмитрий К.',
    company: 'Домашняя пивоварня',
    text: 'Варю для себя и друзей, но пользуюсь как профи. Калькуляторы, рецепты, задачи — всё под рукой.',
    avatar: 'ДК',
    color: '#E91E63',
  },
];

const FAQ = [
  { q: 'Это бесплатно?', a: 'Да, Brew Clone бесплатен на этапе запуска. Мы планируем добавить платные тарифы для больших пивоварен, но базовые функции останутся бесплатными навсегда.' },
  { q: 'Нужно ли устанавливать что-то?', a: 'Нет. Brew Clone работает прямо в браузере — на компьютере, планшете или телефоне. Ничего скачивать не нужно.' },
  { q: 'Сколько танков можно добавить?', a: 'На тарифе «Пивоварня» — без ограничений. При регистрации автоматически создаётся 10 ЦКТ, но ты можешь добавлять свои.' },
  { q: 'Можно ли работать командой?', a: 'Да. Владелец приглашает пивоваров и наблюдателей по коду. Каждый видит то, что ему положено по роли.' },
  { q: 'Где хранятся мои данные?', a: 'На серверах в России (Yandex Cloud). Доступ — только у тебя и твоей команды. Соединение защищено HTTPS.' },
  { q: 'Подходит ли для домашней пивоварни?', a: 'Абсолютно. Можно вести один-два танка, записывать рецепты и замеры — всё то же, что и для крупной пивоварни.' },
];

export default function LandingPage({ onLogin, onRegister, onDemo }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowTopBtn(window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(id) {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-brew-bg text-brew-navy">
      {/* ===== ХЕДЕР ===== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brew-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brew-orange rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">BC</span>
            </div>
            <span className="font-semibold text-brew-navy text-sm sm:text-base">
              Brew Clone
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('features')} className="text-sm text-gray-600 hover:text-brew-orange transition-colors">
              Возможности
            </button>
            <button onClick={() => scrollTo('pricing')} className="text-sm text-gray-600 hover:text-brew-orange transition-colors">
              Тарифы
            </button>
            <button onClick={() => scrollTo('faq')} className="text-sm text-gray-600 hover:text-brew-orange transition-colors">
              Вопросы
            </button>
            <button onClick={onLogin} className="text-sm font-medium text-brew-navy hover:text-brew-orange transition-colors">
              Войти
            </button>
            <button
              onClick={onRegister}
              className="h-9 px-4 rounded-md bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              Начать бесплатно
            </button>
          </nav>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100"
            aria-label="Меню"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-brew-border bg-white px-4 py-3 space-y-2">
            <button onClick={() => scrollTo('features')} className="block w-full text-left py-2 text-sm text-gray-600">
              Возможности
            </button>
            <button onClick={() => scrollTo('pricing')} className="block w-full text-left py-2 text-sm text-gray-600">
              Тарифы
            </button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left py-2 text-sm text-gray-600">
              Вопросы
            </button>
            <button onClick={() => { setMenuOpen(false); onLogin(); }} className="block w-full text-left py-2 text-sm font-medium text-brew-navy">
              Войти
            </button>
            <button
              onClick={() => { setMenuOpen(false); onRegister(); }}
              className="w-full h-10 rounded-md bg-brew-orange text-white text-sm font-medium"
            >
              Начать бесплатно
            </button>
          </div>
        )}
      </header>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brew-orange/10 text-brew-orange text-xs font-medium mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                Бесплатно · Без установки · Прямо в браузере
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brew-navy leading-tight mb-5">
                Планируй варки<br />
                <span className="text-brew-orange">без хаоса</span> в блокнотах
              </h1>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-7 max-w-xl">
                Brew Clone — облачный планировщик для пивоварен. Диаграмма Ганта,
                рецепты с расчётами, QA-журнал и склад — всё в одном месте.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={onRegister}
                  className="h-12 px-6 rounded-md bg-brew-orange text-white font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  Начать бесплатно
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onLogin}
                  className="h-12 px-6 rounded-md border border-brew-border bg-white text-brew-navy font-medium hover:bg-gray-50 transition-colors"
                >
                  У меня уже есть аккаунт   
                </button>
              </div>
              <button
                onClick={onDemo}
                className="text-sm text-brew-orange hover:underline mb-6 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Попробовать без регистрации →
              </button>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Регистрация за 30 секунд
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Работает на телефоне
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Бесплатно навсегда
                </div>
              </div>
            </div>

            {/* Мокап-скриншот */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-brew-orange/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-white border border-brew-border rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-brew-border bg-gray-50">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <div className="ml-3 text-[10px] text-gray-400 truncate">
                    my-brew.ru
                  </div>
                </div>

                <div className="p-4 bg-brew-bg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 px-2 rounded bg-white border border-brew-border text-[9px] text-gray-500 flex items-center">
                      Дни
                    </div>
                    <div className="h-6 px-2 rounded bg-white border border-brew-border text-[9px] text-brew-orange font-medium flex items-center">
                      Недели
                    </div>
                    <div className="h-6 px-2 rounded bg-brew-orange text-[9px] text-white font-medium flex items-center ml-auto">
                      Розливы
                    </div>
                  </div>

                  <div className="bg-white rounded border border-brew-border overflow-hidden">
                    <div className="grid grid-cols-8 border-b border-brew-border bg-gray-50">
                      {['', '36', '37', '38', '39', '40', '41', '42'].map((w, i) => (
                        <div key={i} className="px-1 py-1 text-[8px] text-gray-400 text-center border-r border-brew-border last:border-r-0">
                          {w}
                        </div>
                      ))}
                    </div>

                    {[
                      { name: 'ЦКТ-01', bars: [{ start: 2, len: 3, color: '#4CAF50' }] },
                      { name: 'ЦКТ-02', bars: [{ start: 4, len: 2, color: '#2196F3' }] },
                      { name: 'ЦКТ-03', bars: [] },
                      { name: 'ЦКТ-04', bars: [{ start: 5, len: 2, color: '#E91E63' }] },
                      { name: 'ЦКТ-05', bars: [] },
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-8 border-b border-brew-border last:border-b-0" style={{ height: 22 }}>
                        <div className="px-1 flex items-center text-[8px] text-gray-500 border-r border-brew-border bg-gray-50">
                          {row.name}
                        </div>
                        <div className="col-span-7 relative">
                          {row.bars.map((bar, j) => (
                            <div
                              key={j}
                              className="absolute rounded-sm"
                              style={{
                                left: `calc(${(bar.start / 7) * 100}% + 2px)`,
                                width: `calc(${(bar.len / 7) * 100}% - 4px)`,
                                top: 3, bottom: 3,
                                backgroundColor: bar.color,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== СТАТИСТИКА ===== */}
      <section className="py-10 sm:py-14 bg-white border-y border-brew-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-md bg-brew-orange/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brew-orange" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-brew-navy mb-0.5">
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== ВОЗМОЖНОСТИ ===== */}
      <section id="features" className="py-12 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-brew-orange/10 text-brew-orange text-xs font-medium mb-3">
              8 инструментов в одном окне
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brew-navy mb-3">
              Всё для пивоварни — в одном месте
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
              Больше не нужно держать таблицы в Excel, рецепты — в блокноте,
              а замеры — в голове. Brew Clone собирает всё воедино.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-brew-bg rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-3 ${f.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-brew-navy mb-1.5">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== КАК РАБОТАЕТ ===== */}
      <section id="how" className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-brew-orange/10 text-brew-orange text-xs font-medium mb-3">
              3 простых шага
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brew-navy mb-3">
              Как это работает
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-5xl sm:text-6xl font-bold text-brew-orange/15 mb-3">
                  {s.num}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-brew-navy mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ПОЧЕМУ МЫ ===== */}
      <section className="py-12 sm:py-16 bg-brew-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-brew-orange/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-brew-orange" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Быстро</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  От регистрации до первой варки — меньше минуты. Никаких сложных настроек.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-brew-orange/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-brew-orange" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Безопасно</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Данные в Yandex Cloud, HTTPS-шифрование, JWT-аутентификация, роли команды.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-brew-orange/20 flex items-center justify-center flex-shrink-0">
                <Beer className="w-5 h-5 text-brew-orange" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">Для пивоваров</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Делали вместе с людьми, которые варят. Всё, что нужно — и ничего лишнего.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ТАРИФЫ ===== */}
      <section id="pricing" className="py-12 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-brew-orange/10 text-brew-orange text-xs font-medium mb-3">
              Простые тарифы
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brew-navy mb-3">
              Бесплатно на этапе запуска
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
              Мы только начинаем. Пользуйся бесплатно — нам важна обратная связь.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING.map((p, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-xl p-6 border transition-all ${
                  p.highlight
                    ? 'border-brew-orange shadow-xl scale-[1.02]'
                    : 'border-brew-border hover:shadow-md'
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brew-orange text-white text-[10px] font-medium uppercase tracking-wide">
                    Популярный
                  </div>
                )}

                <div className="text-sm font-semibold text-brew-navy mb-1">
                  {p.name}
                </div>
                <div className="text-xs text-gray-500 mb-5 h-8">
                  {p.description}
                </div>

                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-3xl font-bold text-brew-navy">{p.price}</span>
                  <span className="text-xs text-gray-400">/ {p.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={p.highlight || i === 0 ? onRegister : onLogin}
                  className={`w-full h-10 rounded-md text-sm font-medium transition-colors ${
                    p.highlight
                      ? 'bg-brew-orange text-white hover:bg-orange-600'
                      : 'border border-brew-border text-brew-navy hover:bg-gray-50'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ОТЗЫВЫ ===== */}
      <section className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-block px-3 py-1 rounded-full bg-brew-orange/10 text-brew-orange text-xs font-medium mb-3">
              Отзывы
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-brew-navy mb-3">
              Что говорят пивовары
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-brew-border">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-brew-orange text-brew-orange" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  «{t.text}»
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-brew-border">
                  <div
                    className="w-10 h-10 rounded-full text-white text-xs font-semibold flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-brew-navy truncate">
                      {t.name}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">
                      {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-12 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1 rounded-full bg-brew-orange/10 text-brew-orange text-xs font-medium mb-3">
              FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brew-navy">
              Частые вопросы
            </h2>
          </div>

          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-brew-orange to-orange-600 rounded-2xl p-8 sm:p-12 text-center text-white shadow-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
              Готов начать варить?
            </h2>
            <p className="text-sm sm:text-base text-white/90 mb-7 max-w-xl mx-auto">
              Создай аккаунт за 30 секунд — и получи свою пивоварню в облаке.
              Бесплатно и без ограничений.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              <button
                onClick={onRegister}
                className="h-12 px-7 rounded-md bg-white text-brew-orange font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLogin}
                className="h-12 px-7 rounded-md border border-white/40 text-white font-medium hover:bg-white/10 transition-colors"
              >
                Войти
              </button>
              <button
                onClick={onDemo}
                className="h-12 px-7 rounded-md border border-white/40 text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Демо
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ФУТЕР ===== */}
      <footer className="bg-brew-navy text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-8">
            {/* Логотип + описание */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-brew-orange rounded-md flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">BC</span>
                </div>
                <span className="text-sm text-white font-medium">Brew Clone</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                Облачный планировщик для пивоварен. Диаграмма Ганта, рецепты,
                QA-журнал и склад — всё в одном месте.
              </p>
            </div>

            {/* Навигация */}
            <div>
              <div className="text-xs font-semibold text-white mb-3 uppercase tracking-wide">
                Продукт
              </div>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollTo('features')} className="text-xs hover:text-brew-orange transition-colors">
                    Возможности
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('pricing')} className="text-xs hover:text-brew-orange transition-colors">
                    Тарифы
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('faq')} className="text-xs hover:text-brew-orange transition-colors">
                    Частые вопросы
                  </button>
                </li>
              </ul>
            </div>

            {/* Контакты */}
            <div>
              <div className="text-xs font-semibold text-white mb-3 uppercase tracking-wide">
                Связь
              </div>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:hello@my-brew.ru" className="text-xs hover:text-brew-orange transition-colors flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    hello@my-brew.ru
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs hover:text-brew-orange transition-colors flex items-center gap-1.5">
                    <Send className="w-3 h-3" />
                    Telegram
                  </a>
                </li>
                <li>
                  <a href="#" className="text-xs hover:text-brew-orange transition-colors flex items-center gap-1.5">
                    <Globe className="w-3 h-3" />
                    Сайт
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              © 2026 Brew Clone. Планировщик для пивоварен.
            </div>
            <div className="text-xs text-gray-500">
              Сделано с 🍺 для тех, кто варит
            </div>
          </div>
        </div>
      </footer>

      {/* Кнопка «Наверх» */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-brew-orange text-white shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center z-20"
          title="Наверх"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-brew-border rounded-lg overflow-hidden bg-brew-bg">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 text-left hover:bg-white transition-colors"
      >
        <span className="text-sm font-medium text-brew-navy">{question}</span>
        <span className={`text-brew-orange text-lg transition-transform ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-gray-600 leading-relaxed bg-white">
          {answer}
        </div>
      )}
    </div>
  );
}