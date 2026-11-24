import React, { useEffect, useState } from 'react';
import {
	getPartsCatalog,
	DEFAULT_PARTS,
} from '@/utils/firebase/catalogHandlers';
import st from './PartsSelectorUI.module.css';

const formatPriceARS = (val) =>
	new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS',
		maximumFractionDigits: 0,
	}).format(val || 0);

const PartsSelectorUI = ({ partsUsed = [], onChange, onApplyTotal }) => {
	const [catalog, setCatalog] = useState([]);
	const [selectedId, setSelectedId] = useState('');
	const [customName, setCustomName] = useState('');
	const [customPrice, setCustomPrice] = useState('');

	useEffect(() => {
		let mounted = true;
		getPartsCatalog(true)
			.then((list) => {
				if (!mounted) return;
				setCatalog(list.length > 0 ? list : DEFAULT_PARTS);
			})
			.catch(() => {
				if (mounted) setCatalog(DEFAULT_PARTS);
			});
		return () => {
			mounted = false;
		};
	}, []);

	const handleAddFromCatalog = () => {
		if (!selectedId) return;
		const found = catalog.find((p, idx) => (p.id || p.sku || String(idx)) === selectedId);
		if (!found) return;

		const key = found.id || found.sku || found.name;
		const existingIdx = partsUsed.findIndex((p) => (p.partId || p.name) === key);
		if (existingIdx >= 0) {
			const updated = partsUsed.map((p, i) =>
				i === existingIdx ? { ...p, qty: p.qty + 1 } : p
			);
			onChange(updated);
		} else {
			onChange([
				...partsUsed,
				{
					partId: found.id || found.sku || null,
					name: found.name,
					sku: found.sku || '',
					qty: 1,
					unitPrice: Number(found.defaultPrice) || 0,
				},
			]);
		}
		setSelectedId('');
	};

	const handleAddCustom = () => {
		if (!customName.trim()) return;
		onChange([
			...partsUsed,
			{
				partId: null,
				name: customName.trim(),
				sku: '',
				qty: 1,
				unitPrice: Number(customPrice) || 0,
			},
		]);
		setCustomName('');
		setCustomPrice('');
	};

	const updatePart = (idx, field, val) => {
		const updated = partsUsed.map((p, i) =>
			i === idx ? { ...p, [field]: Number(val) >= 0 ? Number(val) : 0 } : p
		);
		onChange(updated);
	};

	const removePart = (idx) => {
		onChange(partsUsed.filter((_, i) => i !== idx));
	};

	const partsTotal = partsUsed.reduce(
		(acc, p) => acc + (Number(p.qty) || 1) * (Number(p.unitPrice) || 0),
		0
	);

	return (
		<div className={st.container}>
			<span className={st.sectionTitle}>Repuestos vinculados</span>

			<div className={st.pickerRow}>
				<select
					className={st.select}
					value={selectedId}
					onChange={(e) => setSelectedId(e.target.value)}
				>
					<option value="">Seleccionar repuesto del catálogo...</option>
					{catalog.map((part, idx) => {
						const val = part.id || part.sku || String(idx);
						return (
							<option key={val} value={val}>
								{part.name} ({formatPriceARS(part.defaultPrice)})
							</option>
						);
					})}
				</select>
				<button
					type="button"
					className={st.addBtn}
					onClick={handleAddFromCatalog}
					disabled={!selectedId}
				>
					+ Agregar
				</button>
			</div>

			<div className={st.customRow}>
				<input
					className={st.input}
					type="text"
					placeholder="Repuesto fuera de catálogo..."
					value={customName}
					onChange={(e) => setCustomName(e.target.value)}
				/>
				<input
					className={st.inputSmall}
					type="number"
					placeholder="Precio $"
					value={customPrice}
					onChange={(e) => setCustomPrice(e.target.value)}
				/>
				<button
					type="button"
					className={st.addBtn}
					onClick={handleAddCustom}
					disabled={!customName.trim()}
				>
					+
				</button>
			</div>

			{partsUsed.length > 0 && (
				<div className={st.list}>
					{partsUsed.map((part, idx) => (
						<div key={`${part.name}-${idx}`} className={st.partItem}>
							<div className={st.partNameWrap}>
								<span className={st.partName}>{part.name}</span>
								{part.sku && <span className={st.partSku}>{part.sku}</span>}
							</div>
							<div className={st.partControls}>
								<input
									type="number"
									min="1"
									className={st.qtyInput}
									value={part.qty}
									onChange={(e) => updatePart(idx, 'qty', e.target.value)}
									title="Cantidad"
								/>
								<input
									type="number"
									min="0"
									className={st.priceInput}
									value={part.unitPrice}
									onChange={(e) => updatePart(idx, 'unitPrice', e.target.value)}
									title="Precio unitario"
								/>
								<button
									type="button"
									className={st.removeBtn}
									onClick={() => removePart(idx)}
									title="Quitar"
								>
									×
								</button>
							</div>
						</div>
					))}

					<div className={st.totalBar}>
						<span>
							Subtotal repuestos: <strong>{formatPriceARS(partsTotal)}</strong>
						</span>
						{onApplyTotal && (
							<button
								type="button"
								className={st.applyBtn}
								onClick={() => onApplyTotal(partsTotal)}
							>
								Pasar a Importe
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default PartsSelectorUI;
