import React,{useState,forwardRef,useImperativeHandle, useEffect} from 'react'
import st from './DropdownBox.module.css'
import MinimizeButton from './components/MinimizeButton/MinimizeButton'
import MainButton from './components/MainButton/MainButton'
import { scrollToBottom } from '@/utils/helpers'

const DropdownBox = forwardRef(({
    children,
    buttonText,
    scrollOnOpen,
    grey,
    white
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
            if(scrollOnOpen) scrollToBottom()
        }, [isOpen])

    useImperativeHandle(ref, () => ({
        open:  () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(o => !o)
    }), []);

    return (
        <>
            {   
                isOpen?
                    <div className={st.container}>
                        <MinimizeButton onClick={()=>setIsOpen(false)}/>
                        {children}
                    </div>
                :
                <MainButton
                    title={buttonText}
                    onClick={()=>setIsOpen(true)}
                    grey={grey}
                    white={white}
                /> 
            }
        </>
    )
})

export default DropdownBox