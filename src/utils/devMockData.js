import {
	computeGlobalServiceAverages,
	estimateVehicleNextService,
} from './serviceMetrics';

const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const makeFirestoreTs = (date) => ({
	toDate: () => date,
});

export const DEV_MOCK_VEHICLES = [
	{
		id: 'demo-etios',
		patente: 'AC602JF',
		brand: 'TOYOTA',
		model: 'ETIOS',
		oilPreference: {
			oilId: 'shell-hx8',
			label: 'Shell Helix HX8 5W-30 (Sintético)',
			viscosity: '5W-30',
			isOwnerPreference: true,
		},
		privateData: {
			owner_name: 'GABRIEL',
			owner_surname: 'VILLAR',
			alta: makeFirestoreTs(daysAgo(410)),
			phone_number: '11 5555-0192',
			email: 'gabriel.villar@ejemplo.com',
			dni: '32456789',
			occupation: 'Comerciante',
			state: 'Buenos Aires',
			direction: 'Av. San Martín 1420',
			zip_code: '1602',
			birthdate: { day: '14', month: '05', year: '1987' },
		},
		services: [
			{
				id: 'srv-1',
				timestamp: makeFirestoreTs(daysAgo(210)),
				kilometraje: 42000,
				vertical: 'LUBRICENTRO',
				vertical_data: {
					tipo: 'Shell Helix HX8 5W-30 (Sintético)',
					filtro_aceite: true,
					filtro_aire: true,
					filtro_combustible: false,
					engrase: true,
				},
				details: 'Cambio de aceite y filtros completo.',
				next_service: '52000 km',
				importe: 8500000,
			},
			{
				id: 'srv-2',
				timestamp: makeFirestoreTs(daysAgo(195)),
				kilometraje: 42500,
				vertical: 'MECANICA LIGERA',
				partsUsed: [
					{
						partId: 'FR-PAST-DEL',
						name: 'Pastillas de freno delanteras',
						sku: 'FR-PAST-DEL',
						qty: 1,
						unitPrice: 45000,
					},
				],
				details: 'Cambio de pastillas delanteras y control de discos.',
				next_service: 'Control en 10000 km',
				importe: 7200000,
			},
		],
	},
	{
		id: 'demo-gol',
		patente: 'AB123CD',
		brand: 'VOLKSWAGEN',
		model: 'GOL TREND',
		privateData: {
			owner_name: 'MARÍA',
			owner_surname: 'GÓMEZ',
			alta: makeFirestoreTs(daysAgo(300)),
			phone_number: '11 4444-8821',
			email: 'maria.gomez@ejemplo.com',
			dni: '35112233',
			occupation: 'Arquitecta',
			state: 'CABA',
			direction: 'Cabildo 2100',
			zip_code: '1428',
		},
		services: [
			{
				id: 'srv-3',
				timestamp: makeFirestoreTs(daysAgo(185)),
				kilometraje: 68000,
				vertical: 'LUBRICENTRO',
				vertical_data: {
					tipo: 'Shell Helix HX7 10W-40 (Semisintético)',
					filtro_aceite: true,
					filtro_aire: false,
					filtro_combustible: false,
					engrase: true,
				},
				details: 'Service de rutina 68.000 km.',
				next_service: '76000 km',
				importe: 6400000,
			},
		],
	},
	{
		id: 'demo-ranger',
		patente: 'AE456FG',
		brand: 'FORD',
		model: 'RANGER',
		services: [
			{
				id: 'srv-4',
				timestamp: makeFirestoreTs(daysAgo(170)),
				kilometraje: 95000,
				vertical: 'CUBIERTAS',
				details: 'Rotación, balanceo y alineación tren delantero.',
				next_service: '105000 km',
				importe: 5800000,
			},
			{
				id: 'srv-5',
				timestamp: makeFirestoreTs(daysAgo(20)),
				kilometraje: 102000,
				vertical: 'LUBRICENTRO',
				vertical_data: {
					tipo: 'YPF Elaion F50 5W-40 (Sintético)',
					filtro_aceite: true,
					filtro_aire: true,
					filtro_combustible: true,
					engrase: true,
				},
				details: 'Service completo pickup.',
				next_service: '112000 km',
				importe: 12500000,
			},
		],
	},
	{
		id: 'demo-onix',
		patente: 'AD789HI',
		brand: 'CHEVROLET',
		model: 'ONIX',
		services: [
			{
				id: 'srv-6',
				timestamp: makeFirestoreTs(daysAgo(12)),
				kilometraje: 54000,
				vertical: 'REPUESTOS',
				partsUsed: [
					{
						partId: 'MOT-DIST-01',
						name: 'Kit de distribución',
						sku: 'MOT-DIST-01',
						qty: 1,
						unitPrice: 135000,
					},
				],
				details: 'Venta y colocación de kit de distribución.',
				next_service: '114000 km',
				importe: 16500000,
			},
		],
	},
	{
		id: 'demo-kangoo',
		patente: 'AF321JK',
		brand: 'RENAULT',
		model: 'KANGOO',
		services: [
			{
				id: 'srv-7',
				timestamp: makeFirestoreTs(daysAgo(45)),
				kilometraje: 82000,
				vertical: 'MECANICA LIGERA',
				partsUsed: [
					{
						partId: 'SUS-AMO-DEL',
						name: 'Amortiguador delantero',
						sku: 'SUS-AMO-DEL',
						qty: 2,
						unitPrice: 92000,
					},
				],
				details: 'Cambio de par de amortiguadores delanteros.',
				next_service: 'Control 95000 km',
				importe: 21500000,
			},
		],
	},
	{
		id: 'demo-autoelevador',
		unitType: 'autoelevador',
		patente: 'AE-04',
		serialNumber: '8FG25-44102',
		internalNumber: 'AE-04',
		clientNumber: 'CL-0108',
		marketingOptIn: true,
		brand: 'TOYOTA',
		model: '8FG25 AUTOELEVADOR',
		oilPreference: {
			oilId: 'shell-hx7',
			label: 'Shell Helix HX7 10W-40 (Semisintético)',
			viscosity: '10W-40',
			isOwnerPreference: true,
		},
		privateData: {
			owner_name: 'LOGÍSTICA',
			owner_surname: 'SUR S.A.',
			clientNumber: 'CL-0108',
			marketingOptIn: true,
			alta: makeFirestoreTs(daysAgo(240)),
			phone_number: '11 6666-3300',
			email: 'mantenimiento@logisticasur.com.ar',
			dni: '30-71122334-9',
			occupation: 'Empresa / Flota',
			state: 'Buenos Aires',
			direction: 'Parque Industrial Burzaco Lote 12',
			zip_code: '1852',
		},
		services: [
			{
				id: 'srv-ae-1',
				timestamp: makeFirestoreTs(daysAgo(160)),
				kilometraje: 1420,
				vertical: 'LUBRICENTRO',
				vertical_data: {
					tipo: 'Shell Helix HX7 10W-40 (Semisintético)',
					oilBrand: 'Shell',
					oilViscosity: '10W-40',
					oilSpec: 'API SN/CF',
					oilLiters: 4.5,
					oilChanged: true,
					filters: [
						{
							type: 'Aceite',
							action: 'reemplazado',
							brand: 'MANN',
							manufacturerCode: 'W712/95',
							sku: 'FLT-AE-001',
							qty: 1,
						},
						{
							type: 'Aire',
							action: 'reemplazado',
							brand: 'Donaldson',
							manufacturerCode: 'P821575',
							sku: 'FLT-AE-002',
							qty: 1,
						},
						{
							type: 'Hidráulico',
							action: 'revisado',
							brand: 'Toyota OEM',
							manufacturerCode: '67502-26600',
							sku: 'FLT-HID-04',
							qty: 1,
						},
					],
					engrase: true,
				},
				details: 'Mantenimiento preventivo 1420 hs.',
				next_service: '1670 hs',
				importe: 14800000,
			},
		],
	},
];

