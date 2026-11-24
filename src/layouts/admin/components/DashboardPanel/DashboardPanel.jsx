import React, { useState } from 'react';
import st from './DashboardPanel.module.css';
import useDashboard from '../../hooks/useDashboard';
import PastelChart from './PastelChart';
import { formatVertical } from '@/utils/firebase/firebase';
import { auth } from '@/services/firebase/firebaseConfig';
import {
	buildWhatsAppUrl,
	buildServiceReminderMessage,
} from '@/utils/whatsappHelper';

const PERIOD_OPTIONS = [
	{ value: 'all', label: 'Histórico completo' },
	{ value: '30d', label: 'Últimos 30 días' },
	{ value: '90d', label: 'Últimos 90 días' },
	{ value: '365d', label: 'Último año' },
];

const formatCurrency = (amount) =>
	new Intl.NumberFormat('es-AR', {
		style: 'currency',
		currency: 'ARS',
		maximumFractionDigits: 0,
	}).format(amount || 0);

const DashboardPanel = () => {
	const { period, setPeriod, metrics, loading, error, refresh } = useDashboard();
	const [sendingReminder, setSendingReminder] = useState(false);
	const [reminderFeedback, setReminderFeedback] = useState(null);
	const [aiInsights, setAiInsights] = useState(null);
	const [aiLoading, setAiLoading] = useState(false);
	const [aiError, setAiError] = useState(null);
	const [chatMessages, setChatMessages] = useState([]);
	const [chatQuestion, setChatQuestion] = useState('');
	const [chatLoading, setChatLoading] = useState(false);

	const verticalKeys = metrics ? Object.keys(metrics.verticalCounts) : [];
	const verticalLabels = verticalKeys.map((k) => formatVertical(k) || k);
	const verticalServiceValues = verticalKeys.map(
		(k) => metrics.verticalCounts[k] || 0
	);
	const verticalRevenueValues = verticalKeys.map(
		(k) => metrics.revenueByVertical[k] || 0
	);

	const brandLabels = metrics ? metrics.topBrands.map(([brand]) => brand) : [];
	const brandValues = metrics ? metrics.topBrands.map(([, count]) => count) : [];

	const handleTriggerReminders = async (vehicleId = null) => {
		setSendingReminder(true);
		setReminderFeedback(null);
		try {
			const token = await auth.currentUser?.getIdToken();
			const res = await fetch('/api/cron/send-reminders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					vehicleId,
					force: Boolean(vehicleId),
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'No se pudieron enviar los avisos.');
			}
			setReminderFeedback({
				type: 'success',
				text: `Evaluados: ${data.evaluated} · Enviados: ${data.sentCount} · En cooldown: ${data.skippedCooldown}`,
			});
		} catch (err) {
			setReminderFeedback({ type: 'error', text: err.message });
		} finally {
			setSendingReminder(false);
		}
	};

	const handleAnalyzeWithAi = async () => {
		if (!metrics) return;
		setAiLoading(true);
		setAiError(null);
		try {
			const token = await auth.currentUser?.getIdToken();
			const res = await fetch('/api/ai/assist', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({
					action: 'analyze_metrics',
					payload: {
						metricsSummary: {
							period,
							totalClients: metrics.totalClients,
							totalServices: metrics.totalServices,
							totalRevenue: metrics.totalRevenue,
							averageTicket: metrics.averageTicket,
							verticalCounts: metrics.verticalCounts,
							revenueByVertical: metrics.revenueByVertical,
							overallAverages: metrics.globalAverages?.overall,
							dueVehiclesCount: (metrics.dueVehicles || []).length,
						},
					},
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'No se pudo analizar con IA.');
			}
			setAiInsights(data.insights);
		} catch (err) {
			setAiError(err.message);
		} finally {
			setAiLoading(false);
		}
	};

	const handleAskAi = async (customQuestion = null) => {
		const q = (customQuestion ?? chatQuestion).trim();
		if (!q || !metrics) return;
		setChatLoading(true);
		setAiError(null);
		const nextHistory = [...chatMessages, { role: 'user', content: q }];
		setChatMessages(nextHistory);
		if (!customQuestion) setChatQuestion('');

		try {
			const token = await auth.currentUser?.getIdToken();
			const res = await fetch('/api/ai/assist', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({
					action: 'super_admin_chat',
					payload: {
						question: q,
						history: chatMessages,
						businessContext: {
							period,
							totalClients: metrics.totalClients,
							totalServices: metrics.totalServices,
							totalRevenue: metrics.totalRevenue,
							averageTicket: metrics.averageTicket,
							verticalCounts: metrics.verticalCounts,
							revenueByVertical: metrics.revenueByVertical,
							topBrands: metrics.topBrands,
							overallAverages: metrics.globalAverages?.overall,
							dueVehiclesCount: (metrics.dueVehicles || []).length,
							dueVehiclesSample: (metrics.dueVehicles || []).slice(0, 6),
							lowStockParts: (metrics.lowStockParts || []).map((p) => ({
								name: p.name,
								sku: p.sku,
								stock: p.stock,
								minStock: p.minStock,
							})),
						},
					},
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'No se pudo obtener respuesta de la IA.');
			}
			setChatMessages([
				...nextHistory,
				{ role: 'assistant', content: data.answer },
			]);
		} catch (err) {
			setAiError(err.message);
		} finally {
			setChatLoading(false);
		}
	};

	const overallAvg = metrics?.globalAverages?.overall;
	const dueVehicles = metrics?.dueVehicles || [];

	return (
		<div className={st.container}>
			<div className={st.header}>
				<div>
					<h3 className={st.title}>Métricas del Lubricentro</h3>
					<p className={st.subtitle}>
						Resumen operativo, medias de recurrencia y avisos automáticos
					</p>
				</div>
				<div className={st.controls}>
					<select
						className={st.periodSelect}
						value={period}
						onChange={(e) => setPeriod(e.target.value)}
						aria-label="Filtrar por período"
					>
						{PERIOD_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
					<button
						type="button"
						className={st.refreshButton}
						onClick={refresh}
						disabled={loading}
					>
						{loading ? 'Actualizando...' : 'Actualizar'}
					</button>
				</div>
			</div>

			{error && <p className={st.error}>{error}</p>}

			<div className={st.kpiGrid}>
				<div className={st.kpiCard}>
					<span className={st.kpiLabel}>Vehículos Registrados</span>
					<span className={st.kpiValue}>
						{loading && !metrics ? '—' : metrics?.totalClients ?? 0}
					</span>
				</div>
				<div className={st.kpiCard}>
					<span className={st.kpiLabel}>Services en Período</span>
					<span className={st.kpiValue}>
						{loading && !metrics ? '—' : metrics?.totalServices ?? 0}
					</span>
				</div>
				<div className={st.kpiCard}>
					<span className={st.kpiLabel}>Facturación Estimada</span>
					<span className={`${st.kpiValue} ${st.kpiAccent}`}>
						{loading && !metrics
							? '—'
							: formatCurrency(metrics?.totalRevenue)}
					</span>
				</div>
				<div className={st.kpiCard}>
					<span className={st.kpiLabel}>Media entre Services</span>
					<span className={st.kpiValue}>
						{overallAvg
							? `${overallAvg.avgDays} d / ${overallAvg.avgKm.toLocaleString('es-AR')} km`
							: '—'}
					</span>
				</div>
			</div>

			{metrics && (
				<>
					<div className={st.chartsGrid}>
						<PastelChart
							title="Servicios por Categoría"
							labels={verticalLabels}
							values={verticalServiceValues}
							type="doughnut"
						/>
						<PastelChart
							title="Facturación por Categoría"
							labels={verticalLabels}
							values={verticalRevenueValues}
							type="pie"
							valueFormatter={formatCurrency}
						/>
						<PastelChart
							title="Top Marcas Atendidas"
							labels={brandLabels}
							values={brandValues}
							type="doughnut"
						/>
					</div>

					<section className={st.remindersCard}>
						<div className={st.remindersHeader}>
							<div>
								<h4 className={st.chartTitle}>Asistente IA de Gestión (Super Admin)</h4>
								<p className={st.subtitle}>
									Consulta informes del negocio, servicios faltantes y estado del software
								</p>
							</div>
							<button
								type="button"
								className={st.refreshButton}
								onClick={handleAnalyzeWithAi}
								disabled={aiLoading}
							>
								{aiLoading ? 'Analizando...' : 'Informe Rápido IA'}
							</button>
						</div>
						{aiError && <p className={st.error}>{aiError}</p>}
						{aiInsights && (
							<pre
								style={{
									margin: 0,
									padding: 12,
									borderRadius: 10,
									backgroundColor: 'rgba(252, 189, 0, 0.08)',
									border: '1px solid rgba(252, 189, 0, 0.25)',
									whiteSpace: 'pre-wrap',
									fontFamily: 'inherit',
									fontSize: '0.88em',
									lineHeight: 1.5,
									color: '#e5e5e5',
								}}
							>
								{aiInsights}
							</pre>
						)}

						<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
							{[
								'¿Qué servicios están faltando o tienen baja demanda?',
								'Dame un informe ejecutivo del lubricentro',
								'¿Cómo está funcionando el software y qué falta configurar?',
								'¿Qué unidades vencidas deberíamos contactar hoy?',
							].map((preset) => (
								<button
									key={preset}
									type="button"
									disabled={chatLoading}
									onClick={() => handleAskAi(preset)}
									style={{
										border: '1px solid #363636',
										backgroundColor: '#2e2e2e',
										color: '#FCBD00',
										borderRadius: 999,
										padding: '5px 11px',
										fontSize: '0.78em',
										cursor: 'pointer',
									}}
								>
									{preset}
								</button>
							))}
						</div>

						{chatMessages.length > 0 && (
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: 8,
									maxHeight: 320,
									overflowY: 'auto',
									padding: 10,
									borderRadius: 10,
									backgroundColor: 'rgba(0, 0, 0, 0.3)',
									border: '1px solid #363636',
								}}
							>
								{chatMessages.map((msg, idx) => (
									<div
										key={idx}
										style={{
											alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
											maxWidth: '90%',
											padding: '8px 12px',
											borderRadius: 10,
											fontSize: '0.86em',
											lineHeight: 1.45,
											whiteSpace: 'pre-wrap',
											backgroundColor:
												msg.role === 'user'
													? 'rgba(252, 189, 0, 0.18)'
													: '#242424',
											color: msg.role === 'user' ? '#FCBD00' : '#f1f1f1',
										}}
									>
										{msg.content}
									</div>
								))}
							</div>
						)}

						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleAskAi();
							}}
							style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
						>
							<input
								type="text"
								className={st.periodSelect}
								placeholder="Haz una pregunta a la IA sobre el negocio o el sistema..."
								value={chatQuestion}
								onChange={(e) => setChatQuestion(e.target.value)}
								style={{ flex: 1, minWidth: 220 }}
							/>
							<button
								type="submit"
								className={st.sendOneBtn}
								disabled={chatLoading || !chatQuestion.trim()}
							>
								{chatLoading ? 'Pensando...' : 'Preguntar'}
							</button>
						</form>
					</section>

					{(metrics.lowStockParts || []).length > 0 && (
						<section
							className={st.remindersCard}
							style={{ borderColor: 'rgba(206, 38, 38, 0.55)' }}
						>
							<div className={st.remindersHeader}>
								<div>
									<h4 className={st.chartTitle} style={{ color: '#ff9c9c' }}>
										Reposición Urgente de Repuestos ({metrics.lowStockParts.length})
									</h4>
									<p className={st.subtitle}>
										Insumos con stock igual o menor al mínimo configurado
									</p>
								</div>
								<button
									type="button"
									className={st.refreshButton}
									onClick={() => {
										const text = [
											'*Pedido urgente de repuestos - R Services*',
											...metrics.lowStockParts.map(
												(p) =>
													`• ${p.name}${p.sku ? ` [${p.sku}]` : ''} (Stock actual: ${
														p.stock ?? 0
													}, Mín: ${p.minStock ?? 3})`
											),
										].join('\n');
										navigator.clipboard?.writeText(text);
										alert('Lista de compra copiada al portapapeles.');
									}}
								>
									Copiar Lista de Compra
								</button>
							</div>
							<div className={st.dueList}>
								{metrics.lowStockParts.map((part) => (
									<div key={part.id || part.sku} className={st.dueItem}>
										<div className={st.dueInfo}>
											<div className={st.dueTitleRow}>
												<strong>{part.name}</strong>
												<span className={st.badgeOverdue}>
													Stock: {part.stock ?? 0} / Mín: {part.minStock ?? 3}
												</span>
											</div>
											<span className={st.dueMeta}>
												{part.sku ? `SKU: ${part.sku} · ` : ''}Categoría: {part.category || 'General'}
											</span>
										</div>
									</div>
								))}
							</div>
						</section>
					)}

					<section className={st.remindersCard}>
						<div className={st.remindersHeader}>
							<div>
								<h4 className={st.chartTitle}>
									Avisos por Media de Recurrencia ({dueVehicles.length})
								</h4>
								<p className={st.subtitle}>
									Vehículos vencidos o a menos de 15 días de su próximo service estimado
								</p>
							</div>
							{dueVehicles.length > 0 && (
								<button
									type="button"
									className={st.refreshButton}
									onClick={() => handleTriggerReminders(null)}
									disabled={sendingReminder}
								>
									{sendingReminder
										? 'Enviando...'
										: 'Enviar Avisos Pendientes'}
								</button>
							)}
						</div>

						{reminderFeedback && (
							<p
								className={
									reminderFeedback.type === 'error'
										? st.error
										: st.successMsg
								}
							>
								{reminderFeedback.text}
							</p>
						)}

						{dueVehicles.length === 0 ? (
							<p className={st.emptyState}>
								No hay vehículos vencidos ni próximos a vencer en este momento.
							</p>
						) : (
							<div className={st.dueList}>
								{dueVehicles.slice(0, 12).map((item) => (
									<div key={item.vehicleId} className={st.dueItem}>
										<div className={st.dueInfo}>
											<div className={st.dueTitleRow}>
												<strong>
													{item.patente} · {item.brand} {item.model}
												</strong>
												<span
													className={
														item.status === 'overdue'
															? st.badgeOverdue
															: st.badgeSoon
													}
												>
													{item.daysUntilDue <= 0
														? `Vencido (${Math.abs(item.daysUntilDue)} d)`
														: `En ${item.daysUntilDue} días`}
												</span>
											</div>
											<span className={st.dueMeta}>
												Rubro: {formatVertical(item.lastVertical) || item.lastVertical}
												{item.estimatedNextKm
													? ` · Próx. est.: ${item.estimatedNextKm.toLocaleString(
															'es-AR'
													  )} km`
													: ''}
											</span>
										</div>
										<div className={st.dueActions}>
											<a
												href={`/${item.vehicleId}`}
												className={st.linkBtn}
												target="_blank"
												rel="noreferrer"
											>
												Ver Ficha
											</a>
											<a
												href={buildWhatsAppUrl(
													item.phone_number || '',
													buildServiceReminderMessage({
														vehicle: {
															id: item.vehicleId,
															brand: item.brand,
															model: item.model,
															patente: item.patente,
														},
														estimate: item,
													})
												)}
												target="_blank"
												rel="noreferrer"
												className={st.linkBtn}
												style={{ borderColor: '#25D366', color: '#25D366' }}
											>
												WhatsApp
											</a>
											<button
												type="button"
												className={st.sendOneBtn}
												disabled={sendingReminder}
												onClick={() => handleTriggerReminders(item.vehicleId)}
											>
												Enviar Email
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
};

export default DashboardPanel;