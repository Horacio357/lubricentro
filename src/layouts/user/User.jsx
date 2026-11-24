import React from 'react';
import st from './User.module.css';
import { ADMIN_STATES } from '@/utils/enums';
import { PERMISSIONS } from '@/utils/permissions';
import VehicleInfo from './components/VehicleInfo/VehicleInfo';
import ServiceUI from './components/ServiceUI/ServiceUI';
import AddServiceUI from './components/AddServiceUI/AddServiceUI';
import Footer from './components/Footer/Footer';
import MaintenanceTrafficLight from './components/MaintenanceTrafficLight/MaintenanceTrafficLight';
import { getUnitIdentifier } from '@/utils/serviceTemplates';
import TrainingModeHUD from '@/components/TrainingMode/TrainingModeHUD';
import { getVehicleTrainingSteps } from '@/utils/trainingSteps';

const User = ({ data, privateData, onChange, adminState, staffProfile, can }) => {
	const isAuthenticatedStaff = adminState === ADMIN_STATES.ADMIN;
	const hasPerm = (perm) => isAuthenticatedStaff && can && can(perm);
	const [trainingActive, setTrainingActive] = React.useState(false);
	const [trainingStep, setTrainingStep] = React.useState(0);

	const trainingSteps = React.useMemo(
		() => getVehicleTrainingSteps({ isStaff: isAuthenticatedStaff }),
		[isAuthenticatedStaff]
	);

	const findPrivateService = (id) => {
		if (!privateData || !Array.isArray(privateData.services)) return null;
		return privateData.services.find((service) => service.id === id);
	};

	return (
		<div className={st.container}>
			<TrainingModeHUD
				isActive={trainingActive}
				steps={trainingSteps}
				currentIndex={trainingStep}
				onStart={() => {
					setTrainingStep(0);
					setTrainingActive(true);
				}}
				onExit={() => setTrainingActive(false)}
				onNext={() =>
					setTrainingStep((i) => Math.min(i + 1, trainingSteps.length - 1))
				}
				onPrev={() => setTrainingStep((i) => Math.max(i - 1, 0))}
				onJumpTo={(idx) => setTrainingStep(idx)}
			/>
			<div className={st.contentGrid}>
				<div className={st.sidebarCol}>
					<div className={st.imageContainer}>
						<img
							className={st.image}
							src="/logo_rudy.webp"
							alt="Logo Rudy"
						/>
						<h3 className={st.title}>
							{data.brand} {data.model}
						</h3>
						<span className={st.patenteBadge}>
							{data.unitType === 'autoelevador' ? 'AUTOELEVADOR · ' : ''}
							{getUnitIdentifier(data)}
						</span>
					</div>

					<MaintenanceTrafficLight data={data} privateData={privateData} />

					<VehicleInfo
						data={data}
						privateData={privateData}
						isAdmin={hasPerm(PERMISSIONS.VIEW_CLIENT_PRIVATE)}
						canEdit={hasPerm(PERMISSIONS.EDIT_VEHICLE)}
						updatedBy={staffProfile?.uid || null}
						onUpdated={onChange}
					/>
				</div>

				<div className={st.servicesContainer}>
					{data.services.map((item, idx) => (
						<ServiceUI
							vehicleId={data.id}
							vehicleData={data}
							privateVehicle={privateData}
							data={item}
							privateData={findPrivateService(item.id)}
							isAdmin={isAuthenticatedStaff}
							isLatest={idx === data.services.length - 1}
							canViewPrices={hasPerm(PERMISSIONS.VIEW_PRICES)}
							canEditService={hasPerm(PERMISSIONS.EDIT_SERVICE)}
							canDeleteService={hasPerm(PERMISSIONS.DELETE_SERVICE)}
							updatedBy={staffProfile?.uid || null}
							key={item.id}
							onDelete={onChange}
						/>
					))}

					{hasPerm(PERMISSIONS.ADD_SERVICE) ? (
						<AddServiceUI
							onServiceAdded={onChange}
							vehicle={{ data, privateData }}
						/>
					) : null}
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default User;