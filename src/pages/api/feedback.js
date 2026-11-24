import apiInstance from '@/services/brevo/brevoConfig';
import { SendSmtpEmail } from '@getbrevo/brevo';
import { getFirebaseAdmin } from '@/services/firebase/firebaseAdminConfig';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Método no permitido' });
	}

	const {
		vehicleId,
		serviceId,
		unitLabel,
		brandModel,
		serviceName,
		rating,
		comment,
		clientName,
	} = req.body || {};

	const numericRating = Number(rating);
	if (!vehicleId || !serviceId || !numericRating || numericRating < 1 || numericRating > 5) {
		return res.status(400).json({ message: 'Datos de calificación inválidos.' });
	}

	const feedbackRecord = {
		vehicleId,
		serviceId,
		unitLabel: unitLabel || '',
		brandModel: brandModel || '',
		serviceName: serviceName || '',
		clientName: clientName || 'Cliente NFC',
		rating: numericRating,
		comment: String(comment || '').trim(),
		isLowRating: numericRating <= 3,
		createdAt: new Date(),
	};

	// 1. Guardar en Firestore si firebase-admin está configurado
	const adminServices = getFirebaseAdmin();
	if (adminServices) {
		try {
			await adminServices.db
				.collection('service_feedback')
				.add(feedbackRecord);
			await adminServices.db
				.doc(`vehicles/${vehicleId}/services/${serviceId}`)
				.set(
					{
						feedback: {
							rating: numericRating,
							comment: feedbackRecord.comment,
							createdAt: new Date(),
						},
					},
					{ merge: true }
				);
		} catch (err) {
			console.warn('No se pudo guardar feedback en Firestore:', err.message);
		}
	}

	// 2. Disparar alerta automática por Brevo si la calificación es baja (<= 3)
	let emailAlertSent = false;
	const alertRecipient =
		process.env.WORKSHOP_ALERT_EMAIL || 'info@rudyservices.com.ar';
	if (numericRating <= 3 && process.env.BREVO_API_KEY) {
		try {
			const msg = new SendSmtpEmail();
			msg.subject = `⚠️ Calificación baja (${numericRating}/5) - ${unitLabel || vehicleId}`;
			msg.htmlContent = `
				<div style="font-family: Arial, sans-serif; padding: 16px;">
					<h3 style="color: #ce2626; margin-top: 0;">Alerta de Encuesta Post-Servicio</h3>
					<p><strong>Calificación:</strong> ${numericRating} / 5 estrellas</p>
					<p><strong>Cliente:</strong> ${feedbackRecord.clientName}</p>
					<p><strong>Unidad:</strong> ${unitLabel || '-'} (${brandModel || '-'})</p>
					<p><strong>Servicio evaluado:</strong> ${serviceName || '-'}</p>
					<p><strong>Comentario:</strong> ${feedbackRecord.comment || 'Sin comentario'}</p>
					<p><a href="https://mi.rudyservices.com.ar/${vehicleId}">Ver ficha de la unidad</a></p>
				</div>
			`;
			msg.sender = {
				name: 'Alertas R Services',
				email: 'info@rudyservices.com.ar',
			};
			msg.to = [{ email: alertRecipient, name: 'Super Admin R Services' }];
			await apiInstance.sendTransacEmail(msg);
			emailAlertSent = true;
		} catch (err) {
			console.warn('No se pudo enviar alerta Brevo:', err.message);
		}
	}

	// 3. Disparar Webhook saliente hacia Rudy Manager / CRM si CRM_WEBHOOK_URL está configurado
	let webhookDelivered = false;
	if (process.env.CRM_WEBHOOK_URL) {
		try {
			const hookRes = await fetch(process.env.CRM_WEBHOOK_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(process.env.EXTERNAL_CRM_API_KEY
						? { 'x-api-key': process.env.EXTERNAL_CRM_API_KEY }
						: {}),
				},
				body: JSON.stringify({
					event: 'service.feedback_submitted',
					data: feedbackRecord,
				}),
			});
			webhookDelivered = hookRes.ok;
		} catch (err) {
			console.warn('Error enviando webhook a CRM:', err.message);
		}
	}

	return res.status(200).json({
		success: true,
		emailAlertSent,
		webhookDelivered,
		isLowRating: numericRating <= 3,
	});
}
