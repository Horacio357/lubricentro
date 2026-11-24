import React,{useState} from 'react'
import st from './ChecklistUI.module.css'
import { useRouter } from 'next/router'
import { getChecklist, updateChecklist } from '@/utils/firebase/firebase'
import { 
	trenDelantero, 
	trenTrasero, 
	suspension,
	traccion,
	direccion,
	ruedasYFrenos, 
	accesorios, 
} from '@/layouts/user/data/checklist'

const CHECKLIST_STATES ={
	IDLE:'IDLE',
	LOADING:'LOADING',
	NO_CHECKLIST:'NO_CHECKLIST',
	HAS_CHECKLIST: 'HAS_CHECKLIST',
	ERROR:'ERROR'
}

const allTemplates = [
	trenDelantero, 
	trenTrasero, 
	suspension,
	traccion,
	direccion,
	ruedasYFrenos, 
	accesorios, 
];

function mergeTemplatesWithFirebase(templates, firebaseData) {
  return templates.map(template => {
    const varName = template.var_name;

    if (firebaseData.hasOwnProperty(varName)) {
      return {
        ...template,
        items: firebaseData[varName]
      };
    } else {
      return { ...template };
    }
  });
}

const ChecklistUI = ({data, canEdit = false, updatedBy = null}) => {
	const [loadingState, setLoadingState] = useState(CHECKLIST_STATES.IDLE)
	const [checklist, setChecklist] = useState(null)
	const [extra, setExtra] = useState(null)
	const [isEditing, setIsEditing] = useState(false)
	const [saving, setSaving] = useState(false)
	const router = useRouter();
	const { userid } = router.query; 

	const handleGetChecklist = async () => {
		try {
			setLoadingState(CHECKLIST_STATES.LOADING)
			const checklistData = await getChecklist(userid, data.id)
			if(checklistData){
				setLoadingState(CHECKLIST_STATES.HAS_CHECKLIST)
				const filteredTemplates = mergeTemplatesWithFirebase(allTemplates, checklistData)
				setChecklist(filteredTemplates)
				setExtra({by: checklistData.by, details: checklistData.details})
				return
			} 
			setLoadingState(CHECKLIST_STATES.NO_CHECKLIST)
		} 
		catch (error) {
			setLoadingState(CHECKLIST_STATES.ERROR)
		}
	}

	const toggleItem = (sectionIdx, itemIdx, field) => {
		setChecklist((prev) =>
			prev.map((sec, sIdx) =>
				sIdx !== sectionIdx
					? sec
					: {
							...sec,
							items: sec.items.map((it, iIdx) =>
								iIdx !== itemIdx ? it : { ...it, [field]: !it[field] }
							),
					  }
			)
		);
	};

	const handleSaveChecklist = async () => {
		if (!userid || !checklist) return;
		setSaving(true);
		try {
			await updateChecklist(userid, data.id, checklist, extra || {}, updatedBy);
			setIsEditing(false);
		} catch (err) {
			console.error(err);
			alert('No se pudo guardar el checklist.');
		} finally {
			setSaving(false);
		}
	};

  return (
	<div className={st.container}>
		{
			loadingState === CHECKLIST_STATES.IDLE ?
				<button onClick={handleGetChecklist} className={st.button}>Ver Checklist</button>
			: loadingState === CHECKLIST_STATES.LOADING ?
				<span>Cargando...</span>
			: loadingState === CHECKLIST_STATES.NO_CHECKLIST ?
				<span>No hay checklist disponible</span>
			: loadingState === CHECKLIST_STATES.HAS_CHECKLIST ?
				<>
				<h3>Inspección Previa</h3>
					{
						checklist.map((section, sectionIdx) => 
							<div key={section.var_name} className={st.sectionContainer}>
								<h5 className={st.sectionTitle}>{section.title}</h5>
								{
									section.items.map((item, index) => 
										<div key={item.label} className={st.itemContainer}>
											<span
												key={index}
												className={st.itemLabel}
											>
												{item.label}
											</span>
											<div className={st.markerContainer}>
												{
													isEditing ? (
														item.sides ? (
															<>
																<label style={{ fontSize: '0.78em', cursor: 'pointer' }}>
																	<input
																		type="checkbox"
																		checked={Boolean(item.not_passed_right)}
																		onChange={() => toggleItem(sectionIdx, index, 'not_passed_right')}
																	/> d
																</label>
																<label style={{ fontSize: '0.78em', cursor: 'pointer' }}>
																	<input
																		type="checkbox"
																		checked={Boolean(item.not_passed_left)}
																		onChange={() => toggleItem(sectionIdx, index, 'not_passed_left')}
																	/> i
																</label>
															</>
														) : (
															<label style={{ fontSize: '0.78em', cursor: 'pointer' }}>
																<input
																	type="checkbox"
																	checked={Boolean(item.not_passed)}
																	onChange={() => toggleItem(sectionIdx, index, 'not_passed')}
																/> ✖
															</label>
														)
													) : (
														item.sides ?
														<>
															<span>{item.not_passed_right ? 'd ✖' : ' '}</span>
															<span>{item.not_passed_left ? 'i ✖' : ' '}</span>
														</>
														:
														<span className={st.lonely}>{item.not_passed ? '✖' : ' '}</span>
													)
												}
											</div>
										</div>
									)
								}
							</div>
						)
					}
					<p className={st.extra}>Realizada por: {extra?.by || ' -'}</p>
					{isEditing ? (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
							<textarea
								value={extra?.details || ''}
								onChange={(e) => setExtra((prev) => ({ ...prev, details: e.target.value }))}
								placeholder="Observaciones de inspección..."
								style={{
									width: '100%',
									boxSizing: 'border-box',
									padding: 8,
									borderRadius: 8,
									border: '1px solid #363636',
									backgroundColor: '#2e2e2e',
									color: '#fff',
								}}
							/>
							<div style={{ display: 'flex', gap: 8 }}>
								<button
									type="button"
									className={st.button}
									onClick={handleSaveChecklist}
									disabled={saving}
								>
									{saving ? 'Guardando...' : 'Guardar Checklist'}
								</button>
								<button
									type="button"
									className={st.button}
									onClick={() => setIsEditing(false)}
								>
									Cancelar
								</button>
							</div>
						</div>
					) : (
						<>
							<p className={st.extra}>Detalles: {extra?.details || ' -'}</p>
							{canEdit && (
								<button
									type="button"
									className={st.button}
									onClick={() => setIsEditing(true)}
									style={{ marginTop: 8 }}
								>
									Reeditar Checklist
								</button>
							)}
						</>
					)}
				</>
			: loadingState === CHECKLIST_STATES.ERROR ?
				<span>ocurrió un error.</span>
			:null
		}
	</div>
  )
}

export default ChecklistUI

/*



*/