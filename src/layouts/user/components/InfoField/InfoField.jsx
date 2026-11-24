import React from 'react'
import st from './InfoField.module.css'

const checkErrors = (info) => {
  if(info && typeof info === "string" && info.includes("undefined")) return null
  return info
}

const InfoField = ({title, info}) => {

  return (
    <div className={st.fieldContainer}>
        <span className={st.fieldTitle}>{title}: </span>
        <span className={st.field}>{checkErrors(info) || '-'}</span>
    </div>
  )
}

export default InfoField