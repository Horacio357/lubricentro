import React from 'react'
import st from './ServiceInput.module.css'

const ServiceInput = ({type,value, onChange, title}) => {

	const handleChange = (value) => {
		if(type === "number"){
			onChange(parseInt(value))
			return
		}
		onChange(value)
	}

  return (
    <div className={st.container}>
        <label className={st.label}>{title}</label>
		{
			type === 'textarea' ?
			<textarea
				className={st.textarea}
				onChange={(e)=>handleChange(e.target.value)}
				value={value}
			/>
			
			:
			<input 
				type={type} 
				value={value}
				className={st.input}
				onChange={(e)=>handleChange(e.target.value)}
			/>
		}
    </div>
  )
}

export default ServiceInput