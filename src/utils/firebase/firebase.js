import { db } from "@/services/firebase/firebaseConfig";
import { collection,setDoc, getDocs,getDoc, deleteDoc, doc, query, orderBy, addDoc, updateDoc} from "firebase/firestore";
import { decrementPartsStock } from "./catalogHandlers";
//import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const VEHICLES_COLLECTION = "vehicles";

export const getVehicleById = async (vehicleId) => {
	try {
		const vehicleRef = doc(db, VEHICLES_COLLECTION, vehicleId);
		const vehicleSnap = await getDoc(vehicleRef);
		if (!vehicleSnap.exists()) {
			throw new Error("El vehículo no existe");
		}
		//HAY QUE BUSCAR LOS SERVICIOS ANTES DE RETORNAR
		const services = await getServices(vehicleId)
		return { id: vehicleSnap.id, services:services, ...vehicleSnap.data() };
	} catch (error) {
		throw new Error("Error al obtener el vehículo: " + error.message); //hola
	}
};

export const getPrivateVehicleById = async (vehicleId) => {
	try {
		const vehicleRef = doc(db, "vehicles_private", vehicleId);
		const vehicleSnap = await getDoc(vehicleRef);
		if (!vehicleSnap.exists()) {
			throw new Error("El vehículo privado no existe");
		}
		//HAY QUE BUSCAR LOS SERVICIOS ANTES DE RETORNAR
		const services = await getPrivateServices(vehicleId)
		return { id: vehicleSnap.id, services:services, ...vehicleSnap.data() };
	} catch (error) {
		throw new Error("Error al obtener el vehículo privado: " + error.message);
	}
};

export const getPrivateServices = async (id) => {
	try {
        const ref = collection(db, `vehicles_private/${id}/services`)
        const querySnapshot = await getDocs(ref);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        throw new Error("Error al obtener los servicios privados: " + error.message);
    }
};

export const getServices = async (id) => {
    try {
        const q = query(collection(db, `vehicles/${id}/services`), orderBy("timestamp", "asc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        throw new Error("Error al obtener los servicios: " + error.message);
    }
};

export const addService = async (vehicleId, serviceData) => {
	try {
		let { importe, ...publicData } = serviceData;
		const timestamp = new Date();
		importe = importe * 100; // guardar en centavos

		// Generar un ID manualmente
		const publicDocRef = doc(collection(db, `vehicles/${vehicleId}/services`));
		const serviceId = publicDocRef.id;

		// Guardar en la colección pública
		await setDoc(publicDocRef, {
			...publicData,
			timestamp,
		});

		if (publicData.chipText) {
			await updateDoc(doc(db, VEHICLES_COLLECTION, vehicleId), {
				chipSummary: publicData.chipText,
				lastServiceAt: timestamp,
			});
		}

		if (Array.isArray(publicData.partsUsed) && publicData.partsUsed.length > 0) {
			await decrementPartsStock(publicData.partsUsed);
		}

		// Guardar en la colección privada (si hay importe)
		if (importe !== undefined) {
			const privateDocRef = doc(db, `vehicles_private/${vehicleId}/services/${serviceId}`);
			await setDoc(privateDocRef, {
				importe
			});
		}

		return { success: true, id: serviceId };
	} catch (error) {
		throw new Error("Error al agregar el servicio: " + error.message);
	}
};

export const updateService = async (vehicleId, serviceId, serviceData, updatedBy = null) => {
	try {
		const { importe, ...publicData } = serviceData;
		const auditFields = {
			updatedAt: new Date(),
			...(updatedBy ? { updatedBy } : {}),
		};

		const publicDocRef = doc(db, `vehicles/${vehicleId}/services/${serviceId}`);
		await updateDoc(publicDocRef, {
			...publicData,
			...auditFields,
		});

		if (importe !== undefined && importe !== null && importe !== '') {
			const privateDocRef = doc(db, `vehicles_private/${vehicleId}/services/${serviceId}`);
			await setDoc(
				privateDocRef,
				{
					importe: Math.round(Number(importe) * 100),
					...auditFields,
				},
				{ merge: true }
			);
		}

		return { success: true, id: serviceId };
	} catch (error) {
		throw new Error("Error al actualizar el servicio: " + error.message);
	}
};

export const addChecklistData = async (vehicleId, serviceId, checklistData) => {
	const timestamp = new Date();
	const docRef = doc(db, `vehicles/${vehicleId}/checklists/${serviceId}`); 
    await setDoc(docRef, {
		...checklistData, 
		timestamp
	});
};

export const updateChecklist = async (vehicleId, serviceId, checklistSections, extraData = {}, updatedBy = null) => {
	const payload = {};
	checklistSections.forEach((section) => {
		payload[section.var_name] = section.items;
	});
	const docRef = doc(db, `vehicles/${vehicleId}/checklists/${serviceId}`);
	await setDoc(
		docRef,
		{
			...payload,
			...extraData,
			updatedAt: new Date(),
			...(updatedBy ? { updatedBy } : {}),
		},
		{ merge: true }
	);
};

export const deleteService = async (userId, serviceId) => {
  try {
    const publicRef = doc(db, `vehicles/${userId}/services/${serviceId}`);
    const privateRef = doc(db, `vehicles_private/${userId}/services/${serviceId}`);
	 const checklistRef =  doc(db, `vehicles/${userId}/checklists/${serviceId}`);

    await Promise.all([
      deleteDoc(publicRef),
      deleteDoc(privateRef),
	  deleteDoc(checklistRef),
    ]);
  } catch (error) {
    throw new Error("Error al eliminar el servicio: " + error.message);
  }
};


export const getChecklist = async (userId, checklistId) => {
	console.log(userId," --- ", checklistId);
    const ref = doc(db, `vehicles/${userId}/checklists/${checklistId}`);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
		console.log('si existe');
      return { id: snapshot.id, ...snapshot.data() }; 
    } else return null
}

export function formatDate(timestamp) {
	if (!timestamp || typeof timestamp.toDate !== 'function') return '';
  
	const date = timestamp.toDate(); // convierte Firestore Timestamp a Date
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0'); // meses desde 0 a 11
	const year = String(date.getFullYear()).slice(-2); // últimos 2 dígitos
  
	return `${day}/${month}/${year}`;
  }

export function formatVertical(vertical) {
	//TODO: unificar las fuentes de verdad!!!!
	let formatedVertical = ''
	if(vertical === "LUBRICENTRO"){
		formatedVertical = "Cambio de Aceite"
	}
	else if(vertical === "MECANICA LIGERA"){
		formatedVertical = "Mecánica"
	}
	else if(vertical === "CUBIERTAS"){
		formatedVertical = "Neumáticos"
	}
	else if(vertical === "AIRE ACONDICIONADO"){
		formatedVertical = "Aire Acondicionado"
	}
	else if(vertical === "REPUESTOS"){
		formatedVertical = "Repuestos"
	}
		
	return formatedVertical;
}