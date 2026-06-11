import { useState } from 'react';
import { BookOpen, Plus, RotateCcw, Check, X, ChevronLeft, ChevronRight, Brain } from 'lucide-react';
import { Button, Badge, Input, Select, Textarea, Modal, SearchInput, EmptyState, Chip, toast } from '../../components/ui';

interface Flashcard {
  _id: string;
  title: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  reviewCount: number;
  correctCount: number;
}

const INITIAL_CARDS: Flashcard[] = [
  { _id: '1', title: 'Sales Pitch Template', question: 'What are the 5 key elements of a perfect sales pitch?', answer: '1. Hook/Opening\n2. Problem identification\n3. Solution presentation\n4. Social proof (testimonials)\n5. Clear call-to-action', category: 'Sales', difficulty: 'MEDIUM', reviewCount: 12, correctCount: 9 },
  { _id: '2', title: 'Follow-up Timing', question: 'When should you follow up after an initial meeting?', answer: 'Within 24 hours for hot leads, 48-72 hours for warm leads, and 1 week for cold leads. Always reference something specific from your last conversation.', category: 'Sales', difficulty: 'EASY', reviewCount: 8, correctCount: 7 },
  { _id: '3', title: 'React useEffect', question: 'What is the dependency array in useEffect and why does it matter?', answer: 'The dependency array tells React when to re-run the effect. Empty [] = run once, [var] = run when var changes, no array = run every render. Missing deps cause stale closures.', category: 'Technical', difficulty: 'HARD', reviewCount: 20, correctCount: 14 },
  { _id: '4', title: 'MongoDB Indexing', question: 'What types of indexes does MongoDB support?', answer: 'Single field, Compound, Multikey (arrays), Text, Wildcard, 2dsphere (geo), Hashed, TTL (auto-expire). Always index fields used in queries and sorts.', category: 'Technical', difficulty: 'MEDIUM', reviewCount: 5, correctCount: 3 },
];

const CATEGORIES = ['All', 'Sales', 'Technical', 'HR', 'Finance', 'General'];

