// pages/index.jsx

export const getServerSideProps = async () => {
	return {
		redirect: {
			destination: '/admin',
			permanent: false,
		},
	};
};

export default function Home() {
	return null;
}