export function isDevBypassEnabled() {
	return (
		process.env.NODE_ENV === 'development' &&
		process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
	);
}

export function getDevMockDashboardMetrics(period = 'all') {
	const now = new Date();
	let cutoffDate = null;
	if (period === '30d') cutoffDate = daysAgo(30);
	else if (period === '90d') cutoffDate = daysAgo(90);
	else if (period === '365d') cutoffDate = daysAgo(365);

	const verticalCounts = {
		LUBRICENTRO: 0,
		'MECANICA LIGERA': 0,
		CUBIERTAS: 0,
		REPUESTOS: 0,
	};
	const revenueByVertical = {
		LUBRICENTRO: 0,
		'MECANICA LIGERA': 0,
		CUBIERTAS: 0,
		REPUESTOS: 0,
	};
	const brandCounts = {};

	let totalServices = 0;
	let totalRevenue = 0;

	DEV_MOCK_VEHICLES.forEach((v) => {
		brandCounts[v.brand] = (brandCounts[v.brand] || 0) + 1;
		(v.services || []).forEach((s) => {
			const ts = s.timestamp.toDate();
			if (cutoffDate && ts < cutoffDate) return;
			totalServices += 1;
			const vert = s.vertical || 'LUBRICENTRO';
			verticalCounts[vert] = (verticalCounts[vert] || 0) + 1;
			const amount = (s.importe || 0) / 100;
			totalRevenue += amount;
			revenueByVertical[vert] = (revenueByVertical[vert] || 0) + amount;
		});
	});

	const topBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
	const globalAverages = computeGlobalServiceAverages(DEV_MOCK_VEHICLES);
	const dueVehicles = DEV_MOCK_VEHICLES.map((v) =>
		estimateVehicleNextService(v, v.services, globalAverages, now)
	)
		.filter((est) => est && (est.status === 'overdue' || est.status === 'due_soon'))
		.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

	return {
		totalClients: DEV_MOCK_VEHICLES.length,
		totalServices,
		totalRevenue,
		averageTicket: totalServices > 0 ? totalRevenue / totalServices : 0,
		verticalCounts,
		revenueByVertical,
		topBrands,
		globalAverages,
		dueVehicles,
		isDemoData: true,
	};
}

