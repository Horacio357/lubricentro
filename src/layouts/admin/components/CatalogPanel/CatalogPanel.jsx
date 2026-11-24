import React, { useState, useEffect, useCallback } from 'react';
import {
	getOilsCatalog,
	getPartsCatalog,
	saveOilCatalogItem,
	savePartCatalogItem,
	toggleCatalogItemActive,
	seedDefaultCatalogs,
	DEFAULT_OILS,
	DEFAULT_PARTS,
} from '@/utils/firebase/catalogHandlers';
import { isDevBypassEnabled } from '@/utils/devMockData';
import useCarsData from '../../hooks/useCarsData';
import st from './CatalogPanel.module.css';

const formatPriceARS = (val) =>
	new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS',
		maximumFractionDigits: 0,
	}).format(val || 0);

const CatalogPanel = () => {
	const [activeTab, setActiveTab] = useState('oils');
	const [oils, setOils] = useState([]);
	const [parts, setParts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState(null);
	const { car_brands, saveCar } = useCarsData();
	const [newBrand, setNewBrand] = useState('');
	const [newModel, setNewModel] = useState('');

	const [oilForm, setOilForm] = useState({
		id: null,
		brand: '',
		name: '',
		viscosity: '',
		type: 'Sintético',
		defaultIntervalKm: 10000,
		defaultIntervalDays: 180,
	});

	const [partForm, setPartForm] = useState({
		id: null,
		name: '',
		sku: '',
		category: 'Frenos',
		defaultPrice: '',
		stock: 5,
		minStock: 3,
	});

	const loadCatalogs = useCallback(async () => {
		try {
			setLoading(true);
			const [oilsData, partsData] = await Promise.all([
				getOilsCatalog(false),
				getPartsCatalog(false),
			]);
			if (isDevBypassEnabled() && oilsData.length === 0 && partsData.length === 0) {
				setOils(DEFAULT_OILS.map((o, i) => ({ id: `demo-oil-${i}`, ...o })));
				setParts(DEFAULT_PARTS.map((p, i) => ({ id: `demo-part-${i}`, ...p })));
			} else {
				setOils(oilsData);
				setParts(partsData);
			}
		} catch (err) {
			if (isDevBypassEnabled()) {
				setOils(DEFAULT_OILS.map((o, i) => ({ id: `demo-oil-${i}`, ...o })));
				setParts(DEFAULT_PARTS.map((p, i) => ({ id: `demo-part-${i}`, ...p })));
			} else {
				setFeedback({ type: 'error', text: 'Error cargando catálogos.' });
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadCatalogs();
	}, [loadCatalogs]);

	const handleSeedDefaults = async () => {
		setSaving(true);
		setFeedback(null);
		try {
			const count = await seedDefaultCatalogs();
			setFeedback({
				type: 'success',
				text:
					count > 0
						? `Se cargaron ${count} ítems base al catálogo.`
						: 'Los catálogos ya contienen ítems.',
			});
			await loadCatalogs();
		} catch (err) {
			setFeedback({ type: 'error', text: 'No se pudo cargar el catálogo base.' });
		} finally {
			setSaving(false);
		}
	};

	const handleSaveOil = async (e) => {
		e.preventDefault();
		setSaving(true);
		setFeedback(null);
		try {
			await saveOilCatalogItem(oilForm, oilForm.id);
			setOilForm({
				id: null,
				brand: '',
				name: '',
				viscosity: '',
				type: 'Sintético',
				defaultIntervalKm: 10000,
				defaultIntervalDays: 180,
			});
			setFeedback({ type: 'success', text: 'Aceite guardado en el catálogo.' });
			await loadCatalogs();
		} catch (err) {
			setFeedback({ type: 'error', text: 'Error al guardar el aceite.' });
		} finally {
			setSaving(false);
		}
	};

	const handleSavePart = async (e) => {
		e.preventDefault();
		setSaving(true);
		setFeedback(null);
		try {
			await savePartCatalogItem(partForm, partForm.id);
			setPartForm({
				id: null,
				name: '',
				sku: '',
				category: 'Frenos',
				defaultPrice: '',
				stock: 5,
				minStock: 3,
			});
			setFeedback({ type: 'success', text: 'Repuesto guardado en el catálogo.' });
			await loadCatalogs();
		} catch (err) {
			setFeedback({ type: 'error', text: 'Error al guardar el repuesto.' });
		} finally {
			setSaving(false);
		}
	};

	const handleAddBrandModel = async (e) => {
		e.preventDefault();
		if (!newBrand.trim()) return;
		setSaving(true);
		setFeedback(null);
		try {
			await saveCar(newBrand, newModel);
			setFeedback({
				type: 'success',
				text: `Marca/modelo "${newBrand.toUpperCase()} ${newModel.toUpperCase()}" guardado.`,
			});
			setNewBrand('');
			setNewModel('');
		} catch {
			setFeedback({ type: 'error', text: 'No se pudo guardar la marca.' });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className={st.container}>
			<div className={st.topBar}>
				<div className={st.subTabs}>
					<button
						type="button"
						className={`${st.subTab} ${
							activeTab === 'oils' ? st.subTabActive : ''
						}`}
						onClick={() => setActiveTab('oils')}
					>
						Aceites ({oils.length})
					</button>
					<button
						type="button"
						className={`${st.subTab} ${
							activeTab === 'parts' ? st.subTabActive : ''
						}`}
						onClick={() => setActiveTab('parts')}
					>
						Repuestos ({parts.length})
					</button>
					<button
						type="button"
						className={`${st.subTab} ${
							activeTab === 'brands' ? st.subTabActive : ''
						}`}
						onClick={() => setActiveTab('brands')}
					>
						Marcas ({car_brands.length})
					</button>
				</div>

				{(oils.length === 0 || parts.length === 0) && (
					<button
						type="button"
						className={st.seedBtn}
						onClick={handleSeedDefaults}
						disabled={saving}
					>
						Cargar catálogo inicial
					</button>
				)}
			</div>

			{feedback && (
				<p className={feedback.type === 'error' ? st.errorMsg : st.successMsg}>
					{feedback.text}
				</p>
			)}

			{activeTab === 'oils' ? (
				<div className={st.grid}>
					<section className={st.card}>
						<h3 className={st.cardTitle}>
							{oilForm.id ? 'Editar Aceite' : 'Nuevo Aceite Parametrizado'}
						</h3>
						<form onSubmit={handleSaveOil} className={st.form}>
							<div className={st.row}>
								<input
									className={st.input}
									placeholder="Marca (ej. Shell)"
									value={oilForm.brand}
									onChange={(e) =>
										setOilForm({ ...oilForm, brand: e.target.value })
									}
									required
								/>
								<input
									className={st.input}
									placeholder="Línea / Nombre (ej. Helix HX8)"
									value={oilForm.name}
									onChange={(e) =>
										setOilForm({ ...oilForm, name: e.target.value })
									}
									required
								/>
							</div>
							<div className={st.row}>
								<input
									className={st.input}
									placeholder="Viscosidad (ej. 5W-30)"
									value={oilForm.viscosity}
									onChange={(e) =>
										setOilForm({ ...oilForm, viscosity: e.target.value })
									}
									required
								/>
								<select
									className={st.select}
									value={oilForm.type}
									onChange={(e) =>
										setOilForm({ ...oilForm, type: e.target.value })
									}
								>
									<option value="Sintético">Sintético</option>
									<option value="Semisintético">Semisintético</option>
									<option value="Mineral">Mineral</option>
								</select>
							</div>
							<div className={st.row}>
								<div className={st.fieldCol}>
									<label className={st.label}>Intervalo sugerido (km)</label>
									<input
										className={st.input}
										type="number"
										value={oilForm.defaultIntervalKm}
										onChange={(e) =>
											setOilForm({
												...oilForm,
												defaultIntervalKm: e.target.value,
											})
										}
									/>
								</div>
								<div className={st.fieldCol}>
									<label className={st.label}>Intervalo sugerido (días)</label>
									<input
										className={st.input}
										type="number"
										value={oilForm.defaultIntervalDays}
										onChange={(e) =>
											setOilForm({
												...oilForm,
												defaultIntervalDays: e.target.value,
											})
										}
									/>
								</div>
							</div>
							<div className={st.row}>
								<button type="submit" className={st.primaryBtn} disabled={saving}>
									{oilForm.id ? 'Actualizar Aceite' : 'Agregar Aceite'}
								</button>
								{oilForm.id && (
									<button
										type="button"
										className={st.secondaryBtn}
										onClick={() =>
											setOilForm({
												id: null,
												brand: '',
												name: '',
												viscosity: '',
												type: 'Sintético',
												defaultIntervalKm: 10000,
												defaultIntervalDays: 180,
											})
										}
									>
										Cancelar
									</button>
								)}
							</div>
						</form>
					</section>

					<section className={st.card}>
						<h3 className={st.cardTitle}>Aceites Registrados</h3>
						{loading ? (
							<p className={st.muted}>Cargando aceites...</p>
						) : oils.length === 0 ? (
							<p className={st.muted}>
								No hay aceites cargados. Usa &ldquo;Cargar catálogo inicial&rdquo; o crea uno nuevo.
							</p>
						) : (
							<div className={st.list}>
								{oils.map((oil) => (
									<div key={oil.id} className={st.item}>
										<div>
											<div className={st.itemHeader}>
												<strong>
													{oil.brand} {oil.name} · {oil.viscosity}
												</strong>
												<span className={st.badge}>{oil.type}</span>
												{oil.active === false && (
													<span className={st.inactiveBadge}>Inactivo</span>
												)}
											</div>
											<span className={st.meta}>
												Sugerido: {oil.defaultIntervalKm} km /{' '}
												{oil.defaultIntervalDays} días
											</span>
										</div>
										<div className={st.actions}>
											<button
												type="button"
												className={st.secondaryBtn}
												onClick={() => setOilForm(oil)}
											>
												Editar
											</button>
											<button
												type="button"
												className={st.secondaryBtn}
												onClick={async () => {
													await toggleCatalogItemActive(
														'catalog_oils',
														oil.id,
														oil.active === false
													);
													await loadCatalogs();
												}}
											>
												{oil.active === false ? 'Activar' : 'Desactivar'}
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</section>
				</div>
			) : activeTab === 'parts' ? (
				<div className={st.grid}>
					<section className={st.card}>
						<h3 className={st.cardTitle}>
							{partForm.id ? 'Editar Repuesto' : 'Nuevo Repuesto'}
						</h3>
						<form onSubmit={handleSavePart} className={st.form}>
							<input
								className={st.input}
								placeholder="Nombre del repuesto"
								value={partForm.name}
								onChange={(e) =>
									setPartForm({ ...partForm, name: e.target.value })
								}
								required
							/>
							<div className={st.row}>
								<input
									className={st.input}
									placeholder="Código / SKU (ej. FR-PAST-DEL)"
									value={partForm.sku}
									onChange={(e) =>
										setPartForm({ ...partForm, sku: e.target.value })
									}
								/>
								<input
									className={st.input}
									placeholder="Categoría (ej. Frenos)"
									value={partForm.category}
									onChange={(e) =>
										setPartForm({ ...partForm, category: e.target.value })
									}
								/>
							</div>
							<input
								className={st.input}
								type="number"
								placeholder="Precio sugerido ($)"
								value={partForm.defaultPrice}
								onChange={(e) =>
									setPartForm({ ...partForm, defaultPrice: e.target.value })
								}
								required
							/>
							<div className={st.row}>
								<div className={st.fieldCol}>
									<label className={st.label}>Stock actual</label>
									<input
										className={st.input}
										type="number"
										min="0"
										value={partForm.stock ?? 0}
										onChange={(e) =>
											setPartForm({ ...partForm, stock: e.target.value })
										}
										required
									/>
								</div>
								<div className={st.fieldCol}>
									<label className={st.label}>Stock mínimo (alerta)</label>
									<input
										className={st.input}
										type="number"
										min="0"
										value={partForm.minStock ?? 3}
										onChange={(e) =>
											setPartForm({ ...partForm, minStock: e.target.value })
										}
										required
									/>
								</div>
							</div>
							<div className={st.row}>
								<button type="submit" className={st.primaryBtn} disabled={saving}>
									{partForm.id ? 'Actualizar Repuesto' : 'Agregar Repuesto'}
								</button>
								{partForm.id && (
									<button
										type="button"
										className={st.secondaryBtn}
										onClick={() =>
											setPartForm({
												id: null,
												name: '',
												sku: '',
												category: 'Frenos',
												defaultPrice: '',
												stock: 5,
												minStock: 3,
											})
										}
									>
										Cancelar
									</button>
								)}
							</div>
						</form>
					</section>

					<section className={st.card}>
						<h3 className={st.cardTitle}>Repuestos Registrados</h3>
						{loading ? (
							<p className={st.muted}>Cargando repuestos...</p>
						) : parts.length === 0 ? (
							<p className={st.muted}>
								No hay repuestos cargados. Usa &ldquo;Cargar catálogo inicial&rdquo; o crea uno nuevo.
							</p>
						) : (
							<div className={st.list}>
								{parts.map((part) => {
									const isLowStock =
										Number(part.stock ?? 0) <= Number(part.minStock ?? 3);
									return (
										<div key={part.id} className={st.item}>
											<div>
												<div className={st.itemHeader}>
													<strong>{part.name}</strong>
													<span className={st.badge}>{part.category}</span>
													{isLowStock && (
														<span className={st.inactiveBadge}>
															Compra Urgente ({part.stock ?? 0} u.)
														</span>
													)}
													{part.active === false && (
														<span className={st.inactiveBadge}>Inactivo</span>
													)}
												</div>
												<span className={st.meta}>
													{part.sku ? `SKU: ${part.sku} · ` : ''}
													{formatPriceARS(part.defaultPrice)} · Stock: {part.stock ?? 0} (Mín: {part.minStock ?? 3})
												</span>
											</div>
											<div className={st.actions}>
												<button
													type="button"
													className={st.secondaryBtn}
													onClick={() => setPartForm(part)}
												>
													Editar
												</button>
												<button
													type="button"
													className={st.secondaryBtn}
													onClick={async () => {
														await toggleCatalogItemActive(
															'catalog_parts',
															part.id,
															part.active === false
														);
														await loadCatalogs();
													}}
												>
													{part.active === false ? 'Activar' : 'Desactivar'}
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</section>
				</div>
			) : (
				<div className={st.grid}>
					<section className={st.card}>
						<h3 className={st.cardTitle}>Agregar Marca y Modelo</h3>
						<p className={st.muted}>
							Soporta autos, autoelevadores, camiones, maquinaria agrícola e industrial.
						</p>
						<form onSubmit={handleAddBrandModel} className={st.form}>
							<input
								className={st.input}
								placeholder="Marca (ej. HELI, HYSTER, SCANIA)"
								value={newBrand}
								onChange={(e) => setNewBrand(e.target.value)}
								required
							/>
							<input
								className={st.input}
								placeholder="Modelo (ej. CPCD25, H50FT)"
								value={newModel}
								onChange={(e) => setNewModel(e.target.value)}
							/>
							<button type="submit" className={st.primaryBtn} disabled={saving}>
								Guardar Marca / Modelo
							</button>
						</form>
					</section>

					<section className={st.card}>
						<h3 className={st.cardTitle}>Marcas Disponibles ({car_brands.length})</h3>
						<div className={st.list} style={{ maxHeight: 360, overflowY: 'auto' }}>
							{car_brands.slice(0, 60).map((b) => (
								<div key={`${b.id}-${b.brand_name}`} className={st.item}>
									<div>
										<strong>{b.brand_name}</strong>
										{Array.isArray(b.customModels) && b.customModels.length > 0 && (
											<span className={st.meta} style={{ display: 'block' }}>
												Modelos: {b.customModels.join(', ')}
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					</section>
				</div>
			)}
		</div>
	);
};

export default CatalogPanel;
