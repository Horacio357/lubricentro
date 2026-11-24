import apiInstance from "@/services/brevo/brevoConfig";
import { SendSmtpEmail } from "@getbrevo/brevo";
import { getFirebaseAdmin } from "@/services/firebase/firebaseAdminConfig";
import { PERMISSIONS, hasPermission } from "@/utils/permissions";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Método no permitido" });
	}

	const adminServices = getFirebaseAdmin();
	if (adminServices) {
		const authHeader = req.headers.authorization || "";
		const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
		if (!token) {
			return res.status(401).json({ message: "No autorizado" });
		}
		try {
			const decoded = await adminServices.auth.verifyIdToken(token);
			const staffSnap = await adminServices.db.collection("staff_users").doc(decoded.uid).get();
			if (!staffSnap.exists || !hasPermission(staffSnap.data(), PERMISSIONS.CREATE_VEHICLE)) {
				return res.status(403).json({ message: "Permisos insuficientes" });
			}
		} catch (err) {
			return res.status(401).json({ message: "Token inválido o expirado" });
		}
	}

	const { firstName, lastName, userId, email } = req.body;

	if (!email || !firstName || !lastName || !userId) {
		return res.status(400).json({ message: "Faltan datos requeridos" });
	}

	const link = `https://mi.rudyservices.com.ar/${userId}`;

	const htmlContent = `
		<div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px;">
			<div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
				<div style="background-color: #202020ff; color: #fff; padding: 20px;">
					<h2 style="margin: 0; color:#fff;">¡Bienvenido a miRudy!</h2>
				</div>
				<div style="padding: 25px 20px;">
					<p>Hola <strong>${firstName} ${lastName}</strong>,</p>
					<p>Te damos la bienvenida a <strong>miRudy</strong>, la plataforma digital de <strong>RudyServices</strong> que centraliza el historial clínico de tu vehículo.</p>
				
					<p>Además de acceder con tu chip NFC, también podés ingresar directamente desde este enlace: "${link}"</p>
					<p style="text-align: center; margin: 20px 0;">
						<a href="${link}" style="background-color: #FCBD00; color: #333; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block;">
							<b>Ingresar a miRudy</b>
						</a>
					</p>

					<p>Te recomendamos guardarlo para tenerlo siempre a mano.</p>

					<p>Con <strong>miRudy</strong> vas a contar con toda la información de tu vehículo de manera clara, segura y actualizada.</p>

					<p>Gracias por elegir <strong>RudyServices</strong>.</p>

					<p style="font-size: 14px; margin-top: 64px; width: 100%; text-align: end;">developed by <a href="https://sonargroup.us/">sonargroup.us</a></p>
				</div>
			</div>
		</div>
	`;

	let message = new SendSmtpEmail();
	message.subject = "Bienvenido a miRudy";
	message.htmlContent = htmlContent;
	message.sender = { name: "Equipo de RudyServices", email: "info@rudyservices.com.ar" };
	message.to = [{ email: email, name: `${firstName} ${lastName}` }];

	try {
		const data = await apiInstance.sendTransacEmail(message);
		console.log("Correo enviado:", data);
		return res.status(200).json({ message: "Correo enviado correctamente" });
	} catch (error) {
		console.error("Error al enviar el correo:", error);
		return res.status(500).json({ message: "Error al enviar el correo" });
	}
}

