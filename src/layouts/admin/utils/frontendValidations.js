import { fieldLabels } from "./MocksAndLabels";
const currentYear = new Date().getFullYear();

function getFieldLabel(field) {
  return fieldLabels[field] || field;
}

export function validateForm(data) {
  // === Patente ===
  const patenteRegex = /^[A-Z0-9]{6,7}$/;
  if (typeof data.patente !== 'string' || !patenteRegex.test(data.patente)) {
    return `${getFieldLabel('patente')} debe tener 6 o 7 caracteres, solo letras mayúsculas y números, sin espacios ni signos.`;
  }

  // === DNI ===
  const dniRegex = /^\d{8}$/;
  if (typeof data.dni !== 'string' || !dniRegex.test(data.dni)) {
    return `${getFieldLabel('dni')} debe tener exactamente 8 dígitos y no debe contener espacios ni signos.`;
  }

  // === Campos generales ===
  const generalFields = [
    'owner_name',
    'owner_surname',
    'occupation',
    'email',
    'zip_code',
    'direction',
    'brand',
    'model',
    'country',
    'state',
    'phone_number'
  ];
  for (const field of generalFields) {
    const value = data[field];
    const label = getFieldLabel(field);
  
    if (typeof value !== 'string') {
      return `${label} tiene un formato incompatible.`;
    }
  
    if (value === '') {
      return `${label} no puede estar vacío.`;
    }
  
    if (value.length > 100) {
      return `${label} es demasiado largo (máx. 100 caracteres).`;
    }
  }

  // === Fecha de nacimiento ===
  const { day, month, year } = data.birthdate || {};

  if (!/^\d{2}$/.test(day)) return 'El día debe tener 2 dígitos.';
  if (parseInt(day) < 1 || parseInt(day) > 31) return 'El día debe estar entre 01 y 31.';

  if (!/^\d{2}$/.test(month)) return 'El mes debe tener 2 dígitos.';
  if (parseInt(month) < 1 || parseInt(month) > 12) return 'El mes debe estar entre 01 y 12.';

  if (!/^\d{4}$/.test(year)) return 'El año debe tener 4 dígitos.';
  if (parseInt(year) < 1900 || parseInt(year) > currentYear) {
    return `El año debe estar entre 1900 y ${currentYear}.`;
  }

  return null;
}