import React, { useMemo, useState } from 'react';
import ServiceInput from '../ServiceInput/ServiceInput';
import VerticalSelect from './components/VerticalSelect/VerticalSelect';
import LubricentroUI from './components/LubricentroUI/LubricentroUI';
import AirConditioningUI from './components/AirConditioningUI/AirConditioningUI';
import TiresUI from './components/TiresUI/TiresUI';
import PartsSelectorUI from './components/PartsSelectorUI/PartsSelectorUI';
import { formatChipSummary } from '@/utils/chipFormatter';
import {
	SERVICE_VERTICALS,
	generateClientSummary,
	getUsageUnit,
} from '@/utils/serviceTemplates';
import { auth } from '@/services/firebase/firebaseConfig';
import {
	getOilsCatalog,
	getPartsCatalog,
	DEFAULT_OILS,
	DEFAULT_PARTS,
	formatOilLabel,
} from '@/utils/firebase/catalogHandlers';
import st from './ServiceForm.module.css';

const ServiceForm = ({
	data,
	update,
	onSubmit,
	FETCH_STATES,
	fetchState,
	vehicle = null,
}) => {
	const [copied, setCopied] = useState(false);
	const [aiLoading, setAiLoading] = useState(false);
	const [aiError, setAiError] = useState(null);
	const [aiSuggestion, setAiSuggestion] = useState(null);

	const usageUnit = getUsageUnit(vehicle?.data || {});
	const usageLabel =
		usageUnit === 'hs' ? 'Horómetro actual (hs)' : 'Kilometraje actual (km)';

	const clientSummaryPreview = useMemo(
		() => generateClientSummary(data),
		[data]
	);

	const deterministicChip = useMemo(
		() =>
			formatChipSummary({
				vehicle: vehicle?.data || {},
				service: data,
			}),
		[vehicle, data]
	);

	const chipPreview = data.chipTextOverride || deterministicChip;

	const handleCopyChip = async () => {
		try {
			await navigator.clipboard.writeText(chipPreview);
			setCopied(true);
			setTimeout(() => setCopied(false), 1800);
		} catch (err) {
			console.error(err);
		}
	};

	const callAiAssist = async (action, payload) => {
		const token = await auth.currentUser?.getIdToken();
		const res = await fetch('/api/ai/assist', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ action, payload }),
		});
		const json = await res.json();
		if (!res.ok) {
			throw new Error(json.message || 'Error en asistente IA.');
		}
		return json;
	};

	const handleSuggestWithAi = async () => {
		setAiLoading(true);
		setAiError(null);
		try {
			const [oils, parts] = await Promise.all([
				getOilsCatalog(true).catch(() => DEFAULT_OILS),
				getPartsCatalog(true).catch(() => DEFAULT_PARTS),
			]);
			const oilsCatalog = (oils.length > 0 ? oils : DEFAULT_OILS).map((o) =>
				formatOilLabel(o)
			);
			const partsCatalog = (parts.length > 0 ? parts : DEFAULT_PARTS).map((p) => ({
				id: p.id || null,
				name: p.name,
				sku: p.sku || '',
				defaultPrice: p.defaultPrice || 0,
			}));

			const result = await callAiAssist('suggest_technical', {
				vehicle: vehicle?.data || {},
				service: data,
				oilsCatalog,
				partsCatalog,
			});
			setAiSuggestion({ ...result.suggestion, partsCatalog });
		} catch (err) {
			setAiError(err.message);
		} finally {
			setAiLoading(false);
		}
	};

	const handleApplySuggestion = () => {
		if (!aiSuggestion) return;
		if (data.vertical === 'LUBRICENTRO' && aiSuggestion.suggestedOilLabel) {
			update('vertical_data', {
				...data.vertical_data,
				tipo: aiSuggestion.suggestedOilLabel,
			});
		}
		if (aiSuggestion.suggestedNextService) {
			update('next_service', aiSuggestion.suggestedNextService);
		}
		if (
			(data.vertical === 'MECANICA LIGERA' || data.vertical === 'REPUESTOS') &&
			Array.isArray(aiSuggestion.suggestedPartsNames) &&
			aiSuggestion.suggestedPartsNames.length > 0
		) {
			const existingNames = new Set((data.partsUsed || []).map((p) => p.name));
			const matched = aiSuggestion.partsCatalog
				.filter(
					(p) =>
						aiSuggestion.suggestedPartsNames.includes(p.name) &&
						!existingNames.has(p.name)
				)
				.map((p) => ({
					partId: p.id,
					name: p.name,
					sku: p.sku,
					qty: 1,
					unitPrice: Number(p.defaultPrice) || 0,
				}));
			if (matched.length > 0) {
				update('partsUsed', [...(data.partsUsed || []), ...matched]);
			}
		}
		setAiSuggestion(null);
	};

	const handlePolishChipWithAi = async () => {
		setAiLoading(true);
		setAiError(null);
		try {
			const result = await callAiAssist('standardize_chip', {
				vehicle: vehicle?.data || {},
				service: data,
				currentChipText: chipPreview,
			});
			if (result.chipText) {
				update('chipTextOverride', result.chipText);
			}
		} catch (err) {
			setAiError(err.message);
		} finally {
			setAiLoading(false);
		}
	};

	const showPartsSelector =
		data.vertical === 'MECANICA LIGERA' || data.vertical === 'REPUESTOS';

	return (
		<>
			<div
				style={{
					width: '100%',
					display: 'flex',
					justifyContent: 'flex-end',
					marginBottom: 8,
				}}
			>
				<button
					type="button"
					onClick={handleSuggestWithAi}
					disabled={aiLoading}
					style={{
						border: '1px solid #FCBD00',
						backgroundColor: 'rgba(252, 189, 0, 0.12)',
						color: '#FCBD00',
						borderRadius: 8,
						padding: '6px 12px',
						fontSize: '0.8em',
						fontWeight: 700,
						cursor: 'pointer',
					}}
				>
					{aiLoading ? 'Consultando IA...' : 'Sugerir con IA'}
				</button>
			</div>

			{aiError && (
				<p style={{ color: '#ff9c9c', fontSize: '0.82em', margin: '0 0 10px' }}>
					{aiError}
				</p>
			)}

			{aiSuggestion && (
				<div
					style={{
						width: '100%',
						boxSizing: 'border-box',
						padding: 10,
						marginBottom: 12,
						borderRadius: 10,
						border: '1px solid #FCBD00',
						backgroundColor: 'rgba(252, 189, 0, 0.08)',
						fontSize: '0.82em',
						display: 'flex',
						flexDirection: 'column',
						gap: 6,
					}}
				>
					<strong style={{ color: '#FCBD00' }}>Sugerencia Técnica IA</strong>
					<span>{aiSuggestion.rationale}</span>
					{aiSuggestion.suggestedOilLabel && (
						<span>Aceite: {aiSuggestion.suggestedOilLabel}</span>
					)}
					{aiSuggestion.suggestedNextService && (
						<span>Próximo service: {aiSuggestion.suggestedNextService}</span>
					)}
					{Array.isArray(aiSuggestion.suggestedPartsNames) &&
						aiSuggestion.suggestedPartsNames.length > 0 && (
							<span>
								Repuestos: {aiSuggestion.suggestedPartsNames.join(', ')}
							</span>
						)}
					<div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
						<button
							type="button"
							onClick={handleApplySuggestion}
							style={{
								flex: 1,
								border: 'none',
								borderRadius: 7,
								padding: '6px 10px',
								backgroundColor: '#FCBD00',
								color: '#000',
								fontWeight: 700,
								cursor: 'pointer',
							}}
						>
							Aplicar sugerencia
						</button>
						<button
							type="button"
							onClick={() => setAiSuggestion(null)}
							style={{
								border: '1px solid #363636',
								borderRadius: 7,
								padding: '6px 10px',
								backgroundColor: '#2e2e2e',
								color: '#fff',
								cursor: 'pointer',
							}}
						>
							Descartar
						</button>
					</div>
				</div>
			)}

			<ServiceInput
				title={usageLabel}
				type={'number'}
				value={data.kilometraje}
				onChange={(value) => update('kilometraje', value)}
			/>
			<VerticalSelect
				verticals={SERVICE_VERTICALS}
				value={data.vertical}
				onChange={(value) => update('vertical', value)}
			/>

			{data.vertical === 'LUBRICENTRO' ? (
				<LubricentroUI
					value={data.vertical_data}
					oilPreference={vehicle?.data?.oilPreference || null}
					onChange={(n_key, n_value) =>
						update('vertical_data', {
							...data.vertical_data,
							[n_key]: n_value,
						})
					}
					onBatchChange={(patch) =>
						update('vertical_data', {
							...data.vertical_data,
							...patch,
						})
					}
				/>
			) : null}

			{data.vertical === 'AIRE ACONDICIONADO' ? (
				<AirConditioningUI
					value={data.vertical_data}
					onChange={(n_key, n_value) =>
						update('vertical_data', {
							...data.vertical_data,
							[n_key]: n_value,
						})
					}
				/>
			) : null}

			{data.vertical === 'CUBIERTAS' ? (
				<TiresUI
					value={data.vertical_data}
					onChange={(n_key, n_value) =>
						update('vertical_data', {
							...data.vertical_data,
							[n_key]: n_value,
						})
					}
				/>
			) : null}

			{showPartsSelector ? (
				<PartsSelectorUI
					partsUsed={data.partsUsed || []}
					onChange={(parts) => update('partsUsed', parts)}
					onApplyTotal={(total) => update('importe', total)}
				/>
			) : null}

			<ServiceInput
				title={'Observaciones (opcional)'}
				type={'textarea'}
				value={data.details}
				onChange={(value) => update('details', value)}
			/>
			<ServiceInput
				title={
					usageUnit === 'hs'
						? 'Próximo mantenimiento (ej. 1670 hs)'
						: 'Próximo service (ej. 60000 km)'
				}
				value={data.next_service}
				type={'text'}
				onChange={(value) => update('next_service', value)}
			/>
			<ServiceInput
				title={'Importe'}
				value={data.importe}
				type={'number'}
				onChange={(value) => update('importe', value)}
			/>

			<div
				style={{
					width: '100%',
					boxSizing: 'border-box',
					padding: 10,
					marginBottom: 10,
					borderRadius: 10,
					border: '1px solid rgba(252, 189, 0, 0.35)',
					backgroundColor: 'rgba(252, 189, 0, 0.06)',
				}}
			>
				<span
					style={{
						display: 'block',
						fontSize: '0.76em',
						color: '#FCBD00',
						fontWeight: 700,
						marginBottom: 4,
					}}
				>
					Lectura automática para el cliente
				</span>
				<p style={{ margin: 0, fontSize: '0.84em', color: '#fff', lineHeight: 1.4 }}>
					{clientSummaryPreview}
				</p>
			</div>

			<div
				style={{
					width: '100%',
					boxSizing: 'border-box',
					padding: 10,
					marginBottom: 12,
					borderRadius: 10,
					border: '1px solid #363636',
					backgroundColor: 'rgba(0, 0, 0, 0.35)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: 6,
						marginBottom: 6,
					}}
				>
					<span style={{ fontSize: '0.78em', color: '#FCBD00', fontWeight: 700 }}>
						Vista previa estandarizada para chip
					</span>
					<div style={{ display: 'flex', gap: 6 }}>
						<button
							type="button"
							onClick={handlePolishChipWithAi}
							disabled={aiLoading}
							style={{
								border: '1px solid #FCBD00',
								background: 'transparent',
								color: '#FCBD00',
								borderRadius: 6,
								padding: '3px 8px',
								fontSize: '0.75em',
								cursor: 'pointer',
							}}
						>
							Pulir con IA
						</button>
						{data.chipTextOverride && (
							<button
								type="button"
								onClick={() => update('chipTextOverride', null)}
								style={{
									border: '1px solid #363636',
									background: '#2e2e2e',
									color: '#b3b3b3',
									borderRadius: 6,
									padding: '3px 8px',
									fontSize: '0.75em',
									cursor: 'pointer',
								}}
							>
								Restaurar
							</button>
						)}
						<button
							type="button"
							onClick={handleCopyChip}
							style={{
								border: '1px solid #363636',
								background: '#2e2e2e',
								color: '#fff',
								borderRadius: 6,
								padding: '3px 8px',
								fontSize: '0.75em',
								cursor: 'pointer',
							}}
						>
							{copied ? '¡Copiado!' : 'Copiar'}
						</button>
					</div>
				</div>
				<pre
					style={{
						margin: 0,
						whiteSpace: 'pre-wrap',
						fontFamily: 'inherit',
						fontSize: '0.78em',
						lineHeight: 1.4,
						color: '#d4d4d4',
					}}
				>
					{chipPreview}
				</pre>
			</div>

			{fetchState === FETCH_STATES.FETCHING ? (
				<span className={st.feedbackSpan}>Procesando...</span>
			) : fetchState == FETCH_STATES.ERROR ? (
				<span className={st.feedbackSpan}>
					Ocurrió un error, por favor reintente
				</span>
			) : (
				<button className={st.createButton} onClick={onSubmit}>
					Agregar Service
				</button>
			)}
		</>
	);
};

export default ServiceForm;