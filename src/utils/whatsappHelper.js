/**
 * Normaliza un número telefónico argentino/internacional y construye un enlace wa.me.
 */
export function buildWhatsAppUrl(phone = '', message = '') {
	const digits = String(phone || '').replace(/\D+/g, '');
	let normalized = digits;

	if (digits) {
		if (digits.startsWith('549')) {
			normalized = digits;
		} else if (digits.startsWith('54')) {
			normalized = `549${digits.slice(2)}`;
		} else if (digits.startsWith('0')) {
			normalized = `549${digits.slice(1)}`;
		} else if (digits.length === 10) {
			normalized = `549${digits}`;
		}
	}

	const encodedText = encodeURIComponent(message || '');
	return normalized
		? `https://wa.me/${normalized}?text=${encodedText}`
		: `https://wa.me/?text=${encodedText}`;
}

export function buildServiceReminderMessage({ vehicle = {}, estimate = {} }) {
	const model = [vehicle.brand, vehicle.model].filter(Boolean).join(' ').trim();
	const patente = vehicle.patente || '';
	const link = `https://mi.rudyservices.com.ar/${vehicle.id || ''}`;

	const timing =
		estimate.daysUntilDue <= 0
			? `ya superó su fecha estimada de próximo service`
			: `está próximo a cumplir su próximo service (en ${estimate.daysUntilDue} días)`;

	return [
		`Hola! Te escribimos de *R Services*.`,
		`Tu *${model}* (${patente}) ${timing}.`,
		estimate.estimatedNextKm
			? `Kilometraje estimado: *${estimate.estimatedNextKm.toLocaleString('es-AR')} km*.`
			: null,
		`Puedes ver el historial completo aquí: ${link}`,
		`¿Querés que te reservemos turno?`,
	]
		.filter(Boolean)
		.join('\n');
}
