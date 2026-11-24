import React from 'react'
import st from './VerticalSelect.module.css'

const VerticalSelect = ({ verticals, value, onChange, title = 'Tipo de Service' }) => {
 
  // Determine if there's a selected value
  const hasValue = Array.isArray(value)
    ? value.length > 0
    : value !== undefined && value !== null && value !== '';

  return (
    <select
      className={st.select}
      value={hasValue ? value : ''}
      onChange={(e) => onChange(e.target.value)}
    >
      {/* Placeholder option, disabled so user can't select it once a real value is selected */}
      <option value="" disabled>
        {hasValue ? null : title}
      </option>

      {/* Render actual options */}
      {verticals.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
};

export default VerticalSelect;