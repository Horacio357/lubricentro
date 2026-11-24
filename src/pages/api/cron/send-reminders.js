import apiInstance from '@/services/brevo/brevoConfig';
import { SendSmtpEmail } from '@getbrevo/brevo';
import { getFirebaseAdmin } from '@/services/firebase/firebaseAdminConfig';
import { PERMISSIONS, hasPermission } from '@/utils/permissions';
import {
	computeGlobalServiceAverages,
	estimateVehicleNextService,
} from '@/utils/serviceMetrics';

const COOLDOWN_DAYS = 25;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function authorizeRequest(req, adminServices) {
	// 1. Autorización por Vercel Cron Secret (GET/POST)
	const cronSecret = process.env.CRON_SECRET;
	const authHeader = req.headers.authorization || '';
	if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
		return { mode: 'cron', uid: 'cron' };
	}

	// 2. Autorización por Super Admin / permiso VIEW_DASHBOARD
	const token = authHeader.startsWith('Bearer ')
		? authHeader.slice(7).trim()
		: null;
	if (!token) {
		return { error: 'No autorizado.', status: 401 };
	}

	try {
		const decoded = await adminServices.auth.verifyIdToken(token);
		const staffSnap = await adminServices.db
			.collection('staff_users')
			.doc(decoded.uid)
			.get();

		if (
			!staffSnap.exists ||
			!hasPermission(staffSnap.data(), PERMISSIONS.VIEW_DASHBOARD)
		) {
			return { error: 'Permisos insuficientes.', status: 403 };
		}
		return { mode: 'manual', uid: decoded.uid };
	} catch (err) {
		return { error: 'Token inválido o expirado.', status: 401 };
	}
}

function buildReminderHtml({ firstName, lastName, vehicle, estimate }) {
	const link = `https://mi.rudyservices.com.ar/${vehicle.id}`;
	const statusText =
		estimate.daysUntilDue <= 0
			? `ya superó la fecha estimada de su próximo service (hace ${Math.abs(
					estimate.daysUntilDue
			  )} días)`
			: `está próximo a cumplir el intervalo recomendado (en ${estimate.daysUntilDue} días)`;

	return `
		<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
				<div style="background-color: #202020; color: #fff; padding: 20px;">
					<h2 style="margin: 0; color:#FCBD00;">Recordatorio de Service — R Services</h2>
				</div>
				<div style="padding: 25px 20px;">
					<p>Hola <strong>${firstName || ''} ${lastName || ''}</strong>,</p>
					<p>Te escribimos de <strong>RudyServices</strong> porque tu <strong>${
						vehicle.brand || ''
					} ${vehicle.model || ''}</strong> (patente <strong>${
		vehicle.patente || ''
	}</strong>) ${statusText}.</p>
					${
						estimate.estimatedNextKm
							? `<p>Kilometraje estimado para el próximo control: <strong>${estimate.estimatedNextKm.toLocaleString(
									'es-AR'
							  )} km</strong>.</p>`
							: ''
					}
					<p style="text-align: center; margin: 22px 0;">
						<a href="${link}" style="background-color: #FCBD00; color: #202020; text-decoration: none; padding: 11px 22px; border-radius: 6px; display: inline-block;">
							<b>Ver historial en miRudy</b>
						</a>
					</p>
					<p>Te esperamos en el lubricentro para mantener tu vehículo al día.</p>
				</div>
			</div>
		</div>
	`;
}

