import { useState } from 'react';
import { useGetProjectsQuery, useCreateProjectMutation } from '../../api/project-endpoints';
import { useGetBusinessesQuery } from '../../api/endpoints';
import { Badge, Button, Card, EmptyState, Input, Modal, Select, Spinner, Textarea, toast } from '../../components/ui';
import { useAppSelector } from '../../store';
import { FolderOpen, Plus, TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  active: 'success',
  completed: 'info',
  'on-hold': 'warning',
  planning: 'gray',
};

export default function Projects() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const { data, isLoading } = useGetProjectsQuery(businessId || 'all');
  const [createProject, createResult] = useCreateProjectMutation();
  const { data: bizData } = useGetBusinessesQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    estimatedHours: '',
    hourlyRate: '',
    costRate: '',
    selectedBusinessId: '',
  });

  const isAllView = !businessId || businessId === 'all';
  const businesses = bizData?.businesses || [];
  const effectiveBusinessId = isAllView ? form.selectedBusinessId : businessId;

  const projects = data?.projects || [];
  const totalProfit = projects.reduce((s, p) => s + p.profit, 0);
  const totalRevenue = projects.reduce((s, p) => s + p.revenue, 0);
  const avgMargin = projects.length > 0 ? (projects.reduce((s, p) => s + parseFloat(p.profitMargin), 0) / projects.length).toFixed(1) : '0';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveBusinessId) {
      toast.error('Select a business to create this project under');
      return;
    }
    if (!form.name.trim() || !form.estimatedHours || !form.hourlyRate) return;
    const ok = await createProject({
      businessId: effectiveBusinessId,
      name: form.name,
      description: form.description || undefined,
      estimatedHours: parseFloat(form.estimatedHours),
      hourlyRate: parseFloat(form.hourlyRate),
      costRate: form.costRate ? parseFloat(form.costRate) : undefined,
    }).unwrap().catch(() => null);
    if (ok) {
      setForm({ name: '', description: '', estimatedHours: '', hourlyRate: '', costRate: '', selectedBusinessId: '' });
      setShowAdd(false);
      toast.success('Project created');
    } else {
      toast.error('Failed to create project');
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <FolderOpen size={18} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">Projects</h1>
              <p className="text-sm text-surface-500">Profitability & time tracking</p>
            </div>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
            New Project
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-success-600" />
                </div>
                <span className="text-xs font-medium text-surface-500">Total Revenue</span>
              </div>
              <p className="text-2xl font-display font-bold text-surface-900">
                ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalProfit >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
                  {totalProfit >= 0
                    ? <TrendingUp size={16} className="text-success-600" />
                    : <TrendingDown size={16} className="text-danger-600" />}
                </div>
                <span className="text-xs font-medium text-surface-500">Total Profit</span>
              </div>
              <p className={`text-2xl font-display font-bold ${totalProfit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                ₹{totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-brand-600" />
                </div>
                <span className="text-xs font-medium text-surface-500">Avg Margin</span>
              </div>
              <p className="text-2xl font-display font-bold text-surface-900">{avgMargin}%</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-info-50 rounded-lg flex items-center justify-center">
                  <FolderOpen size={16} className="text-info-600" />
                </div>
                <span className="text-xs font-medium text-surface-500">Projects</span>
              </div>
              <p className="text-2xl font-display font-bold text-surface-900">{projects.length}</p>
            </div>
          </div>
        )}

        {/* Projects list */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={28} />}
            title="No projects yet"
            description="Create a project to start tracking time and profitability."
            action={<Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>New Project</Button>}
          />
        ) : (
          <div className="space-y-4">
            {projects.map((p) => (
              <Card key={p._id} interactive padding="lg" accent={p.profit < 0 ? 'danger' : 'success'}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-surface-900">{p.name}</h3>
                      <Badge variant={STATUS_VARIANT[p.status] || 'gray'} size="xs">
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-surface-500">
                      <span className="flex items-center gap-1"><Clock size={11} /> {p.estimatedHours}h estimated</span>
                      <span className="flex items-center gap-1"><Clock size={11} /> {p.actualHours.toFixed(1)}h actual</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-display text-2xl font-bold ${p.profit < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                      ₹{p.profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-surface-400">Profit</p>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-5">
                  {[
                    { label: 'Revenue', value: `₹${p.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-success-600' },
                    { label: 'Cost', value: `₹${p.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-surface-700' },
                    { label: 'Margin', value: `${p.profitMargin}%`, color: parseFloat(p.profitMargin) >= 20 ? 'text-success-600' : 'text-warning-600' },
                    { label: 'Variance', value: `${p.variancePercent}%`, color: p.variance > 0 ? 'text-danger-600' : 'text-success-600' },
                    { label: 'Efficiency', value: `${p.efficiency}%`, color: parseFloat(p.efficiency) >= 80 ? 'text-success-600' : 'text-warning-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-surface-50 rounded-xl p-3 text-center">
                      <p className={`text-sm font-bold ${color}`}>{value}</p>
                      <p className="text-[10px] uppercase font-semibold text-surface-400 tracking-wider mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New project modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Project" size="md">
        <form onSubmit={submit} className="space-y-4">
          {isAllView && (
            <Select
              label="Business"
              value={form.selectedBusinessId}
              onChange={(e) => setForm({ ...form, selectedBusinessId: e.target.value })}
              options={[
                { value: '', label: 'Select a business…' },
                ...businesses.map((b) => ({ value: b.business._id, label: b.business.name })),
              ]}
              required
            />
          )}
          <Input
            label="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Website redesign for Acme Corp"
            required
          />
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Project details..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimated hours"
              type="number"
              value={form.estimatedHours}
              onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
              placeholder="e.g. 160"
              required
            />
            <Input
              label="Billable rate (₹/h)"
              type="number"
              value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
              placeholder="e.g. 1000"
              required
            />
          </div>
          <Input
            label="Cost rate ₹/h (optional)"
            type="number"
            value={form.costRate}
            onChange={(e) => setForm({ ...form, costRate: e.target.value })}
            placeholder="Defaults to billable rate"
          />
          {createResult.error && (
            <p className="text-sm text-danger-600">
              {(() => { const m = (createResult.error as any)?.data?.message; return typeof m === 'string' ? m : 'Failed to create project'; })()}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={createResult.isLoading}>
              {createResult.isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
