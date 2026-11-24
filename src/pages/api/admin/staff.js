import { getFirebaseAdmin } from '@/services/firebase/firebaseAdminConfig';
import {
	ROLES,
	DEFAULT_ROLE_PERMISSIONS,
} from '@/utils/permissions';

const STAFF_COLLECTION = 'staff_users';

async function verifySuperAdminRequest(req, adminServices) {
	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ')
		? authHeader.slice(7).trim()
		: null;

	if (!token) {
		return { error: 'Token de autenticación requerido.', status: 401 };
	}

	try {
		const decoded = await adminServices.auth.verifyIdToken(token);
		const staffSnap = await adminServices.db
			.collection(STAFF_COLLECTION)
			.doc(decoded.uid)
			.get();

		if (!staffSnap.exists) {
			return { error: 'Perfil de administrador no encontrado.', status: 403 };
		}

		const profile = staffSnap.data();
		if (profile.active === false || profile.role !== ROLES.SUPER_ADMIN) {
			return {
				error: 'Solo el Super Administrador puede gestionar perfiles.',
				status: 403,
			};
		}

		return { uid: decoded.uid, profile };
	} catch (err) {
		console.error('Error verificando token:', err);
		return { error: 'Token inválido o expirado.', status: 401 };
	}
}

export default async function handler(req, res) {
	const adminServices = getFirebaseAdmin();
	if (!adminServices) {
		return res.status(503).json({
			message:
				'Firebase Admin SDK no está configurado en el servidor. Agregue FIREBASE_SERVICE_ACCOUNT_KEY (o FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY) en .env.local.',
		});
	}

	const authCheck = await verifySuperAdminRequest(req, adminServices);
	if (authCheck.error) {
		return res.status(authCheck.status).json({ message: authCheck.error });
	}

	const { auth, db } = adminServices;

	if (req.method === 'GET') {
		try {
			const snap = await db
				.collection(STAFF_COLLECTION)
				.orderBy('createdAt', 'desc')
				.get();
			const staff = snap.docs.map((docSnap) => ({
				uid: docSnap.id,
				...docSnap.data(),
				createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString?.() || null,
			}));
			return res.status(200).json({ staff });
		} catch (error) {
			console.error('Error listando staff:', error);
			return res.status(500).json({ message: 'Error al listar el equipo.' });
		}
	}

	if (req.method === 'POST') {
		const { email, password, name, surname, role, customPermissions } = req.body || {};

		if (!email || !password || !name || !role) {
			return res.status(400).json({
				message: 'Email, contraseña, nombre y rol son obligatorios.',
			});
		}

		if (!Object.values(ROLES).includes(role)) {
			return res.status(400).json({ message: 'Rol no válido.' });
		}

		if (String(password).length < 6) {
			return res.status(400).json({
				message: 'La contraseña debe tener al menos 6 caracteres.',
			});
		}

		try {
			const userRecord = await auth.createUser({
				email: String(email).trim().toLowerCase(),
				password: String(password),
				displayName: `${name} ${surname || ''}`.trim(),
			});

			const resolvedPermissions = Array.isArray(customPermissions)
				? customPermissions
				: DEFAULT_ROLE_PERMISSIONS[role] || [];

			const profileData = {
				email: userRecord.email,
				name: String(name).trim(),
				surname: String(surname || '').trim(),
				role,
				active: true,
				customPermissions: resolvedPermissions,
				createdBy: authCheck.uid,
				createdAt: new Date(),
			};

			await db.collection(STAFF_COLLECTION).doc(userRecord.uid).set(profileData);

			return res.status(201).json({
				uid: userRecord.uid,
				...profileData,
				createdAt: profileData.createdAt.toISOString(),
			});
		} catch (error) {
			console.error('Error creando cuenta de staff:', error);
			const message =
				error.code === 'auth/email-already-exists'
					? 'Ya existe una cuenta registrada con ese correo electrónico.'
					: 'No se pudo crear el perfil de usuario.';
			return res.status(400).json({ message });
		}
	}

	if (req.method === 'PATCH') {
		const { uid, role, active, customPermissions, name, surname } = req.body || {};
		if (!uid) {
			return res.status(400).json({ message: 'UID requerido.' });
		}

		if (uid === authCheck.uid && active === false) {
			return res.status(400).json({
				message: 'No puedes desactivar tu propia cuenta de Super Administrador.',
			});
		}

		try {
			const updates = {
				updatedAt: new Date(),
				updatedBy: authCheck.uid,
			};

			if (role && Object.values(ROLES).includes(role)) {
				updates.role = role;
			}
			if (typeof active === 'boolean') {
				updates.active = active;
				await auth.updateUser(uid, { disabled: !active });
			}
			if (Array.isArray(customPermissions)) {
				updates.customPermissions = customPermissions;
			}
			if (typeof name === 'string' && name.trim()) {
				updates.name = name.trim();
			}
			if (typeof surname === 'string') {
				updates.surname = surname.trim();
			}

			await db.collection(STAFF_COLLECTION).doc(uid).set(updates, { merge: true });
			return res.status(200).json({ uid, ...updates });
		} catch (error) {
			console.error('Error actualizando staff:', error);
			return res.status(500).json({ message: 'No se pudo actualizar el perfil.' });
		}
	}

	if (req.method === 'DELETE') {
		const { uid } = req.body || {};
		if (!uid) {
			return res.status(400).json({ message: 'UID requerido.' });
		}
		if (uid === authCheck.uid) {
			return res.status(400).json({
				message: 'No puedes eliminar tu propia cuenta de Super Administrador.',
			});
		}

		try {
			await auth.deleteUser(uid);
			await db.collection(STAFF_COLLECTION).doc(uid).delete();
			return res.status(200).json({ message: 'Perfil eliminado correctamente.' });
		} catch (error) {
			console.error('Error eliminando staff:', error);
			return res.status(500).json({ message: 'No se pudo eliminar el perfil.' });
		}
	}

	return res.status(405).json({ message: 'Método no permitido' });
}
