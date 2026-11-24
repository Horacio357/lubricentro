import React, { useState } from 'react';
import st from './SimplifiedDateSelector.module.css';

const currentYear = new Date().getFullYear();

const validateDatePart = (field, value) => {
  if (!/^\d+$/.test(value)) return 'Solo se permiten números';

  if (field === 'day') {
    if (value.length !== 2) return 'El día debe tener 2 dígitos';
    const num = parseInt(value, 10);
    if (num < 1 || num > 31) return 'El día debe estar entre 01 y 31';
  }

  if (field === 'month') {
    if (value.length !== 2) return 'El mes debe tener 2 dígitos';
    const num = parseInt(value, 10);
    if (num < 1 || num > 12) return 'El mes debe estar entre 01 y 12';
  }

  if (field === 'year') {
    if (value.length !== 4) return 'El año debe tener 4 dígitos';
    const num = parseInt(value, 10);
    if (num < 1900 || num > currentYear) {
      return `El año debe estar entre 1900 y ${currentYear}`;
    }
  }

  return null;
};

const SimplifiedDateSelector = ({value, onChange }) => {

  const handleInputChange = (field, maxLength) => (e) => {
    const value = e.target.value;

    if (/^\d*$/.test(value) && value.length <= maxLength) {
      onChange(field, value);
    }
  };

  return (
    <div className={st.wrapper}>
      <label className={st.label}>Fecha de nacimiento</label>
      <div className={st.inputGroup}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD"
          value={value.day}
          onChange={handleInputChange('day', 2)}
          className={st.input}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="MM"
          value={value.month}
          onChange={handleInputChange('month', 2)}
          className={st.input}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="AAAA"
          value={value.year}
          onChange={handleInputChange('year', 4)}
          className={`${st.input} ${st.inputYear}`}
        />
      </div>
    </div>
  );
};

export default SimplifiedDateSelector;