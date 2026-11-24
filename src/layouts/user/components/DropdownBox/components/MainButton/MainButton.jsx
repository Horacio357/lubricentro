import React from 'react'
import st from './MainButton.module.css'

const MainButton = ({title, onClick, grey, white}) => {
  return (
    <button
        onClick={onClick}
        className={ `${st.button} ${grey ? st.grey : white ? st.white : st.yellow}`}
    >
        {title}
    </button> 
)
}

export default MainButton