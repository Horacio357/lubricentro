import Button from '@/components/Button/Button'
import React from 'react'
import st from './FeedbackBox.module.css'

const FeedbackBox = ({ isWaitingToSign, onCancel, onPass}) => {
  return (
	<div className={st.feedbackBox}>
		{
			isWaitingToSign ?
			<>
				<button 
					onClick={onCancel}
					className={st.cancelButton}
					type='button'
				>
					Rechazado
				</button>
				<button 
					onClick={onPass}
					className={st.passButton}
					type='button'
				>
					Ticket Firmado
				</button>
			</>
			:
			<Button
				title={'Generar Ticket'}
				type={'submit'}
			/>
		}
	</div>
  )
}

export default FeedbackBox