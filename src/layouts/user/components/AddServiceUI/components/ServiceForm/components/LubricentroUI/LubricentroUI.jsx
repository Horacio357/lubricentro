import React, { useEffect, useState } from 'react';
import st from './LubricentroUI.module.css';
import ServiceInput from '../../../ServiceInput/ServiceInput';
import {
	getOilsCatalog,
	DEFAULT_OILS,
	formatOilLabel,
} from '@/utils/firebase/catalogHandlers';

const FILTER_TYPES = [
	'Aceite',
	'Aire',
	'Combustible',
	'Habitáculo',
	'Hidráulico',
];

const LubricentroUI = ({ onChange, onBatchChange, value = {}, oilPreference = null }) => {
	const [oils, setOils] = useState([]);
	const [customMode, setCustomMode] = useState(false);

	useEffect(() => {
		let mounted = true;
		getOilsCatalog(true)
			.then((list) => {
				if (!mounted) return;
				setOils(list.length > 0 ? list : DEFAULT_OILS);
			})
			.catch(() => {
				if (mounted) setOils(DEFAULT_OILS);
			});
		return () => {
			mounted = false;
		};
	}, []);

	const oilOptions = oils.map((o) => formatOilLabel(o));
	const currentTipo = value?.tipo || '';
	const isPresetMatch = oilOptions.includes(currentTipo);

	const applyCatalogOil = (label) => {
		const matched = oils.find((o) => formatOilLabel(o) === label);
		if (onBatchChange) {
			onBatchChange({
				tipo: label,
				oilBrand: matched?.brand || value.oilBrand || '',
				oilViscosity: matched?.viscosity || value.oilViscosity || '',
				oilSpec: matched?.type || value.oilSpec || '',
				oilChanged: true,
			});
		} else {
			onChange('tipo', label);
		}
	};

	const handleSelectChange = (e) => {
		const selected = e.target.value;
		if (selected === '__custom__') {
			setCustomMode(true);
			onChange('tipo', '');
			return;
		}
		setCustomMode(false);
		applyCatalogOil(selected);
	};

	const filters = Array.isArray(value.filters) ? value.filters : [];

	const addFilterRow = () => {
		onChange('filters', [
			...filters,
			{
				type: 'Aceite',
				action: 'reemplazado',
				brand: '',
				manufacturerCode: '',
				sku: '',
				qty: 1,
			},
		]);
	};

	const updateFilterRow = (idx, field, val) => {
		const next = filters.map((f, i) => (i === idx ? { ...f, [field]: val } : f));
		onChange('filters', next);
	};

	const removeFilterRow = (idx) => {
		onChange(
			'filters',
			filters.filter((_, i) => i !== idx)
		);
	};

	const prefLabel = oilPreference?.label || '';

	return (
		<div className={st.container}>
			{prefLabel && (
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: 8,
						padding: '8px 10px',
						marginBottom: 10,
						borderRadius: 8,
						backgroundColor: 'rgba(252, 189, 0, 0.12)',
						border: '1px solid rgba(252, 189, 0, 0.35)',
						fontSize: '0.82em',
					}}
				>
					<span>
						Preferencia de la unidad: <strong>{prefLabel}</strong>
					</span>
					{currentTipo !== prefLabel && (
						<button
							type="button"
							onClick={() => {
								setCustomMode(false);
								applyCatalogOil(prefLabel);
							}}
							style={{
								border: 'none',
								borderRadius: 6,
								padding: '4px 8px',
								backgroundColor: '#FCBD00',
								color: '#000',
								fontWeight: 700,
								cursor: 'pointer',
								flexShrink: 0,
							}}
						>
							Aplicar
						</button>
					)}
				</div>
			)}

			<label
				style={{
					display: 'block',
					fontSize: '0.82em',
					color: '#b3b3b3',
					marginBottom: 4,
				}}
			>
				Aceite utilizado (Catálogo estandarizado)
			</label>
			<select
				className={st.input}
				value={
					customMode || (currentTipo && !isPresetMatch)
						? '__custom__'
						: currentTipo
				}
				onChange={handleSelectChange}
			>
				<option value="">Seleccionar aceite...</option>
				{oilOptions.map((label) => (
					<option key={label} value={label}>
						{label}
					</option>
				))}
				<option value="__custom__">Otro / personalizado...</option>
			</select>

			{(customMode || (currentTipo && !isPresetMatch)) && (
				<ServiceInput
					title={'Tipo de Aceite personalizado'}
					value={currentTipo}
					type={'text'}
					onChange={(val) => onChange('tipo', val)}
				/>
			)}

			<div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
				<input
					className={st.input}
					type="text"
					placeholder="Especificación (ej. API SN / ACEA C3)"
					value={value.oilSpec || ''}
					onChange={(e) => onChange('oilSpec', e.target.value)}
				/>
				<input
					className={st.input}
					type="number"
					step="0.5"
					placeholder="Cantidad (L)"
					value={value.oilLiters || ''}
					onChange={(e) => onChange('oilLiters', e.target.value)}
					style={{ maxWidth: 110 }}
				/>
			</div>

			<div
				style={{
					marginTop: 8,
					marginBottom: 10,
					padding: 10,
					borderRadius: 8,
					border: '1px solid #363636',
					backgroundColor: 'rgba(0, 0, 0, 0.25)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: 8,
					}}
				>
					<span style={{ fontSize: '0.82em', color: '#FCBD00', fontWeight: 700 }}>
						Filtros e insumos (con código y estado)
					</span>
					<button
						type="button"
						onClick={addFilterRow}
						style={{
							border: 'none',
							borderRadius: 6,
							padding: '4px 10px',
							backgroundColor: '#FCBD00',
							color: '#000',
							fontWeight: 700,
							fontSize: '0.78em',
							cursor: 'pointer',
						}}
					>
						+ Filtro
					</button>
				</div>

				{filters.length === 0 ? (
					<span style={{ fontSize: '0.78em', color: '#b3b3b3' }}>
						Sin filtros estructurados agregados (puedes usar + Filtro o los checks rápidos abajo).
					</span>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{filters.map((f, idx) => (
							<div
								key={idx}
								style={{
									padding: 8,
									borderRadius: 8,
									backgroundColor: 'rgba(255,255,255,0.04)',
									display: 'flex',
									flexDirection: 'column',
									gap: 6,
								}}
							>
								<div style={{ display: 'flex', gap: 6 }}>
									<select
										className={st.input}
										value={f.type}
										onChange={(e) => updateFilterRow(idx, 'type', e.target.value)}
										style={{ marginBottom: 0 }}
									>
										{FILTER_TYPES.map((t) => (
											<option key={t} value={t}>
												Filtro de {t}
											</option>
										))}
									</select>
									<select
										className={st.input}
										value={f.action || 'reemplazado'}
										onChange={(e) => updateFilterRow(idx, 'action', e.target.value)}
										style={{ marginBottom: 0 }}
									>
										<option value="reemplazado">Reemplazado</option>
										<option value="revisado">Revisado</option>
									</select>
									<button
										type="button"
										onClick={() => removeFilterRow(idx)}
										style={{
											border: '1px solid rgba(206,38,38,0.5)',
											background: 'transparent',
											color: '#ff9c9c',
											borderRadius: 6,
											width: 34,
											cursor: 'pointer',
										}}
									>
										×
									</button>
								</div>
								<div style={{ display: 'flex', gap: 6 }}>
									<input
										className={st.input}
										placeholder="Marca (ej. MANN)"
										value={f.brand || ''}
										onChange={(e) => updateFilterRow(idx, 'brand', e.target.value)}
										style={{ marginBottom: 0 }}
									/>
									<input
										className={st.input}
										placeholder="Cód. fabricante (ej. W712/95)"
										value={f.manufacturerCode || ''}
										onChange={(e) =>
											updateFilterRow(idx, 'manufacturerCode', e.target.value)
										}
										style={{ marginBottom: 0 }}
									/>
								</div>
								<div style={{ display: 'flex', gap: 6 }}>
									<input
										className={st.input}
										placeholder="SKU interno (opcional)"
										value={f.sku || ''}
										onChange={(e) => updateFilterRow(idx, 'sku', e.target.value)}
										style={{ marginBottom: 0 }}
									/>
									<input
										className={st.input}
										type="number"
										min="1"
										placeholder="Cant."
										value={f.qty || 1}
										onChange={(e) => updateFilterRow(idx, 'qty', Number(e.target.value) || 1)}
										style={{ marginBottom: 0, maxWidth: 80 }}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value?.filtro_aire)}
					onChange={(e) => onChange('filtro_aire', e.target.checked)}
				/>
				Filtro de aire (check rápido)
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value?.filtro_aceite)}
					onChange={(e) => onChange('filtro_aceite', e.target.checked)}
				/>
				Filtro de aceite (check rápido)
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value?.filtro_combustible)}
					onChange={(e) => onChange('filtro_combustible', e.target.checked)}
				/>
				Filtro de combustible (check rápido)
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value?.engrase)}
					onChange={(e) => onChange('engrase', e.target.checked)}
				/>
				Engrase / revisión niveles
			</label>
		</div>
	);
};

export default LubricentroUI;