import { useState } from 'react';
import { useCreateTaskMutation } from '../api/endpoints';
import { useCreateProjectMutation } from '../api/project-endpoints';
import { useGetBusinessesQuery } from '../api/endpoints';
import { useAppSelector } from '../store';
import { Modal, Input, Button, toast } from './ui';
import { Plus, CheckSquare, FolderOpen } from 'lucide-react';

export default function QuickAddButton() {
  const globalBizId = useAppSelector((s) => s.ui.businessId);
  const { data: bizData } = useGetBusinessesQuery();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'task' | 'project' | null>(null);
  const [createTask, taskResult] = useCreateTaskMutation();
  const [createProject, projectResult] = useCreateProjectMutation();

  const myBusinesses = bizData?.businesses || [];
  const singleBizId = globalBizId !== 'all' ? globalBizId : myBusinesses.length === 1 ? myBusinesses[0].business._id : '';

  const [taskForm, setTaskForm] = useState({ title: '', bizId: '' });
  const [projectForm, setProjectForm] = useState({ name: '', estimatedHours: '', hourlyRate: '', bizId: '' });

  const effectiveTaskBiz = singleBizId || taskForm.bizId;
  const effectiveProjectBiz = singleBizId || projectForm.bizId;

  const handleClose = () => { setOpen(false); setMode(null); };

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !effectiveTaskBiz) return;
    const ok = await createTask({ businessId: effectiveTaskBiz, title: taskForm.title, priority: 'MED' }).unwrap().catch(() => null);
    if (ok) {
      setTaskForm({ title: '', bizId: '' });
      handleClose();
      toast.success('Task created');
    } else {
      toast.error('Failed to create task');
    }
  };

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim() || !projectForm.estimatedHours || !projectForm.hourlyRate || !effectiveProjectBiz) return;
    const ok = await createProject({
      businessId: effectiveProjectBiz,
      name: projectForm.name,
      estimatedHours: parseFloat(projectForm.estimatedHours),
      hourlyRate: parseFloat(projectForm.hourlyRate),
    }).unwrap().catch(() => null);
    if (ok) {
      setProjectForm({ name: '', estimatedHours: '', hourlyRate: '', bizId: '' });
      handleClose();
      toast.success('Project created');
    } else {
      toast.error('Failed to create project');
    }
  };

  const BizSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    if (singleBizId) return null;
    return (
      <div className="space-y-1.5">
        <label className="form-label">Business</label>
        <select className="form-input" value={value} onChange={(e) => onChange(e.target.value)} required>
          <option value="">Select business…</option>
          {myBusinesses.map((b) => (
            <option key={b.business._id} value={b.business._id}>{b.business.name}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg hover:bg-brand-600 hover:shadow-xl transition-all hover:scale-110"
        title="Quick add"
      >
        <Plus size={24} />
      </button>

      <Modal open={open && !mode} onClose={handleClose} title="Quick Add" size="sm">
        <div className="space-y-2">
          <button
            onClick={() => setMode('task')}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-brand-100 hover:bg-brand-50 text-left transition-colors"
          >
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
              <CheckSquare size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-surface-900">Quick Task</p>
              <p className="text-xs text-surface-400">Create and assign in seconds</p>
            </div>
          </button>
          <button
            onClick={() => setMode('project')}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-purple-100 hover:bg-purple-50 text-left transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FolderOpen size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-surface-900">New Project</p>
              <p className="text-xs text-surface-400">Set estimate & billing rate</p>
            </div>
          </button>
        </div>
      </Modal>

      <Modal open={open && mode === 'task'} onClose={() => setMode(null)} title="Quick Task" size="sm">
        <form onSubmit={submitTask} className="space-y-4">
          <BizSelect value={taskForm.bizId} onChange={(v) => setTaskForm({ ...taskForm, bizId: v })} />
          <Input
            label="Task title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            placeholder="e.g. Design homepage"
            required
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setMode(null)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={taskResult.isLoading || !effectiveTaskBiz}>
              {taskResult.isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={open && mode === 'project'} onClose={() => setMode(null)} title="New Project" size="sm">
        <form onSubmit={submitProject} className="space-y-4">
          <BizSelect value={projectForm.bizId} onChange={(v) => setProjectForm({ ...projectForm, bizId: v })} />
          <Input
            label="Project name"
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            placeholder="e.g. Website Redesign"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Est. hours"
              type="number"
              min={1}
              value={projectForm.estimatedHours}
              onChange={(e) => setProjectForm({ ...projectForm, estimatedHours: e.target.value })}
              placeholder="e.g. 160"
              required
            />
            <Input
              label="Rate (₹/h)"
              type="number"
              min={1}
              value={projectForm.hourlyRate}
              onChange={(e) => setProjectForm({ ...projectForm, hourlyRate: e.target.value })}
              placeholder="e.g. 1000"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setMode(null)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={projectResult.isLoading || !effectiveProjectBiz}>
              {projectResult.isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
