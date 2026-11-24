import { useEffect, useState } from "react";
import { onAuthStateChanged} from "firebase/auth";
import { auth } from "@/services/firebase/firebaseConfig"; // Importa la configuración de Firebase
import Login from "@/layouts/login/Login";
import Admin from "@/layouts/admin/Admin";
import Head from "next/head";
import { ADMIN_STATES } from "@/utils/enums";
import SpinnerBranded from "@/components/SpinnerBranded/SpinnerBranded";

//TODO: hacer un hook useAuth donde encapsular el comportamiento de este componente, de Admin y de Login.

export default function AdminPage_legacy() {
	const [fetchState, setFetchState] = useState(ADMIN_STATES.FETCHING);
	const [user, setUser] = useState(null)

	useEffect(() => {
		// Escuchar cambios en la autenticación
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
		if (currentUser) {
			setUser(currentUser);
			setFetchState(ADMIN_STATES.ADMIN);
		} else {
			setUser(null);
			setFetchState(ADMIN_STATES.NO_ADMIN);
		}
		});

		return () => unsubscribe(); // Limpieza del listener
	}, []);

  return (
    <>
      <Head>
        <title>Administración</title>
        <meta name="description" content="Rudy Care" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
		  </Head>
		  <main>
        <SpinnerBranded fullscreen/>
        {
          fetchState === ADMIN_STATES.ADMIN ? 
            <Admin/>
          : fetchState === ADMIN_STATES.NO_ADMIN ? 
            <Login/>
          : 
            null
        }
      </main>
    </>
  );
}
