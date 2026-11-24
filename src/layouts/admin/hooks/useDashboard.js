import { useState, useEffect, useCallback } from 'react';
import { getDashboardMetrics } from '../utils/firestoreDashboardHandlers';

const useDashboard = () => {
	const [period, setPeriod] = useState('all');
	const [metrics, setMetrics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchMetrics = useCallback(async (selectedPeriod) => {
		try {
			setLoading(true);
			setError(null);
			const data = await getDashboardMetrics(selectedPeriod);
			setMetrics(data);
		} catch (err) {
			console.error(err);
			setError('No se pudieron cargar las métricas.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchMetrics(period);
	}, [period, fetchMetrics]);

	return {
		period,
		setPeriod,
		metrics,
		loading,
		error,
		refresh: () => fetchMetrics(period),
	};
};

export default useDashboard;
