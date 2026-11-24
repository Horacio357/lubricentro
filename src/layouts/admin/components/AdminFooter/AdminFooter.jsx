import React from 'react'
import classes from './AdminFooter.module.css'

const AdminFooter = ({onSignout, signingOut}) => {
  return (
    <div className={classes.container}>
         <span className={classes.sonargroup}>
            Developed by
            <a href="sonargroup.us"> sonargroup.us</a>
        </span>
        {
            signingOut ?
                <span>Cerrando sesión...</span>
            :
                
                <button
                className={classes.closeButton} 
                onClick={onSignout}
                >
                        Cerrar Sesión
                </button>
        }
    </div>
  )
}

export default AdminFooter