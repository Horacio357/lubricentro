import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	query,
	setDoc,
} from 'firebase/firestore';
import { auth, db } from '@/services/firebase/firebaseConfig';
import { ADMIN_STATES } from '@/utils/enums';
import {
	ROLES,
	hasPermission,
	isSuperAdmin as checkIsSuperAdmin,
} from '@/utils/permissions';

const STAFF_COLLECTION = 'staff_users';

async function resolveStaffProfile(firebaseUser) {
	const staffRef = doc(db, STAFF_COLLECTION, firebaseUser.uid);
	const staffSnap = await getDoc(staffRef);

	if (staffSnap.exists()) {
		return { uid: staffSnap.id, ...staffSnap.data() };
	}

	// Bootstrap: si aún no existe ningún perfil en staff_users, el primer usuario autenticado
	// se inicializa como Super Administrador para evitar bloqueo tras la migración.
	const existingStaffSnap = await getDocs(
		query(collection(db, STAFF_COLLECTION), limit(1))
	);

	if (existingStaffSnap.empty) {
		const bootstrapProfile = {
			email: firebaseUser.email || '',
			name: firebaseUser.displayName || 'Super',
			surname: 'Admin',
			role: ROLES.SUPER_ADMIN,
			active: true,
			createdAt: new Date(),
		};
		await setDoc(staffRef, bootstrapProfile);
		return { uid: firebaseUser.uid, ...bootstrapProfile };
	}

	return null;
}

export function useAuth() {
	const [user, setUser] = useState(null);
	const [staffProfile, setStaffProfile] = useState(null);
	const [authState, setAuthState] = useState(ADMIN_STATES.FETCHING);

const IS_DEV_BYPASS =
	process.env.NODE_ENV === 'development' &&
	process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true';

const DEV_PREVIEW_PROFILE = {
	uid: 'dev-super-admin',
	email: 'horacitoxp@gmail.com',
	name: 'Super',
	surname: 'Admin (Modo Prueba)',
	role: ROLES.SUPER_ADMIN,
	active: true,
};

	const loadProfile = useCallback(async (currentUser) => {
		if (!currentUser) {
			if (IS_DEV_BYPASS) {
				setUser({ uid: DEV_PREVIEW_PROFILE.uid, email: DEV_PREVIEW_PROFILE.email });
				setStaffProfile(DEV_PREVIEW_PROFILE);
				setAuthState(ADMIN_STATES.ADMIN);
				return;
			}
			setUser(null);
			setStaffProfile(null);
			setAuthState(ADMIN_STATES.NO_ADMIN);
			return;
		}

		try {
			const profile = await resolveStaffProfile(currentUser);
			setUser(currentUser);
			setStaffProfile(profile);
			if (profile && profile.active !== false) {
				setAuthState(ADMIN_STATES.ADMIN);
			} else {
				setAuthState(ADMIN_STATES.NO_ADMIN);
			}
		} catch (error) {
			console.error('Error al cargar el perfil de staff:', error);
			setUser(currentUser);
			setStaffProfile(null);
			setAuthState(ADMIN_STATES.NO_ADMIN);
		}
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			loadProfile(currentUser);
		});
		return () => unsubscribe();
	}, [loadProfile]);

	const can = useCallback(
		(permission) => hasPermission(staffProfile, permission),
		[staffProfile]
	);

	const refreshProfile = useCallback(() => {
		if (auth.currentUser) {
			return loadProfile(auth.currentUser);
		}
		return Promise.resolve();
	}, [loadProfile]);

	return {
		user,
		staffProfile,
		authState,
		can,
		isSuperAdmin: checkIsSuperAdmin(staffProfile),
		refreshProfile,
	};
}
