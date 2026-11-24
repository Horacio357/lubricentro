import React, { useState, useMemo, useEffect } from 'react';
import classes from './Admin.module.css';
import { FETCH_STATES, PANEL } from './utils/adminEnums';
import PanelSelector from './components/PanelSelector';
import FeedbackBox from './components/FeedbackBox';
import DeleteAccountPanel from './components/DeleteAccountPanel';
import useApi from './hooks/useApi';
import SearchAccountPanel from './components/SearchAccountPanel';
import CreateAccountPanel from './components/CreateAccountPanel';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase/firebaseConfig';
import AdminFooter from './components/AdminFooter/AdminFooter';
import DashboardPanel from './components/DashboardPanel/DashboardPanel';
import AppointmentsPanel from './components/AppointmentsPanel/AppointmentsPanel';
import ClientsBasePanel from './components/ClientsBasePanel/ClientsBasePanel';
import CatalogPanel from './components/CatalogPanel/CatalogPanel';
import StaffManagementPanel from './components/StaffManagementPanel/StaffManagementPanel';
import { PERMISSIONS, ROLE_LABELS } from '@/utils/permissions';
import TrainingModeHUD from '@/components/TrainingMode/TrainingModeHUD';
import { getAdminTrainingSteps } from '@/utils/trainingSteps';

const Admin = ({ staffProfile, can }) => {
	const {
		fetchState,
		serverResponse,
		searchResults,
		resetStates,
		createAccount,
		searchAccount,
		deleteAccount,
	} = useApi();

	const availablePanels = useMemo(() => {
		const list = [];
		if (can(PERMISSIONS.SEARCH_VEHICLE)) list.push(PANEL.SEARCH_ACCOUNT);
		if (can(PERMISSIONS.CREATE_VEHICLE)) list.push(PANEL.CREATE_ACCOUNT);
		if (can(PERMISSIONS.DELETE_VEHICLE)) list.push(PANEL.DELETE_ACCOUNT);
		if (can(PERMISSIONS.VIEW_DASHBOARD)) list.push(PANEL.DASHBOARD);
		if (can(PERMISSIONS.SEARCH_VEHICLE)) list.push(PANEL.APPOINTMENTS);
		if (can(PERMISSIONS.SEARCH_VEHICLE)) list.push(PANEL.CLIENTS_BASE);
		if (can(PERMISSIONS.MANAGE_CATALOGS)) list.push(PANEL.CATALOGS);
		if (can(PERMISSIONS.MANAGE_STAFF)) list.push(PANEL.STAFF_MANAGEMENT);
		return list;
	}, [can]);

	const [panel, setPanel] = useState(
		availablePanels[0] || PANEL.SEARCH_ACCOUNT
	);
	const [signingOut, setSigningOut] = useState(false);
	const [trainingActive, setTrainingActive] = useState(false);
	const [trainingStep, setTrainingStep] = useState(0);

	const trainingSteps = useMemo(
		() => getAdminTrainingSteps(availablePanels),
		[availablePanels]
	);

	useEffect(() => {
		if (availablePanels.length > 0 && !availablePanels.includes(panel)) {
			setPanel(availablePanels[0]);
		}
	}, [availablePanels, panel]);

	const updatePanel = (value) => {
		resetStates();
		setPanel(value);
	};

	const goToTrainingStep = (nextIndex) => {
		if (nextIndex < 0 || nextIndex >= trainingSteps.length) return;
		setTrainingStep(nextIndex);
		const targetPanel = trainingSteps[nextIndex]?.panel;
		if (targetPanel && availablePanels.includes(targetPanel)) {
			updatePanel(targetPanel);
		}
	};

	const handleSignOut = async () => {
		try {
			setSigningOut(true);
			await signOut(auth);
		} catch (error) {
			console.error(error);
			alert('Ocurrió un error al intentar cerrar sesión');
		}
	};

	const isWidePanel =
		panel === PANEL.DASHBOARD ||
		panel === PANEL.APPOINTMENTS ||
		panel === PANEL.CLIENTS_BASE ||
		panel === PANEL.CATALOGS ||
		panel === PANEL.STAFF_MANAGEMENT;

	return (
		<div className={classes.container}>
			<TrainingModeHUD
				isActive={trainingActive}
				steps={trainingSteps}
				currentIndex={trainingStep}
				onStart={() => {
					setTrainingActive(true);
					goToTrainingStep(0);
				}}
				onExit={() => setTrainingActive(false)}
				onNext={() => goToTrainingStep(trainingStep + 1)}
				onPrev={() => goToTrainingStep(trainingStep - 1)}
				onJumpTo={goToTrainingStep}
			/>
			<img src="/logo_negro.webp" alt="RudyServices" className={classes.logo} />
			<div className={classes.headerMeta}>
				<h2 className={classes.title}>Panel de Administración</h2>
				{staffProfile && (
					<span className={classes.rolePill}>
						{ROLE_LABELS[staffProfile.role] || staffProfile.role}
						{staffProfile.name ? ` · ${staffProfile.name}` : ''}
					</span>
				)}
			</div>

			{availablePanels.length > 0 ? (
				<>
					<PanelSelector
						panels={availablePanels}
						currentPanel={panel}
						onPanelChange={updatePanel}
					/>
					<div
						className={`${classes.panelContainer} ${
							isWidePanel ? classes.panelContainerWide : ''
						}`}
					>
						{panel === PANEL.DELETE_ACCOUNT &&
						can(PERMISSIONS.DELETE_VEHICLE) ? (
							<DeleteAccountPanel onDelete={(value) => deleteAccount(value)} />
						) : panel === PANEL.SEARCH_ACCOUNT &&
						  can(PERMISSIONS.SEARCH_VEHICLE) ? (
							<SearchAccountPanel
								onSearch={(values) => searchAccount(values.chapa)}
								results={searchResults}
							/>
						) : panel === PANEL.CREATE_ACCOUNT &&
						  can(PERMISSIONS.CREATE_VEHICLE) ? (
							<CreateAccountPanel
								onCreate={(values) => createAccount(values)}
								fetchState={fetchState}
								FETCH_STATES={FETCH_STATES}
							/>
						) : panel === PANEL.DASHBOARD && can(PERMISSIONS.VIEW_DASHBOARD) ? (
							<DashboardPanel />
						) : panel === PANEL.APPOINTMENTS && can(PERMISSIONS.SEARCH_VEHICLE) ? (
							<AppointmentsPanel />
						) : panel === PANEL.CLIENTS_BASE && can(PERMISSIONS.SEARCH_VEHICLE) ? (
							<ClientsBasePanel />
						) : panel === PANEL.CATALOGS && can(PERMISSIONS.MANAGE_CATALOGS) ? (
							<CatalogPanel />
						) : panel === PANEL.STAFF_MANAGEMENT &&
						  can(PERMISSIONS.MANAGE_STAFF) ? (
							<StaffManagementPanel />
						) : null}
					</div>
				</>
			) : (
				<p className={classes.errorMessage}>
					Tu cuenta no tiene permisos asignados. Contacta al Super Administrador.
				</p>
			)}

			{!isWidePanel && (
				<FeedbackBox
					fetchState={fetchState}
					panel={panel}
					response={serverResponse}
				/>
			)}
			<AdminFooter onSignout={handleSignOut} signingOut={signingOut} />
		</div>
	);
};

export default Admin;