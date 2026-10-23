import { useState, useEffect } from 'react';
import {
  Plus, Check, Circle, Clock, AlertCircle, Trash2, Edit3,
  Flag, Calendar as CalendarIcon, User, Beer,
} from 'lucide-react';
import api from '../api';
import TaskModal from './TaskModal';

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'todo', label: 'Активные' },
  { id: 'done', label: 'Выполненные' },
  { id: 'mine', label: 'Мои' },
];

export default function TasksPage({ user, isMobile = false }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [modalState, setModalState] = useState({ open: false, task: null });

  const canEdit = user?.role === 'owner' || user?.role === 'brewer';

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(task) {
    try {
      const res = await api.patch(`/tasks/${task.id}/toggle`);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? res.data : t)));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(task) {
    if (!confirm(`Удалить задачу «${task.title}»?`)) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleSaved() {
    loadTasks();
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'todo') return t.status === 'todo';
    if (filter === 'done') return t.status === 'done';
    if (filter === 'mine') return t.assigned_to === user.id;
    return true;
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  if (loading && tasks.length === 0) {
    return <div className="p-6 text-center text-gray-400">Загрузка задач...</div>;
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Заголовок + кнопка */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <div className="flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-brew-navy">Задачи команды</h1>
          <div className="text-xs text-gray-400 mt-0.5">
            Всего {stats.total} · Активных {stats.todo} · Выполнено {stats.done}
          </div>
        </div>
        {canEdit && (
          <button
            onClick={() => setModalState({ open: true, task: null })}
            className="h-10 px-4 rounded-md bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Новая задача
          </button>
        )}
      </div>

      {/* Фильтры */}
      <div className="flex items-center bg-gray-100 rounded-md p-0.5 mb-4 w-fit overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 h-8 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              filter === f.id
                ? 'bg-white text-brew-navy shadow-sm'
                : 'text-gray-500 hover:text-brew-navy'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white border border-brew-border rounded-lg p-10 text-center">
          <Check className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">
            {filter === 'done' ? 'Нет выполненных задач' :
             filter === 'mine' ? 'У тебя нет назначенных задач' :
             filter === 'todo' ? 'Нет активных задач — всё сделано! 🎉' :
             'Задач пока нет'}
          </p>
          <p className="text-xs text-gray-400">
            {canEdit ? 'Создай первую кнопкой сверху' : 'Владелец или пивовар создаст задачи'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              onToggle={() => handleToggle(task)}
              onEdit={() => setModalState({ open: true, task })}
              onDelete={() => handleDelete(task)}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {modalState.open && canEdit && (
        <TaskModal
          mode={modalState.task ? 'edit' : 'add'}
          initial={modalState.task}
          onClose={() => setModalState({ open: false, task: null })}
          onSaved={handleSaved}
          isMobile={isMobile}
          currentUser={user}
        />
      )}
    </div>
  );
}

function TaskCard({ task, canEdit, onToggle, onEdit, onDelete, isMobile }) {
  const isDone = task.status === 'done';
  const overdue = task.due_date && !isDone && new Date(task.due_date) < new Date(new Date().toDateString());

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    normal: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const priorityLabels = { high: 'Высокий', normal: 'Обычный', low: 'Низкий' };

  return (
    <div className={`bg-white border rounded-lg p-3 sm:p-4 flex items-start gap-3 transition-colors ${
      isDone ? 'border-brew-border opacity-60' : 'border-brew-border hover:border-brew-orange/40'
    }`}>
      {/* Чекбокс */}
      <button
        onClick={canEdit ? onToggle : undefined}
        disabled={!canEdit}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          isDone
            ? 'bg-brew-orange border-brew-orange text-white'
            : canEdit
            ? 'border-gray-300 hover:border-brew-orange'
            : 'border-gray-200'
        }`}
      >
        {isDone && <Check className="w-4 h-4" />}
      </button>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div
          onClick={canEdit ? onEdit : undefined}
          className={canEdit ? 'cursor-pointer' : ''}
        >
          <div className={`text-sm font-medium text-brew-navy ${isDone ? 'line-through' : ''}`}>
            {task.title}
          </div>

          {task.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {task.description}
            </div>
          )}

          {/* Мета-строка */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Приоритет */}
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${priorityColors[task.priority] || priorityColors.normal}`}>
              <Flag className="w-2.5 h-2.5 inline mr-0.5" />
              {priorityLabels[task.priority] || 'Обычный'}
            </span>

            {/* Срок */}
            {task.due_date && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                overdue
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                <CalendarIcon className="w-2.5 h-2.5" />
                {formatDate(task.due_date)}
                {overdue && ' · просрочено'}
              </span>
            )}

            {/* Привязка к варке */}
            {task.batch_recipe_name && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-orange-50 text-brew-orange border-orange-200 flex items-center gap-0.5">
                <Beer className="w-2.5 h-2.5" />
                {task.batch_recipe_name}
              </span>
            )}

            {/* Назначение */}
            {task.assigned_to_name && (
              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <User className="w-2.5 h-2.5" />
                {task.assigned_to_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Действия */}
      {canEdit && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brew-orange"
            title="Редактировать"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500"
            title="Удалить"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}