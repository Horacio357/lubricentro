import { GoogleGenAI } from '@google/genai';
import { getFirebaseAdmin } from '@/services/firebase/firebaseAdminConfig';

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const DEFAULT_XAI_MODEL = process.env.XAI_MODEL || 'grok-2-latest';

async function verifyStaffAuth(req) {
	const adminServices = getFirebaseAdmin();
	if (!adminServices) return { ok: true };

	const authHeader = req.headers.authorization || '';
	const token = authHeader.startsWith('Bearer ')
		? authHeader.slice(7).trim()
		: null;

	if (!token) {
		return { ok: false, status: 401, message: 'No autorizado.' };
	}

	try {
		const decoded = await adminServices.auth.verifyIdToken(token);
		const staffSnap = await adminServices.db
			.collection('staff_users')
			.doc(decoded.uid)
			.get();
		if (!staffSnap.exists || staffSnap.data().active === false) {
			return { ok: false, status: 403, message: 'Perfil sin acceso activo.' };
		}
		return { ok: true, uid: decoded.uid, staff: staffSnap.data() };
	} catch (err) {
		return { ok: false, status: 401, message: 'Token inválido o expirado.' };
	}
}

async function runLlmCompletion({ systemPrompt, messages }) {
	const groqOrXaiKey =
		process.env.GROQ_API_KEY || process.env.GROK_API_KEY || '';

	if (groqOrXaiKey) {
		const isGroq = groqOrXaiKey.startsWith('gsk_');
		const endpoint = isGroq
			? 'https://api.groq.com/openai/v1/chat/completions'
			: 'https://api.x.ai/v1/chat/completions';
		const model = isGroq ? DEFAULT_GROQ_MODEL : DEFAULT_XAI_MODEL;

		const apiMessages = [
			...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
			...messages,
		];

		const resp = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${groqOrXaiKey}`,
			},
			body: JSON.stringify({
				model,
				messages: apiMessages,
				temperature: 0.35,
			}),
		});

		const data = await resp.json();
		if (!resp.ok) {
			throw new Error(
				data?.error?.message || `Error del proveedor IA (${resp.status})`
			);
		}
		return (data?.choices?.[0]?.message?.content || '').trim();
	}

	const geminiKey = process.env.GEMINI_API_KEY;
	if (geminiKey) {
		const ai = new GoogleGenAI({ apiKey: geminiKey });
		const combinedPrompt = [
			systemPrompt,
			...messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
		]
			.filter(Boolean)
			.join('\n\n');

		const candidateModels = Array.from(
			new Set([
				DEFAULT_GEMINI_MODEL,
				'gemini-3.1-flash-lite-preview',
				'gemini-flash-latest',
				'gemini-flash-lite-latest',
			])
		);

		let lastErr;
		for (const modelName of candidateModels) {
			try {
				const response = await ai.models.generateContent({
					model: modelName,
					contents: combinedPrompt,
				});
				return (response.text || '').trim();
			} catch (err) {
				lastErr = err;
				const msg = String(err?.message || '');
				if (
					msg.includes('503') ||
					msg.includes('429') ||
					msg.includes('404') ||
					msg.includes('UNAVAILABLE')
				) {
					continue;
				}
				throw err;
			}
		}
		throw lastErr;
	}

	throw new Error(
		'No hay clave de IA configurada (GROQ_API_KEY, GROK_API_KEY o GEMINI_API_KEY) en .env.local.'
	);
}

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Método no permitido' });
	}

	const hasAnyKey = Boolean(
		process.env.GROQ_API_KEY ||
			process.env.GROK_API_KEY ||
			process.env.GEMINI_API_KEY
	);
	if (!hasAnyKey) {
		return res.status(503).json({
			message:
				'Configura GROQ_API_KEY (o GEMINI_API_KEY) en .env.local para usar el asistente IA.',
		});
	}

	const authCheck = await verifyStaffAuth(req);
	if (!authCheck.ok) {
		return res.status(authCheck.status).json({ message: authCheck.message });
	}

	const { action, payload } = req.body || {};
	if (!action || !payload) {
		return res
			.status(400)
			.json({ message: 'Faltan parámetros (action, payload).' });
	}

	try {
		if (action === 'standardize_chip') {
			const { vehicle, service, currentChipText } = payload;
			const text = await runLlmCompletion({
				systemPrompt:
					'Eres asistente operativo del lubricentro y taller multimarca "R Services". Responde en español rioplatense claro, técnico y conciso sin markdown.',
				messages: [
					{
						role: 'user',
						content: `Estandariza y pule el siguiente texto para grabar/mostrar en el chip NFC del vehículo (máximo 5 líneas cortas, sin emojis ni markdown, sin inventar datos):
Vehículo: ${JSON.stringify(vehicle || {})}
Servicio: ${JSON.stringify(service || {})}
Borrador actual:
${currentChipText || ''}`,
					},
				],
			});
			return res.status(200).json({ chipText: text });
		}

		if (action === 'suggest_technical') {
			const { vehicle, service, oilsCatalog, partsCatalog } = payload;
			const raw = await runLlmCompletion({
				systemPrompt:
					'Eres asesor técnico de "R Services" (lubricentro, autoelevadores y mecánica ligera). Responde ÚNICAMENTE con un JSON válido sin bloque markdown.',
				messages: [
					{
						role: 'user',
						content: `Devuelve un JSON con estas claves exactas:
{
  "suggestedOilLabel": string | null,
  "suggestedNextService": string,
  "suggestedPartsNames": string[],
  "rationale": string
}
Reglas:
- Si "oilPreference" existe en el vehículo, priorízalo en "suggestedOilLabel".
- Si el rubro es LUBRICENTRO y no hay preferencia, elige una opción exacta de "oilsCatalog".
- Si el rubro es MECANICA LIGERA o REPUESTOS, sugiere hasta 3 repuestos de "partsCatalog" si aplica.
- "rationale" debe ser breve (máximo 2 oraciones en español).

Vehículo: ${JSON.stringify(vehicle || {})}
Servicio actual: ${JSON.stringify(service || {})}
Catálogo de aceites: ${JSON.stringify(oilsCatalog || [])}
Catálogo de repuestos: ${JSON.stringify(partsCatalog || [])}`,
					},
				],
			});

			const cleaned = raw
				.replace(/^```json\s*/i, '')
				.replace(/^```\s*/i, '')
				.replace(/```$/i, '')
				.trim();
			const parsed = JSON.parse(cleaned);
			return res.status(200).json({ suggestion: parsed });
		}

		if (action === 'analyze_metrics') {
			const { metricsSummary } = payload;
			const insights = await runLlmCompletion({
				systemPrompt:
					'Eres analista de negocio y operaciones para el Super Administrador de "R Services". Responde en español claro y directo.',
				messages: [
					{
						role: 'user',
						content: `Analiza estas métricas reales del taller y entrega 4 puntos concretos (viñetas cortas con "-" al inicio, máximo 160 palabras en total):
1) Qué rubro tracciona más servicios y facturación.
2) Qué servicios o rubros están faltando o tienen 0/baja actividad.
3) Qué acción tomar con los vehículos vencidos según la media.
4) Una oportunidad comercial o mejora operativa inmediata.

Métricas: ${JSON.stringify(metricsSummary || {})}`,
					},
				],
			});
			return res.status(200).json({ insights });
		}

		if (action === 'parse_client_text') {
			const { text } = payload;
			const raw = await runLlmCompletion({
				systemPrompt:
					'Eres un extractor de datos para "R Services". Responde ÚNICAMENTE con un JSON válido sin markdown.',
				messages: [
					{
						role: 'user',
						content: `Extrae los datos del cliente y su unidad desde el siguiente texto. Si un dato no aparece, devuelve "".
JSON exacto:
{
  "unitType": "vehiculo" | "autoelevador",
  "patente": string,
  "serialNumber": string,
  "internalNumber": string,
  "brand": string,
  "model": string,
  "owner_name": string,
  "owner_surname": string,
  "dni": string,
  "phone_number": string,
  "email": string,
  "direction": string,
  "state": string,
  "zip_code": string,
  "occupation": string
}
Texto:
${text || ''}`,
					},
				],
			});

			const cleaned = raw
				.replace(/^```json\s*/i, '')
				.replace(/^```\s*/i, '')
				.replace(/```$/i, '')
				.trim();
			return res.status(200).json({ parsed: JSON.parse(cleaned) });
		}

		if (action === 'super_admin_chat') {
			const { question, history = [], businessContext = {} } = payload;
			if (!question || !String(question).trim()) {
				return res.status(400).json({ message: 'La pregunta es obligatoria.' });
			}

			const systemStatus = {
				envConfigured: {
					firebaseAdmin: Boolean(getFirebaseAdmin()),
					brevoEmail: Boolean(process.env.BREVO_API_KEY),
					cronSecret: Boolean(process.env.CRON_SECRET),
					workshopWhatsapp: Boolean(process.env.NEXT_PUBLIC_WORKSHOP_WHATSAPP),
					aiProvider: process.env.GROQ_API_KEY
						? 'Groq (gsk)'
						: process.env.GROK_API_KEY
							? 'xAI Grok'
							: 'Gemini',
				},
				activeModules: [
					'Dashboard con gráficos pastel',
					'Turnos (Solicitudes WhatsApp vs Confirmados)',
					'Base de Clientes (CRM + exportación CSV)',
					'Catálogos de Aceites y Repuestos',
					'Gestión de Equipo (Super Admin, Vendedor, Mecánico)',
					'Soporte Vehículos (km) y Autoelevadores (serie/interno/hs)',
					'Doble lectura (Cliente NFC vs Operario) + Comprobante PDF',
				],
			};

			const systemPrompt = `Eres el Consultor Estratégico y Técnico de "R Services" (lubricentro, autoelevadores y taller multimarca).
Hablas directamente con el Super Administrador. Responde en español claro, conciso y accionable usando SOLO los datos reales proporcionados abajo (no inventes cifras ni clientes).
Si el Super Administrador pregunta por el funcionamiento del software, usa "systemStatus" para señalar qué módulos están activos y qué variables/configuraciones faltan (por ejemplo, si firebaseAdmin o workshopWhatsapp están en false).
Si pregunta por informes del negocio, servicios faltantes o vencimientos, analiza "businessContext".

systemStatus: ${JSON.stringify(systemStatus)}
businessContext: ${JSON.stringify(businessContext)}`;

			const recentHistory = Array.isArray(history)
				? history.slice(-6).map((m) => ({
						role: m.role === 'assistant' ? 'assistant' : 'user',
						content: String(m.content || ''),
				  }))
				: [];

			const answer = await runLlmCompletion({
				systemPrompt,
				messages: [...recentHistory, { role: 'user', content: String(question).trim() }],
			});

			return res.status(200).json({ answer });
		}

		return res.status(400).json({ message: 'Acción de IA no soportada.' });
	} catch (error) {
		console.error('Error en /api/ai/assist:', error);
		return res.status(500).json({
			message:
				error.message ||
				'No se pudo procesar la solicitud de IA.',
		});
	}
}
