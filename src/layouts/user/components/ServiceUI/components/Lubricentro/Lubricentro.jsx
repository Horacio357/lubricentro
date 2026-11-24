import React from 'react';
import st from './Lubricentro.module.css';
import InfoField from '../../../InfoField/InfoField';

const Lubricentro = ({ lubricentro }) => {
	if (!lubricentro) return null;
	const hasStructuredFilters =
		Array.isArray(lubricentro.filters) && lubricentro.filters.length > 0;

	return (
		<div className={st.container}>
			<InfoField
				title={'Aceite'}
				info={[
					lubricentro.tipo,
					lubricentro.oilSpec,
					lubricentro.oilLiters ? `${lubricentro.oilLiters} L` : '',
				]
					.filter(Boolean)
					.join(' · ')}
			/>

			{hasStructuredFilters ? (
				<div
					style={{
						marginTop: 6,
						padding: 8,
						borderRadius: 8,
						backgroundColor: 'rgba(255,255,255,0.04)',
						fontSize: '0.82em',
					}}
				>
					<strong style={{ color: '#FCBD00', display: 'block', marginBottom: 4 }}>
						Filtros e insumos registrados:
					</strong>
					{lubricentro.filters.map((f, idx) => (
						<div key={idx} style={{ marginBottom: 2 }}>
							• <strong>{f.type}</strong> ({f.action === 'revisado' ? 'Revisado' : 'Reemplazado'})
							{f.brand ? ` · ${f.brand}` : ''}
							{f.manufacturerCode ? ` · Cód: ${f.manufacturerCode}` : ''}
							{f.sku ? ` · SKU: ${f.sku}` : ''}
							{f.qty > 1 ? ` · x${f.qty}` : ''}
						</div>
					))}
				</div>
			) : null}

			{lubricentro.filtro_aceite ? (
				<span className={st.checkSpan}>Filtro de aceite</span>
			) : null}
			{lubricentro.filtro_aire ? (
				<span className={st.checkSpan}>Filtro de aire</span>
			) : null}
			{lubricentro.filtro_combustible ? (
				<span className={st.checkSpan}>Filtro de combustible</span>
			) : null}
			{lubricentro.engrase ? (
				<span className={st.checkSpan}>Engrase / Revisión niveles</span>
			) : null}
		</div>
	);
};

export default Lubricentro;