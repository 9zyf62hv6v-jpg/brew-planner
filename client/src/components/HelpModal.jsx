import Modal from './Modal';

export default function HelpModal({ onClose }) {
  function restartTour() {
    onClose();
    setTimeout(() => {
      if (typeof window.__brewTourRestart === 'function') {
        window.__brewTourRestart();
      }
    }, 200);
  }

  return (
    <Modal title="Помощь" onClose={onClose} width="md">
      <div className="space-y-4 text-sm text-brew-navy leading-relaxed">
        <section>
          <h3 className="text-xs font-semibold text-brew-orange uppercase mb-1">
            Диаграмма Ганта
          </h3>
          <ul className="text-xs space-y-1 text-gray-600 list-disc list-inside">
            <li>Каждая строка — отдельный ЦКТ (танк)</li>
            <li>Цветная полоса — варка, её длина = длительность в неделях</li>
            <li>Красная линия — текущая дата</li>
            <li>Штриховая полоса — планируемая варка</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-brew-orange uppercase mb-1">
            Режимы «Варки» и «Розливы»
          </h3>
          <ul className="text-xs space-y-1 text-gray-600 list-disc list-inside">
            <li><b>Варки</b> — полный цикл ферментации в ЦКТ</li>
            <li><b>Розливы</b> — момент, когда пиво уходит в кеги/бутылки (📦)</li>
            <li>В режиме «Розливы» можно двигать только неделю розлива (по горизонтали)</li>
            <li>Неделю розлива задают в карточке варки, внизу — блок «Розлив»</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-brew-orange uppercase mb-1">
            Управление варками
          </h3>
          <ul className="text-xs space-y-1 text-gray-600 list-disc list-inside">
            <li><b>Клик по полосе</b> — редактировать варку</li>
            <li><b>Перетаскивание</b> — сдвинуть по неделям или сменить танк</li>
            <li>При попытке поставить на занятое место полоса становится красной</li>
            <li>Кнопка <b>«Добавить»</b> в шапке — создать новую варку</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-brew-orange uppercase mb-1">
            Роли
          </h3>
          <ul className="text-xs space-y-1 text-gray-600 list-disc list-inside">
            <li><b>Владелец</b> — полный доступ, управление командой</li>
            <li><b>Пивовар</b> — создание и редактирование варок</li>
            <li><b>Наблюдатель</b> — только просмотр</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-brew-orange uppercase mb-1">
            Горячие клавиши
          </h3>
          <ul className="text-xs space-y-1 text-gray-600 list-disc list-inside">
            <li><b>Esc</b> — закрыть модалку</li>
          </ul>
        </section>

        <button
          type="button"
          onClick={restartTour}
          className="w-full h-10 rounded-md bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          🎓 Пройти обучение заново
        </button>

        <div className="text-[11px] text-gray-400 pt-2 border-t border-brew-border">
          Brew Clone · v2026.10
        </div>
      </div>
    </Modal>
  );
}