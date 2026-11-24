import { formatVertical } from './firebase/firebase';

export const SERVICE_VERTICALS = [
	'LUBRICENTRO',
	'AIRE ACONDICIONADO',
	'CUBIERTAS',
	'MECANICA LIGERA',
	'REPUESTOS',
];

function joinSpanishList(items) {
	if (!items || items.length === 0) return '';
	if (items.length === 1) return items[0];
	if (items.length === 2) return `${items[0]} y ${items[1]}`;
	return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

export function getUsageUnit(vehicle = {}) {
	return vehicle?.unitType === 'autoelevador' ? 'hs' : 'km';
}

export function getUnitIdentifier(vehicle = {}) {
	if (vehicle?.unitType === 'autoelevador') {
		const parts = [];
		if (vehicle.serialNumber) parts.push(`Serie ${vehicle.serialNumber}`);
		if (vehicle.internalNumber) parts.push(`Int. ${vehicle.internalNumber}`);
		return parts.join(' · ') || vehicle.patente || 'Autoelevador';
	}
	return vehicle.patente || 'SIN PATENTE';
}

/**
 * Genera una descripción uniforme, sencilla y condicional para el CLIENTE,
 * reflejando únicamente lo realizado y diferenciando "reemplazo" de "revisión".
 */
export function generateClientSummary(service = {}) {
	const actions = [];

	if (service.vertical === 'LUBRICENTRO') {
		const vd = service.vertical_data || {};
		if (vd.oilChanged !== false && vd.tipo) {
			actions.push('cambio de aceite del motor');
		}

		// Soporte para filtros estructurados nuevos
		if (Array.isArray(vd.filters) && vd.filters.length > 0) {
			const replaced = vd.filters
				.filter((f) => f.action !== 'revisado')
				.map((f) => f.type?.toLowerCase())
				.filter(Boolean);
			const checked = vd.filters
				.filter((f) => f.action === 'revisado')
				.map((f) => f.type?.toLowerCase())
				.filter(Boolean);

			if (replaced.length > 0) {
				actions.push(`reemplazo de filtros de ${joinSpanishList(replaced)}`);
			}
			if (checked.length > 0) {
				actions.push(`revisión de filtros de ${joinSpanishList(checked)}`);
			}
		} else {
			// Compatibilidad con registros anteriores (checkboxes)
			const legacyReplaced = [];
			if (vd.filtro_aceite) legacyReplaced.push('aceite');
			if (vd.filtro_aire) legacyReplaced.push('aire');
			if (vd.filtro_combustible) legacyReplaced.push('combustible');
			if (legacyReplaced.length > 0) {
				actions.push(`reemplazo de filtros de ${joinSpanishList(legacyReplaced)}`);
			}
		}

		if (vd.engrase) {
			actions.push('engrase y control de niveles');
		}
	} else if (service.vertical === 'AIRE ACONDICIONADO') {
		const ac = service.vertical_data || {};
		const acReplaced = [];
		const acChecked = [];
		if (ac.gasCharge) acReplaced.push('carga de gas refrigerante');
		if (ac.cabinFilterReplaced) acReplaced.push('reemplazo de filtro de habitáculo');
		if (ac.leakCheck) acChecked.push('control de fugas');
		if (ac.compressorCheck) acChecked.push('revisión de compresor');
		actions.push(...acReplaced, ...acChecked);
	} else if (service.vertical === 'CUBIERTAS') {
		const tr = service.vertical_data || {};
		if (tr.reemplazo) actions.push('reemplazo de neumáticos');
		if (tr.rotacion) actions.push('rotación de neumáticos');
		if (tr.alineacion) actions.push('alineación');
		if (tr.balanceo) actions.push('balanceo');
		if (tr.reparacion) actions.push('reparación de neumático');
	} else if (service.vertical === 'MECANICA LIGERA') {
		if (Array.isArray(service.partsUsed) && service.partsUsed.length > 0) {
			const names = service.partsUsed.map((p) => p.name).filter(Boolean);
			actions.push(`trabajo de mecánica ligera con reemplazo de ${joinSpanishList(names)}`);
		} else {
			actions.push('trabajo de mecánica ligera y revisión general');
		}
	} else if (service.vertical === 'REPUESTOS') {
		if (Array.isArray(service.partsUsed) && service.partsUsed.length > 0) {
			const names = service.partsUsed.map((p) => p.name).filter(Boolean);
			actions.push(`provisión/colocación de ${joinSpanishList(names)}`);
		} else {
			actions.push('provisión de repuestos');
		}
	}

	if (actions.length === 0) {
		const label = formatVertical(service.vertical) || service.vertical || 'servicio técnico';
		return `Se realizó ${label.toLowerCase()}.`;
	}

	return `Se realizó ${joinSpanishList(actions)}.`;
}
