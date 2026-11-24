import React, { useState } from 'react';
import { formatVertical } from '@/utils/firebase/firebase';
import { getUnitIdentifier } from '@/utils/serviceTemplates';
import { buildWhatsAppUrl } from '@/utils/whatsappHelper';

const ServiceFeedbackWidget = ({ vehicleData = {}, privateVehicle = null, service = {} }) => {
	const [rating, setRating] = useState(service.feedback?.rating || 0);
	const [comment, setComment] = useState(service.feedback?.comment || '');
	const [submitted, setSubmitted] = useState(Boolean(service.feedback?.rating));
	const [submitting, setSubmitting] = useState(false);

	const unitLabel = getUnitIdentifier(vehicleData);
	const brandModel = `${vehicleData.brand || ''} ${vehicleData.model || ''}`.trim();
	const serviceName = formatVertical(service.vertical) || service.vertical;
	const clientName = privateVehicle
		? `${privateVehicle.owner_name || ''} ${privateVehicle.owner_surname || ''}`.trim()
		: 'Cliente';

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!rating) return;
		setSubmitting(true);
		try {
			await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					vehicleId: vehicleData.id,
					serviceId: service.id,
					unitLabel,
					brandModel,
					serviceName,
					clientName,
					rating,
					comment,
				}),
			});
			setSubmitted(true);
		} catch (err) {
			console.error(err);
			setSubmitted(true);
		} finally {
			setSubmitting(false);
		}
	};

	const whatsappFeedbackUrl = buildWhatsAppUrl(
		process.env.NEXT_PUBLIC_WORKSHOP_WHATSAPP || '',
		`Hola R Services, soy ${clientName}. Evalué el servicio de ${serviceName} (${unitLabel}) con ${rating}/5 estrellas.${
			comment ? ` Comentario: ${comment}` : ''
		}`
	);

	return (
		<div
			style={{
				marginTop: 12,
				padding: 12,
				borderRadius: 10,
				border: '1px solid #363636',
				backgroundColor: 'rgba(255, 255, 255, 0.03)',
				display: 'flex',
				flexDirection: 'column',
				gap: 8,
			}}
		>
			<strong style={{ fontSize: '0.84em', color: '#FCBD00' }}>
				¿Cómo fue tu experiencia con este servicio?
			</strong>

			{submitted ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
					<span style={{ fontSize: '0.82em', color: '#a8e6cf' }}>
						¡Gracias! Registramos tu calificación ({rating}/5).
					</span>
					{rating <= 3 && (
						<a
							href={whatsappFeedbackUrl}
							target="_blank"
							rel="noreferrer"
							style={{
								textAlign: 'center',
								textDecoration: 'none',
								padding: '7px 10px',
								borderRadius: 8,
								border: '1px solid #25D366',
								color: '#25D366',
								fontSize: '0.8em',
								fontWeight: 700,
							}}
						>
							Hablar directo con el responsable por WhatsApp
						</a>
					)}
				</div>
			) : (
				<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
					<div style={{ display: 'flex', gap: 6 }}>
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => setRating(star)}
								style={{
									flex: 1,
									padding: '6px 0',
									borderRadius: 8,
									border:
										rating >= star ? '1px solid #FCBD00' : '1px solid #363636',
									backgroundColor:
										rating >= star ? 'rgba(252, 189, 0, 0.2)' : '#242424',
									color: rating >= star ? '#FCBD00' : '#b3b3b3',
									fontWeight: 700,
									cursor: 'pointer',
								}}
							>
								{star} ★
							</button>
						))}
					</div>
					<input
						type="text"
						placeholder="Comentario breve (opcional)"
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						style={{
							width: '100%',
							boxSizing: 'border-box',
							padding: '7px 10px',
							borderRadius: 8,
							border: '1px solid #363636',
							backgroundColor: '#242424',
							color: '#fff',
							fontSize: '0.82em',
						}}
					/>
					<button
						type="submit"
						disabled={!rating || submitting}
						style={{
							border: 'none',
							borderRadius: 8,
							padding: '8px 12px',
							backgroundColor: rating ? '#FCBD00' : '#363636',
							color: rating ? '#000' : '#888',
							fontWeight: 700,
							fontSize: '0.82em',
							cursor: rating ? 'pointer' : 'not-allowed',
						}}
					>
						{submitting ? 'Enviando...' : 'Enviar Calificación'}
					</button>
				</form>
			)}
		</div>
	);
};

export default ServiceFeedbackWidget;
