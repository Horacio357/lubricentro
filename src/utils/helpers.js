export const scrollToBottom = () => {
  window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
  });
};

export function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
  }).format(cents / 100).replace(/,/g, '.'); // Reemplaza comas por puntos
}