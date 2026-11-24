import React,{useState} from 'react'
import classes from './Input.module.css'

const Input = ({type, max, value, uppercase, noSpaces, placeholder, onChange}) => {
  

  const handleChange = (e) => {
    let value = e.target.value
    if(uppercase) value = value.toUpperCase()
    if (noSpaces) value = value.replace(/\s+/g, '')
    if(max){
      if(value.length > max) return
    }
    onChange(value);
  };

  return (
    <input 
        className={classes.input}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e)=>handleChange(e)} 
    />
  )
}

export default Input