import React, { useEffect, useState, useCallback } from 'react';
import {
	getAppointments,
	updateAppointmentStatus,
	createAppointmentRecord,
	APPOINTMENT_STATUS,
	APPOINTMENT_STATUS_LABELS,
} from '@/utils/firebase/appointmentsHandlers';
import { buildWhatsAppUrl } from '@/utils/whatsappHelper';
import st from '../DashboardPanel/DashboardPanel.module.css';

const AppointmentsPanel = () => {
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState('ALL');
	const [confirmingId, setConfirmingId] = useState(null);
	const [scheduledDate, setScheduledDate] = useState('');
	const [confirmNotes, setConfirmNotes] = useState('');

	const [newForm, setNewForm] = useState({
		clientName: '',
		phone: '',
		unitLabel: '',
		requestedService: 'Cambio de Aceite',
		scheduledDate: '',
		notes: '',
	});
	const [showNewForm, setShowNewForm] = useState(false);

	const loadAppointments = useCallback(async () => {
		setLoading(true);
		try {
			const list = await getAppointments();
			setAppointments(list);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadAppointments();
	}, [loadAppointments]);

	const handleConfirm = async (id) => {
		await updateAppointmentStatus(id, {
			status: APPOINTMENT_STATUS.CONFIRMED,
			scheduledDate,
			notes: confirmNotes,
		});
		setConfirmingId(null);
		setScheduledDate('');
		setConfirmNotes('');
		await loadAppointments();
	};

	const handleCreateManual = async (e) => {
		e.preventDefault();
		await createAppointmentRecord({
			...newForm,
			status: APPOINTMENT_STATUS.CONFIRMED,
		});
		setNewForm({
			clientName: '',
			phone: '',
			unitLabel: '',
			requestedService: 'Cambio de Aceite',
			scheduledDate: '',
			notes: '',
		});
		setShowNewForm(false);
		await loadAppointments();
	};

	const filtered = appointments.filter((a) =>
		filterStatus === 'ALL' ? true : a.status === filterStatus
	);

	const requestsCount = appointments.filter(
		(a) => a.status === APPOINTMENT_STATUS.WHATSAPP_REQUESTED
	).length;
	const confirmedCount = appointments.filter(
		(a) => a.status === APPOINTMENT_STATUS.CONFIRMED
	).length;

	return (
		<div className={st.container}>
			<div className={st.header}>
				<div>
					<h3 className={st.title}>Turnos y Solicitudes WhatsApp</h3>
					<p className={st.subtitle}>
						Diferencia solicitudes entrantes por WhatsApp de turnos confirmados en agenda
					</p>
				</div>
				<div className={st.controls}>
					<select
						className={st.periodSelect}
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
					>
						<option value="ALL">Todos ({appointments.length})</option>
						<option value={APPOINTMENT_STATUS.WHATSAPP_REQUESTED}>
							Solicitudes WhatsApp ({requestsCount})
						</option>
						<option value={APPOINTMENT_STATUS.CONFIRMED}>
							Turnos Confirmados ({confirmedCount})
						</option>
						<option value={APPOINTMENT_STATUS.COMPLETED}>Completados</option>
						<option value={APPOINTMENT_STATUS.CANCELLED}>Cancelados</option>
					</select>
					<button
						type="button"
						className={st.refreshButton}
						onClick={() => setShowNewForm((s) => !s)}
					>
						{showNewForm ? 'Cerrar' : '+ Agendar Turno'}
					</button>
				</div>
			</div>

			{showNewForm && (
				<form onSubmit={handleCreateManual} className={st.remindersCard}>
					<h4 className={st.chartTitle}>Registrar Turno Confirmado</h4>
					<div className={st.controls}>
						<input
							className={st.periodSelect}
							placeholder="Nombre del cliente"
							value={newForm.clientName}
							onChange={(e) =>
								setNewForm({ ...newForm, clientName: e.target.value })
							}
							required
							style={{ flex: 1 }}
						/>
						<input
							className={st.periodSelect}
							placeholder="Teléfono"
							value={newForm.phone}
							onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
						/>
						<input
							className={st.periodSelect}
							placeholder="Patente o Serie/Interno"
							value={newForm.unitLabel}
							onChange={(e) =>
								setNewForm({ ...newForm, unitLabel: e.target.value })
							}
							required
						/>
					</div>
					<div className={st.controls}>
						<input
							className={st.periodSelect}
							placeholder="Servicio (ej. Cambio de Aceite)"
							value={newForm.requestedService}
							onChange={(e) =>
								setNewForm({ ...newForm, requestedService: e.target.value })
							}
							required
							style={{ flex: 1 }}
						/>
						<input
							className={st.periodSelect}
							placeholder="Fecha y hora (ej. 27/11 10:00)"
							value={newForm.scheduledDate}
							onChange={(e) =>
								setNewForm({ ...newForm, scheduledDate: e.target.value })
							}
							required
						/>
					</div>
					<input
						className={st.periodSelect}
						placeholder="Notas / insumos a preparar"
						value={newForm.notes}
						onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
					/>
					<button type="submit" className={st.sendOneBtn}>
						Guardar Turno Confirmado
					</button>
				</form>
			)}

			{loading ? (
				<p className={st.emptyState}>Cargando turnos...</p>
			) : filtered.length === 0 ? (
				<p className={st.emptyState}>No hay solicitudes ni turnos en esta vista.</p>
			) : (
				<div className={st.dueList}>
					{filtered.map((apt) => {
						const isRequest =
							apt.status === APPOINTMENT_STATUS.WHATSAPP_REQUESTED;
						const isConfirmed = apt.status === APPOINTMENT_STATUS.CONFIRMED;
						return (
							<div key={apt.id} className={st.dueItem}>
								<div className={st.dueInfo}>
									<div className={st.dueTitleRow}>
										<strong>
											{apt.clientName}
											{apt.clientNumber ? ` (${apt.clientNumber})` : ''}
										</strong>
										<span
											className={
												isRequest ? st.badgeSoon : st.badgeOverdue
											}
											style={
												isConfirmed
													? {
															backgroundColor: 'rgba(10, 185, 10, 0.18)',
															color: '#7ee87e',
													  }
													: undefined
											}
										>
											{APPOINTMENT_STATUS_LABELS[apt.status] || apt.status}
										</span>
									</div>
									<span className={st.dueMeta}>
										{apt.unitLabel} {apt.brandModel ? `· ${apt.brandModel}` : ''} ·{' '}
										{apt.requestedService}
										{apt.dueReference ? ` (Venc: ${apt.dueReference})` : ''}
									</span>
									{apt.scheduledDate && (
										<span className={st.dueMeta} style={{ color: '#7ee87e' }}>
											Fecha confirmada: {apt.scheduledDate}
										</span>
									)}
									{apt.notes && <span className={st.dueMeta}>Nota: {apt.notes}</span>}
								</div>

								<div className={st.dueActions}>
									{apt.vehicleId && (
										<a
											href={`/${apt.vehicleId}`}
											className={st.linkBtn}
											target="_blank"
											rel="noreferrer"
										>
											Ver Ficha
										</a>
									)}
									{apt.phone && (
										<a
											href={buildWhatsAppUrl(
												apt.phone,
												`Hola ${apt.clientName}! Te confirmamos disponibilidad en R Services para ${apt.requestedService} de ${apt.unitLabel}.`
											)}
											target="_blank"
											rel="noreferrer"
											className={st.linkBtn}
											style={{ borderColor: '#25D366', color: '#25D366' }}
										>
											WhatsApp
										</a>
									)}
									{isRequest && (
										<button
											type="button"
											className={st.sendOneBtn}
											onClick={() => {
												setConfirmingId(apt.id);
												setScheduledDate(apt.scheduledDate || '');
												setConfirmNotes(apt.notes || '');
											}}
										>
											Confirmar Turno
										</button>
									)}
									{isConfirmed && (
										<button
											type="button"
											className={st.linkBtn}
											onClick={async () => {
												await updateAppointmentStatus(apt.id, {
													status: APPOINTMENT_STATUS.COMPLETED,
												});
												await loadAppointments();
											}}
										>
											Marcar Atendido
										</button>
									)}
								</div>

								{confirmingId === apt.id && (
									<div
										style={{
											width: '100%',
											marginTop: 8,
											display: 'flex',
											flexWrap: 'wrap',
											gap: 8,
										}}
									>
										<input
											className={st.periodSelect}
											placeholder="Fecha y hora (ej. 28/11 10:30)"
											value={scheduledDate}
											onChange={(e) => setScheduledDate(e.target.value)}
										/>
										<input
											className={st.periodSelect}
											placeholder="Insumos/notas para el taller"
											value={confirmNotes}
											onChange={(e) => setConfirmNotes(e.target.value)}
											style={{ flex: 1 }}
										/>
										<button
											type="button"
											className={st.sendOneBtn}
											onClick={() => handleConfirm(apt.id)}
										>
											Guardar Confirmación
										</button>
										<button
											type="button"
											className={st.linkBtn}
											onClick={() => setConfirmingId(null)}
										>
											Cancelar
										</button>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default AppointmentsPanel;
