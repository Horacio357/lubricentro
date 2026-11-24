import React,{useEffect} from 'react'
import classes from '../Admin.module.css'
import { FETCH_STATES, PANEL } from '../utils/adminEnums'
import { useRouter } from 'next/router'
import Spinner from '@/components/Spinner/Spinner'

const FeedbackBox = ({fetchState, panel, response}) => {
    const router = useRouter()
useEffect(() => {
  if(fetchState !== FETCH_STATES.FETCHING){
    scrollToBottom()
  }
}, [fetchState])

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth',
        });
    };

    const copyData = () => {
       setTimeout(async () => await navigator.clipboard.writeText(`mi.rudyservices.com.ar/${response.data.id}`))
    }

  return (
    <div className={classes.feedbackBox} >
        {
            fetchState === FETCH_STATES.FETCHING ?
                <Spinner/>
            : fetchState === FETCH_STATES.ERROR ?
            <span className={classes.errorMessage}>
                {response.message}
            </span>
            : fetchState === FETCH_STATES.SUCCESS ?
            <>
                <span className={classes.errorMessage}>
                    {response.message}
                </span>
                {
                    panel !== PANEL.DELETE_ACCOUNT ?
                    <>
                        <button  
                            className={classes.copyButton} 
                            onClick={()=>copyData()}
                        >
                            Copiar link
                        </button>
                        <button  
                            className={classes.copyButton} 
                            onClick={()=>router.push(`/${response.data.id}`)}
                        >
                            Ir al perfil
                        </button>
                    </>
                    :null
                }
            </>
            :null
        }
    </div>
  )
}

export default FeedbackBox