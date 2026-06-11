import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Gift, Building2, Globe } from 'lucide-react';
import { Button, Badge, Modal, Input, Select, toast } from '../../components/ui';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface CalEvent {
  date: string;
  name: string;
  type: 'PUBLIC' | 'COMPANY' | 'BIRTHDAY' | 'VACATION';
  color: string;
  emoji?: string;
}

const SEED_EVENTS: CalEvent[] = [
  { date: '2026-06-15', name: "Priya's Birthday", type: 'BIRTHDAY', color: '#F97316', emoji: '🎂' },
  { date: '2026-06-18', name: 'Company Outing', type: 'COMPANY', color: '#6366F1', emoji: '🎉' },
  { date: '2026-06-22', name: 'Sana on Vacation', type: 'VACATION', color: '#F59E0B', emoji: '🏖️' },
  { date: '2026-06-26', name: 'Independence Day', type: 'PUBLIC', color: '#10B981', emoji: '🇮🇳' },
  { date: '2026-07-04', name: 'Team Hackathon', type: 'COMPANY', color: '#6366F1', emoji: '💻' },
  { date: '2026-07-15', name: "Rahul's Birthday", type: 'BIRTHDAY', color: '#F97316', emoji: '🎂' },
  { date: '2026-08-15', name: 'Independence Day', type: 'PUBLIC', color: '#10B981', emoji: '🇮🇳' },
];

const INDIAN_HOLIDAYS_2026: CalEvent[] = [
  { date: '2026-01-26', name: 'Republic Day', type: 'PUBLIC', color: '#10B981', emoji: '🇮🇳' },
  { date: '2026-03-25', name: 'Holi', type: 'PUBLIC', color: '#10B981', emoji: '🎨' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'PUBLIC', color: '#10B981', emoji: '📅' },
  { date: '2026-08-15', name: 'Independence Day', type: 'PUBLIC', color: '#10B981', emoji: '🇮🇳' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'PUBLIC', color: '#10B981', emoji: '🕊️' },
  { date: '2026-10-20', name: 'Dussehra', type: 'PUBLIC', color: '#10B981', emoji: '🪔' },
  { date: '2026-11-08', name: 'Diwali', type: 'PUBLIC', color: '#10B981', emoji: '🪔' },
  { date: '2026-12-25', name: 'Christmas', type: 'PUBLIC', color: '#10B981', emoji: '🎄' },
];

const TYPE_CONFIG = {
  PUBLIC: { icon: <Globe size={13} />, label: 'Public Holiday', color: '#10B981', badge: 'success' as const },
  COMPANY: { icon: <Building2 size={13} />, label: 'Company Event', color: '#6366F1', badge: 'brand' as const },
  BIRTHDAY: { icon: <Gift size={13} />, label: 'Birthday', color: '#F97316', badge: 'orange' as const },
  VACATION: { icon: <span className="text-xs">🏖️</span>, label: 'Vacation', color: '#F59E0B', badge: 'warning' as const },
};

