import clsx from 'clsx'
import { ChevronLeft, ListChecks, Pencil, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Modal } from '@/components/Modal'
import { inputClass, primaryButtonClass } from '@/components/form'
import type { ListType, LongTermTask, Priority, TaskListDef } from '@/types'
import { listColorStyle } from './list-colors'
import { PRIORITY_ORDER, useLongTermTasks, useTaskLists } from './use-long-term-tasks'

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-neutral-600',
}

const LIST_TYPE_ICON: Record<ListType, typeof ListChecks> = {
  todo: ListChecks,
  shopping: ShoppingCart,
}

export function LongTermPage() {
  const lists = useTaskLists()
  const tasks = useLongTermTasks()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedListId, setSelectedListIdState] = useState<string | null>(
    searchParams.get('open'),
  )
  const [showNewList, setShowNewList] = useState(false)

  function setSelectedListId(id: string | null) {
    setSelectedListIdState(id)
    setSearchParams(id ? { open: id } : {}, { replace: true })
  }

  // Deep-link support: dashboard widgets link to /list?open=<listId>.
  useEffect(() => {
    const requested = searchParams.get('open')
    if (requested && requested !== selectedListId) setSelectedListIdState(requested)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // One-time cleanup: tasks created before lists existed (or whose list was
  // since deleted) point at a listId with no matching list, so they never
  // show up anywhere. Recover them into a visible list instead of losing
  // them silently.
  useEffect(() => {
    if (lists.loading || tasks.loading) return
    const orphans = tasks.items.filter((t) => !lists.items.some((l) => l.id === t.listId))
    if (orphans.length === 0) return
    lists.add({ name: 'My List', type: 'todo', createdAt: Date.now() }).then((ref) => {
      orphans.forEach((t) => tasks.update(t.id, { listId: ref.id }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists.loading, tasks.loading])

  const selectedList = lists.items.find((l) => l.id === selectedListId) ?? null

  async function handleDeleteList(list: TaskListDef) {
    await Promise.all(
      tasks.items.filter((t) => t.listId === list.id).map((t) => tasks.remove(t.id)),
    )
    await lists.remove(list.id)
    setSelectedListId(null)
  }

  if (selectedList) {
    return (
      <ListDetail
        list={selectedList}
        tasks={tasks.items.filter((t) => t.listId === selectedList.id)}
        onBack={() => setSelectedListId(null)}
        onAddTask={tasks.add}
        onUpdateTask={tasks.update}
        onRemoveTask={tasks.remove}
        onRenameList={(name) => lists.update(selectedList.id, { name })}
        onDeleteList={() => handleDeleteList(selectedList)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-neutral-300">Your lists</h2>

      {lists.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          No lists yet — create one to start organizing (e.g. "Honey-Do", "Groceries").
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {lists.items.map((list) => {
            const listTasks = tasks.items.filter((t) => t.listId === list.id && !t.completed)
            const style = listColorStyle(list.id)
            const Icon = LIST_TYPE_ICON[list.type ?? 'todo']
            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={clsx(
                  'flex flex-col items-start gap-2 rounded-xl border-y border-r border-l-4 border-y-neutral-800 border-r-neutral-800 bg-neutral-900 p-3 text-left transition hover:border-y-neutral-700 hover:border-r-neutral-700',
                  style.border,
                )}
              >
                <span className={clsx('rounded-full p-1.5', style.badge)}>
                  <Icon size={14} />
                </span>
                <span className="w-full truncate text-sm font-medium text-neutral-100">
                  {list.name}
                </span>
                <span className="text-xs text-neutral-500">
                  {listTasks.length === 0 ? 'All caught up' : `${listTasks.length} open`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setShowNewList(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-3 text-sm text-neutral-400 hover:border-indigo-500 hover:text-indigo-400"
      >
        <Plus size={16} /> New list
      </button>

      {showNewList && (
        <NewListModal
          onClose={() => setShowNewList(false)}
          onCreate={async (name, type) => {
            const ref = await lists.add({ name, type, createdAt: Date.now() })
            setShowNewList(false)
            setSelectedListId(ref.id)
          }}
        />
      )}
    </div>
  )
}

function ListDetail({
  list,
  tasks,
  onBack,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onRenameList,
  onDeleteList,
}: {
  list: TaskListDef
  tasks: (LongTermTask & { id: string })[]
  onBack: () => void
  onAddTask: (data: Omit<LongTermTask, 'id'>) => unknown
  onUpdateTask: (id: string, data: Partial<LongTermTask>) => unknown
  onRemoveTask: (id: string) => unknown
  onRenameList: (name: string) => unknown
  onDeleteList: () => unknown
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState<(LongTermTask & { id: string }) | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [hideDone, setHideDone] = useState(true)
  const [quickAdd, setQuickAdd] = useState('')
  const isShopping = list.type === 'shopping'

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickAdd.trim()) return
    const now = Date.now()
    onAddTask({
      title: quickAdd.trim(),
      priority: 'medium',
      completed: false,
      listId: list.id,
      createdAt: now,
      updatedAt: now,
    })
    setQuickAdd('')
  }

  const visible = (hideDone ? tasks.filter((t) => !t.completed) : tasks).sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-900"
          aria-label="Back to lists"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="flex-1 truncate text-base font-semibold text-neutral-50">{list.name}</h2>
        <button
          onClick={() => setRenaming(true)}
          className="text-neutral-500 hover:text-indigo-400"
          aria-label="Rename list"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onDeleteList}
          className="text-neutral-500 hover:text-red-400"
          aria-label="Delete list"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setHideDone(!hideDone)}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          {hideDone ? 'Show completed' : 'Hide completed'}
        </button>
      </div>

      {visible.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-500">
          Nothing here yet. Add the first thing that's been nagging you.
        </p>
      )}

      <ul className="space-y-2">
        {visible.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
          >
            <button
              onClick={() =>
                onUpdateTask(task.id, { completed: !task.completed, updatedAt: Date.now() })
              }
              className={clsx(
                'h-5 w-5 shrink-0 rounded-full border-2',
                task.completed ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600',
              )}
              aria-label="Toggle complete"
            />
            {!isShopping && (
              <span
                className={clsx('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[task.priority])}
                title={`${task.priority} priority`}
              />
            )}
            <p
              className={clsx(
                'min-w-0 flex-1 truncate text-sm',
                task.completed ? 'text-neutral-500 line-through' : 'text-neutral-100',
              )}
            >
              {task.title}
              {task.quantity && (
                <span className="ml-1.5 text-xs text-neutral-500">· {task.quantity}</span>
              )}
            </p>
            <button
              onClick={() => setEditingTask(task)}
              className="text-neutral-500 hover:text-indigo-400"
              aria-label="Edit item"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onRemoveTask(task.id)}
              className="text-xs text-neutral-600 hover:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <input
          placeholder={isShopping ? 'Add an item…' : 'Add a task…'}
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={!quickAdd.trim()}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 text-white hover:bg-indigo-500 disabled:opacity-40"
          aria-label="Add"
        >
          <Plus size={18} />
        </button>
      </form>
      <button
        onClick={() => setShowAdd(true)}
        className="w-full text-center text-xs text-neutral-500 hover:text-indigo-400"
      >
        Add with priority &amp; notes
      </button>

      {showAdd && (
        <TaskModal
          title={`Add to ${list.name}`}
          isShopping={isShopping}
          onClose={() => setShowAdd(false)}
          onSubmit={(data) => {
            const now = Date.now()
            onAddTask({ ...data, listId: list.id, completed: false, createdAt: now, updatedAt: now })
            setShowAdd(false)
          }}
        />
      )}

      {editingTask && (
        <TaskModal
          title="Edit item"
          isShopping={isShopping}
          existing={editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={(data) => {
            onUpdateTask(editingTask.id, { ...data, updatedAt: Date.now() })
            setEditingTask(null)
          }}
        />
      )}

      {renaming && (
        <RenameListModal
          list={list}
          onClose={() => setRenaming(false)}
          onSave={(name) => {
            onRenameList(name)
            setRenaming(false)
          }}
        />
      )}
    </div>
  )
}

function NewListModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, type: ListType) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ListType>('todo')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onCreate(name.trim(), type)
  }

  return (
    <Modal title="New list" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="e.g. Honey-Do, Groceries"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-1 rounded-lg bg-neutral-800 p-1">
          <button
            type="button"
            onClick={() => setType('todo')}
            className={clsx(
              'flex-1 rounded-md py-1.5 text-xs font-medium transition',
              type === 'todo' ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
            )}
          >
            To-do list
          </button>
          <button
            type="button"
            onClick={() => setType('shopping')}
            className={clsx(
              'flex-1 rounded-md py-1.5 text-xs font-medium transition',
              type === 'shopping' ? 'bg-neutral-700 text-neutral-50' : 'text-neutral-500',
            )}
          >
            Shopping list
          </button>
        </div>
        <button type="submit" disabled={!name.trim()} className={`${primaryButtonClass} disabled:opacity-40`}>
          Create list
        </button>
      </form>
    </Modal>
  )
}

function RenameListModal({
  list,
  onClose,
  onSave,
}: {
  list: TaskListDef
  onClose: () => void
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(list.name)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <Modal title="Rename list" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <button type="submit" disabled={!name.trim()} className={`${primaryButtonClass} disabled:opacity-40`}>
          Save
        </button>
      </form>
    </Modal>
  )
}

function TaskModal({
  title,
  isShopping,
  existing,
  onClose,
  onSubmit,
}: {
  title: string
  isShopping: boolean
  existing?: LongTermTask
  onClose: () => void
  onSubmit: (data: Omit<LongTermTask, 'id' | 'listId' | 'createdAt' | 'updatedAt' | 'completed'>) => void
}) {
  const [itemTitle, setItemTitle] = useState(existing?.title ?? '')
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium')
  const [quantity, setQuantity] = useState(existing?.quantity ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemTitle.trim()) return
    onSubmit({
      title: itemTitle.trim(),
      notes: notes.trim() || undefined,
      priority,
      quantity: isShopping ? quantity.trim() || undefined : undefined,
    })
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          required
          placeholder={isShopping ? 'e.g. Milk' : 'e.g. Fix the fence gate'}
          value={itemTitle}
          onChange={(e) => setItemTitle(e.target.value)}
          className={inputClass}
        />
        {isShopping ? (
          <input
            placeholder="Quantity (optional), e.g. 2 gal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        ) : (
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputClass}
          >
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        )}
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass}
        />
        <button type="submit" className={primaryButtonClass}>
          {existing ? 'Save changes' : 'Add'}
        </button>
      </form>
    </Modal>
  )
}
