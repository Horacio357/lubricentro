const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_INTERVALS_BY_VERTICAL = {
	LUBRICENTRO: { days: 180, km: 10000 },
	'MECANICA LIGERA': { days: 365, km: 15000 },
	CUBIERTAS: { days: 365, km: 20000 },
	REPUESTOS: { days: 365, km: 15000 },
};

function toDateObj(ts) {
	if (!ts) return null;
	if (ts instanceof Date) return ts;
	if (typeof ts.toDate === 'function') return ts.toDate();
	if (typeof ts._seconds === 'number') return new Date(ts._seconds * 1000);
	const parsed = new Date(ts);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calcula la media global de días y kilómetros entre servicios usando vehículos con 2+ services.
 * @param {Array<{ id: string, services: Array }>} vehiclesWithServices
 */
export function computeGlobalServiceAverages(vehiclesWithServices = []) {
	const accum = {
		ALL: { totalDays: 0, totalKm: 0, countDays: 0, countKm: 0 },
	};

	for (const v of vehiclesWithServices) {
		const sorted = [...(v.services || [])]
			.map((s) => ({
				...s,
				_date: toDateObj(s.timestamp),
				_km: Number(s.kilometraje),
			}))
			.filter((s) => s._date)
			.sort((a, b) => a._date - b._date);

		for (let i = 1; i < sorted.length; i += 1) {
			const prev = sorted[i - 1];
			const curr = sorted[i];
			const diffDays = (curr._date - prev._date) / MS_PER_DAY;
			const diffKm = curr._km - prev._km;

			if (diffDays > 1 && diffDays < 1500) {
				const vert = curr.vertical || 'LUBRICENTRO';
				if (!accum[vert]) {
					accum[vert] = { totalDays: 0, totalKm: 0, countDays: 0, countKm: 0 };
				}
				accum.ALL.totalDays += diffDays;
				accum.ALL.countDays += 1;
				accum[vert].totalDays += diffDays;
				accum[vert].countDays += 1;
			}

			if (!Number.isNaN(diffKm) && diffKm > 100 && diffKm < 200000) {
				const vert = curr.vertical || 'LUBRICENTRO';
				if (!accum[vert]) {
					accum[vert] = { totalDays: 0, totalKm: 0, countDays: 0, countKm: 0 };
				}
				accum.ALL.totalKm += diffKm;
				accum.ALL.countKm += 1;
				accum[vert].totalKm += diffKm;
				accum[vert].countKm += 1;
			}
		}
	}

	const result = {
		overall: {
			avgDays:
				accum.ALL.countDays > 0
					? Math.round(accum.ALL.totalDays / accum.ALL.countDays)
					: 180,
			avgKm:
				accum.ALL.countKm > 0
					? Math.round(accum.ALL.totalKm / accum.ALL.countKm)
					: 10000,
			sampleSize: accum.ALL.countDays,
		},
		byVertical: {},
	};

	Object.keys(DEFAULT_INTERVALS_BY_VERTICAL).forEach((vert) => {
		const stats = accum[vert];
		const fallback = DEFAULT_INTERVALS_BY_VERTICAL[vert];
		result.byVertical[vert] = {
			avgDays:
				stats && stats.countDays > 0
					? Math.round(stats.totalDays / stats.countDays)
					: fallback.days,
			avgKm:
				stats && stats.countKm > 0
					? Math.round(stats.totalKm / stats.countKm)
					: fallback.km,
			sampleSize: stats ? stats.countDays : 0,
		};
	});

	return result;
}

/**
 * Estima el próximo servicio de un vehículo combinando su propia cadencia (si tiene 2+ services)
 * con la media global de su último rubro.
 */
export function estimateVehicleNextService(vehicle, services = [], globalAverages, now = new Date()) {
	const sorted = [...services]
		.map((s) => ({
			...s,
			_date: toDateObj(s.timestamp),
			_km: Number(s.kilometraje),
		}))
		.filter((s) => s._date)
		.sort((a, b) => a._date - b._date);

	if (sorted.length === 0) {
		return null;
	}

	const last = sorted[sorted.length - 1];
	const lastVertical = last.vertical || 'LUBRICENTRO';
	const verticalAvg =
		globalAverages?.byVertical?.[lastVertical] ||
		DEFAULT_INTERVALS_BY_VERTICAL[lastVertical] ||
		{ days: 180, km: 10000 };

	let vehicleDays = 0;
	let vehicleKm = 0;
	let pairs = 0;

	for (let i = 1; i < sorted.length; i += 1) {
		const dDays = (sorted[i]._date - sorted[i - 1]._date) / MS_PER_DAY;
		const dKm = sorted[i]._km - sorted[i - 1]._km;
		if (dDays > 1 && dDays < 1500) {
			vehicleDays += dDays;
			if (!Number.isNaN(dKm) && dKm > 100) {
				vehicleKm += dKm;
			}
			pairs += 1;
		}
	}

	const estimatedIntervalDays =
		pairs > 0 ? Math.round((vehicleDays / pairs + verticalAvg.avgDays) / 2) : verticalAvg.avgDays;
	const estimatedIntervalKm =
		pairs > 0 && vehicleKm > 0
			? Math.round((vehicleKm / pairs + verticalAvg.avgKm) / 2)
			: verticalAvg.avgKm;

	const estimatedNextDate = new Date(
		last._date.getTime() + estimatedIntervalDays * MS_PER_DAY
	);
	const estimatedNextKm = !Number.isNaN(last._km)
		? last._km + estimatedIntervalKm
		: null;

	const daysUntilDue = Math.ceil((estimatedNextDate - now) / MS_PER_DAY);

	let status = 'ok';
	if (daysUntilDue <= 0) {
		status = 'overdue';
	} else if (daysUntilDue <= 15) {
		status = 'due_soon';
	}

	return {
		vehicleId: vehicle.id,
		patente: vehicle.patente || '',
		brand: vehicle.brand || '',
		model: vehicle.model || '',
		lastServiceAt: last._date,
		lastVertical,
		lastKm: Number.isNaN(last._km) ? null : last._km,
		estimatedIntervalDays,
		estimatedIntervalKm,
		estimatedNextDate,
		estimatedNextKm,
		daysUntilDue,
		status,
	};
}
