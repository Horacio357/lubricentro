import React, { useState } from 'react';
import Input from '@/components/Input/Input';
import Button from '@/components/Button/Button';
import Form from '@/components/Form/Form';
import { isDevBypassEnabled, DEV_MOCK_VEHICLES } from '@/utils/devMockData';

const SearchAccountPanel = ({ onSearch, results = [] }) => {
	const [queryText, setQueryText] = useState('');
	const isDemo = isDevBypassEnabled();

	return (
		<div style={{ width: '100%' }}>
			<Form onSubmit={() => onSearch({ chapa: queryText })}>
				<Input
					type={'text'}
					placeholder={'Patente, apellido, marca o modelo'}
					uppercase
					value={queryText}
					onChange={(value) => setQueryText(value)}
				/>
				<Button title={'Buscar vehículo'} type={'submit'} />
			</Form>

			{isDemo && (
				<div
					style={{
						marginTop: 12,
						display: 'flex',
						flexWrap: 'wrap',
						gap: 6,
						justifyContent: 'center',
					}}
				>
					{DEV_MOCK_VEHICLES.map((v) => (
						<button
							key={v.id}
							type="button"
							onClick={() => {
								setQueryText(v.patente);
								onSearch({ chapa: v.patente });
							}}
							style={{
								border: '1px solid #363636',
								backgroundColor: '#1d1d1d',
								color: '#FCBD00',
								borderRadius: 999,
								padding: '4px 10px',
								fontSize: '0.75em',
								cursor: 'pointer',
							}}
						>
							{v.patente} · {v.brand}
						</button>
					))}
				</div>
			)}

			{results.length > 1 && (
				<div
					style={{
						marginTop: 16,
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
					}}
				>
					{results.map((item) => (
						<a
							key={item.id}
							href={`/${item.id}`}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								padding: '10px 12px',
								borderRadius: 10,
								border: '1px solid #363636',
								backgroundColor: '#1d1d1d',
								color: '#fff',
								textDecoration: 'none',
								fontSize: '0.88em',
							}}
						>
							<span>
								<strong>{item.patente}</strong> · {item.brand} {item.model}
							</span>
							<span style={{ color: '#FCBD00' }}>Ver Ficha →</span>
						</a>
					))}
				</div>
			)}
		</div>
	);
};

export default SearchAccountPanel;