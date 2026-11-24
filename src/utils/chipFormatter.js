import { formatDate } from './firebase/firebase';
import {
	generateClientSummary,
	getUnitIdentifier,
	getUsageUnit,
} from './serviceTemplates';

/**
 * Genera una redacción estandarizada, clara y concisa para el chip NFC / resumen de servicio.
 * Mantiene siempre el mismo formato independientemente de quién cargue el servicio.
 */
export function formatChipSummary({ vehicle = {}, service = {}, date = null }) {
	const unitId = getUnitIdentifier(vehicle);
	const modelo = [vehicle.brand, vehicle.model].filter(Boolean).join(' ').trim();
	const usageUnit = getUsageUnit(vehicle);
	const fechaStr = date
		? date
		: service.timestamp
			? formatDate(service.timestamp)
			: formatTodayShort();

	const usageStr =
		service.kilometraje !== undefined && service.kilometraje !== ''
			? `${Number(service.kilometraje).toLocaleString('es-AR')} ${usageUnit}`
			: 's/d';

	const clientSentence = generateClientSummary(service);

	const detailsTech = [];
	if (service.vertical === 'LUBRICENTRO' && service.vertical_data) {
		const vd = service.vertical_data;
		if (vd.tipo) {
			const qtyStr = vd.oilLiters ? ` (${vd.oilLiters} L)` : '';
			detailsTech.push(`Aceite: ${vd.tipo}${qtyStr}`);
		}
		if (Array.isArray(vd.filters) && vd.filters.length > 0) {
			const codes = vd.filters
				.filter((f) => f.action !== 'revisado')
				.map((f) =>
					[f.type, f.brand, f.manufacturerCode || f.sku]
						.filter(Boolean)
						.join(' ')
				)
				.filter(Boolean);
			if (codes.length > 0) detailsTech.push(`Filtros: ${codes.join(', ')}`);
		}
	}

	if (Array.isArray(service.partsUsed) && service.partsUsed.length > 0) {
		const partsList = service.partsUsed
			.map(
				(p) =>
					`${p.qty > 1 ? `${p.qty}x ` : ''}${p.name}${
						p.sku ? ` [${p.sku}]` : ''
					}`
			)
			.join(', ');
		detailsTech.push(`Repuestos: ${partsList}`);
	}

	const prox = service.next_service ? `Próx: ${service.next_service}` : null;

	const segments = [
		`R SERVICES | ${unitId}${modelo ? ` (${modelo})` : ''}`,
		`${fechaStr} · ${usageStr}`,
		clientSentence,
		detailsTech.length > 0 ? detailsTech.join(' | ') : null,
		prox,
	].filter(Boolean);

	return segments.join('\n');
}

function formatTodayShort() {
	const d = new Date();
	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const year = String(d.getFullYear()).slice(-2);
	return `${day}/${month}/${year}`;
}
