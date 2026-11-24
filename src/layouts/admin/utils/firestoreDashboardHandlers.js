import { db } from '@/services/firebase/firebaseConfig';
import {
	collection,
	collectionGroup,
	getCountFromServer,
	getDocs,
} from 'firebase/firestore';
import {
	computeGlobalServiceAverages,
	estimateVehicleNextService,
} from '@/utils/serviceMetrics';
import {
	isDevBypassEnabled,
	getDevMockDashboardMetrics,
} from '@/utils/devMockData';
import { getLowStockParts } from '@/utils/firebase/catalogHandlers';

const vehiclesCollection = collection(db, 'vehicles');

export const getTotalVehiclesCount = async () => {
	const snapshot = await getCountFromServer(vehiclesCollection);
	return snapshot.data().count;
};

/**
 * Obtiene métricas agregadas del lubricentro para el Dashboard de Super Administrador.
 * @param {'all' | '30d' | '90d' | '365d'} period
 */
export const getDashboardMetrics = async (period = 'all') => {
	const now = new Date();
	let cutoffDate = null;

	if (period === '30d') {
		cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	} else if (period === '90d') {
		cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
	} else if (period === '365d') {
		cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
	}

	const lowStockParts = await getLowStockParts();

	let vehiclesSnap;
	let servicesGroupSnap;
	try {
		[vehiclesSnap, servicesGroupSnap] = await Promise.all([
			getDocs(vehiclesCollection),
			getDocs(collectionGroup(db, 'services')),
		]);
		if (isDevBypassEnabled() && vehiclesSnap.empty) {
			return { ...getDevMockDashboardMetrics(period), lowStockParts };
		}
	} catch (err) {
		if (isDevBypassEnabled()) {
			return { ...getDevMockDashboardMetrics(period), lowStockParts };
		}
		throw err;
	}

	const totalClients = vehiclesSnap.size;
	const brandCounts = {};
	const vehiclesById = {};
	const allServicesByVehicle = {};

	vehiclesSnap.forEach((docSnap) => {
		const vData = docSnap.data();
		vehiclesById[docSnap.id] = { id: docSnap.id, ...vData };
		allServicesByVehicle[docSnap.id] = [];
		const brand = (vData.brand || 'OTROS').toUpperCase().trim();
		brandCounts[brand] = (brandCounts[brand] || 0) + 1;
	});

	const verticalCounts = {
		LUBRICENTRO: 0,
		'MECANICA LIGERA': 0,
		CUBIERTAS: 0,
		REPUESTOS: 0,
	};

	const publicServiceIdsInRange = new Set();
	const privateAmountsById = {};
	const serviceVerticalById = {};
	let totalServices = 0;

	servicesGroupSnap.forEach((docSnap) => {
		const path = docSnap.ref.path;
		const data = docSnap.data();

		if (path.startsWith('vehicles/')) {
			const vehicleId = docSnap.ref.parent?.parent?.id;
			if (vehicleId && allServicesByVehicle[vehicleId]) {
				allServicesByVehicle[vehicleId].push({ id: docSnap.id, ...data });
			}

			const ts = data.timestamp?.toDate ? data.timestamp.toDate() : null;
			if (cutoffDate && (!ts || ts < cutoffDate)) {
				return;
			}
			totalServices += 1;
			publicServiceIdsInRange.add(docSnap.id);

			const vertical = data.vertical || 'LUBRICENTRO';
			verticalCounts[vertical] = (verticalCounts[vertical] || 0) + 1;
			serviceVerticalById[docSnap.id] = vertical;
		} else if (path.startsWith('vehicles_private/')) {
			if (typeof data.importe === 'number') {
				privateAmountsById[docSnap.id] = data.importe / 100;
			}
		}
	});

	let totalRevenue = 0;
	let servicesWithPrice = 0;
	const revenueByVertical = {
		LUBRICENTRO: 0,
		'MECANICA LIGERA': 0,
		CUBIERTAS: 0,
		REPUESTOS: 0,
	};

	publicServiceIdsInRange.forEach((serviceId) => {
		const amount = privateAmountsById[serviceId];
		if (typeof amount === 'number' && !Number.isNaN(amount)) {
			totalRevenue += amount;
			servicesWithPrice += 1;
			const v = serviceVerticalById[serviceId] || 'LUBRICENTRO';
			revenueByVertical[v] = (revenueByVertical[v] || 0) + amount;
		}
	});

	const averageTicket =
		servicesWithPrice > 0 ? totalRevenue / servicesWithPrice : 0;

	const topBrands = Object.entries(brandCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 6);

	const vehiclesWithServices = Object.values(vehiclesById).map((v) => ({
		id: v.id,
		services: allServicesByVehicle[v.id] || [],
	}));

	const globalAverages = computeGlobalServiceAverages(vehiclesWithServices);

	const dueVehicles = Object.values(vehiclesById)
		.map((v) =>
			estimateVehicleNextService(
				v,
				allServicesByVehicle[v.id] || [],
				globalAverages,
				now
			)
		)
		.filter((est) => est && (est.status === 'overdue' || est.status === 'due_soon'))
		.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

	return {
		totalClients,
		totalServices,
		totalRevenue,
		averageTicket,
		verticalCounts,
		revenueByVertical,
		topBrands,
		globalAverages,
		dueVehicles,
		lowStockParts,
	};
};
