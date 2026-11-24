import React from 'react';
import styles from './ChecklistItemSides.module.css';

const ChecklistItemSides = ({ label, checkedRight, checkedLeft, onChangeLeft, onChangeRight }) => {

  	return (
		<div className={styles.itemRow}>
			<span className={styles.label}>{label}</span>
			<div className={styles.checkboxContainer}>
					<button
						type='button'
						className={`${styles.customCheckbox} ${checkedRight ? styles.checked : ''} ${styles.right}`}
						onClick={onChangeRight}
					>
						{checkedRight ?"✕":null}
					</button>
					<button
						type='button'
						className={`${styles.customCheckbox} ${checkedLeft ? styles.checked : ''} ${styles.left}`}
						onClick={onChangeLeft}
					>
						{checkedLeft ?"✕":null}
					</button>
			</div>
		</div>
	);
};

export default ChecklistItemSides;