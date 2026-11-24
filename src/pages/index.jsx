// pages/index.jsx

export const getServerSideProps = async () => {
	return {
	  redirect: {
		destination: 'https://rudyservices.com.ar',
		permanent: false, // ponelo en true si querés que sea una redirección 301
	  },
	};
  };
  
  export default function Home() {
	return null; // Nunca se renderiza porque se redirige antes
  }