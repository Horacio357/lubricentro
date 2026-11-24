import React from 'react'
import st from './Footer.module.css'

const Footer = () => {
    return (
        <footer className={st.footer}>
            <div className={st.socialMedia}>
                <a href="https://www.instagram.com/rudyservices.tuc?igsh=MWJ3cWF6dHJ4cGRlOA%3D%3D" className={st.icon} style={{padding:'0px'}}>
                    <img 
                        src="/footer/ig.png" 
                        alt="logo de Rudy Services" 
                        className={st.iconImg}
                    />
                </a>
                <a href="https://rudyservices.com.ar/" className={st.icon} style={{padding:'4px'}}>
                    <img 
                        src="/footer/web.png" 
                        alt="logo de Rudy Services" 
                        className={st.iconImg}
                    />
                </a>
                <a href="https://www.linkedin.com/in/rudyservice/" className={st.icon}>
                    <img 
                        src="/footer/linkedin.png" 
                        alt="logo de Rudy Services" 
                        className={st.iconImg}
                    />
                </a>
            </div>
            <span className={st.sonargroup}>
                Developed by
                <a href="sonargroup.us"> sonargroup.us</a>
            </span>
        </footer>
    )
}

export default Footer