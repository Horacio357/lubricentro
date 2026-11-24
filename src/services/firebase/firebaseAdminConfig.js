import admin from 'firebase-admin';

function getServiceAccountFromEnv() {
	if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
		try {
			return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
		} catch (err) {
			console.error('FIREBASE_SERVICE_ACCOUNT_KEY no es un JSON válido:', err);
			return null;
		}
	}

	if (
		process.env.FIREBASE_PROJECT_ID &&
		process.env.FIREBASE_CLIENT_EMAIL &&
		process.env.FIREBASE_PRIVATE_KEY
	) {
		return {
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
		};
	}

	return null;
}

export function getFirebaseAdmin() {
	if (admin.apps.length > 0) {
		return {
			app: admin.app(),
			auth: admin.auth(),
			db: admin.firestore(),
		};
	}

	const serviceAccount = getServiceAccountFromEnv();
	if (!serviceAccount) {
		return null;
	}

	const app = admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});

	return {
		app,
		auth: admin.auth(),
		db: admin.firestore(),
	};
}
