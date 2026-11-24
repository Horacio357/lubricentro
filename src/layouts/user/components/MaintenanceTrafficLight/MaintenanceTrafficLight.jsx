import React from 'react';
import { estimateVehicleNextService, computeGlobalServiceAverages } from '@/utils/serviceMetrics';
import { formatDate, formatVertical } from '@/utils/firebase/firebase';
import { getUnitIdentifier, getUsageUnit } from '@/utils/serviceTemplates';
import { buildWhatsAppUrl } from '@/utils/whatsappHelper';

const STATUS_STYLES = {
	ok: {
		bg: 'rgba(10, 185, 10, 0.12)',
		border: 'rgba(10, 185, 10, 0.45)',
		dot: '#22c55e',
		label: 'Mantenimiento al día',
	},
	due_soon: {
		bg: 'rgba(252, 189, 0, 0.14)',
		border: 'rgba(252, 189, 0, 0.55)',
		dot: '#FCBD00',
		label: 'Próximo a mantenimiento',
	},
	overdue: {
		bg: 'rgba(206, 38, 38, 0.15)',
		border: 'rgba(206, 38, 38, 0.55)',
		dot: '#ef4444',
		label: 'Mantenimiento vencido',
	},
};

const MaintenanceTrafficLight = ({ data, privateData }) => {
	const services = Array.isArray(data?.services) ? data.services : [];
	if (services.length === 0) return null;

	const globalAverages = computeGlobalServiceAverages([
		{ id: data.id, services },
	]);
	const estimate = estimateVehicleNextService(data, services, globalAverages);
	if (!estimate) return null;

	const lastService = services[services.length - 1];
	const usageUnit = getUsageUnit(data);
	const style = STATUS_STYLES[estimate.status] || STATUS_STYLES.ok;

	const lastDateStr = formatDate(lastService.timestamp) || 'sin fecha';
	const hasExplicitNext = Boolean(lastService.next_service);

	const basisText = hasExplicitNext
		? `Calculado sobre último service (${lastDateStr}, ${lastService.kilometraje} ${usageUnit}) y próximo mantenimiento registrado (${lastService.next_service}).`
		: `Calculado por tiempo transcurrido desde el último service (${lastDateStr}, ${lastService.kilometraje} ${usageUnit}) con intervalo estimado de ${estimate.estimatedIntervalDays} días.`;

	const clientName = privateData
		? `${privateData.owner_name || ''} ${privateData.owner_surname || ''}`.trim()
		: '';
	const clientNumber = data.clientNumber || privateData?.clientNumber || '';

	const whatsappMessage = [
		`Hola${clientName ? `, soy ${clientName}` : ''}${
			clientNumber ? ` (cliente ${clientNumber})` : ''
		}.`,
		`Quiero solicitar turno para ${
			formatVertical(estimate.lastVertical) || estimate.lastVertical
		} de mi ${
			data.unitType === 'autoelevador' ? 'autoelevador' : 'vehículo'
		} ${getUnitIdentifier(data)}.`,
		hasExplicitNext
			? `Próximo mantenimiento registrado: ${lastService.next_service}.`
			: estimate.estimatedNextKm
				? `Próximo estimado: ${estimate.estimatedNextKm.toLocaleString(
						'es-AR'
				  )} ${usageUnit}.`
				: null,
		`Ficha: https://mi.rudyservices.com.ar/${data.id || ''}`,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div
			style={{
				width: '100%',
				boxSizing: 'border-box',
				padding: '14px 16px',
				borderRadius: 14,
				backgroundColor: style.bg,
				border: `1px solid ${style.border}`,
				display: 'flex',
				flexDirection: 'column',
				gap: 8,
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<span
					style={{
						width: 12,
						height: 12,
						borderRadius: '50%',
						backgroundColor: style.dot,
						boxShadow: `0 0 8px ${style.dot}`,
						flexShrink: 0,
					}}
				/>
				<strong style={{ fontSize: '0.98em', color: '#fff' }}>
					{style.label}
				</strong>
				<span
					style={{
						marginLeft: 'auto',
						fontSize: '0.78em',
						color: '#d4d4d4',
					}}
				>
					{estimate.daysUntilDue <= 0
						? `Vencido hace ${Math.abs(estimate.daysUntilDue)} días`
						: `En aprox. ${estimate.daysUntilDue} días`}
				</span>
			</div>

			<p style={{ margin: 0, fontSize: '0.8em', color: '#d4d4d4', lineHeight: 1.4 }}>
				{basisText}
			</p>

			<a
				href={buildWhatsAppUrl(
					process.env.NEXT_PUBLIC_WORKSHOP_WHATSAPP || '',
					whatsappMessage
				)}
				target="_blank"
				rel="noreferrer"
				style={{
					marginTop: 4,
					display: 'block',
					textAlign: 'center',
					textDecoration: 'none',
					padding: '9px 12px',
					borderRadius: 10,
					border: '1px solid #25D366',
					color: '#25D366',
					fontWeight: 700,
					fontSize: '0.85em',
				}}
			>
				Solicitar turno por WhatsApp
			</a>
		</div>
	);
};

export default MaintenanceTrafficLight;
