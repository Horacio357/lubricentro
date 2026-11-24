import React, { useEffect, useRef } from 'react';
import {
	Chart,
	ArcElement,
	Tooltip,
	Legend,
	PieController,
	DoughnutController,
} from 'chart.js';
import st from './DashboardPanel.module.css';

Chart.register(ArcElement, Tooltip, Legend, PieController, DoughnutController);

export const PASTEL_PALETTE = [
	'#FFE082', // Ámbar pastel
	'#A8E6CF', // Menta pastel
	'#FFAAA5', // Coral pastel
	'#C3B1E1', // Lavanda pastel
	'#A0D2EB', // Celeste pastel
	'#FFD3B6', // Durazno pastel
];

const PastelChart = ({
	title,
	labels,
	values,
	type = 'doughnut',
	valueFormatter = (v) => v,
	emptyText = 'Sin datos para mostrar en este período.',
}) => {
	const canvasRef = useRef(null);
	const chartRef = useRef(null);

	const total = values.reduce((acc, val) => acc + (Number(val) || 0), 0);

	useEffect(() => {
		if (!canvasRef.current || total === 0) return;

		if (chartRef.current) {
			chartRef.current.destroy();
		}

		const prefersReducedMotion =
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const colors = labels.map(
			(_, idx) => PASTEL_PALETTE[idx % PASTEL_PALETTE.length]
		);

		chartRef.current = new Chart(canvasRef.current, {
			type,
			data: {
				labels,
				datasets: [
					{
						data: values,
						backgroundColor: colors,
						borderColor: '#1d1d1d',
						borderWidth: 3,
						hoverOffset: 10,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: type === 'doughnut' ? '62%' : '0%',
				animation: {
					animateRotate: !prefersReducedMotion,
					animateScale: !prefersReducedMotion,
					duration: prefersReducedMotion ? 0 : 850,
					easing: 'easeOutQuart',
				},
				plugins: {
					legend: {
						display: false,
					},
					tooltip: {
						backgroundColor: '#141414',
						titleColor: '#FCBD00',
						bodyColor: '#ffffff',
						borderColor: '#363636',
						borderWidth: 1,
						padding: 12,
						cornerRadius: 10,
						callbacks: {
							label: (ctx) => {
								const rawVal = Number(ctx.raw) || 0;
								const pct = total > 0 ? ((rawVal / total) * 100).toFixed(1) : 0;
								return ` ${ctx.label}: ${valueFormatter(rawVal)} (${pct}%)`;
							},
						},
					},
				},
			},
		});

		return () => {
			if (chartRef.current) {
				chartRef.current.destroy();
				chartRef.current = null;
			}
		};
	}, [labels, values, type, total, valueFormatter]);

	return (
		<div className={st.chartCard}>
			<h4 className={st.chartTitle}>{title}</h4>
			{total === 0 ? (
				<p className={st.emptyState}>{emptyText}</p>
			) : (
				<div className={st.chartBody}>
					<div className={st.canvasWrap}>
						<canvas ref={canvasRef} />
					</div>
					<ul className={st.legendList}>
						{labels.map((label, idx) => {
							const val = Number(values[idx]) || 0;
							if (val === 0) return null;
							const pct = ((val / total) * 100).toFixed(1);
							const color = PASTEL_PALETTE[idx % PASTEL_PALETTE.length];
							return (
								<li key={label} className={st.legendItem}>
									<span
										className={st.legendDot}
										style={{ backgroundColor: color }}
									/>
									<span className={st.legendLabel}>{label}</span>
									<span className={st.legendValue}>
										{valueFormatter(val)} ({pct}%)
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
};

export default PastelChart;
