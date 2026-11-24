import React from 'react';
import st from '../LubricentroUI/LubricentroUI.module.css';

const TiresUI = ({ value = {}, onChange }) => {
	return (
		<div className={st.container}>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.reemplazo)}
					onChange={(e) => onChange('reemplazo', e.target.checked)}
				/>
				Reemplazo de neumáticos
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.rotacion)}
					onChange={(e) => onChange('rotacion', e.target.checked)}
				/>
				Rotación de neumáticos
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.alineacion)}
					onChange={(e) => onChange('alineacion', e.target.checked)}
				/>
				Alineación
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.balanceo)}
					onChange={(e) => onChange('balanceo', e.target.checked)}
				/>
				Balanceo
			</label>
			<label className={st.checkboxLabel}>
				<input
					type="checkbox"
					checked={Boolean(value.reparacion)}
					onChange={(e) => onChange('reparacion', e.target.checked)}
				/>
				Reparación / parche
			</label>

			<div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
				<input
					className={st.input}
					type="text"
					placeholder="Marca (ej. Bridgestone)"
					value={value.tireBrand || ''}
					onChange={(e) => onChange('tireBrand', e.target.value)}
				/>
				<input
					className={st.input}
					type="text"
					placeholder="Medida (ej. 185/60 R15)"
					value={value.tireSize || ''}
					onChange={(e) => onChange('tireSize', e.target.value)}
				/>
			</div>
			<input
				className={st.input}
				type="number"
				min="1"
				placeholder="Cantidad de neumáticos"
				value={value.qty || ''}
				onChange={(e) => onChange('qty', e.target.value)}
			/>
		</div>
	);
};

export default TiresUI;
