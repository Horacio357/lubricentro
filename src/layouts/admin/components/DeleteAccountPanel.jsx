import React, {useState} from 'react'
import Input from '@/components/Input/Input'
import Button from '@/components/Button/Button'
import Form from '@/components/Form/Form'

const DeleteAccountPanel = ({onDelete}) => {
    const [patente, setPatente] = useState('')

  return (
    <Form onSubmit={()=>onDelete(patente)}>
        <Input 
            type={'text'}   
            placeholder={'Chapa patente'} 
            uppercase
            value={patente}
			      noSpaces
            max={7}
            onChange={(value)=>setPatente(value)}
        />             
        <Button 
            title={'Eliminar'} 
            danger
            type={'submit'}
        />
    </Form>
  )
}

export default DeleteAccountPanel