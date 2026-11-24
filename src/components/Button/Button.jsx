import React from 'react'
import classes from './Button.module.css'

const Button = ({title, onClick, danger, type}) => {

return (
    <button 
        className={`${classes.button} ${danger ? classes.danger : null}`} 
        onClick={onClick}
		type={type}
    >
        {title}
    </button>
  )
}

export default Button