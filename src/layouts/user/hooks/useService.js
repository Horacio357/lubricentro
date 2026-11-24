import { useState } from 'react'
import { FETCH_STATES } from '@/utils/enums'
import { addChecklistData, addService, deleteService } from '@/utils/firebase/firebase'
import { useRouter } from 'next/router'
import { serviceMock, lubricentroMock, labels} from '../utils/mocksAndLabels'
/*
TODOS:
	mejorar el sistema de mocks para tener una sola fuente de verdad tanto para esto como para los
	componentes de UI


	Crear enums si hace falta

	partir y dividir este documento
*/

import { formatChipSummary } from '@/utils/chipFormatter'

export function useService() {
    const [fetchState, setfetchState] = useState(FETCH_STATES.IDLE)
    const [data, setData] = useState({ ...serviceMock, partsUsed: [] })
	const [checklistData, setchecklistData] = useState(null)
	const router = useRouter()
	const { userid } = router.query; 

	const update = (n_key, n_value) => {
		let dataClone = {...data}
		dataClone[n_key] = n_value
		if(n_key === "vertical"){ 
			if(n_value === "LUBRICENTRO"){
				dataClone["vertical_data"] = { ...lubricentroMock, filters: [] }
			} else if(n_value === "AIRE ACONDICIONADO"){
				dataClone["vertical_data"] = { gasCharge: true, leakCheck: true, cabinFilterReplaced: false, compressorCheck: false }
			} else if(n_value === "CUBIERTAS"){
				dataClone["vertical_data"] = { reemplazo: false, rotacion: true, alineacion: false, balanceo: false, reparacion: false }
			}
			if(n_value !== "MECANICA LIGERA" && n_value !== "REPUESTOS"){
				dataClone["partsUsed"] = []
			}
		}
		setData(dataClone)
	}

	const handleAddService = async (vehicleInfo = {}) => {
		if(!userid){
			alert('error interno, so ne reconoce al usuario, vuelva a intentarlo.')
			return
		}
		const validation = validateServiceFrontend(data)
		if(!validation.success){
			alert(validation.message)
			return
		}
		try {
			setfetchState(FETCH_STATES.FETCHING)
			const chipText = data.chipTextOverride || formatChipSummary({ vehicle: vehicleInfo, service: data })
			const { chipTextOverride, ...cleanData } = data
			const service = await addService(userid, { ...cleanData, chipText })
			if(checklistData) await addChecklistData(userid, service.id, checklistData)
			setData({ ...serviceMock, partsUsed: [] })
			setfetchState(FETCH_STATES.SUCCESS)
		} 
		catch (error) {
			setfetchState(FETCH_STATES.ERROR)
			console.error(error)
			setTimeout(() => {
				setfetchState(FETCH_STATES.IDLE)
			}, 2500);
		}
	}

	const handleDeleteService = async (serviceId) => {
		if(!confirm("¿Desea ELIMINAR este service?")) return
		if(!userid){
			alert('error interno, vuelva a intentarlo.')
			return
		}
		try {
			setfetchState(FETCH_STATES.FETCHING)
			await deleteService(userid, serviceId)
			setfetchState(FETCH_STATES.SUCCESS)
		} 
		catch (error) {
			setfetchState(FETCH_STATES.ERROR)
			console.error(error)
			setTimeout(() => {
				setfetchState(FETCH_STATES.IDLE)
			}, 1500);
		}
	}

	const addCheckistData = (checklistData, extraData) => {
		const formattedData = checklistData.reduce((acc, curr) => {
			acc[curr.var_name] = curr.items;
			return acc;
		}, {});
		const merged = {...formattedData, ...extraData}
		setchecklistData(merged)
	};

	return {
		fetchState,
		data,
		update,
		handleAddService,
		handleDeleteService,
		FETCH_STATES,
		validateServiceFrontend,
		addCheckistData,
	  }
}

const showLabel = (field) =>{
	return labels[field]
}

export const validateServiceFrontend = (data) => {
	if (!data || typeof data !== "object") {
		return { success: false, message: "Datos inválidos." };
	}

	const requiredFields = ["kilometraje", "vertical", "importe"];

	for (const field of requiredFields) {
		const value = data[field];
		if (
			value === undefined ||
			value === null ||
			(Array.isArray(value) && value.length === 0) ||
			(typeof value === "string" && value.trim() === "")
		) {
			return { success: false, message: `El campo ${showLabel(field)} es obligatorio y no puede estar vacío.` };
		}
	}

	if (typeof data.kilometraje !== "number" || data.kilometraje < 0) {
		return { success: false, message: "El kilometraje / horómetro debe ser un número válido no negativo." };
	}

	if (typeof data.importe !== "number" || data.importe < 0) {
		return { success: false, message: "El importe debe ser un número válido no negativo." };
	}

	if (typeof data.vertical !== "string" || data.vertical.trim() === "") {
		return { success: false, message: "El campo vertical debe ser una cadena de texto no vacía." };
	}

	if (data.vertical === "LUBRICENTRO") {
		const l = data.vertical_data;
		if (!l || typeof l !== "object") {
			return { success: false, message: "Datos de lubricentro faltantes o inválidos." };
		}
		if (typeof l.tipo !== "string" || l.tipo.trim() === "") {
			return { success: false, message: "El campo Tipo de aceite no puede estar vacío." };
		}
	}

	return { success: true };
};