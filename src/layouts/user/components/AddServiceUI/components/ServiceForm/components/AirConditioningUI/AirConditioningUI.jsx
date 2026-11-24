import React from 'react';
import st from '../LubricentroUI/LubricentroUI.module.css';

const AirConditioningUI = ({ value = {}, onChange }) => {
	return (
		<div className={st.container}>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.gasCharge)}
					onChange={(e) => onChange('gasCharge', e.target.checked)}
				/>
				Carga de gas refrigerante
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.leakCheck)}
					onChange={(e) => onChange('leakCheck', e.target.checked)}
				/>
				Control de fugas / presurización
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.cabinFilterReplaced)}
					onChange={(e) => onChange('cabinFilterReplaced', e.target.checked)}
				/>
				Reemplazo de filtro de habitáculo
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.compressorCheck)}
					onChange={(e) => onChange('compressorCheck', e.target.checked)}
				/>
				Revisión de compresor y correa
			</label>

			<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
				<input
					className={st.input}
					type="text"
					placeholder="Tipo de gas (ej. R134a)"
					value={value.gasType || ''}
					onChange={(e) => onChange('gasType', e.target.value)}
				/>
				<input
					className={st.input}
					type="number"
					placeholder="Cantidad (gr)"
					value={value.gasGrams || ''}
					onChange={(e) => onChange('gasGrams', e.target.value)}
				/>
			</div>
			<input
				className={st.input}
				type="text"
				placeholder="Código filtro habitáculo (si aplica)"
				value={value.cabinFilterCode || ''}
				onChange={(e) => onChange('cabinFilterCode', e.target.value)}
			/>
		</div>
	);
};

export default AirConditioningUI;
