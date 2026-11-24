import React, { useState, useEffect } from 'react';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import MultipleSelector from './MultipleSelector/MultipleSelector';
import provinces_arg from '@/utils/options/provinces_arg.json';
import SimplifiedDateSelector from './SimplifiedDateSelector/SimplifiedDateSelector';
import { validateForm } from '../utils/frontendValidations';
import { newVehicleMock } from '../utils/MocksAndLabels';
import useCarsData from '../hooks/useCarsData';
import { normalizeString } from '@/utils/normalizeStrings';
import Form from '@/components/Form/Form';
import { auth, db } from '@/services/firebase/firebaseConfig';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { isDevBypassEnabled, DEV_MOCK_VEHICLES } from '@/utils/devMockData';

const prov_arg = provinces_arg.map((prov) => ({
	label: prov.name,
	value: prov.name,
}));

const OCCUPATION_OPTIONS = [
	{ label: 'PARTICULAR', value: 'PARTICULAR' },
	{ label: 'EMPRESA / FLOTA', value: 'EMPRESA / FLOTA' },
	{ label: 'LOGISTICA / TRANSPORTE', value: 'LOGISTICA / TRANSPORTE' },
	{ label: 'COMERCIANTE', value: 'COMERCIANTE' },
	{ label: 'AGRO', value: 'AGRO' },
	{ label: 'OTRO', value: 'OTRO' },
];

const INITIAL_FORM = {
	...newVehicleMock,
	unitType: 'vehiculo',
	serialNumber: '',
	internalNumber: '',
	clientNumber: '',
	marketingOptIn: true,
};