export function findDevMockVehicleByPatente(patente) {
	const clean = String(patente || '').toUpperCase().replace(/\s+/g, '');
	const found = DEV_MOCK_VEHICLES.find((v) => v.patente === clean);
	if (!found) return null;
	return {
		id: found.id,
		patente: found.patente,
		brand: found.brand,
		model: found.model,
		oilPreference: found.oilPreference || null,
		...(found.privateData || {}),
	};
}

export function searchDevMockVehicles(queryText) {
	const q = String(queryText || '').toUpperCase().trim();
	if (!q) return [];
	return DEV_MOCK_VEHICLES.filter((v) => {
		const fullName = `${v.privateData?.owner_name || ''} ${
			v.privateData?.owner_surname || ''
		}`.toUpperCase();
		return (
			v.patente.includes(q) ||
			v.brand.toUpperCase().includes(q) ||
			v.model.toUpperCase().includes(q) ||
			fullName.includes(q)
		);
	}).map((v) => ({
		id: v.id,
		patente: v.patente,
		brand: v.brand,
		model: v.model,
		oilPreference: v.oilPreference || null,
		...(v.privateData || {}),
	}));
}

export function getDevMockVehicleById(vehicleId) {
	const found = DEV_MOCK_VEHICLES.find((v) => v.id === vehicleId);
	if (!found) return null;
	return {
		publicData: {
			id: found.id,
			patente: found.patente,
			brand: found.brand,
			model: found.model,
			oilPreference: found.oilPreference || null,
			services: found.services,
		},
		privateData: {
			id: found.id,
			...(found.privateData || {
				owner_name: 'CLIENTE',
				owner_surname: 'DEMO',
				alta: makeFirestoreTs(daysAgo(180)),
				phone_number: '11 5555-0000',
				email: 'demo@ejemplo.com',
				dni: '30000000',
				occupation: '-',
				state: 'Buenos Aires',
				direction: '-',
				zip_code: '1000',
			}),
			services: found.services.map((s) => ({
				id: s.id,
				importe: s.importe,
			})),
		},
	};
}