const TYPE_EMOJI: Record<CalEvent['type'], string> = {
  PUBLIC: '🌍', COMPANY: '🏢', BIRTHDAY: '🎂', VACATION: '🏖️',
};

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function CalendarPage() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalEvent[]>(SEED_EVENTS);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', date: todayStr, type: 'COMPANY' as CalEvent['type'], description: '' });

  const days = getCalendarDays(year, month);

  const goBack = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1); };
  const goNext = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1); };

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date === dateStr);
  };

  const upcomingEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  const openAdd = (date?: string) => {
    setForm({ name: '', date: date || todayStr, type: 'COMPANY', description: '' });
    setShowAdd(true);
  };

  const submitAdd = () => {
    if (!form.name.trim()) { toast.error('Event name is required'); return; }
    const cfg = TYPE_CONFIG[form.type];
    const newEvent: CalEvent = {
      date: form.date,
      name: form.name.trim(),
      type: form.type,
      color: cfg.color,
      emoji: TYPE_EMOJI[form.type],
    };
    setEvents((prev) => [...prev, newEvent]);
    setShowAdd(false);
    toast.success(`"${newEvent.name}" added to calendar`);
  };

  const addIndianHolidays = () => {
    const existing = new Set(events.map((e) => `${e.date}:${e.name}`));
    const fresh = INDIAN_HOLIDAYS_2026.filter((h) => !existing.has(`${h.date}:${h.name}`));
    if (!fresh.length) { toast.info('Indian holidays already added'); return; }
    setEvents((prev) => [...prev, ...fresh]);
    toast.success(`Added ${fresh.length} Indian holidays for 2026`);
  };

  return (
    <div className="animate-fade-up">
      {/* Page Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-success-50 rounded-xl flex items-center justify-center">
              <Calendar size={18} className="text-success-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">Calendar</h1>
              <p className="text-sm text-surface-500">Holidays, birthdays & team events</p>
            </div>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openAdd()}>
            Add Event
          </Button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-display font-bold text-surface-900">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={goBack} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 text-surface-500 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
                className="px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              >
                Today
              </button>
              <button onClick={goNext} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 text-surface-500 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-surface-400 uppercase tracking-wider py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="h-24" />;

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate === dateStr;
              const isWeekend = [0, 6].includes(new Date(year, month, day).getDay());

              return (
                <div
                  key={day}
                  onClick={() => { setSelectedDate(dateStr); }}
                  onDoubleClick={() => openAdd(dateStr)}
                  className={`h-24 p-1.5 rounded-xl cursor-pointer transition-all border ${
                    isToday ? 'bg-brand-50 border-brand-200'
                    : isSelected ? 'bg-surface-100 border-surface-300'
                    : 'border-transparent hover:bg-surface-50 hover:border-surface-200'
                  } ${isWeekend ? 'opacity-60' : ''}`}
                  title={isWeekend ? '' : 'Double-click to add event'}
                >
                  <div className="mb-1">
                    {isToday ? (
                      <span className="inline-flex w-6 h-6 rounded-full bg-brand-500 text-white items-center justify-center text-xs font-bold">{day}</span>
                    ) : (
                      <span className={`text-sm font-semibold ${isSelected ? 'text-surface-900' : 'text-surface-600'}`}>{day}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev, j) => (
                      <div key={j} className="flex items-center gap-0.5 px-1 py-0.5 rounded-md truncate" style={{ background: ev.color + '18' }}>
                        <span className="text-[9px] leading-none">{ev.emoji}</span>
                        <span className="text-[9px] font-semibold truncate leading-none" style={{ color: ev.color }}>{ev.name}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-surface-400 font-medium pl-1">+{dayEvents.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-surface-400 text-center">Double-click a day to quickly add an event</p>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Event Type Legend */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-card p-4">
            <h3 className="text-sm font-bold text-surface-800 mb-3">Event Types</h3>
            <div className="space-y-2.5">
              {(Object.entries(TYPE_CONFIG) as [keyof typeof TYPE_CONFIG, (typeof TYPE_CONFIG)[keyof typeof TYPE_CONFIG]][]).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  <span className="text-xs text-surface-600">{cfg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-100 bg-surface-50">
              <h3 className="text-sm font-bold text-surface-800">Upcoming Events</h3>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar size={28} className="text-surface-300 mx-auto mb-2" />
                <p className="text-sm text-surface-400">No upcoming events</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-50">
                {upcomingEvents.map((ev, i) => {
                  const cfg = TYPE_CONFIG[ev.type];
                  const date = new Date(ev.date + 'T00:00:00');
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: ev.color + '18' }}>
                        {ev.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-surface-800 truncate">{ev.name}</p>
                        <p className="text-xs text-surface-400">
                          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <Badge variant={cfg.badge} size="xs">{ev.type}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={addIndianHolidays}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 hover:border-surface-300 transition-all shadow-xs"
          >
            🇮🇳 Add Indian Holidays 2026
          </button>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Event" size="md">
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Team Outing, Diwali..."
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Select
            label="Event Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CalEvent['type'] })}
            options={[
              { value: 'PUBLIC', label: '🌍 Public Holiday' },
              { value: 'COMPANY', label: '🏢 Company Event' },
              { value: 'BIRTHDAY', label: '🎂 Birthday' },
              { value: 'VACATION', label: '🏖️ Vacation' },
            ]}
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add details..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitAdd}>Add Event</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
