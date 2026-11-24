import { db } from '@/services/firebase/firebaseConfig';
import {
	collection,
	addDoc,
	getDocs,
	doc,
	updateDoc,
	orderBy,
	query,
	writeBatch,
	increment,
} from 'firebase/firestore';
import { isDevBypassEnabled } from '@/utils/devMockData';

const OILS_COLLECTION = 'catalog_oils';
const PARTS_COLLECTION = 'catalog_parts';
const DEMO_PARTS_STOCK_KEY = 'rudy_demo_parts_stock';

export const DEFAULT_OILS = [
	{
		brand: 'Shell',
		name: 'Helix HX8',
		viscosity: '5W-30',
		type: 'Sintético',
		defaultIntervalKm: 10000,
		defaultIntervalDays: 180,
		active: true,
	},
	{
		brand: 'Shell',
		name: 'Helix HX7',
		viscosity: '10W-40',
		type: 'Semisintético',
		defaultIntervalKm: 8000,
		defaultIntervalDays: 180,
		active: true,
	},
	{
		brand: 'YPF',
		name: 'Elaion F50',
		viscosity: '5W-40',
		type: 'Sintético',
		defaultIntervalKm: 10000,
		defaultIntervalDays: 180,
		active: true,
	},
	{
		brand: 'Castrol',
		name: 'EDGE',
		viscosity: '5W-30',
		type: 'Sintético',
		defaultIntervalKm: 12000,
		defaultIntervalDays: 365,
		active: true,
	},
	{
		brand: 'Total',
		name: 'Quartz 7000',
		viscosity: '10W-40',
		type: 'Semisintético',
		defaultIntervalKm: 8000,
		defaultIntervalDays: 180,
		active: true,
	},
];

export const DEFAULT_PARTS = [
	{
		name: 'Pastillas de freno delanteras',
		sku: 'FR-PAST-DEL',
		category: 'Frenos',
		defaultPrice: 45000,
		stock: 8,
		minStock: 3,
		active: true,
	},
	{
		name: 'Juego de discos de freno',
		sku: 'FR-DISC-01',
		category: 'Frenos',
		defaultPrice: 85000,
		stock: 2,
		minStock: 3,
		active: true,
	},
	{
		name: 'Amortiguador delantero',
		sku: 'SUS-AMO-DEL',
		category: 'Suspensión',
		defaultPrice: 92000,
		stock: 6,
		minStock: 2,
		active: true,
	},
	{
		name: 'Filtro de aceite MANN W712/95 (Autoelevador)',
		sku: 'FLT-AE-001',
		category: 'Filtros',
		defaultPrice: 18500,
		stock: 1,
		minStock: 4,
		active: true,
	},
	{
		name: 'Filtro de aire Donaldson P821575',
		sku: 'FLT-AE-002',
		category: 'Filtros',
		defaultPrice: 29000,
		stock: 2,
		minStock: 3,
		active: true,
	},
	{
		name: 'Kit de distribución',
		sku: 'MOT-DIST-01',
		category: 'Motor',
		defaultPrice: 135000,
		stock: 4,
		minStock: 2,
		active: true,
	},
];

export const FORKLIFT_AND_MACHINERY_BRANDS = [
	{ brand_name: 'HELI', models: ['CPCD25', 'CPCD30', 'CPD20'] },
	{ brand_name: 'HANGCHA', models: ['CPCD25', 'CPCD35', 'CPD25'] },
	{ brand_name: 'YALE', models: ['GLP050', 'GDP050', 'ERP040'] },
	{ brand_name: 'HYSTER', models: ['H50FT', 'H60FT', 'H2.5XT'] },
	{ brand_name: 'CLARK', models: ['C25', 'C30', 'GEX25'] },
	{ brand_name: 'LINDE', models: ['H25D', 'H30T', 'E20'] },
	{ brand_name: 'CROWN', models: ['SC5200', 'FC4500', 'RR5700'] },
	{ brand_name: 'STILL', models: ['RX20-20', 'RX70-25', 'RC40'] },
	{ brand_name: 'CATERPILLAR', models: ['DP25N', 'GP25N', 'EP20'] },
	{ brand_name: 'KOMATSU', models: ['FG25T-16', 'FD25T-16', 'FB20'] },
	{ brand_name: 'TOYOTA', models: ['8FG25', '8FD25', '8FGCU25', 'ETIOS', 'HILUX', 'COROLLA'] },
];

function getLocalDemoParts() {
	if (typeof window === 'undefined') {
		return DEFAULT_PARTS.map((p, i) => ({ id: `demo-part-${i}`, ...p }));
	}
	try {
		const raw = window.localStorage.getItem(DEMO_PARTS_STOCK_KEY);
		if (!raw) {
			const seeded = DEFAULT_PARTS.map((p, i) => ({ id: `demo-part-${i}`, ...p }));
			window.localStorage.setItem(DEMO_PARTS_STOCK_KEY, JSON.stringify(seeded));
			return seeded;
		}
		return JSON.parse(raw);
	} catch {
		return DEFAULT_PARTS.map((p, i) => ({ id: `demo-part-${i}`, ...p }));
	}
}

function saveLocalDemoParts(list) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(DEMO_PARTS_STOCK_KEY, JSON.stringify(list));
	} catch {
		// ignorar errores de almacenamiento
	}
}

export async function getOilsCatalog(onlyActive = false) {
	const q = query(collection(db, OILS_COLLECTION), orderBy('brand', 'asc'));
	const snap = await getDocs(q);
	const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
	return onlyActive ? items.filter((item) => item.active !== false) : items;
}

