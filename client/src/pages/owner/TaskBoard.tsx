import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useGetTasksQuery, useUpdateTaskMutation, useGetBusinessMembersQuery, useCreateTaskMutation } from '../../api/endpoints';
import { Badge, Button, Modal, Input, Select, Spinner, toast } from '../../components/ui';
import { useAppSelector } from '../../store';
import { Task } from '../../types';
import { Plus, Columns3, GripVertical } from 'lucide-react';

const COLUMNS = [
  { key: 'TODO' as const,        title: 'To Do',       color: 'border-surface-200 bg-surface-50',    headerColor: 'text-surface-500', dot: 'bg-surface-400',  emptyMsg: 'No tasks yet' },
  { key: 'IN_PROGRESS' as const, title: 'In Progress', color: 'border-warning-200 bg-warning-50/40', headerColor: 'text-warning-600', dot: 'bg-warning-400',  emptyMsg: 'Nothing in progress' },
  { key: 'DONE' as const,        title: 'Done',        color: 'border-success-200 bg-success-50/40', headerColor: 'text-success-600', dot: 'bg-success-400',  emptyMsg: 'No completed tasks' },
];

const PRIORITY_CONFIG = {
  HIGH: { variant: 'danger'  as const, border: 'border-l-danger-500' },
  MED:  { variant: 'warning' as const, border: 'border-l-warning-400' },
  LOW:  { variant: 'info'    as const, border: 'border-l-info-400' },
};

export default function TaskBoard() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const { data, isLoading } = useGetTasksQuery({ businessId }, { skip: !businessId });
  const { data: memberData } = useGetBusinessMembersQuery(businessId, { skip: !businessId || businessId === 'all' });
  const [updateTask] = useUpdateTaskMutation();
  const [createTask, createResult] = useCreateTaskMutation();

  // Optimistic local copy — prevents snap-back during drag
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', assigneeId: '', priority: 'MED', dueAt: '' });

  const members = memberData?.members || [];

  useEffect(() => {
    if (data?.tasks) setLocalTasks(data.tasks);
  }, [data]);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    tasks: localTasks.filter((t) => t.status === col.key),
  }));

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as Task['status'];
    const snapshot = [...localTasks];

    // Immediately update UI
    setLocalTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    // Persist to server
    const ok = await updateTask({
      id: draggableId,
      status: newStatus,
      ...(newStatus === 'DONE' ? { confirmedByOwner: true } : {}),
    }).unwrap().catch(() => null);

    if (!ok) {
      setLocalTasks(snapshot); // rollback
      toast.error('Could not move task — check your connection');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!businessId || businessId === 'all') {
      toast.error('Select a specific business to create tasks');
      return;
    }
    const ok = await createTask({
      businessId,
      title: form.title,
      assigneeId: form.assigneeId || undefined,
      priority: form.priority as 'LOW' | 'MED' | 'HIGH',
      dueAt: form.dueAt || undefined,
    }).unwrap().catch(() => null);
    if (ok) {
      setForm({ title: '', assigneeId: '', priority: 'MED', dueAt: '' });
      setShowAdd(false);
      toast.success('Task created');
    } else {
      toast.error('Failed to create task');
    }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <Columns3 size={18} className="text-brand-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">Task Board</h1>
              <p className="text-sm text-surface-500">Drag cards to move between columns</p>
            </div>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
            Assign Task
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Column summary */}
        <div className="flex items-center gap-5 mb-5 flex-wrap">
          {grouped.map((col) => (
            <div key={col.key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="text-sm text-surface-500">{col.title}</span>
              <span className="text-sm font-bold text-surface-900">{col.tasks.length}</span>
            </div>
          ))}
          <span className="text-xs text-surface-400 ml-auto hidden sm:block">
            💡 Drag cards between columns to update status
          </span>
        </div>

        {/* Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid gap-4 md:grid-cols-3">
            {grouped.map((col) => (
              <div key={col.key} className={`rounded-2xl border-2 ${col.color} flex flex-col overflow-hidden`}>
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <h3 className={`text-xs font-bold uppercase tracking-widest font-display ${col.headerColor}`}>
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-surface-400 bg-white px-2 py-0.5 rounded-full border border-surface-200">
                    {col.tasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ minHeight: 280 }}
                      className={`flex-1 p-2 transition-colors duration-150 ${
                        snapshot.isDraggingOver ? 'bg-brand-50/70' : ''
                      }`}
                    >
                      {col.tasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-surface-200 m-1" style={{ minHeight: 100 }}>
                          <p className="text-xs text-surface-300">{col.emptyMsg}</p>
                        </div>
                      )}

                      {col.tasks.map((task: Task, idx: number) => {
                        const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MED;
                        const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'DONE';
                        return (
                          <Draggable key={task._id} draggableId={task._id} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{ ...provided.draggableProps.style }}
                                className={`mb-2 select-none ${snapshot.isDragging ? 'drop-shadow-2xl' : ''}`}
                              >
                                <div className={`bg-white rounded-xl border border-surface-100 border-l-4 ${pCfg.border} ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-[1.02]' : 'shadow-xs hover:shadow-md'} transition-shadow`}>
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex items-start gap-2 px-3 pt-3 pb-0 cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical size={13} className="text-surface-300 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm font-semibold text-surface-900 leading-snug">
                                      {task.title}
                                    </p>
                                  </div>
                                  <div className="px-3 pb-3 pt-2 pl-8">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs text-surface-400 truncate">
                                        {typeof task.assigneeId === 'object' && (task.assigneeId as any)?.name
                                          ? (task.assigneeId as any).name
                                          : 'Unassigned'}
                                      </span>
                                      <Badge variant={pCfg.variant} size="xs">{task.priority}</Badge>
                                    </div>
                                    {task.dueAt && (
                                      <p className={`text-[10px] mt-1 font-medium ${isOverdue ? 'text-danger-500' : 'text-surface-400'}`}>
                                        {isOverdue ? '⚠ Overdue · ' : 'Due '}
                                        {new Date(task.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Create task modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Assign Task" size="md">
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Design homepage mockup"
            required
          />
          <Select
            label="Assign to"
            value={form.assigneeId}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
            options={[
              { value: '', label: 'Optional — assign later' },
              ...members.map((m) => ({ value: m.userId._id, label: m.userId.name })),
            ]}
          />
          <Select
            label="Priority"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MED', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
            ]}
          />
          <Input
            label="Due date (optional)"
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          />
          {createResult.error && (
            <p className="text-sm text-danger-600">
              {(() => { const m = (createResult.error as any)?.data?.message; return typeof m === 'string' ? m : 'Failed to create task'; })()}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={createResult.isLoading}>
              {createResult.isLoading ? 'Creating…' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
