import { downloadPDF } from "@/utils/pdflib/pdflib";

function getDateDDMMYY() {
	const date = new Date()
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0'); // meses desde 0 a 11
	const year = String(date.getFullYear()).slice(-2); // últimos 2 dígitos
	return `${day}/${month}/${year}`;
}

function autoLineBreak(text, lineLength, lineBreakChar = '\n') {
	if (typeof text !== 'string' || typeof lineLength !== 'number' || lineLength <= 0) {
		console.error("Argumentos inválidos: se espera un string y un número positivo.");
		return text;
	}
	let formattedText = '';
	let startIndex = 0;
	while (startIndex < text.length) {
		let endIndex = startIndex + lineLength;
		if (endIndex >= text.length) {
		formattedText += text.substring(startIndex);
		break;
		}
		let lastSpaceIndex = text.lastIndexOf(' ', endIndex);
		if (lastSpaceIndex !== -1 && lastSpaceIndex > startIndex) {
		formattedText += text.substring(startIndex, lastSpaceIndex).trim();
		startIndex = lastSpaceIndex + 1;
		} else {
		formattedText += text.substring(startIndex, endIndex);
		startIndex = endIndex;
		}
		if (startIndex < text.length) {
		formattedText += lineBreakChar;
		}
	}
	return formattedText;
}

const getChecklistTable = (allItems) => {
const LABEL_WIDTH = 29;
  const SPACING_BETWEEN = 4;

  const shorten = (text, maxLength) => {
  if (text.length <= maxLength) return text;

  const words = text.split(' ');
  let shortenedWords = [];

  for (let word of words) {
	if (word.length > 4) {
	  shortenedWords.push(word.slice(0, 4) + '.');
	} else {
	  shortenedWords.push(word);
	}
  }

  let result = shortenedWords.join(' ');

  // Si aún excede el largo, eliminar palabras del final
  while (result.length > maxLength && shortenedWords.length > 1) {
	shortenedWords.pop();
	result = shortenedWords.join(' ');
  }

  return result;
};

let lines = '';

  for (let i = 0; i < allItems.length; i += 2) {
	const item1 = allItems[i];
	const item2 = allItems[i + 1];

	let line1 = ''
	const label1 = shorten(item1.label, LABEL_WIDTH).padEnd(LABEL_WIDTH);
	if(item1.sides){
		const der1 = item1.not_passed_right ? 'X' : ' ';
		const izq1 = item1.not_passed_left ? 'X' : ' ';
		line1 = `${label1}D:${der1} I:${izq1}`;
	}
	else{
		const res = item1.not_passed ? 'X' : ' ';
		line1 = `${label1}${res}`;
	}

	let line2 = '';
	if (item2) {
		const label2 = shorten(item2.label, LABEL_WIDTH).padEnd(LABEL_WIDTH);
		if(item2.sides){
			const der2 = item2.not_passed_right ? 'X' : ' ';
			const izq2 = item2.not_passed_left ? 'X' : ' ';
			line2 = `${label2}D:${der2} I:${izq2}`;
		}
		else{
			const res = item2.not_passed ? 'X' : ' ';
			line2 = `${label2}${res}`;
		}
	}

	lines += line1.padEnd(LABEL_WIDTH + 5 + SPACING_BETWEEN) + line2 + '\n';
  }

  return lines;
}

export const generateTicket = (dataChecklist, dataExtra, vehicle) => {
	const msg =`
_____________________________________________________________________________						
								
								RUDY SERVICES
_____________________________________________________________________________
Vendedor:			
Fecha: ${getDateDDMMYY()}		
Marca: ${vehicle.data.brand} 
Modelo:${vehicle.data.model}		
Patente: ${vehicle.data.patente}
_____________________________________________________________________________
${getChecklistTable(dataChecklist.flatMap(apartado => apartado.items))}
_____________________________________________________________________________
Inspección realizada por: ${dataExtra.by}
Informado a:
Observaciones: 
${autoLineBreak(dataExtra.details, 66)}
_____________________________________________________________________________

Firma:				      Aclaración:
_____________________________________________________________________________
`;

	downloadPDF(msg)
}