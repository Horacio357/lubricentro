import React from 'react'
import st from './MinimizeButton.module.css'
const MinimizeButton = ({onClick}) => {
	return (
		<div className={st.container}>
			<button
				onClick={onClick}
				className={st.closeButton}
			>
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				viewBox="0 0 24 24" 
				className={st.svg}
				>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
			</button>
		</div>
	)
}

export default MinimizeButton