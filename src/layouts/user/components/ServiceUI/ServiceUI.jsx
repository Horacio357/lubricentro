import React, { useEffect, useState } from 'react';
import st from './ServiceUI.module.css';
import {
	formatDate,
	formatVertical,
	updateService,
} from '@/utils/firebase/firebase';
import { useService } from '../../hooks/useService';
import InfoField from '../InfoField/InfoField';
import DeleteUI from './components/DeleteUI/DeleteUI';
import { formatPrice } from '@/utils/helpers';
import DropdownBox from '../DropdownBox/DropdownBox';
import Lubricentro from './components/Lubricentro/Lubricentro';
import ChecklistUI from './components/ChecklistUI/ChecklistUI';
import LubricentroUI from '../AddServiceUI/components/ServiceForm/components/LubricentroUI/LubricentroUI';
import AirConditioningUI from '../AddServiceUI/components/ServiceForm/components/AirConditioningUI/AirConditioningUI';
import TiresUI from '../AddServiceUI/components/ServiceForm/components/TiresUI/TiresUI';
import PartsSelectorUI from '../AddServiceUI/components/ServiceForm/components/PartsSelectorUI/PartsSelectorUI';
import { formatChipSummary } from '@/utils/chipFormatter';
import { downloadServiceReceiptPdf } from '@/utils/pdfReceipt';
import {
	SERVICE_VERTICALS,
	generateClientSummary,
	getUsageUnit,
	getUnitIdentifier,
} from '@/utils/serviceTemplates';
import { buildWhatsAppUrl } from '@/utils/whatsappHelper';
import {
	createAppointmentRecord,
	APPOINTMENT_STATUS,
} from '@/utils/firebase/appointmentsHandlers';
import ServiceFeedbackWidget from './components/ServiceFeedbackWidget';
import editSt from '../EditForm.module.css';

const VERTICALS = SERVICE_VERTICALS;

