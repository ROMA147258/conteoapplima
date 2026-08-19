import React from 'react';
import { Filter } from 'lucide-react';

export const CountingTabs = ({ activeFilter, onChangeFilter }) => {
  return (
    <div
      className="view-filter-container glass"
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        padding: '6px',
        borderRadius: 'var(--border-radius-md)',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', marginRight: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Filter size={14} /> Vista:
      </span>
      <button
        type="button"
        id="filter-btn-manual"
        className={`ocr-column-tab ${activeFilter === 'manual' ? 'active' : ''}`}
        onClick={() => onChangeFilter('manual')}
        style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, textAlign: 'center' }}
      >
        Conteo Manual
      </button>
      <button
        type="button"
        id="filter-btn-ocr"
        className={`ocr-column-tab ${activeFilter === 'ocr' ? 'active' : ''}`}
        onClick={() => onChangeFilter('ocr')}
        style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, textAlign: 'center' }}
      >
        Conteo por Imagen
      </button>
    </div>
  );
};