const CreateAccountPanel = ({ onCreate, fetchState, FETCH_STATES }) => {
	const [data, setData] = useState(INITIAL_FORM);
	const { car_brands, car_models, getCars, saveCar } = useCarsData();

	const [aiText, setAiText] = useState('');
	const [aiParsing, setAiParsing] = useState(false);
	const [lookupText, setLookupText] = useState('');
	const [lookupMsg, setLookupMsg] = useState(null);

	useEffect(() => {
		if (fetchState === FETCH_STATES.SUCCESS) setData(INITIAL_FORM);
	}, [fetchState, FETCH_STATES.SUCCESS]);

	const handleCreate = () => {
		if (fetchState === FETCH_STATES.FETCHING) return;
		const payload = {
			...data,
			patente:
				data.unitType === 'autoelevador'
					? (data.internalNumber || data.serialNumber || '').toUpperCase().replace(/\s+/g, '')
					: data.patente,
		};
		const errorMessage = validateForm(payload);
		if (errorMessage) {
			alert(errorMessage);
			return;
		}
		onCreate(payload);
	};

	const handleBrandSelection = async (selectedBrand) => {
		if (!selectedBrand) return;
		if (selectedBrand.__isNew__) {
			const brandName = normalizeString(selectedBrand.value);
			setData((prev) => ({ ...prev, brand: String(brandName) }));
			await saveCar(brandName, '');
		} else {
			setData((prev) => ({ ...prev, brand: String(selectedBrand.brand_name) }));
			getCars(selectedBrand.id);
		}
	};

	const handleModelSelection = async (selectedModel) => {
		if (!selectedModel) return;
		if (selectedModel.__isNew__) {
			const modelName = normalizeString(selectedModel.value);
			setData((prev) => ({ ...prev, model: String(modelName) }));
			await saveCar(data.brand, modelName);
		} else {
			setData((prev) => ({ ...prev, model: String(selectedModel.model_name) }));
		}
	};

	const handleLookupExistingClient = async () => {
		const term = lookupText.trim();
		if (!term) return;
		setLookupMsg(null);

		try {
			let found = null;
			if (isDevBypassEnabled()) {
				const qUpper = term.toUpperCase();
				const mock = DEV_MOCK_VEHICLES.find((v) => {
					const p = v.privateData || {};
					return (
						String(p.dni || '').includes(term) ||
						String(p.phone_number || '').includes(term) ||
						String(p.owner_surname || '').toUpperCase().includes(qUpper) ||
						String(v.clientNumber || '').toUpperCase() === qUpper
					);
				});
				if (mock) found = { ...(mock.privateData || {}), clientNumber: mock.clientNumber || '' };
			}

			if (!found) {
				const qDni = query(
					collection(db, 'vehicles_private'),
					where('dni', '==', term),
					limit(1)
				);
				const snap = await getDocs(qDni);
				if (!snap.empty) found = snap.docs[0].data();
			}

			if (!found) {
				setLookupMsg('No se encontró un cliente previo con ese DNI/teléfono.');
				return;
			}

			setData((prev) => ({
				...prev,
				owner_name: found.owner_name || prev.owner_name,
				owner_surname: found.owner_surname || prev.owner_surname,
				dni: found.dni || prev.dni,
				phone_number: found.phone_number || prev.phone_number,
				email: found.email || prev.email,
				direction: found.direction || prev.direction,
				state: found.state || prev.state,
				zip_code: found.zip_code || prev.zip_code,
				occupation: found.occupation || prev.occupation,
				clientNumber: found.clientNumber || prev.clientNumber,
			}));
			setLookupMsg(
				`Datos autocompletados de ${found.owner_name || ''} ${found.owner_surname || ''}.`
			);
		} catch {
			setLookupMsg('No se pudo consultar la base de clientes.');
		}
	};

	const handleAiAutofill = async () => {
		if (!aiText.trim()) return;
		setAiParsing(true);
		setLookupMsg(null);
		try {
			const token = await auth.currentUser?.getIdToken();
			const res = await fetch('/api/ai/assist', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({
					action: 'parse_client_text',
					payload: { text: aiText },
				}),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.message || 'Error IA');

			const p = json.parsed || {};
			setData((prev) => ({
				...prev,
				unitType: p.unitType === 'autoelevador' ? 'autoelevador' : prev.unitType,
				patente: p.patente ? String(p.patente).toUpperCase().replace(/\s+/g, '') : prev.patente,
				serialNumber: p.serialNumber || prev.serialNumber,
				internalNumber: p.internalNumber || prev.internalNumber,
				brand: p.brand ? normalizeString(p.brand) : prev.brand,
				model: p.model ? normalizeString(p.model) : prev.model,
				owner_name: p.owner_name ? normalizeString(p.owner_name) : prev.owner_name,
				owner_surname: p.owner_surname ? normalizeString(p.owner_surname) : prev.owner_surname,
				dni: p.dni || prev.dni,
				phone_number: p.phone_number || prev.phone_number,
				email: p.email || prev.email,
				direction: p.direction ? normalizeString(p.direction) : prev.direction,
				state: p.state ? normalizeString(p.state) : prev.state,
				zip_code: p.zip_code || prev.zip_code,
				occupation: p.occupation ? normalizeString(p.occupation) : prev.occupation,
			}));
			setLookupMsg('Campos autocompletados con IA. Revisa y confirma.');
		} catch (err) {
			setLookupMsg(err.message || 'No se pudo interpretar el texto con IA.');
		} finally {
			setAiParsing(false);
		}
	};

	return (
		<Form onSubmit={() => handleCreate(data)}>
			{/* Autocompletado por cliente existente y Pegado Inteligente IA */}
			<div
				style={{
					width: '100%',
					boxSizing: 'border-box',
					padding: 12,
					marginBottom: 14,
					borderRadius: 12,
					border: '1px solid #363636',
					backgroundColor: '#1d1d1d',
					display: 'flex',
					flexDirection: 'column',
					gap: 8,
				}}
			>
				<span style={{ fontSize: '0.8em', color: '#FCBD00', fontWeight: 700 }}>
					Carga Rápida (Cliente existente o IA)
				</span>
				<div style={{ display: 'flex', gap: 6 }}>
					<input
						type="text"
						placeholder="DNI, Teléfono o N° Cliente existente..."
						value={lookupText}
						onChange={(e) => setLookupText(e.target.value)}
						style={{
							flex: 1,
							padding: '8px 10px',
							borderRadius: 8,
							border: '1px solid #363636',
							backgroundColor: '#2e2e2e',
							color: '#fff',
							fontSize: '0.84em',
						}}
					/>
					<button
						type="button"
						onClick={handleLookupExistingClient}
						style={{
							border: 'none',
							borderRadius: 8,
							padding: '0 12px',
							backgroundColor: '#FCBD00',
							color: '#000',
							fontWeight: 700,
							fontSize: '0.8em',
							cursor: 'pointer',
						}}
					>
						Autocompletar
					</button>
				</div>

				<div style={{ display: 'flex', gap: 6 }}>
					<input
						type="text"
						placeholder="O pega un mensaje de WhatsApp del cliente para rellenar con IA..."
						value={aiText}
						onChange={(e) => setAiText(e.target.value)}
						style={{
							flex: 1,
							padding: '8px 10px',
							borderRadius: 8,
							border: '1px solid #363636',
							backgroundColor: '#2e2e2e',
							color: '#fff',
							fontSize: '0.84em',
						}}
					/>
					<button
						type="button"
						onClick={handleAiAutofill}
						disabled={aiParsing || !aiText.trim()}
						style={{
							border: '1px solid #FCBD00',
							borderRadius: 8,
							padding: '0 12px',
							backgroundColor: 'transparent',
							color: '#FCBD00',
							fontWeight: 700,
							fontSize: '0.8em',
							cursor: 'pointer',
						}}
					>
						{aiParsing ? 'Leyendo...' : 'IA'}
					</button>
				</div>
				{lookupMsg && (
					<span style={{ fontSize: '0.78em', color: '#a8e6cf' }}>{lookupMsg}</span>
				)}
			</div>

			{/* Selector de Tipo de Unidad */}
			<select
				value={data.unitType}
				onChange={(e) =>
					setData((prev) => ({ ...prev, unitType: e.target.value }))
				}
				style={{
					width: '100%',
					height: 40,
					padding: '0 10px',
					marginBottom: 15,
					borderRadius: 10,
					border: '2px solid rgb(37, 37, 37)',
					backgroundColor: 'rgb(46, 46, 46)',
					color: '#fff',
				}}
			>
				<option value="vehiculo">Vehículo (Auto / Camioneta / Utilitario)</option>
				<option value="autoelevador">Autoelevador / Maquinaria (Serie / Interno)</option>
			</select>

			{data.unitType === 'autoelevador' ? (
				<>
					<Input
						type={'text'}
						placeholder={'N° de Serie'}
						value={data.serialNumber}
						uppercase
						onChange={(value) =>
							setData((prev) => ({ ...prev, serialNumber: value }))
						}
					/>
					<Input
						type={'text'}
						placeholder={'N° de Interno (opcional)'}
						value={data.internalNumber}
						uppercase
						onChange={(value) =>
							setData((prev) => ({ ...prev, internalNumber: value }))
						}
					/>
				</>
			) : (
				<Input
					type={'text'}
					placeholder={'Chapa patente'}
					value={data.patente}
					uppercase
					noSpaces
					max={7}
					onChange={(value) => setData((prev) => ({ ...prev, patente: value }))}
				/>
			)}

			<Input
				type={'text'}
				placeholder={'N° de Cliente (opcional, ej. CL-0109)'}
				value={data.clientNumber}
				uppercase
				onChange={(value) =>
					setData((prev) => ({ ...prev, clientNumber: value }))
				}
			/>

			<MultipleSelector
				options={car_brands}
				value={data.brand}
				placeholder={'Marca (escribe para crear nueva)'}
				onChange={(value) => handleBrandSelection(value)}
				isCreatable={true}
			/>
			{data.brand ? (
				<MultipleSelector
					options={car_models}
					key={data.brand ? data.brand : 'no-brand'}
					placeholder={'Modelo (escribe para crear nuevo)'}
					value={data.model}
					onChange={(value) => handleModelSelection(value)}
					isCreatable={true}
				/>
			) : null}

			<Input
				type={'text'}
				value={data.owner_name}
				placeholder={'Nombre'}
				onChange={(value) =>
					setData((prev) => ({ ...prev, owner_name: normalizeString(value) }))
				}
			/>
			<Input
				type={'text'}
				value={data.owner_surname}
				placeholder={'Apellido / Razón social'}
				onChange={(value) =>
					setData((prev) => ({
						...prev,
						owner_surname: normalizeString(value),
					}))
				}
			/>
			<Input
				type={'text'}
				value={data.dni}
				placeholder={'DNI / CUIT'}
				max={13}
				onChange={(value) => setData((prev) => ({ ...prev, dni: value }))}
			/>
			<SimplifiedDateSelector
				value={data.birthdate}
				onChange={(fieldKey, value) =>
					setData((prev) => ({
						...prev,
						birthdate: { ...prev.birthdate, [fieldKey]: value },
					}))
				}
			/>
			<MultipleSelector
				options={OCCUPATION_OPTIONS}
				value={data.occupation}
				placeholder={'Ocupación / Perfil'}
				onChange={(opt) =>
					setData((prev) => ({
						...prev,
						occupation: normalizeString(opt.value),
					}))
				}
				isCreatable={true}
			/>
			<Input
				type={'text'}
				value={data.email}
				placeholder={'Correo electrónico'}
				onChange={(value) => setData((prev) => ({ ...prev, email: value }))}
			/>
			<MultipleSelector
				options={prov_arg}
				value={data.state}
				placeholder={'Provincia'}
				onChange={(prov) =>
					setData((prev) => ({ ...prev, state: normalizeString(prov.value) }))
				}
			/>
			<Input
				type={'text'}
				value={data.direction}
				placeholder={'Dirección'}
				onChange={(value) =>
					setData((prev) => ({ ...prev, direction: normalizeString(value) }))
				}
			/>
			<Input
				type={'text'}
				value={data.zip_code}
				max={5}
				placeholder={'Código postal'}
				onChange={(value) =>
					setData((prev) => ({ ...prev, zip_code: normalizeString(value) }))
				}
			/>
			<Input
				type={'number'}
				value={data.phone_number}
				placeholder={'Teléfono'}
				noSpaces
				onChange={(value) =>
					setData((prev) => ({ ...prev, phone_number: String(value) }))
				}
			/>

			<label
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					fontSize: '0.86em',
					marginBottom: 14,
					cursor: 'pointer',
				}}
			>
				<input
					type="checkbox"
					checked={data.marketingOptIn !== false}
					onChange={(e) =>
						setData((prev) => ({ ...prev, marketingOptIn: e.target.checked }))
					}
				/>
				Acepta recibir recordatorios de service y promociones
			</label>

			<Button title={'Crear cuenta'} type={'submit'} />
		</Form>
	);
};

export default CreateAccountPanel;