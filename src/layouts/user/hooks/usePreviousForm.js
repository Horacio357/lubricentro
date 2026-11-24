import { useState } from "react"
import { 
	trenDelantero, 
	trenTrasero, 
	suspension,
	traccion,
	direccion,
	ruedasYFrenos, 
	accesorios,
} from '../data/checklist';
import { generateTicket } from "../utils/ticketGenerating";

const allChecklists = [
	trenDelantero, 
	trenTrasero, 
	suspension,
	traccion,
	direccion,
	ruedasYFrenos, 
	accesorios,
];

const PREVIOUS_CHECKLIST_STATES ={
	CHECKING: 'checking',
	WAITING_SIGN: 'waiting_sign',
	CHECKED: 'checked'
}

const cloneChecklists = (apartados) => {
  return apartados.map(apartado => ({
    ...apartado,
    items: apartado.items.map(item => ({ ...item }))
  }));
}

export function usePreviousForm(vehicle) {
	const [checklist, setChecklist] = useState(() => cloneChecklists(allChecklists))
	const [checkState, setCheckState] = useState(PREVIOUS_CHECKLIST_STATES.CHECKING)
	const [extra, setExtra] = useState({})

	const updateChecklist = (sectionData) => {
        let checklistClone = [...checklist]
		const section = checklistClone[sectionData.index].items[sectionData.sectionIndex];
		if(!sectionData.side){
			section.not_passed = !section.not_passed;
		} 
		else if( sectionData.side === 'R'){
			section.not_passed_right = !section.not_passed_right
		} 
		else if( sectionData.side === 'L'){
			section.not_passed_left = !section.not_passed_left
		} 
		setChecklist(checklistClone)
    }
	const updateExtra = (data) => {
		let extraClone = {...extra}
		extraClone[data.key] = data.value
		setExtra(extraClone)
	}
	const continueToSign = () => {
		generateTicket(checklist, extra, vehicle)
		setCheckState(PREVIOUS_CHECKLIST_STATES.WAITING_SIGN)
	}
	const passCheck = () => {
		setCheckState(PREVIOUS_CHECKLIST_STATES.CHECKED)
	}
	const refresh = () => {
		setCheckState(PREVIOUS_CHECKLIST_STATES.CHECKING)
		setChecklist(() => cloneChecklists(allChecklists))
		setExtra({})
	}
	return{
		checklist, 
		extra, 
		continueToSign, 
		passCheck, 
		refresh,
		checkState,
		PREVIOUS_CHECKLIST_STATES, 
		updateChecklist, 
		updateExtra
	}
}

