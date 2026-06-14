import { useState } from 'react';
import { useGetPaymentsQuery, useGeneratePaymentMutation, useUpdatePaymentMutation, useGetBusinessMembersQuery, useGetBusinessesQuery } from '../../api/endpoints';
import { Avatar, Badge, Button, EmptyState, ScoreRing, Select, Spinner, toast } from '../../components/ui';
import { useAppSelector } from '../../store';
import { DollarSign, CheckCircle, Clock, RefreshCw, CreditCard, Users } from 'lucide-react';

interface PaymentRow {
  _id: string;
  userId: { _id: string; name: string; email: string };
  period: string;
  baseSalary: number;
  bonusAmount: number;
  deductionAmount: number;
  totalAmount: number;
  actualHoursWorked: number;
  tasksCompleted: number;
  performanceScore: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID';
  paidAt?: string;
  currency: string;
}

function getPeriodOptions() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return { value, label };
  });
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
  PAID: 'success',
  APPROVED: 'info',
  PENDING: 'warning',
  DRAFT: 'gray',
};

export default function Payments() {
  const businessId = useAppSelector((s) => s.ui.businessId);
  const isAllView = !businessId || businessId === 'all';

  const { data: bizData } = useGetBusinessesQuery();
  const ownedBusinesses = (bizData?.businesses || []).filter((b) => b.role === 'OWNER');

  const [selectedBizId, setSelectedBizId] = useState('');
  const effectiveBizId = isAllView ? selectedBizId : (businessId || '');

  const periodOptions = getPeriodOptions();
  const [period, setPeriod] = useState(periodOptions[0].value);

  const { data: payData, isLoading: payLoading } = useGetPaymentsQuery(
    { businessId: effectiveBizId, period },
    { skip: !effectiveBizId }
  );
  const { data: memberData, isLoading: membersLoading } = useGetBusinessMembersQuery(
    effectiveBizId,
    { skip: !effectiveBizId }
  );

  const [generatePayment, genResult] = useGeneratePaymentMutation();
  const [updatePayment] = useUpdatePaymentMutation();

  const payments = (payData?.payments || []) as PaymentRow[];
  const members = memberData?.members || [];
  const paymentByUser = new Map(payments.map((p) => [p.userId._id, p]));

  const totalPayroll = payments.reduce((s, p) => s + p.totalAmount, 0);
  const paidTotal = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.totalAmount, 0);
  const paidCount = payments.filter((p) => p.status === 'PAID').length;
  const pendingCount = payments.filter((p) => p.status !== 'PAID').length;

  const handleGenerate = async (userId: string) => {
    if (!effectiveBizId) return;
    await generatePayment({ businessId: effectiveBizId, userId, period })
      .unwrap()
      .then(() => toast.success('Payment generated'))
      .catch(() => toast.error('Failed to generate payment'));
  };

  const handleGenerateAll = async () => {
    if (!effectiveBizId) return;
    const missing = members.filter((m) => !paymentByUser.has(m.userId._id));
    if (missing.length === 0) {
      toast.success('All members already have payments for this period');
      return;
    }
    let ok = 0;
    for (const m of missing) {
      const result = await generatePayment({ businessId: effectiveBizId, userId: m.userId._id, period }).unwrap().catch(() => null);
      if (result) ok++;
    }
    toast.success(`Generated ${ok} payment${ok !== 1 ? 's' : ''}`);
  };

  const handleApprove = async (pay: PaymentRow) => {
    await updatePayment({ id: pay._id, businessId: effectiveBizId, status: 'APPROVED' })
      .unwrap()
      .then(() => toast.success('Payment approved'))
      .catch(() => toast.error('Failed to approve'));
  };

  const handleMarkPaid = async (pay: PaymentRow) => {
    await updatePayment({ id: pay._id, businessId: effectiveBizId, status: 'PAID' })
      .unwrap()
      .then(() => toast.success('Marked as paid'))
      .catch(() => toast.error('Failed to update'));
  };

  const loading = payLoading || membersLoading;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-success-50 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-success-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">Payments</h1>
              <p className="text-sm text-surface-500">Payroll management & salary processing</p>
            </div>
          </div>
          {effectiveBizId && (
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={handleGenerateAll}
              disabled={genResult.isLoading}
            >
              {genResult.isLoading ? 'Generating…' : 'Generate All'}
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {isAllView && (
            <Select
              value={selectedBizId}
              onChange={(e) => setSelectedBizId(e.target.value)}
              options={[
                { value: '', label: 'Select a business…' },
                ...ownedBusinesses.map((b) => ({ value: b.business._id, label: b.business.name })),
              ]}
            />
          )}
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={periodOptions}
          />
        </div>

        {!effectiveBizId ? (
          <EmptyState
            icon={<DollarSign size={28} />}
            title="Select a business"
            description="Choose a business above to view and manage payroll."
          />
        ) : loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                    <DollarSign size={16} className="text-brand-600" />
                  </div>
                  <span className="text-xs font-medium text-surface-500">Total Payroll</span>
                </div>
                <p className="text-2xl font-display font-bold text-surface-900">
                  ₹{totalPayroll.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-surface-400 mt-1">{payments.length} records</p>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-success-50 rounded-lg flex items-center justify-center">
                    <CheckCircle size={16} className="text-success-600" />
                  </div>
                  <span className="text-xs font-medium text-surface-500">Paid Out</span>
                </div>
                <p className="text-2xl font-display font-bold text-success-600">
                  ₹{paidTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-surface-400 mt-1">{paidCount} employees</p>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-warning-50 rounded-lg flex items-center justify-center">
                    <Clock size={16} className="text-warning-600" />
                  </div>
                  <span className="text-xs font-medium text-surface-500">Pending</span>
                </div>
                <p className="text-2xl font-display font-bold text-warning-600">{pendingCount}</p>
                <p className="text-xs text-surface-400 mt-1">awaiting payment</p>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-info-50 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-info-600" />
                  </div>
                  <span className="text-xs font-medium text-surface-500">Team Size</span>
                </div>
                <p className="text-2xl font-display font-bold text-surface-900">{members.length}</p>
                <p className="text-xs text-surface-400 mt-1">members</p>
              </div>
            </div>

            {/* Table */}
            {members.length === 0 ? (
              <EmptyState
                icon={<Users size={28} />}
                title="No team members"
                description="Add members to this business to manage payroll."
              />
            ) : (
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-100 bg-surface-50">
                        {['Employee', 'Hours', 'Tasks', 'Score', 'Base Salary', 'Bonus', 'Deductions', 'Total', 'Status', 'Action'].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => {
                        const pay = paymentByUser.get(member.userId._id);
                        return (
                          <tr key={member._id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={member.userId.name} size="sm" />
                                <div>
                                  <p className="text-sm font-semibold text-surface-900">{member.userId.name}</p>
                                  <p className="text-xs text-surface-400">{member.userId.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-surface-700">
                              {pay ? `${pay.actualHoursWorked}h` : <span className="text-surface-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-surface-700">
                              {pay ? pay.tasksCompleted : <span className="text-surface-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {pay
                                ? <ScoreRing score={pay.performanceScore} size={32} strokeWidth={3} showValue={false} />
                                : <span className="text-sm text-surface-300">—</span>
                              }
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-surface-800">
                              {pay ? `₹${pay.baseSalary.toLocaleString('en-IN')}` : <span className="text-surface-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-success-600">
                              {pay && pay.bonusAmount > 0
                                ? `+₹${pay.bonusAmount.toLocaleString('en-IN')}`
                                : <span className="text-surface-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-danger-500">
                              {pay && pay.deductionAmount > 0
                                ? `−₹${pay.deductionAmount.toLocaleString('en-IN')}`
                                : <span className="text-surface-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-surface-900">
                              {pay ? `₹${pay.totalAmount.toLocaleString('en-IN')}` : <span className="text-surface-300">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {pay
                                ? <Badge variant={STATUS_VARIANT[pay.status] || 'gray'} size="xs">{pay.status}</Badge>
                                : <Badge variant="gray" size="xs">Not generated</Badge>
                              }
                            </td>
                            <td className="px-4 py-3">
                              {!pay ? (
                                <Button variant="secondary" size="xs" icon={<RefreshCw size={11} />} onClick={() => handleGenerate(member.userId._id)}>
                                  Generate
                                </Button>
                              ) : pay.status === 'DRAFT' || pay.status === 'PENDING' ? (
                                <Button variant="primary" size="xs" onClick={() => handleApprove(pay)}>
                                  Approve
                                </Button>
                              ) : pay.status === 'APPROVED' ? (
                                <Button variant="success" size="xs" icon={<CreditCard size={11} />} onClick={() => handleMarkPaid(pay)}>
                                  Mark Paid
                                </Button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-success-600 font-semibold">
                                  <CheckCircle size={12} /> Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