function FlashcardItem({ card, onFlip, flipped, studied }: { card: Flashcard; onFlip: () => void; flipped: boolean; studied: boolean }) {
  const accuracy = card.reviewCount > 0 ? Math.round((card.correctCount / card.reviewCount) * 100) : 0;
  const diffColor = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }[card.difficulty] as 'success' | 'warning' | 'danger';

  return (
    <div className={`flashcard w-full h-full ${flipped ? 'flipped' : ''}`} onClick={onFlip} style={{ minHeight: 280 }}>
      <div className="flashcard-inner" style={{ minHeight: 280 }}>
        {/* Front */}
        <div className="flashcard-front" style={{ minHeight: 280 }}>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Badge variant={diffColor} size="xs">{card.difficulty}</Badge>
            <span className="text-xs text-surface-400">{accuracy}% accuracy</span>
          </div>
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Chip label={card.category} color="brand" size="sm" />
            {studied && <span className="text-xs text-success-600 font-bold">✓ Reviewed</span>}
          </div>
          <div className="pt-8 w-full">
            <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">QUESTION</p>
            <p className="text-lg font-semibold text-surface-900 leading-relaxed text-center">{card.question}</p>
            <p className="text-xs text-surface-400 mt-6 flex items-center gap-1 justify-center">
              <RotateCcw size={12} /> Click to reveal answer
            </p>
          </div>
        </div>
        {/* Back */}
        <div className="flashcard-back" style={{ minHeight: 280 }}>
          <div className="absolute top-3 left-3">
            <span className="text-xs text-white/60 font-medium">ANSWER</span>
          </div>
          <div className="w-full pt-4">
            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line text-center">{card.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const BLANK_FORM = { title: '', question: '', answer: '', category: 'Sales', difficulty: 'MEDIUM' as Flashcard['difficulty'] };

export default function Flashcards() {
  const [cards, setCards] = useState<Flashcard[]>(INITIAL_CARDS);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'browse' | 'study'>('browse');
  const [flipped, setFlipped] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [studiedIds, setStudiedIds] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  const filtered = cards.filter(c =>
    (category === 'All' || c.category === category) &&
    (c.title.toLowerCase().includes(search.toLowerCase()) || c.question.toLowerCase().includes(search.toLowerCase()))
  );

  const current = filtered[currentIdx];
  const studiedCount = Object.keys(studiedIds).length;
  const correct = Object.values(studiedIds).filter(v => v === 'correct').length;
  const done = filtered.length > 0 && studiedCount >= filtered.length;

  const next = () => { setFlipped(false); setCurrentIdx(i => Math.min(i + 1, filtered.length - 1)); };
  const prev = () => { setFlipped(false); setCurrentIdx(i => Math.max(i - 1, 0)); };

  const mark = (res: 'correct' | 'wrong') => {
    if (!current) return;
    setStudiedIds(r => ({ ...r, [current._id]: res }));
    if (currentIdx < filtered.length - 1) {
      setFlipped(false);
      setCurrentIdx(i => i + 1);
    } else {
      setFlipped(false);
    }
  };

  const resetStudy = () => { setCurrentIdx(0); setFlipped(false); setStudiedIds({}); };

  const enterStudy = (startIdx = 0) => {
    setMode('study');
    setCurrentIdx(startIdx);
    setFlipped(false);
    setStudiedIds({});
  };

  const submitCreate = () => {
    if (!form.title.trim() || !form.question.trim() || !form.answer.trim()) {
      toast.error('Title, question, and answer are required');
      return;
    }
    const newCard: Flashcard = {
      _id: `local-${Date.now()}`,
      title: form.title.trim(),
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category,
      difficulty: form.difficulty,
      reviewCount: 0,
      correctCount: 0,
    };
    setCards(prev => [...prev, newCard]);
    setForm(BLANK_FORM);
    setShowCreate(false);
    toast.success(`"${newCard.title}" flashcard created`);
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-surface-900">Flashcards</h1>
              <p className="text-sm text-surface-500">Learn & review with spaced repetition</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Brain size={14} />}
              onClick={() => mode === 'browse' ? enterStudy() : setMode('browse')}
            >
              {mode === 'browse' ? 'Study Mode' : 'Browse Mode'}
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>New Card</Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {mode === 'browse' ? (
          <div className="space-y-5">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <SearchInput value={search} onChange={setSearch} placeholder="Search flashcards..." className="max-w-xs" />
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${cat === category ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-display font-bold text-brand-600">{filtered.length}</p>
                <p className="text-xs text-surface-400 mt-0.5">Total Cards</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-display font-bold text-success-600">{CATEGORIES.length - 1}</p>
                <p className="text-xs text-surface-400 mt-0.5">Categories</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-display font-bold text-warning-600">
                  {cards.length === 0 ? 0 : Math.round(cards.reduce((s, c) => s + (c.reviewCount > 0 ? c.correctCount / c.reviewCount : 0), 0) / cards.length * 100)}%
                </p>
                <p className="text-xs text-surface-400 mt-0.5">Avg Accuracy</p>
              </div>
            </div>

            {/* Cards grid */}
            {filtered.length === 0 ? (
              <EmptyState icon={<BookOpen size={28} />} title="No flashcards found" description="Create your first flashcard to start learning" action={<Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>Create Flashcard</Button>} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((card, idx) => {
                  const acc = card.reviewCount > 0 ? Math.round(card.correctCount / card.reviewCount * 100) : 0;
                  return (
                    <div key={card._id} className="card p-5 card-interactive">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Chip label={card.category} color="brand" size="sm" />
                          <Badge variant={{ EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }[card.difficulty] as 'success' | 'warning' | 'danger'}>{card.difficulty}</Badge>
                        </div>
                        <span className="text-xs text-surface-400">{acc}% correct</span>
                      </div>
                      <p className="font-semibold text-surface-900 text-sm mb-2 line-clamp-2">{card.question}</p>
                      <p className="text-xs text-surface-500 line-clamp-2">{card.answer}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-surface-400">
                        <span>{card.reviewCount} reviews</span>
                        <button onClick={() => enterStudy(idx)} className="text-brand-600 font-semibold hover:text-brand-700">Study →</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // Study mode
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
            {done ? (
              <div className="card p-10 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-display font-bold text-surface-900 mb-2">Session Complete!</h3>
                <p className="text-surface-500 mb-6">
                  You got <span className="font-bold text-success-600">{correct}</span> / {studiedCount} correct
                  {studiedCount > 0 && ` (${Math.round(correct / studiedCount * 100)}%)`}
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="secondary" onClick={() => setMode('browse')}>Back to Browse</Button>
                  <Button variant="primary" onClick={resetStudy}>Study Again</Button>
                </div>
              </div>
            ) : (
              <>
                {/* Progress */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500 font-medium">
                    {currentIdx + 1} / {filtered.length}
                    {studiedCount > 0 && <span className="ml-2 text-surface-400">({studiedCount} reviewed)</span>}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-success-600 font-bold">✓ {correct}</span>
                    <span className="text-xs text-danger-500 font-bold">✗ {studiedCount - correct}</span>
                  </div>
                </div>
                <div className="w-full bg-surface-200 h-1.5 rounded-full">
                  <div className="bg-brand-500 h-full rounded-full transition-all" style={{ width: `${(studiedCount / filtered.length) * 100}%` }} />
                </div>

                {current && (
                  <>
                    <FlashcardItem
                      card={current}
                      flipped={flipped}
                      onFlip={() => setFlipped(!flipped)}
                      studied={!!studiedIds[current._id]}
                    />

                    <div className="flex items-center justify-between gap-3">
                      <Button variant="secondary" size="sm" icon={<ChevronLeft size={14} />} onClick={prev} disabled={currentIdx === 0}>Prev</Button>

                      {flipped && (
                        <div className="flex gap-3 flex-1 justify-center">
                          <Button variant="danger" size="md" icon={<X size={16} />} onClick={() => mark('wrong')}>Wrong</Button>
                          <Button variant="success" size="md" icon={<Check size={16} />} onClick={() => mark('correct')}>Correct</Button>
                        </div>
                      )}

                      <Button variant="secondary" size="sm" iconRight={<ChevronRight size={14} />} onClick={next} disabled={currentIdx === filtered.length - 1}>Next</Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(BLANK_FORM); }} title="Create Flashcard" size="md">
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Sales Pitch Template"
            required
          />
          <Textarea
            label="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="What do you want to remember?"
            rows={3}
          />
          <Textarea
            label="Answer"
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            placeholder="The answer..."
            rows={4}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={CATEGORIES.filter(c => c !== 'All').map(c => ({ value: c, label: c }))}
            />
            <Select
              label="Difficulty"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value as Flashcard['difficulty'] })}
              options={[
                { value: 'EASY', label: 'Easy' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HARD', label: 'Hard' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowCreate(false); setForm(BLANK_FORM); }}>Cancel</Button>
            <Button variant="primary" onClick={submitCreate}>Create Card</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
