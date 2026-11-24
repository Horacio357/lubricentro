import React from 'react'
import st from './DeleteUI.module.css'
const DeleteUI = ({onDelete, isAdmin, fetchState, FETCH_STATES}) => {
  return (
    <>
        {
            isAdmin ?
            <div className={st.container}>
                {
                    fetchState === FETCH_STATES.FETCHING ?
                        <span className={st.feedbackSpan}>Procesando...</span>
                    : fetchState === FETCH_STATES.ERROR ?
                        <span className={st.feedbackSpan}>Ocurrió un error, por favor reintente</span>
                    : fetchState === FETCH_STATES.SUCCESS ?
                        <span className={st.feedbackSpan}>Service Borrado, se refrescará la página.</span>
                    : 
                    <button 
                        className={st.deleteButton}
                        onClick={onDelete}
                    >
                        Eliminar Service
                    </button>
                }
            </div>
            :null
        }
    </>
  )
}

export default DeleteUI