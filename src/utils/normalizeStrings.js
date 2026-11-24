//normalizar strings para devolver todo en uppercase y sin acentos:

export const normalizeString = (str) => {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
};