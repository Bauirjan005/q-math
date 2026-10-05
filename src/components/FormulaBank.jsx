import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Copy, 
  Check, 
  Lightbulb, 
  Compass, 
  TrendingUp, 
  Binary, 
  Shapes, 
  Shuffle, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { BlockMath, InlineMath } from './MathRenderer';
import { FORMULA_CATEGORIES } from '../data/formulaData';

const ICONS_MAP = {
  Compass,
  TrendingUp,
  Binary,
  Shapes,
  Shuffle
};

export default function FormulaBank({ embedded = false }) {
  const [activeTab, setActiveTab] = useState('trig');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const currentCategory = useMemo(() => {
    return FORMULA_CATEGORIES.find(c => c.id === activeTab) || FORMULA_CATEGORIES[0];
  }, [activeTab]);

  const totalFormulasCount = useMemo(() => {
    return FORMULA_CATEGORIES.reduce((acc, cat) => acc + cat.formulas.length, 0);
  }, []);

  const filteredFormulas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;

    return FORMULA_CATEGORIES.flatMap(cat =>
      cat.formulas
        .filter(f => 
          f.name.toLowerCase().includes(q) || 
          f.latex.toLowerCase().includes(q) ||
          f.tag.toLowerCase().includes(q) ||
          (f.note && f.note.toLowerCase().includes(q))
        )
        .map(f => ({ ...f, categoryName: cat.name, categoryId: cat.id }))
    );
  }, [search]);

  const handleCopy = (formula) => {
    navigator.clipboard.writeText(formula.latex);
    setCopiedId(formula.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className={`formula-bank-root ${embedded ? 'embedded-view' : ''}`}>
      {/* Header Info (if embedded) */}
      {embedded && (
        <div className="formula-bank-embedded-header">
          <div className="header-left">
            <div className="icon-badge">
              <BookOpen size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="title">ҰБТ Математика: Ресми Формулалар Банкі</h2>
              <p className="subtitle">
                Мемлекеттік стандартқа сәйкес барлық 5 негізгі бөлім бойынша ресми анықтамалық ({totalFormulasCount} формула)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="formula-search-bar">
        <Search size={18} className="search-icon text-muted" />
        <input
          type="text"
          placeholder="Формула, тақырып немесе LaTeX белгілеуін іздеу (мысалы: қос бұрыш, конус, логарифм, Ньютон)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button 
            className="clear-search-btn" 
            onClick={() => setSearch('')}
            title="Іздеуді тазалау"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Interactive Pill-Style Topic Tabs */}
      {!search && (
        <div className="formula-pill-tabs-wrapper">
          <div className="formula-pill-tabs">
            {FORMULA_CATEGORIES.map(cat => {
              const Icon = ICONS_MAP[cat.iconName] || BookOpen;
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`formula-pill-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  <Icon size={16} className={`tab-icon ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="tab-label">{cat.name}</span>
                  <span className={`tab-count-badge ${isActive ? 'active-badge' : ''}`}>
                    {cat.formulas.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Highlighted Amber Callout Banner */}
      <div className="formula-amber-callout-banner">
        <div className="amber-callout-header">
          <div className="amber-badge-wrap">
            <Lightbulb size={18} className="amber-bulb-icon" />
            <span className="amber-badge-text">💡 ҰБТ кеңесі</span>
          </div>
          <span className="amber-context-tag">
            {search ? 'Жалпы ҰБТ дайындық стратегиясы' : `${currentCategory.name} бөлімі бойынша сарапшы кеңесі`}
          </span>
        </div>
        <p className="amber-callout-text">
          {search 
            ? 'Формулаларды құр жаттаумен шектелмей, әр формуланың геометриялық мағынасын және тест нұсқаларындағы сандық мәндерді қою тәсілдерін меңгеріңіз!' 
            : currentCategory.tip}
        </p>
      </div>

      {/* Formulas Content Grid */}
      <div className="formula-cards-scroll-container">
        {filteredFormulas ? (
          filteredFormulas.length === 0 ? (
            <div className="empty-search-box">
              <Search size={36} className="text-muted mb-2" />
              <h4>«{search}» сұранысы бойынша формула табылмады</h4>
              <p>Іздеу кілт сөзін өзгертіп көріңіз немесе жоғарыдағы тақырыптық вкладкаларды қолданыңыз.</p>
              <button className="btn btn-secondary btn-sm mt-3" onClick={() => setSearch('')}>
                Барлық формулаларды көрсету
              </button>
            </div>
          ) : (
            <div>
              <div className="search-results-info">
                <span>Табылған нәтижелер: <strong>{filteredFormulas.length} формула</strong></span>
              </div>
              <div className="formula-cards-grid">
                {filteredFormulas.map(f => (
                  <FormulaCard 
                    key={f.id} 
                    formula={f} 
                    isCopied={copiedId === f.id} 
                    onCopy={() => handleCopy(f)}
                    showCategoryTag={true}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="formula-cards-grid">
            {currentCategory.formulas.map(f => (
              <FormulaCard 
                key={f.id} 
                formula={f} 
                isCopied={copiedId === f.id} 
                onCopy={() => handleCopy(f)} 
                showCategoryTag={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info / Tip */}
      <div className="formula-bank-footer">
        <div className="footer-left-info">
          <Sparkles size={16} className="text-amber-400" />
          <span>Барлық формулалар ҰБТ және ҚР Оқу-ағарту министрлігінің мемлекеттік стандартына толық сәйкес келтірілген.</span>
        </div>
      </div>
    </div>
  );
}

function FormulaCard({ formula, isCopied, onCopy, showCategoryTag }) {
  return (
    <div className="formula-item-card">
      <div className="formula-item-header">
        <div className="header-badges">
          {showCategoryTag && formula.categoryName && (
            <span className="formula-cat-pill">{formula.categoryName}</span>
          )}
          <span className="formula-tag-pill">{formula.tag}</span>
        </div>
        <button 
          className={`copy-formula-btn ${isCopied ? 'copied' : ''}`}
          onClick={onCopy}
          title="LaTeX кодын көшіру"
        >
          {isCopied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span>Көшірілді</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>LaTeX</span>
            </>
          )}
        </button>
      </div>

      <h3 className="formula-title">{formula.name}</h3>

      {/* Dedicated Subtle Formula Background with Horizontal Scrolling */}
      <div className="formula-math-box overflow-x-auto">
        <BlockMath math={formula.latex} className="formula-math-render" />
      </div>

      {/* Explanatory Note / Hint */}
      {formula.note && (
        <div className="formula-note-row">
          <span className="note-bullet">📌</span>
          <span className="note-text">
            {formula.note.includes('\\') ? (
              <InlineMath math={formula.note} />
            ) : (
              formula.note
            )}
          </span>
        </div>
      )}
    </div>
  );
}