export default async function handler(req, res) {
	if (req.method !== 'GET' && req.method !== 'POST') {
		return res.status(405).json({ message: 'Método no permitido' });
	}

	const adminServices = getFirebaseAdmin();
	if (!adminServices) {
		return res.status(503).json({
			message:
				'Firebase Admin SDK no configurado. Configura FIREBASE_SERVICE_ACCOUNT_KEY en .env.local para enviar avisos.',
		});
	}

	const authCheck = await authorizeRequest(req, adminServices);
	if (authCheck.error) {
		return res.status(authCheck.status).json({ message: authCheck.error });
	}

	const { db } = adminServices;
	const targetVehicleId = req.body?.vehicleId || null;
	const forceSend = Boolean(req.body?.force);

	try {
		const now = new Date();
		const [vehiclesSnap, servicesSnap, logsSnap] = await Promise.all([
			db.collection('vehicles').get(),
			db.collectionGroup('services').get(),
			db
				.collection('reminders_log')
				.where('sentAt', '>=', new Date(now.getTime() - COOLDOWN_DAYS * MS_PER_DAY))
				.get(),
		]);

		const recentlyNotified = new Set();
		logsSnap.forEach((docSnap) => {
			const vId = docSnap.data().vehicleId;
			if (vId) recentlyNotified.add(vId);
		});

		const vehicles = [];
		const servicesByVehicle = {};
		vehiclesSnap.forEach((docSnap) => {
			const v = { id: docSnap.id, ...docSnap.data() };
			vehicles.push(v);
			servicesByVehicle[docSnap.id] = [];
		});

		servicesSnap.forEach((docSnap) => {
			if (docSnap.ref.path.startsWith('vehicles/')) {
				const vId = docSnap.ref.parent?.parent?.id;
				if (vId && servicesByVehicle[vId]) {
					servicesByVehicle[vId].push({ id: docSnap.id, ...docSnap.data() });
				}
			}
		});

		const globalAverages = computeGlobalServiceAverages(
			vehicles.map((v) => ({ id: v.id, services: servicesByVehicle[v.id] || [] }))
		);

		const candidates = vehicles
			.filter((v) => !targetVehicleId || v.id === targetVehicleId)
			.map((v) => ({
				vehicle: v,
				estimate: estimateVehicleNextService(
					v,
					servicesByVehicle[v.id] || [],
					globalAverages,
					now
				),
			}))
			.filter(
				({ estimate }) =>
					estimate &&
					(estimate.status === 'overdue' || estimate.status === 'due_soon')
			);

		let sentCount = 0;
		let skippedCooldown = 0;
		let skippedNoEmail = 0;
		const errors = [];

		for (const { vehicle, estimate } of candidates) {
			if (!forceSend && recentlyNotified.has(vehicle.id)) {
				skippedCooldown += 1;
				continue;
			}

			const privSnap = await db
				.collection('vehicles_private')
				.doc(vehicle.id)
				.get();
			const privData = privSnap.exists ? privSnap.data() : null;

			if (!privData || !privData.email) {
				skippedNoEmail += 1;
				continue;
			}

			try {
				const emailMsg = new SendSmtpEmail();
				emailMsg.subject = `Recordatorio de service para tu ${vehicle.brand || ''} ${
					vehicle.model || ''
				}`.trim();
				emailMsg.htmlContent = buildReminderHtml({
					firstName: privData.owner_name,
					lastName: privData.owner_surname,
					vehicle,
					estimate,
				});
				emailMsg.sender = {
					name: 'Equipo de RudyServices',
					email: 'info@rudyservices.com.ar',
				};
				emailMsg.to = [
					{
						email: privData.email,
						name: `${privData.owner_name || ''} ${
							privData.owner_surname || ''
						}`.trim(),
					},
				];

				await apiInstance.sendTransacEmail(emailMsg);
				await db.collection('reminders_log').add({
					vehicleId: vehicle.id,
					patente: vehicle.patente || '',
					email: privData.email,
					daysUntilDue: estimate.daysUntilDue,
					mode: authCheck.mode,
					triggeredBy: authCheck.uid,
					sentAt: new Date(),
				});
				sentCount += 1;
			} catch (err) {
				errors.push({
					vehicleId: vehicle.id,
					message: err.message || 'Error Brevo',
				});
			}
		}

		return res.status(200).json({
			evaluated: candidates.length,
			sentCount,
			skippedCooldown,
			skippedNoEmail,
			errors,
		});
	} catch (error) {
		console.error('Error enviando recordatorios:', error);
		return res.status(500).json({
			message: 'Error procesando recordatorios automáticos.',
		});
	}
}