const ServiceUI = ({
	vehicleId,
	vehicleData = {},
	privateVehicle = null,
	data,
	privateData,
	isAdmin,
	isLatest = false,
	canViewPrices = false,
	canEditService = false,
	canDeleteService = false,
	updatedBy = null,
	onDelete,
}) => {
	const { handleDeleteService, fetchState, FETCH_STATES } = useService();
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [form, setForm] = useState({});
	const [copiedChip, setCopiedChip] = useState(false);

	useEffect(() => {
		if (fetchState === FETCH_STATES.SUCCESS) {
			onDelete();
		}
	}, [fetchState, FETCH_STATES.SUCCESS, onDelete]);

	const startEditing = () => {
		setForm({
			kilometraje: data.kilometraje || '',
			vertical: data.vertical || 'LUBRICENTRO',
			vertical_data: data.vertical_data || {},
			partsUsed: Array.isArray(data.partsUsed) ? data.partsUsed : [],
			details: data.details || '',
			next_service: data.next_service || '',
			importe:
				privateData && typeof privateData.importe === 'number'
					? String(privateData.importe / 100)
					: '',
		});
		setError(null);
		setIsEditing(true);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		if (!vehicleId) return;
		setSaving(true);
		setError(null);
		try {
			const chipText = formatChipSummary({
				vehicle: vehicleData,
				service: { ...data, ...form },
			});
			await updateService(vehicleId, data.id, { ...form, chipText }, updatedBy);
			setIsEditing(false);
			if (onDelete) await onDelete();
		} catch (err) {
			setError(err.message || 'No se pudo actualizar el service.');
		} finally {
			setSaving(false);
		}
	};

	const chipDisplay =
		data.chipText ||
		formatChipSummary({
			vehicle: vehicleData,
			service: data,
		});

	const handleCopyChip = async () => {
		try {
			await navigator.clipboard.writeText(chipDisplay);
			setCopiedChip(true);
			setTimeout(() => setCopiedChip(false), 1800);
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<DropdownBox buttonText={`Service ${formatDate(data.timestamp)}`}>
			<h4 className={st.title}>Service {formatDate(data.timestamp)}</h4>

			{isEditing ? (
				<form onSubmit={handleSave} className={editSt.editForm}>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Kilometraje</label>
						<input
							className={editSt.input}
							type="number"
							value={form.kilometraje}
							onChange={(e) => setForm({ ...form, kilometraje: e.target.value })}
							required
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Categoría</label>
						<select
							className={editSt.select}
							value={form.vertical}
							onChange={(e) => setForm({ ...form, vertical: e.target.value })}
						>
							{VERTICALS.map((v) => (
								<option key={v} value={v}>
									{formatVertical(v) || v}
								</option>
							))}
						</select>
					</div>

					{form.vertical === 'LUBRICENTRO' && (
						<LubricentroUI
							value={form.vertical_data}
							oilPreference={vehicleData?.oilPreference || null}
							onChange={(nKey, nVal) =>
								setForm((prev) => ({
									...prev,
									vertical_data: { ...prev.vertical_data, [nKey]: nVal },
								}))
							}
							onBatchChange={(patch) =>
								setForm((prev) => ({
									...prev,
									vertical_data: { ...prev.vertical_data, ...patch },
								}))
							}
						/>
					)}

					{form.vertical === 'AIRE ACONDICIONADO' && (
						<AirConditioningUI
							value={form.vertical_data}
							onChange={(nKey, nVal) =>
								setForm((prev) => ({
									...prev,
									vertical_data: { ...prev.vertical_data, [nKey]: nVal },
								}))
							}
						/>
					)}

					{form.vertical === 'CUBIERTAS' && (
						<TiresUI
							value={form.vertical_data}
							onChange={(nKey, nVal) =>
								setForm((prev) => ({
									...prev,
									vertical_data: { ...prev.vertical_data, [nKey]: nVal },
								}))
							}
						/>
					)}

					{(form.vertical === 'MECANICA LIGERA' ||
						form.vertical === 'REPUESTOS') && (
						<PartsSelectorUI
							partsUsed={form.partsUsed || []}
							onChange={(parts) => setForm((prev) => ({ ...prev, partsUsed: parts }))}
							onApplyTotal={(total) =>
								setForm((prev) => ({ ...prev, importe: String(total) }))
							}
						/>
					)}

					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Observaciones (opcional)</label>
						<textarea
							className={editSt.textarea}
							value={form.details}
							onChange={(e) => setForm({ ...form, details: e.target.value })}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Próximo Servicio</label>
						<input
							className={editSt.input}
							value={form.next_service}
							onChange={(e) => setForm({ ...form, next_service: e.target.value })}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Importe ($)</label>
						<input
							className={editSt.input}
							type="number"
							step="0.01"
							value={form.importe}
							onChange={(e) => setForm({ ...form, importe: e.target.value })}
						/>
					</div>

					{error && <p className={editSt.errorText}>{error}</p>}

					<div className={editSt.editActions}>
						<button type="submit" className={editSt.saveBtn} disabled={saving}>
							{saving ? 'Guardando...' : 'Guardar Cambios'}
						</button>
						<button
							type="button"
							className={editSt.cancelBtn}
							onClick={() => setIsEditing(false)}
						>
							Cancelar
						</button>
					</div>
				</form>
			) : (
				<>
					{/* Lectura 1: Sencilla y uniforme para el cliente */}
					<div
						style={{
							padding: 10,
							marginBottom: 10,
							borderRadius: 10,
							backgroundColor: 'rgba(252, 189, 0, 0.08)',
							border: '1px solid rgba(252, 189, 0, 0.25)',
						}}
					>
						<p style={{ margin: 0, fontSize: '0.92em', lineHeight: 1.45, color: '#fff' }}>
							{generateClientSummary(data)}
						</p>
					</div>

					<InfoField
						title={getUsageUnit(vehicleData) === 'hs' ? 'Horómetro' : 'Kilometraje'}
						info={`${data.kilometraje} ${getUsageUnit(vehicleData)}`}
					/>
					<InfoField
						title={'Servicio Realizado'}
						info={formatVertical(data.vertical)}
					/>
					<InfoField title={'Próximo Mantenimiento'} info={data.next_service || '-'} />

					<a
						href={buildWhatsAppUrl(
							process.env.NEXT_PUBLIC_WORKSHOP_WHATSAPP || '',
							[
								`Hola, soy ${
									privateVehicle
										? `${privateVehicle.owner_name || ''} ${privateVehicle.owner_surname || ''}`.trim()
										: 'cliente'
								}${
									vehicleData?.clientNumber || privateVehicle?.clientNumber
										? `, cliente ${vehicleData?.clientNumber || privateVehicle?.clientNumber}`
										: ''
								}.`,
								`Quiero solicitar turno para ${
									formatVertical(data.vertical) || data.vertical
								} de mi ${
									vehicleData?.unitType === 'autoelevador' ? 'autoelevador' : 'vehículo'
								} ${getUnitIdentifier(vehicleData)}.`,
								data.next_service
									? `El próximo servicio figura para: ${data.next_service}.`
									: null,
								`Ficha: https://mi.rudyservices.com.ar/${vehicleId || ''}`,
							]
								.filter(Boolean)
								.join(' ')
						)}
						target="_blank"
						rel="noreferrer"
						onClick={() => {
							createAppointmentRecord({
								vehicleId: vehicleId || '',
								unitLabel: getUnitIdentifier(vehicleData),
								brandModel: `${vehicleData?.brand || ''} ${
									vehicleData?.model || ''
								}`.trim(),
								clientName: privateVehicle
									? `${privateVehicle.owner_name || ''} ${
											privateVehicle.owner_surname || ''
									  }`.trim()
									: 'Cliente NFC',
								clientNumber:
									vehicleData?.clientNumber || privateVehicle?.clientNumber || '',
								phone: privateVehicle?.phone_number || '',
								requestedService: formatVertical(data.vertical) || data.vertical,
								dueReference: data.next_service || '',
								status: APPOINTMENT_STATUS.WHATSAPP_REQUESTED,
								notes: 'Solicitud iniciada desde ficha NFC.',
							}).catch(() => {});
						}}
						className={editSt.editToggleBtn}
						style={{
							display: 'block',
							textAlign: 'center',
							textDecoration: 'none',
							boxSizing: 'border-box',
							borderColor: '#25D366',
							color: '#25D366',
							marginBottom: 8,
						}}
					>
						Pedir turno por WhatsApp ({formatVertical(data.vertical) || data.vertical})
					</a>

					{/* Lectura 2: Detalle técnico completo para el operario/taller */}
					{isAdmin && data.vertical === 'LUBRICENTRO' ? (
						<Lubricentro lubricentro={data.vertical_data} />
					) : null}

					{isAdmin && Array.isArray(data.partsUsed) && data.partsUsed.length > 0 && (
						<div
							style={{
								margin: '8px 0',
								padding: '8px 10px',
								borderRadius: 8,
								backgroundColor: 'rgba(255, 255, 255, 0.04)',
								fontSize: '0.85em',
							}}
						>
							<strong style={{ color: '#FCBD00', display: 'block', marginBottom: 4 }}>
								Repuestos utilizados (detalle técnico):
							</strong>
							{data.partsUsed.map((p, idx) => (
								<div key={`${p.name}-${idx}`}>
									• {p.qty}x {p.name}
									{p.sku ? ` [SKU: ${p.sku}]` : ''}
									{canViewPrices && p.unitPrice ? ` ($${p.unitPrice})` : ''}
								</div>
							))}
						</div>
					)}

					{isAdmin && data.details ? (
						<p className={st.details}>Obs. internas: {data.details}</p>
					) : null}
					{isAdmin && canViewPrices && privateData ? (
						<InfoField
							title={'Importe'}
							info={
								privateData.importe
									? formatPrice(privateData.importe)
									: 'No encontrado'
							}
						/>
					) : null}

					{isAdmin && (
						<div
							style={{
								marginTop: 10,
								padding: 10,
								borderRadius: 8,
								border: '1px solid #363636',
								backgroundColor: 'rgba(0, 0, 0, 0.35)',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									marginBottom: 4,
								}}
							>
								<span style={{ fontSize: '0.75em', color: '#FCBD00', fontWeight: 700 }}>
									Texto estandarizado para chip
								</span>
								<button
									type="button"
									onClick={handleCopyChip}
									style={{
										border: '1px solid #363636',
										background: '#2e2e2e',
										color: '#fff',
										borderRadius: 6,
										padding: '2px 8px',
										fontSize: '0.72em',
										cursor: 'pointer',
									}}
								>
									{copiedChip ? '¡Copiado!' : 'Copiar'}
								</button>
							</div>
							<pre
								style={{
									margin: 0,
									whiteSpace: 'pre-wrap',
									fontFamily: 'inherit',
									fontSize: '0.76em',
									lineHeight: 1.4,
									color: '#d4d4d4',
								}}
							>
								{chipDisplay}
							</pre>
						</div>
					)}

					<ChecklistUI
						data={data}
						canEdit={canEditService}
						updatedBy={updatedBy}
					/>

					{isLatest && (
						<ServiceFeedbackWidget
							vehicleData={vehicleData}
							privateVehicle={privateVehicle}
							service={data}
						/>
					)}

					<button
						type="button"
						className={editSt.editToggleBtn}
						onClick={() =>
							downloadServiceReceiptPdf({
								vehicle: vehicleData,
								privateVehicle,
								service: data,
								privateService: privateData,
								canViewPrices: isAdmin && canViewPrices,
							})
						}
					>
						Descargar Comprobante PDF
					</button>

					{canEditService && (
						<button
							type="button"
							className={editSt.editToggleBtn}
							onClick={startEditing}
						>
							Reeditar Service
						</button>
					)}

					<DeleteUI
						isAdmin={isAdmin && canDeleteService}
						fetchState={fetchState}
						FETCH_STATES={FETCH_STATES}
						onDelete={() => handleDeleteService(data.id)}
					/>
				</>
			)}
		</DropdownBox>
	);
};

export default ServiceUI;