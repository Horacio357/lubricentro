import React from 'react';
import styles from './ChecklistItem.module.css';

const ChecklistItem = ({ label, checked, onChange }) => {

	return (
		<div className={styles.itemRow}>
			<span className={styles.label}>{label}</span>
			<div className={styles.checkboxContainer}>
				<button
					type='button'
					className={`${styles.customCheckbox} ${checked ? styles.checked : null}`}
					onClick={onChange}
				>
					{checked ?"✕":null}
				</button>
			</div>
		</div>
	);
};

export default ChecklistItem;