export async function getPartsCatalog(onlyActive = false) {
	if (isDevBypassEnabled()) {
		const demoList = getLocalDemoParts();
		return onlyActive ? demoList.filter((item) => item.active !== false) : demoList;
	}
	const q = query(collection(db, PARTS_COLLECTION), orderBy('name', 'asc'));
	const snap = await getDocs(q);
	const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
	return onlyActive ? items.filter((item) => item.active !== false) : items;
}

export async function saveOilCatalogItem(oilData, id = null) {
	const payload = {
		brand: String(oilData.brand || '').trim(),
		name: String(oilData.name || '').trim(),
		viscosity: String(oilData.viscosity || '').trim().toUpperCase(),
		type: String(oilData.type || 'Sintético').trim(),
		defaultIntervalKm: Number(oilData.defaultIntervalKm) || 10000,
		defaultIntervalDays: Number(oilData.defaultIntervalDays) || 180,
		active: oilData.active !== false,
		updatedAt: new Date(),
	};

	if (id) {
		await updateDoc(doc(db, OILS_COLLECTION, id), payload);
		return { id, ...payload };
	}

	const ref = await addDoc(collection(db, OILS_COLLECTION), {
		...payload,
		createdAt: new Date(),
	});
	return { id: ref.id, ...payload };
}

export async function savePartCatalogItem(partData, id = null) {
	const payload = {
		name: String(partData.name || '').trim(),
		sku: String(partData.sku || '').trim().toUpperCase(),
		category: String(partData.category || 'General').trim(),
		defaultPrice: Number(partData.defaultPrice) || 0,
		stock: Number(partData.stock ?? 0),
		minStock: Number(partData.minStock ?? 3),
		active: partData.active !== false,
		updatedAt: new Date(),
	};

	if (isDevBypassEnabled()) {
		const list = getLocalDemoParts();
		if (id) {
			const updated = list.map((p) => (p.id === id ? { ...p, ...payload } : p));
			saveLocalDemoParts(updated);
			return { id, ...payload };
		}
		const newItem = { id: `demo-part-${Date.now()}`, ...payload };
		saveLocalDemoParts([newItem, ...list]);
		return newItem;
	}

	if (id) {
		await updateDoc(doc(db, PARTS_COLLECTION, id), payload);
		return { id, ...payload };
	}

	const ref = await addDoc(collection(db, PARTS_COLLECTION), {
		...payload,
		createdAt: new Date(),
	});
	return { id: ref.id, ...payload };
}

export async function decrementPartsStock(partsUsed = []) {
	if (!Array.isArray(partsUsed) || partsUsed.length === 0) return;

	if (isDevBypassEnabled()) {
		const list = getLocalDemoParts();
		const updated = list.map((part) => {
			const match = partsUsed.find(
				(u) => (u.partId && u.partId === part.id) || (u.sku && u.sku === part.sku)
			);
			if (!match) return part;
			const nextStock = Math.max(0, (Number(part.stock) || 0) - (Number(match.qty) || 1));
			return { ...part, stock: nextStock };
		});
		saveLocalDemoParts(updated);
		return;
	}

	const batch = writeBatch(db);
	let hasUpdates = false;
	partsUsed.forEach((p) => {
		if (p.partId && !String(p.partId).startsWith('demo-')) {
			const qty = Math.max(1, Number(p.qty) || 1);
			batch.update(doc(db, PARTS_COLLECTION, p.partId), {
				stock: increment(-qty),
				updatedAt: new Date(),
			});
			hasUpdates = true;
		}
	});
	if (hasUpdates) {
		await batch.commit();
	}
}

export async function getLowStockParts() {
	try {
		const all = await getPartsCatalog(true);
		return all.filter((p) => {
			const stock = Number(p.stock ?? 0);
			const minStock = Number(p.minStock ?? 3);
			return stock <= minStock;
		});
	} catch {
		return [];
	}
}

export async function toggleCatalogItemActive(collectionName, id, active) {
	if (isDevBypassEnabled() && collectionName === PARTS_COLLECTION) {
		const list = getLocalDemoParts();
		saveLocalDemoParts(list.map((p) => (p.id === id ? { ...p, active } : p)));
		return;
	}
	await updateDoc(doc(db, collectionName, id), {
		active,
		updatedAt: new Date(),
	});
}

export async function seedDefaultCatalogs() {
	const [oilsSnap, partsSnap] = await Promise.all([
		getDocs(collection(db, OILS_COLLECTION)),
		getDocs(collection(db, PARTS_COLLECTION)),
	]);

	const batch = writeBatch(db);
	let created = 0;

	if (oilsSnap.empty) {
		DEFAULT_OILS.forEach((oil) => {
			const ref = doc(collection(db, OILS_COLLECTION));
			batch.set(ref, { ...oil, createdAt: new Date() });
			created += 1;
		});
	}

	if (partsSnap.empty) {
		DEFAULT_PARTS.forEach((part) => {
			const ref = doc(collection(db, PARTS_COLLECTION));
			batch.set(ref, { ...part, createdAt: new Date() });
			created += 1;
		});
	}

	if (created > 0) {
		await batch.commit();
	}
	return created;
}

export function formatOilLabel(oil) {
	if (!oil) return '';
	return [oil.brand, oil.name, oil.viscosity, oil.type ? `(${oil.type})` : '']
		.filter(Boolean)
		.join(' ');
}
