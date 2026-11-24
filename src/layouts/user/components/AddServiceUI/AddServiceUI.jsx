import React,{useEffect, useRef} from 'react'
import { useService } from '../../hooks/useService'
import DropdownBox from '../DropdownBox/DropdownBox'
import ServiceForm from './components/ServiceForm/ServiceForm'
import PreviousForm from './components/PreviousForm/PreviousForm'
import { usePreviousForm } from '../../hooks/usePreviousForm'
import SkipPreviousForm from './components/SkipPreviousForm/SkipPreviousForm'

const AddServiceUI = ({onServiceAdded, vehicle}) => {

	const {
		checklist, 
		extra, 
		continueToSign, 
		passCheck, 
		refresh,
		checkState,
		PREVIOUS_CHECKLIST_STATES, 
		updateChecklist, 
		updateExtra
	} = usePreviousForm(vehicle)

  	const {		
		fetchState,
		data,
		update,
		handleAddService,
		addCheckistData,
		FETCH_STATES,
	}= useService()

	const dropdownRef = useRef(null)

	useEffect(() => {
		if(fetchState === FETCH_STATES.SUCCESS){
			dropdownRef.current.close()
			refresh()
			onServiceAdded()
		}
	}, [fetchState])

	const handlePassCheck = () => {
		addCheckistData(checklist, extra)
		passCheck()
	}

	return ( 
		<DropdownBox 
			buttonText={'Nueva orden de servicio'} 
			grey
			ref={dropdownRef}
		>
			{
				checkState === PREVIOUS_CHECKLIST_STATES.CHECKED ?
					<ServiceForm
						data={data}
						vehicle={vehicle}
						update={(key, value)=>update(key, value)}
						FETCH_STATES={FETCH_STATES}
						fetchState={fetchState}
						onSubmit={()=>handleAddService(vehicle?.data)}
					/>
				:
				<>
					{/*<SkipPreviousForm vehicle={vehicle}/>*/}
					<PreviousForm
						data={checklist}
						isWaitingToSign = {checkState === PREVIOUS_CHECKLIST_STATES.WAITING_SIGN}
						extraData={extra}
						onSubmit={continueToSign}
						onPass={handlePassCheck}
						onCancel={refresh}
						onUpdate={(newData)=>updateChecklist(newData)}
						onUpdateExtra = {(newData)=>updateExtra(newData)}
					/>
				</>
			}
		</DropdownBox>
	)
}

export default AddServiceUI