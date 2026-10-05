import React from 'react';
import { X, BookOpen } from 'lucide-react';
import FormulaBank from './FormulaBank';

export default function FormulaSheetModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card formula-modal-enhanced" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="formula-bank-title"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <BookOpen className="text-emerald-400" size={22} />
            </div>
            <div>
              <h2 id="formula-bank-title" className="modal-title">
                ҰБТ Математика: Ресми Формулалар Банкі
              </h2>
              <p className="modal-subtitle">
                Ұлттық бірыңғай тестілеуге арналған толықтырылған интерактивті формулалар анықтамалығы
              </p>
            </div>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Жабу"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Core FormulaBank Component */}
        <div className="formula-modal-body">
          <FormulaBank embedded={false} />
        </div>

        {/* Modal Footer */}
        <div className="modal-footer formula-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Түсіндім, терезеден шығу
          </button>
        </div>
      </div>
    </div>
  );
}

