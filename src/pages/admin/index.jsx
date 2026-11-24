import Login from "@/layouts/login/Login";
import Admin from "@/layouts/admin/Admin";
import Head from "next/head";
import { ADMIN_STATES } from "@/utils/enums";
import SpinnerBranded from "@/components/SpinnerBranded/SpinnerBranded";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
	const { authState, staffProfile, can } = useAuth();

	return (
		<>
			<Head>
				<title>Administración</title>
				<meta name="description" content="Rudy Care" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<SpinnerBranded
				fullscreen
				isLoading={authState === ADMIN_STATES.FETCHING}
			/>
			{authState === ADMIN_STATES.ADMIN ? (
				<Admin staffProfile={staffProfile} can={can} />
			) : authState === ADMIN_STATES.NO_ADMIN ? (
				<Login />
			) : null}
		</>
	);
}