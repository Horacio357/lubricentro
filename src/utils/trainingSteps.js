import { PANEL } from '@/layouts/admin/utils/adminEnums';

export function getAdminTrainingSteps(availablePanels = []) {
	const allSteps = [
		{
			id: 'welcome',
			panel: null,
			title: 'Bienvenido al Panel de R Services',
			description:
				'Este modo entrenamiento te guía paso a paso por cada herramienta del sistema según tus permisos. Puedes avanzar con las flechas o salir en cualquier momento presionando ESC.',
			tip: 'La barra superior cambia automáticamente entre pestañas en computadora y menú desplegable en celular.',
		},
		{
			id: 'search',
			panel: PANEL.SEARCH_ACCOUNT,
			title: 'Buscar Cuenta / Unidad',
			description:
				'Busca cualquier vehículo o autoelevador por patente, N° de serie, marca, modelo o apellido del cliente para abrir su ficha digital y cargar o consultar servicios.',
			tip: 'Si hay varias unidades con el mismo apellido o marca, verás una lista con todas las coincidencias.',
		},
		{
			id: 'create',
			panel: PANEL.CREATE_ACCOUNT,
			title: 'Crear Cuenta (Vehículo o Autoelevador)',
			description:
				'Da de alta vehículos (por patente y km) o autoelevadores/maquinaria (por N° de serie, interno y horómetro en hs). Incluye autocompletado por cliente existente y pegado inteligente con IA.',
			tip: 'Al terminar, copia el enlace generado para grabarlo en el chip NFC de la unidad.',
		},
		{
			id: 'dashboard',
			panel: PANEL.DASHBOARD,
			title: 'Dashboard de Métricas e IA (Super Admin)',
			description:
				'Visualiza KPIs, gráficos estilo pastel por categoría y marcas, alertas de reposición urgente de repuestos, avisos por media de recurrencia y el Consultor IA para hacer preguntas del negocio.',
			tip: 'Usa los botones de WhatsApp o Enviar Email en la lista de vencidos para recuperar clientes.',
		},
		{
			id: 'appointments',
			panel: PANEL.APPOINTMENTS,
			title: 'Turnos y Solicitudes WhatsApp',
			description:
				'Separa las solicitudes que los clientes envían desde su chip NFC ("Solicitud WhatsApp") de los turnos ya acordados y agendados ("Turno Confirmado").',
			tip: 'Al confirmar un turno, anota los códigos de filtros o repuestos a preparar.',
		},
		{
			id: 'clients_base',
			panel: PANEL.CLIENTS_BASE,
			title: 'Base de Clientes (CRM y Exportación)',
			description:
				'Planilla general de clientes filtrable por rubro realizado, tipo de unidad y consentimiento comercial. Incluye opción para evitar contactos duplicados y exportar a CSV (Excel).',
			tip: 'Respeta siempre la etiqueta "No contactar" antes de enviar promociones.',
		},
		{
			id: 'catalogs',
			panel: PANEL.CATALOGS,
			title: 'Catálogos (Aceites, Repuestos y Marcas)',
			description:
				'Administra aceites parametrizados, repuestos con stock actual/mínimo (alerta de compra urgente) y nuevas marcas/modelos de autos, autoelevadores o maquinaria.',
			tip: 'El stock de repuestos se descuenta automáticamente cuando se carga un service.',
		},
		{
			id: 'staff',
			panel: PANEL.STAFF_MANAGEMENT,
			title: 'Gestión de Equipo y Permisos',
			description:
				'Crea perfiles de Vendedor o Mecánico sin cerrar tu sesión de Super Administrador, delega permisos puntuales por casillas y suspende o reactiva accesos cuando lo necesites.',
			tip: 'Los mecánicos pueden cargar servicios y checklists sin ver importes si así lo configuras.',
		},
		{
			id: 'delete',
			panel: PANEL.DELETE_ACCOUNT,
			title: 'Eliminar Cuenta',
			description:
				'Elimina de forma permanente e irreversible una unidad y todo su historial de servicios y checklists en Firestore.',
			tip: 'Úsalo solo para registros duplicados o de prueba.',
		},
	];

	return allSteps.filter(
		(step) => !step.panel || availablePanels.includes(step.panel)
	);
}

export function getVehicleTrainingSteps({ isStaff = false } = {}) {
	if (!isStaff) {
		return [
			{
				id: 'client-welcome',
				title: 'Tu Ficha Digital miRudy',
				description:
					'Aquí consultas el historial de mantenimiento de tu vehículo o autoelevador escaneando el chip NFC. Puedes salir de esta guía cuando quieras con ESC.',
				tip: 'Guarda este enlace en favoritos para tenerlo siempre a mano.',
			},
			{
				id: 'client-traffic',
				title: 'Semáforo de Mantenimiento',
				description:
					'Te muestra de un vistazo si tu unidad está al día (verde), próxima al service (amarillo) o vencida (rojo), indicando sobre qué fecha y kilometraje/horas se calculó.',
				tip: 'Desde el botón verde puedes pedir turno por WhatsApp con todos tus datos ya cargados.',
			},
			{
				id: 'client-services',
				title: 'Historial, Comprobante PDF y Encuesta',
				description:
					'Toca cada tarjeta de Service para ver qué se realizó, descargar tu comprobante en PDF, pedir turno para ese trabajo específico o calificar la atención.',
				tip: 'Si algo no salió como esperabas, tu calificación baja avisa directo al responsable del taller.',
			},
		];
	}

	return [
		{
			id: 'staff-traffic',
			title: 'Semáforo y Ficha de Unidad',
			description:
				'Arriba ves el estado de mantenimiento (km u horas en autoelevadores) y la tarjeta blanca con datos del cliente, aceite preferido y botón de WhatsApp.',
			tip: 'Como Super Administrador puedes reeditar cualquier dato de la unidad o del cliente.',
		},
		{
			id: 'staff-service',
			title: 'Doble Lectura de Servicios',
			description:
				'Cada service muestra arriba la frase sencilla que ve el cliente y debajo el detalle técnico completo para el taller: marcas, códigos de filtro, SKU, observaciones e importe.',
			tip: 'También puedes descargar el comprobante PDF o reeditar el service y su checklist.',
		},
		{
			id: 'staff-add',
			title: 'Nueva Orden de Servicio',
			description:
				'Carga un nuevo mantenimiento completando el checklist previo y el formulario estructurado del rubro (Lubricentro, Aire Acondicionado, Neumáticos, Mecánica Ligera o Repuestos).',
			tip: 'Usa "Sugerir con IA" y "Pulir con IA" para estandarizar el texto del chip NFC en segundos.',
		},
	];
}
