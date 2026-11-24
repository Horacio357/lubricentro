import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import User from "@/layouts/user/User";
import { ADMIN_STATES, FETCH_STATES } from "@/utils/enums";
import { getVehicleById, getPrivateVehicleById } from "@/utils/firebase/firebase";
import { useRouter } from "next/router";
import SpinnerBranded from "@/components/SpinnerBranded/SpinnerBranded";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS } from "@/utils/permissions";
import {
	isDevBypassEnabled,
	getDevMockVehicleById,
} from "@/utils/devMockData";

export default function UserPage() {
	const [fetchState, setFetchState] = useState(FETCH_STATES.FETCHING);
	const [data, setData] = useState(null);
	const [privateData, setPrivateData] = useState(null);
	const router = useRouter();
	const { userid } = router.query;
	const { authState, staffProfile, can } = useAuth();

	const canViewPrivate =
		authState === ADMIN_STATES.ADMIN &&
		(can(PERMISSIONS.VIEW_CLIENT_PRIVATE) || can(PERMISSIONS.VIEW_PRICES));

	const handleGetData = useCallback(async () => {
		if (!userid) return;
		try {
			setFetchState(FETCH_STATES.FETCHING);
			if (isDevBypassEnabled()) {
				const mock = getDevMockVehicleById(userid);
				if (mock) {
					setData(mock.publicData);
					setPrivateData(mock.privateData);
					setFetchState(FETCH_STATES.SUCCESS);
					return;
				}
			}
			const vehicle = await getVehicleById(userid);
			setData(vehicle);
			setFetchState(FETCH_STATES.SUCCESS);
		} catch (error) {
			if (isDevBypassEnabled()) {
				const mock = getDevMockVehicleById(userid);
				if (mock) {
					setData(mock.publicData);
					setPrivateData(mock.privateData);
					setFetchState(FETCH_STATES.SUCCESS);
					return;
				}
			}
			setFetchState(FETCH_STATES.ERROR);
		}
	}, [userid]);

	useEffect(() => {
		handleGetData();
	}, [handleGetData]);

	const handleGetPrivateData = useCallback(async () => {
		if (!userid || !canViewPrivate) {
			setPrivateData(null);
			return;
		}
		try {
			const vehicle = await getPrivateVehicleById(userid);
			setPrivateData(vehicle);
		} catch (error) {
			console.error(error);
		}
	}, [userid, canViewPrivate]);

	useEffect(() => {
		handleGetPrivateData();
	}, [handleGetPrivateData]);

	const handleChanges = async () => {
		try {
			const vehicle = await getVehicleById(userid);
			setData(vehicle);
			if (canViewPrivate) {
				const vehiclePrivate = await getPrivateVehicleById(userid);
				setPrivateData(vehiclePrivate);
			}
		} catch (error) {
			setFetchState(FETCH_STATES.ERROR);
		}
	};

	return (
		<>
			<Head>
				<title>Mi Rudy</title>
				<meta name="description" content="Mi Rudy" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<SpinnerBranded
				fullscreen
				isLoading={fetchState === FETCH_STATES.FETCHING}
			/>
			{fetchState === FETCH_STATES.FETCHING ? null : fetchState ===
			  FETCH_STATES.SUCCESS ? (
				<User
					data={data}
					privateData={privateData}
					adminState={authState}
					staffProfile={staffProfile}
					can={can}
					onChange={handleChanges}
				/>
			) : fetchState === FETCH_STATES.ERROR ? (
				<span>Ha ocurrido un error, intente recargar la página</span>
			) : null}
		</>
	);
}
