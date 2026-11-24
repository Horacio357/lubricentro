import {useState} from 'react';
import {FETCH_STATES } from '../utils/adminEnums';
import { createUser, deleteUser, getUserByPatente, searchVehiclesFlexible } from '@/utils/firebase/firebaseAdminPanel';
import { auth } from '@/services/firebase/firebaseConfig';
import {
	isDevBypassEnabled,
	searchDevMockVehicles,
} from '@/utils/devMockData';

const useApi = ()=>{
 
    const [fetchState, setFetchState] = useState(FETCH_STATES.IDLE)
    const [serverResponse, setServerResponse] = useState(null)
    const [searchResults, setSearchResults] = useState([])

    const resetStates = () => {
        setFetchState(FETCH_STATES.IDLE)
        setServerResponse(null)
        setSearchResults([])
    }

    const createAccount = async (data) => {
        try {
            setFetchState(FETCH_STATES.FETCHING)
            const user = await createUser(data)
            setServerResponse({
                    data:user, 
                    message: `¡Usuario Creado! Copie el link para grabar la tarjeta NFC con su información.`
            })
			const token = await auth.currentUser?.getIdToken();
			const res = await fetch('/api/send-welcome-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({
					email: data.email,
					firstName: data.owner_name,
					lastName: data.owner_surname,
					userId:user.id
				}),
			});
			console.log(res);
            setFetchState(FETCH_STATES.SUCCESS)
        } 
        catch (error) {
			console.error(error)
            setServerResponse({
                message:"No se pudo crear el usario, inténtelo nuévamente."
            })
            setFetchState(FETCH_STATES.ERROR)
        }
    }   

const searchAccount = async (queryText) => {
    try {
        setFetchState(FETCH_STATES.FETCHING)
        setSearchResults([])

        let matches = [];
        if (isDevBypassEnabled()) {
            matches = searchDevMockVehicles(queryText);
        }
        if (matches.length === 0) {
            matches = await searchVehiclesFlexible(queryText);
        }

        if (matches.length === 0) {
            throw new Error('No encontrado');
        }

        if (matches.length === 1) {
            const user = matches[0];
            setServerResponse({
                data: user,
                message: `${user.brand} ${user.model} (${user.patente}) a nombre de ${user.owner_name || ''} ${user.owner_surname || ''}. Visite el perfil presionando el botón de abajo.`
            })
            setFetchState(FETCH_STATES.SUCCESS)
            return;
        }

        setSearchResults(matches);
        setServerResponse({
            message: `Se encontraron ${matches.length} vehículos coincidentes.`
        })
        setFetchState(FETCH_STATES.SUCCESS)
    } 
    catch (error) {
        if (isDevBypassEnabled()) {
            const matches = searchDevMockVehicles(queryText);
            if (matches.length > 0) {
                if (matches.length === 1) {
                    const user = matches[0];
                    setServerResponse({
                        data: user,
                        message: `${user.brand} ${user.model} (${user.patente}) a nombre de ${user.owner_name || ''} ${user.owner_surname || ''}.`
                    });
                } else {
                    setSearchResults(matches);
                    setServerResponse({ message: `Se encontraron ${matches.length} vehículos coincidentes.` });
                }
                setFetchState(FETCH_STATES.SUCCESS);
                return;
            }
        }
        setServerResponse({
            message:`No se encontró ningún vehículo para "${queryText}". Prueba con patente, marca, modelo o apellido.`
        })
        setFetchState(FETCH_STATES.ERROR)
    }
}

const deleteAccount = async (patente) => {
    if(!confirm('ELIMINAR EL VEHÍCULO es un procedimiento irreversible ¿Desea continuar?')){
        return
    }
    try {
        setFetchState(FETCH_STATES.FETCHING)
        const user = await getUserByPatente(patente)
        if(!user){
            throw new Error(`No se encontró la patente ${patente}`);
        }
        await deleteUser(user) 
        setServerResponse({
                data:user, 
                message:"Vehículo eliminado permanentemente."
        })
        setFetchState(FETCH_STATES.SUCCESS)
    } 
    catch (error) {
        setServerResponse({
            message: `No se pudo eliminar el vehículo: ${error.message}, no existe o ya se eliminó préviamente, recuerde escribirla en mayúsculas y sin espacios.`
        })
        setFetchState(FETCH_STATES.ERROR)
    }
   
}

return {
    fetchState, 
    serverResponse,
    searchResults,
    resetStates, 
    createAccount, 
    searchAccount,
    deleteAccount
}
}

    export default useApi

    