import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatDate, formatVertical } from './firebase/firebase';
import { formatPrice } from './helpers';
import { formatChipSummary } from './chipFormatter';

function sanitizePdfText(str) {
	return String(str || '')
		.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
		.trim();
}

export async function downloadServiceReceiptPdf({
	vehicle = {},
	privateVehicle = null,
	service = {},
	privateService = null,
	canViewPrices = false,
}) {
	const pdfDoc = await PDFDocument.create();
	const page = pdfDoc.addPage([595.28, 841.89]); // A4
	const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
	const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

	const { width, height } = page.getSize();
	const margin = 45;
	let y = height - 55;

	// Header oscuro con acento #FCBD00
	page.drawRectangle({
		x: 0,
		y: height - 95,
		width,
		height: 95,
		color: rgb(0.08, 0.08, 0.08),
	});

	page.drawText('R SERVICES', {
		x: margin,
		y: height - 45,
		size: 20,
		font: fontBold,
		color: rgb(0.988, 0.741, 0),
	});
	page.drawText('Comprobante Digital de Servicio', {
		x: margin,
		y: height - 68,
		size: 11,
		font: fontRegular,
		color: rgb(0.9, 0.9, 0.9),
	});

	const fecha = formatDate(service.timestamp) || '-';
	page.drawText(sanitizePdfText(`Fecha: ${fecha}`), {
		x: width - margin - 110,
		y: height - 50,
		size: 11,
		font: fontBold,
		color: rgb(1, 1, 1),
	});

	y = height - 130;

	const drawSectionTitle = (title) => {
		page.drawText(sanitizePdfText(title), {
			x: margin,
			y,
			size: 12,
			font: fontBold,
			color: rgb(0.12, 0.12, 0.12),
		});
		y -= 6;
		page.drawLine({
			start: { x: margin, y },
			end: { x: width - margin, y },
			thickness: 1,
			color: rgb(0.85, 0.85, 0.85),
		});
		y -= 16;
	};

	const drawRow = (label, value) => {
		page.drawText(sanitizePdfText(`${label}:`), {
			x: margin,
			y,
			size: 10,
			font: fontBold,
			color: rgb(0.3, 0.3, 0.3),
		});
		page.drawText(sanitizePdfText(value || '-'), {
			x: margin + 145,
			y,
			size: 10,
			font: fontRegular,
			color: rgb(0.1, 0.1, 0.1),
		});
		y -= 18;
	};

	drawSectionTitle('Datos del Vehículo y Cliente');
	drawRow('Vehículo', `${vehicle.brand || ''} ${vehicle.model || ''}`.trim());
	drawRow('Patente', vehicle.patente || '-');
	if (privateVehicle) {
		drawRow(
			'Cliente',
			`${privateVehicle.owner_name || ''} ${privateVehicle.owner_surname || ''}`.trim()
		);
		if (privateVehicle.phone_number) {
			drawRow('Teléfono', privateVehicle.phone_number);
		}
	}
	y -= 8;

	drawSectionTitle('Detalle del Servicio Realizado');
	drawRow('Rubro', formatVertical(service.vertical) || service.vertical);
	drawRow('Kilometraje', `${service.kilometraje || '-'} km`);
	drawRow('Próximo Service', service.next_service || '-');

	if (service.vertical === 'LUBRICENTRO' && service.vertical_data) {
		const vd = service.vertical_data;
		drawRow('Aceite utilizado', vd.tipo || '-');
		const checks = [];
		if (vd.filtro_aceite) checks.push('Filtro de aceite');
		if (vd.filtro_aire) checks.push('Filtro de aire');
		if (vd.filtro_combustible) checks.push('Filtro de combustible');
		if (vd.engrase) checks.push('Engrase / niveles');
		drawRow('Controles / Filtros', checks.join(', ') || '-');
	}

	if (Array.isArray(service.partsUsed) && service.partsUsed.length > 0) {
		y -= 4;
		page.drawText('Repuestos utilizados:', {
			x: margin,
			y,
			size: 10,
			font: fontBold,
			color: rgb(0.3, 0.3, 0.3),
		});
		y -= 16;
		service.partsUsed.forEach((p) => {
			const pricePart =
				canViewPrices && p.unitPrice ? ` - $${p.unitPrice}` : '';
			page.drawText(
				sanitizePdfText(`• ${p.qty}x ${p.name}${pricePart}`),
				{
					x: margin + 12,
					y,
					size: 10,
					font: fontRegular,
					color: rgb(0.15, 0.15, 0.15),
				}
			);
			y -= 15;
		});
	}

	if (service.details) {
		y -= 4;
		drawRow('Observaciones', String(service.details).slice(0, 95));
	}

	if (canViewPrices && privateService?.importe) {
		y -= 6;
		drawRow('Importe Total', formatPrice(privateService.importe));
	}

	y -= 12;
	drawSectionTitle('Resumen Estandarizado (Chip NFC)');
	const chipLines = (
		service.chipText ||
		formatChipSummary({ vehicle, service })
	).split('\n');
	chipLines.forEach((line) => {
		page.drawText(sanitizePdfText(line), {
			x: margin,
			y,
			size: 9.5,
			font: fontRegular,
			color: rgb(0.25, 0.25, 0.25),
		});
		y -= 14;
	});

	page.drawText('Gracias por elegir RudyServices · https://rudyservices.com.ar', {
		x: margin,
		y: 35,
		size: 9,
		font: fontRegular,
		color: rgb(0.5, 0.5, 0.5),
	});

	const pdfBytes = await pdfDoc.save();
	const blob = new Blob([pdfBytes], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	const cleanPatente = (vehicle.patente || 'VEHICULO').replace(/\s+/g, '');
	a.href = url;
	a.download = `Comprobante_${cleanPatente}_${fecha.replace(/\//g, '-')}.pdf`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
