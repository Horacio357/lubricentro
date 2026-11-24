import React from 'react'
import st from './Form.module.css'
const Form = ({children, onSubmit}) => {

	const handleSubmit = (event) => {
		event.preventDefault(); 
		onSubmit()
		return false;
	};

  	return (
		<form 
			className={st.form}
			onSubmit={handleSubmit}
		>
			{...children}
		</form>
	)
}

export default Form