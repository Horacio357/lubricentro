import { db } from '@/services/firebase/firebaseConfig';
import {
	collection,
	addDoc,
	getDocs,
	doc,
	updateDoc,
	orderBy,
	query,
} from 'firebase/firestore';
import { isDevBypassEnabled } from '@/utils/devMockData';

const APPOINTMENTS_COLLECTION = 'appointments';

export const APPOINTMENT_STATUS = {
	WHATSAPP_REQUESTED: 'solicitado_whatsapp',
	CONFIRMED: 'turno_confirmado',
	COMPLETED: 'completado',
	CANCELLED: 'cancelado',
};

export const APPOINTMENT_STATUS_LABELS = {
	[APPOINTMENT_STATUS.WHATSAPP_REQUESTED]: 'Solicitud WhatsApp',
	[APPOINTMENT_STATUS.CONFIRMED]: 'Turno Confirmado',
	[APPOINTMENT_STATUS.COMPLETED]: 'Completado',
	[APPOINTMENT_STATUS.CANCELLED]: 'Cancelado',
};

const DEMO_APPOINTMENTS = [
	{
		id: 'apt-demo-1',
		vehicleId: 'demo-gol',
		unitLabel: 'AB123CD',
		brandModel: 'VOLKSWAGEN GOL TREND',
		clientName: 'MARÍA GÓMEZ',
		phone: '11 4444-8821',
		requestedService: 'Cambio de Aceite',
		dueReference: '76000 km',
		status: APPOINTMENT_STATUS.WHATSAPP_REQUESTED,
		scheduledDate: '',
		notes: 'Cliente consultó por WhatsApp desde el chip NFC.',
		createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
	},
	{
		id: 'apt-demo-2',
		vehicleId: 'demo-autoelevador',
		unitLabel: 'Serie 8FG25-44102 · Int. AE-04',
		brandModel: 'TOYOTA 8FG25 AUTOELEVADOR',
		clientName: 'LOGÍSTICA SUR S.A.',
		clientNumber: 'CL-0108',
		phone: '11 6666-3300',
		requestedService: 'Cambio de Aceite',
		dueReference: '1670 hs',
		status: APPOINTMENT_STATUS.CONFIRMED,
		scheduledDate: '2026-11-26 09:30',
		notes: 'Preparar filtros MANN W712/95 y Donaldson P821575.',
		createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
	},
];

function getLocalDemoAppointments() {
	if (typeof window === 'undefined') return DEMO_APPOINTMENTS;
	try {
		const raw = window.localStorage.getItem('rudy_demo_appointments');
		if (!raw) {
			window.localStorage.setItem(
				'rudy_demo_appointments',
				JSON.stringify(DEMO_APPOINTMENTS)
			);
			return DEMO_APPOINTMENTS;
		}
		return JSON.parse(raw);
	} catch {
		return DEMO_APPOINTMENTS;
	}
}

function saveLocalDemoAppointments(list) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem('rudy_demo_appointments', JSON.stringify(list));
	} catch {
		// ignorar errores de almacenamiento
	}
}

export async function createAppointmentRecord(payload) {
	const record = {
		vehicleId: payload.vehicleId || '',
		unitLabel: payload.unitLabel || '',
		brandModel: payload.brandModel || '',
		clientName: payload.clientName || 'Cliente',
		clientNumber: payload.clientNumber || '',
		phone: payload.phone || '',
		requestedService: payload.requestedService || '',
		dueReference: payload.dueReference || '',
		status: payload.status || APPOINTMENT_STATUS.WHATSAPP_REQUESTED,
		scheduledDate: payload.scheduledDate || '',
		notes: payload.notes || '',
		createdAt: new Date(),
	};

	if (isDevBypassEnabled()) {
		const list = getLocalDemoAppointments();
		const demoItem = {
			...record,
			id: `apt-${Date.now()}`,
			createdAt: new Date().toISOString(),
		};
		saveLocalDemoAppointments([demoItem, ...list]);
		return demoItem;
	}

	const ref = await addDoc(collection(db, APPOINTMENTS_COLLECTION), record);
	return { id: ref.id, ...record };
}

export async function getAppointments() {
	if (isDevBypassEnabled()) {
		return getLocalDemoAppointments();
	}

	const q = query(
		collection(db, APPOINTMENTS_COLLECTION),
		orderBy('createdAt', 'desc')
	);
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({
		id: d.id,
		...d.data(),
		createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() || null,
	}));
}

export async function updateAppointmentStatus(id, updates) {
	if (isDevBypassEnabled()) {
		const list = getLocalDemoAppointments();
		const updated = list.map((item) =>
			item.id === id ? { ...item, ...updates } : item
		);
		saveLocalDemoAppointments(updated);
		return;
	}

	await updateDoc(doc(db, APPOINTMENTS_COLLECTION, id), {
		...updates,
		updatedAt: new Date(),
	});
}
