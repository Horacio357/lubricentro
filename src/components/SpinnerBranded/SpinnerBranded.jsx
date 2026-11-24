import React from 'react';
import st from './SpinnerBranded.module.css';

const SpinnerBranded = ({ fullscreen = false, isLoading = false }) => {
	return (
		<div
			className={`${st.container} ${fullscreen ? st.fullscreen : ''} ${
				!isLoading ? st.hidden : ''
			}`}
			aria-hidden={!isLoading}
		>
			<div className={st.loaderBox}>
				<svg
					className={st.ring}
					viewBox="0 0 64 64"
					width="64"
					height="64"
					aria-label="Cargando"
				>
					<circle
						className={st.track}
						cx="32"
						cy="32"
						r="26"
						fill="none"
						strokeWidth="4"
					/>
					<circle
						className={st.arc}
						cx="32"
						cy="32"
						r="26"
						fill="none"
						strokeWidth="4"
						strokeLinecap="round"
					/>
				</svg>
				<img
					src="/logo_rudy.webp"
					alt="RudyServices"
					className={st.brandBadge}
					width={32}
					height={32}
				/>
			</div>
		</div>
	);
};

export default SpinnerBranded;