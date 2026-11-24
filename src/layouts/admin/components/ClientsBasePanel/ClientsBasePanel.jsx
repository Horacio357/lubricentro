import React, { useEffect, useMemo, useState } from 'react';
import { collection, collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';
import { formatDate, formatVertical } from '@/utils/firebase/firebase';
import { SERVICE_VERTICALS, getUnitIdentifier } from '@/utils/serviceTemplates';
import { isDevBypassEnabled, DEV_MOCK_VEHICLES } from '@/utils/devMockData';
import st from '../DashboardPanel/DashboardPanel.module.css';

const ClientsBasePanel = () => {
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [verticalFilter, setVerticalFilter] = useState('ALL');
	const [unitFilter, setUnitFilter] = useState('ALL');
	const [optInFilter, setOptInFilter] = useState('ALL');
	const [deduplicate, setDeduplicate] = useState(true);
	const [searchText, setSearchText] = useState('');

	useEffect(() => {
		const loadBase = async () => {
			setLoading(true);
			try {
				if (isDevBypassEnabled()) {
					const mapped = DEV_MOCK_VEHICLES.map((v) => buildRowFromMock(v));
					setRows(mapped);
					setLoading(false);
					return;
				}

				const [vehiclesSnap, privateSnap, servicesSnap] = await Promise.all([
					getDocs(collection(db, 'vehicles')),
					getDocs(collection(db, 'vehicles_private')),
					getDocs(collectionGroup(db, 'services')),
				]);

				const privById = {};
				privateSnap.forEach((d) => {
					privById[d.id] = d.data();
				});

				const servicesByVehicle = {};
				servicesSnap.forEach((d) => {
					if (d.ref.path.startsWith('vehicles/')) {
						const vId = d.ref.parent?.parent?.id;
						if (vId) {
							if (!servicesByVehicle[vId]) servicesByVehicle[vId] = [];
							servicesByVehicle[vId].push({ id: d.id, ...d.data() });
						}
					}
				});

				const list = vehiclesSnap.docs.map((docSnap) => {
					const v = { id: docSnap.id, ...docSnap.data() };
					const priv = privById[docSnap.id] || {};
					const svcs = servicesByVehicle[docSnap.id] || [];
					return buildRow(v, priv, svcs);
				});

				setRows(list.length > 0 ? list : []);
			} catch (err) {
				if (isDevBypassEnabled()) {
					setRows(DEV_MOCK_VEHICLES.map((v) => buildRowFromMock(v)));
				}
			} finally {
				setLoading(false);
			}
		};

		loadBase();
	}, []);

	const filtered = useMemo(() => {
		const q = searchText.trim().toUpperCase();
		const matched = rows.filter((r) => {
			if (unitFilter !== 'ALL' && r.unitType !== unitFilter) return false;
			if (
				verticalFilter !== 'ALL' &&
				!r.verticals.includes(verticalFilter)
			) {
				return false;
			}
			if (optInFilter === 'OPT_IN' && !r.marketingOptIn) return false;
			if (optInFilter === 'OPT_OUT' && r.marketingOptIn) return false;
			if (q) {
				const haystack = `${r.clientName} ${r.clientNumber} ${r.phone} ${r.unitLabel} ${r.brandModel}`.toUpperCase();
				if (!haystack.includes(q)) return false;
			}
			return true;
		});

		if (!deduplicate) return matched;

		const grouped = new Map();
		for (const r of matched) {
			const key = (r.phone || r.email || r.clientNumber || r.id).trim();
			if (!grouped.has(key)) {
				grouped.set(key, { ...r });
			} else {
				const prev = grouped.get(key);
				prev.unitLabel = `${prev.unitLabel} | ${r.unitLabel}`;
				prev.brandModel = `${prev.brandModel} | ${r.brandModel}`;
				prev.verticals = Array.from(new Set([...prev.verticals, ...r.verticals]));
			}
		}
		return Array.from(grouped.values());
	}, [rows, verticalFilter, unitFilter, optInFilter, searchText, deduplicate]);

	const handleExportCsv = () => {
		const headers = [
			'N° Cliente',
			'Nombre',
			'Teléfono',
			'Email',
			'Tipo Unidad',
			'Identificación',
			'Marca / Modelo',
			'Servicios Realizados',
			'Última Visita',
			'Próximo Mantenimiento',
			'Acepta Comunicaciones',
		];
		const csvRows = [
			headers.join(','),
			...filtered.map((r) =>
				[
					r.clientNumber,
					r.clientName,
					r.phone,
					r.email,
					r.unitType,
					r.unitLabel,
					r.brandModel,
					r.verticals.map((v) => formatVertical(v) || v).join(' | '),
					r.lastVisit,
					r.nextService,
					r.marketingOptIn ? 'Sí' : 'No',
				]
					.map((val) => `"${String(val || '').replace(/"/g, '""')}"`)
					.join(',')
			),
		];
		const blob = new Blob([csvRows.join('\n')], {
			type: 'text/csv;charset=utf-8;',
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `base_clientes_r_services.csv`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<div className={st.container}>
			<div className={st.header}>
				<div>
					<h3 className={st.title}>Base de Clientes y Unidades ({filtered.length})</h3>
					<p className={st.subtitle}>
						Planilla general para seguimiento, filtros por rubro y exportación CSV
					</p>
				</div>
				<button
					type="button"
					className={st.refreshButton}
					onClick={handleExportCsv}
					disabled={filtered.length === 0}
				>
					Exportar CSV (Excel)
				</button>
			</div>

			<div className={st.controls}>
				<input
					type="text"
					className={st.periodSelect}
					placeholder="Filtrar por nombre, N° cliente, patente o serie..."
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					style={{ flex: 1, minWidth: 200 }}
				/>
				<select
					className={st.periodSelect}
					value={verticalFilter}
					onChange={(e) => setVerticalFilter(e.target.value)}
				>
					<option value="ALL">Todos los rubros</option>
					{SERVICE_VERTICALS.map((v) => (
						<option key={v} value={v}>
							{formatVertical(v) || v}
						</option>
					))}
				</select>
				<select
					className={st.periodSelect}
					value={unitFilter}
					onChange={(e) => setUnitFilter(e.target.value)}
				>
					<option value="ALL">Vehículos y Autoelevadores</option>
					<option value="vehiculo">Solo Vehículos</option>
					<option value="autoelevador">Solo Autoelevadores</option>
				</select>
				<select
					className={st.periodSelect}
					value={optInFilter}
					onChange={(e) => setOptInFilter(e.target.value)}
				>
					<option value="ALL">Comunicaciones: Todos</option>
					<option value="OPT_IN">Aceptan promos/avisos</option>
					<option value="OPT_OUT">No contactar</option>
				</select>
				<label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84em', cursor: 'pointer' }}>
					<input
						type="checkbox"
						checked={deduplicate}
						onChange={(e) => setDeduplicate(e.target.checked)}
					/>
					Evitar duplicados
				</label>
			</div>

			{loading ? (
				<p className={st.emptyState}>Cargando base de clientes...</p>
			) : filtered.length === 0 ? (
				<p className={st.emptyState}>No hay registros que coincidan con los filtros.</p>
			) : (
				<div className={st.dueList}>
					{filtered.map((r) => (
						<div key={r.id} className={st.dueItem}>
							<div className={st.dueInfo}>
								<div className={st.dueTitleRow}>
									<strong>
										{r.clientName} {r.clientNumber ? `(${r.clientNumber})` : ''}
									</strong>
									<span className={st.badgeSoon}>
										{r.unitType === 'autoelevador' ? 'Autoelevador' : 'Vehículo'} ·{' '}
										{r.unitLabel}
									</span>
									{!r.marketingOptIn && (
										<span className={st.badgeOverdue}>No contactar</span>
									)}
								</div>
								<span className={st.dueMeta}>
									{r.brandModel} · Tel: {r.phone || '-'} · Última visita: {r.lastVisit || '-'}
									{r.nextService ? ` · Próx: ${r.nextService}` : ''}
								</span>
							</div>
							<div className={st.dueActions}>
								<a
									href={`/${r.id}`}
									className={st.linkBtn}
									target="_blank"
									rel="noreferrer"
								>
									Ver Ficha
								</a>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

function buildRow(v, priv, svcs) {
	const sorted = [...svcs].sort(
		(a, b) => (a.timestamp?.toDate?.() || 0) - (b.timestamp?.toDate?.() || 0)
	);
	const last = sorted[sorted.length - 1];
	const verticals = Array.from(new Set(svcs.map((s) => s.vertical).filter(Boolean)));
	return {
		id: v.id,
		unitType: v.unitType || 'vehiculo',
		unitLabel: getUnitIdentifier(v),
		brandModel: `${v.brand || ''} ${v.model || ''}`.trim(),
		clientNumber: v.clientNumber || priv.clientNumber || '',
		clientName:
			`${priv.owner_name || ''} ${priv.owner_surname || ''}`.trim() ||
			'Sin nombre',
		phone: priv.phone_number || '',
		email: priv.email || '',
		marketingOptIn:
			v.marketingOptIn !== false && priv.marketingOptIn !== false,
		verticals,
		lastVisit: last ? formatDate(last.timestamp) : '-',
		nextService: last?.next_service || '-',
	};
}

function buildRowFromMock(v) {
	return buildRow(v, v.privateData || {}, v.services || []);
}

export default ClientsBasePanel;
