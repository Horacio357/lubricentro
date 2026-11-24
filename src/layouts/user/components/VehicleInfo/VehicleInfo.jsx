import React, { useState, useEffect } from 'react';
import InfoField from '../InfoField/InfoField';
import DropdownBox from '../DropdownBox/DropdownBox';
import { formatDate } from '@/utils/firebase/firebase';
import { updateVehicle } from '@/utils/firebase/firebaseAdminPanel';
import {
	getOilsCatalog,
	DEFAULT_OILS,
	formatOilLabel,
} from '@/utils/firebase/catalogHandlers';
import { buildWhatsAppUrl } from '@/utils/whatsappHelper';
import { getUsageUnit } from '@/utils/serviceTemplates';
import editSt from '../EditForm.module.css';

const getKilometraje = (data) => {
	try {
		const unit = getUsageUnit(data);
		return `${data.services[data.services.length - 1].kilometraje} ${unit}`;
	} catch (error) {
		return '-';
	}
};

const getBirthdate = (privateData) => {
	try {
		return `${privateData.birthdate.day}/${privateData.birthdate.month}/${privateData.birthdate.year}`;
	} catch (error) {
		return '-';
	}
};

const VehicleInfo = ({
	isAdmin,
	canEdit = false,
	privateData,
	data,
	onUpdated,
	updatedBy,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [form, setForm] = useState({});
	const [oils, setOils] = useState([]);

	useEffect(() => {
		if (!isEditing) return;
		getOilsCatalog(true)
			.then((list) => setOils(list.length > 0 ? list : DEFAULT_OILS))
			.catch(() => setOils(DEFAULT_OILS));
	}, [isEditing]);

	if (!isAdmin || !privateData) return null;

	const startEditing = () => {
		setForm({
			unitType: data.unitType || 'vehiculo',
			brand: data.brand || '',
			model: data.model || '',
			patente: data.patente || '',
			serialNumber: data.serialNumber || '',
			internalNumber: data.internalNumber || '',
			clientNumber: data.clientNumber || privateData.clientNumber || '',
			marketingOptIn: data.marketingOptIn !== false && privateData.marketingOptIn !== false,
			oilPreferenceLabel: data.oilPreference?.label || '',
			owner_name: privateData.owner_name || '',
			owner_surname: privateData.owner_surname || '',
			phone_number: privateData.phone_number || '',
			email: privateData.email || '',
			dni: privateData.dni || '',
			occupation: privateData.occupation || '',
			state: privateData.state || '',
			direction: privateData.direction || '',
			zip_code: privateData.zip_code || '',
		});
		setError(null);
		setIsEditing(true);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError(null);
		try {
			const cleanPatente = String(form.patente || '')
				.toUpperCase()
				.replace(/\s+/g, '');

			const matchedOil = oils.find(
				(o) => formatOilLabel(o) === form.oilPreferenceLabel
			);

			const oilPreference = form.oilPreferenceLabel
				? {
						oilId: matchedOil?.id || null,
						label: form.oilPreferenceLabel,
						viscosity: matchedOil?.viscosity || '',
						isOwnerPreference: true,
				  }
				: null;

			await updateVehicle(
				data.id,
				{
					unitType: form.unitType,
					brand: form.brand,
					model: form.model,
					patente: cleanPatente || form.internalNumber || form.serialNumber,
					serialNumber: form.serialNumber,
					internalNumber: form.internalNumber,
					clientNumber: form.clientNumber,
					marketingOptIn: Boolean(form.marketingOptIn),
					oilPreference,
				},
				{
					owner_name: form.owner_name,
					owner_surname: form.owner_surname,
					patente: cleanPatente || form.internalNumber || form.serialNumber,
					clientNumber: form.clientNumber,
					marketingOptIn: Boolean(form.marketingOptIn),
					phone_number: form.phone_number,
					email: form.email,
					dni: form.dni,
					occupation: form.occupation,
					state: form.state,
					direction: form.direction,
					zip_code: form.zip_code,
				},
				updatedBy
			);
			setIsEditing(false);
			if (onUpdated) await onUpdated();
		} catch (err) {
			setError(err.message || 'Error al guardar los cambios.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<DropdownBox
			buttonText={`${privateData.owner_name} ${privateData.owner_surname}`}
			white
		>
			{isEditing ? (
				<form onSubmit={handleSave} className={editSt.editForm}>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Tipo de Unidad</label>
						<select
							className={editSt.select}
							value={form.unitType}
							onChange={(e) => setForm({ ...form, unitType: e.target.value })}
						>
							<option value="vehiculo">Vehículo (Patente / km)</option>
							<option value="autoelevador">Autoelevador (Serie / Interno / hs)</option>
						</select>
					</div>
					{form.unitType === 'autoelevador' ? (
						<>
							<div className={editSt.fieldGroup}>
								<label className={editSt.fieldLabel}>N° de Serie</label>
								<input
									className={editSt.input}
									value={form.serialNumber}
									onChange={(e) =>
										setForm({ ...form, serialNumber: e.target.value })
									}
									required
								/>
							</div>
							<div className={editSt.fieldGroup}>
								<label className={editSt.fieldLabel}>N° de Interno</label>
								<input
									className={editSt.input}
									value={form.internalNumber}
									onChange={(e) =>
										setForm({ ...form, internalNumber: e.target.value })
									}
								/>
							</div>
						</>
					) : (
						<div className={editSt.fieldGroup}>
							<label className={editSt.fieldLabel}>Patente</label>
							<input
								className={editSt.input}
								value={form.patente}
								onChange={(e) => setForm({ ...form, patente: e.target.value })}
								required
							/>
						</div>
					)}
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>N° de Cliente</label>
						<input
							className={editSt.input}
							value={form.clientNumber}
							onChange={(e) => setForm({ ...form, clientNumber: e.target.value })}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Marca</label>
						<input
							className={editSt.input}
							value={form.brand}
							onChange={(e) => setForm({ ...form, brand: e.target.value })}
							required
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Modelo</label>
						<input
							className={editSt.input}
							value={form.model}
							onChange={(e) => setForm({ ...form, model: e.target.value })}
							required
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>
							Aceite preferido / parametrizado
						</label>
						<select
							className={editSt.select}
							value={form.oilPreferenceLabel}
							onChange={(e) =>
								setForm({ ...form, oilPreferenceLabel: e.target.value })
							}
						>
							<option value="">Sin preferencia definida</option>
							{oils.map((o) => {
								const lbl = formatOilLabel(o);
								return (
									<option key={lbl} value={lbl}>
										{lbl}
									</option>
								);
							})}
						</select>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Nombre</label>
						<input
							className={editSt.input}
							value={form.owner_name}
							onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
							required
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Apellido</label>
						<input
							className={editSt.input}
							value={form.owner_surname}
							onChange={(e) =>
								setForm({ ...form, owner_surname: e.target.value })
							}
							required
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Teléfono</label>
						<input
							className={editSt.input}
							value={form.phone_number}
							onChange={(e) =>
								setForm({ ...form, phone_number: e.target.value })
							}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Email</label>
						<input
							className={editSt.input}
							type="email"
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>DNI</label>
						<input
							className={editSt.input}
							value={form.dni}
							onChange={(e) => setForm({ ...form, dni: e.target.value })}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Ocupación</label>
						<input
							className={editSt.input}
							value={form.occupation}
							onChange={(e) => setForm({ ...form, occupation: e.target.value })}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Provincia</label>
						<input
							className={editSt.input}
							value={form.state}
							onChange={(e) => setForm({ ...form, state: e.target.value })}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Dirección</label>
						<input
							className={editSt.input}
							value={form.direction}
							onChange={(e) => setForm({ ...form, direction: e.target.value })}
						/>
					</div>
					<div className={editSt.fieldGroup}>
						<label className={editSt.fieldLabel}>Código Postal</label>
						<input
							className={editSt.input}
							value={form.zip_code}
							onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
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
					<InfoField
						title={'Cliente'}
						info={`${privateData.owner_name} ${privateData.owner_surname}`}
					/>
					{(data.clientNumber || privateData.clientNumber) && (
						<InfoField
							title={'N° Cliente'}
							info={data.clientNumber || privateData.clientNumber}
						/>
					)}
					<InfoField
						title={data.unitType === 'autoelevador' ? 'Autoelevador' : 'Vehículo'}
						info={`${data.brand} ${data.model}`}
					/>
					{data.unitType === 'autoelevador' && (
						<>
							<InfoField title={'N° Serie'} info={data.serialNumber || '-'} />
							<InfoField title={'N° Interno'} info={data.internalNumber || '-'} />
						</>
					)}
					<InfoField
						title={getUsageUnit(data) === 'hs' ? 'Horómetro' : 'Kilometraje'}
						info={getKilometraje(data)}
					/>
					<InfoField
						title={'Aceite Preferido'}
						info={data.oilPreference?.label || '-'}
					/>
					<InfoField title={'Alta'} info={formatDate(privateData.alta)} />
					<InfoField title={'Teléfono'} info={privateData.phone_number} />
					<InfoField title={'Email'} info={privateData.email} />
					<InfoField title={'DNI'} info={`${privateData.dni}`} />
					<InfoField title={'Ocupación'} info={`${privateData.occupation}`} />
					<InfoField title={'Provincia'} info={`${privateData.state}`} />
					<InfoField title={'Dirección'} info={`${privateData.direction}`} />
					<InfoField title={'Código Postal'} info={`${privateData.zip_code}`} />
					<InfoField title={'F.N.'} info={getBirthdate(privateData)} />

					{privateData.phone_number && (
						<a
							href={buildWhatsAppUrl(
								privateData.phone_number,
								data.chipSummary ||
									`Hola ${privateData.owner_name || ''}! Te compartimos la ficha digital de tu ${data.brand} ${data.model} (${data.patente}) en R Services: https://mi.rudyservices.com.ar/${data.id}`
							)}
							target="_blank"
							rel="noreferrer"
							className={editSt.editToggleBtn}
							style={{
								display: 'block',
								textAlign: 'center',
								textDecoration: 'none',
								boxSizing: 'border-box',
								borderColor: '#25D366',
								color: '#25D366',
							}}
						>
							Enviar resumen por WhatsApp
						</a>
					)}

					{canEdit && (
						<button
							type="button"
							className={editSt.editToggleBtn}
							onClick={startEditing}
						>
							Reeditar Datos del Vehículo / Cliente
						</button>
					)}
				</>
			)}
		</DropdownBox>
	);
};

export default VehicleInfo;