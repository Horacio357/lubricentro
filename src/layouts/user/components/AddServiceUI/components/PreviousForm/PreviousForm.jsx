import React from 'react';
import st from './PreviousForm.module.css'
import ChecklistSection from './components/ChecklistSection/ChecklistSection';
import ServiceInput from '../ServiceInput/ServiceInput';
import FeedbackBox from './components/FeedbackBox/FeedbackBox';

const PreviousForm = ({data, onPass, onCancel, isWaitingToSign, extraData, onSubmit, onUpdate, onUpdateExtra}) => {

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit()
		return false;
	};
	const handleCancel = () => {
		if(confirm('¿Eliminar chequeo?')) onCancel()
	}

  	return (
		<form onSubmit={handleSubmit}>
			{
				data.map((section, index)=>
					<ChecklistSection
						key={section.title}
						data={section}
						onToggle={(sectionData)=>onUpdate({...sectionData, index})}
					/>
				)
			}
			<label className={st.label}>Inspección realizada por</label>
			<ServiceInput
				type={'text'}
				value={extraData.by || ''}
				onChange={(value)=>onUpdateExtra({key:'by', value})}
			/>
			<label className={st.label}>Detalles</label>
			<ServiceInput
				type={'textarea'}
				value={extraData.details || ''}
				onChange={(value)=>onUpdateExtra({key:'details', value})}
			/>
			<FeedbackBox
				isWaitingToSign={isWaitingToSign} 
				onCancel={handleCancel} 
				onPass={onPass} 
			/>
		</form>
	);
};

export default PreviousForm;