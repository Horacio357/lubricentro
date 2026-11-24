import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '@/services/firebase/firebaseConfig';
import {
	ROLES,
	ROLE_LABELS,
	PERMISSIONS,
	PERMISSION_LABELS,
	DEFAULT_ROLE_PERMISSIONS,
} from '@/utils/permissions';
import { isDevBypassEnabled } from '@/utils/devMockData';
import st from './StaffManagementPanel.module.css';

const DEMO_STAFF = [
	{
		uid: 'demo-super',
		name: 'Super',
		surname: 'Admin',
		email: 'horacitoxp@gmail.com',
		role: ROLES.SUPER_ADMIN,
		active: true,
	},
	{
		uid: 'demo-vendedor',
		name: 'Lucas',
		surname: 'Vendedor',
		email: 'ventas@rudyservices.com.ar',
		role: ROLES.VENDEDOR,
		active: true,
		customPermissions: DEFAULT_ROLE_PERMISSIONS[ROLES.VENDEDOR],
	},
	{
		uid: 'demo-mecanico',
		name: 'Carlos',
		surname: 'Mecánico',
		email: 'taller@rudyservices.com.ar',
		role: ROLES.MECANICO,
		active: true,
		customPermissions: DEFAULT_ROLE_PERMISSIONS[ROLES.MECANICO],
	},
];

const ASSIGNABLE_PERMISSIONS = [
	PERMISSIONS.SEARCH_VEHICLE,
	PERMISSIONS.CREATE_VEHICLE,
	PERMISSIONS.EDIT_VEHICLE,
	PERMISSIONS.DELETE_VEHICLE,
	PERMISSIONS.ADD_SERVICE,
	PERMISSIONS.EDIT_SERVICE,
	PERMISSIONS.DELETE_SERVICE,
	PERMISSIONS.VIEW_PRICES,
	PERMISSIONS.VIEW_CLIENT_PRIVATE,
	PERMISSIONS.FILL_CHECKLIST,
	PERMISSIONS.MANAGE_CATALOGS,
	PERMISSIONS.VIEW_DASHBOARD,
];

const StaffManagementPanel = () => {
	const [staff, setStaff] = useState([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [feedback, setFeedback] = useState(null);

	const [name, setName] = useState('');
	const [surname, setSurname] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState(ROLES.VENDEDOR);
	const [selectedPermissions, setSelectedPermissions] = useState(
		DEFAULT_ROLE_PERMISSIONS[ROLES.VENDEDOR]
	);
	const [editingMember, setEditingMember] = useState(null);

	const getAuthHeaders = async () => {
		const token = await auth.currentUser?.getIdToken();
		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		};
	};

	const fetchStaff = useCallback(async () => {
		try {
			setLoading(true);
			const headers = await getAuthHeaders();
			const res = await fetch('/api/admin/staff', { headers });
			const data = await res.json();
			if (!res.ok) {
				if (isDevBypassEnabled()) {
					setStaff(DEMO_STAFF);
					return;
				}
				throw new Error(data.message || 'Error cargando equipo');
			}
			setStaff(data.staff || []);
		} catch (err) {
			if (isDevBypassEnabled()) {
				setStaff(DEMO_STAFF);
			} else {
				setFeedback({ type: 'error', text: err.message });
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchStaff();
	}, [fetchStaff]);

	const handleRoleChange = (newRole) => {
		setRole(newRole);
		setSelectedPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || []);
	};

	const togglePermission = (perm) => {
		setSelectedPermissions((prev) =>
			prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
		);
	};

	const handleCreateStaff = async (e) => {
		e.preventDefault();
		setSubmitting(true);
		setFeedback(null);
		try {
			const headers = await getAuthHeaders();
			const res = await fetch('/api/admin/staff', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					name,
					surname,
					email,
					password,
					role,
					customPermissions: selectedPermissions,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'No se pudo crear el perfil');
			}
			setFeedback({
				type: 'success',
				text: `Perfil de ${ROLE_LABELS[role]} creado para ${name} ${surname}.`,
			});
			setName('');
			setSurname('');
			setEmail('');
			setPassword('');
			await fetchStaff();
		} catch (err) {
			setFeedback({ type: 'error', text: err.message });
		} finally {
			setSubmitting(false);
		}
	};

	const handleToggleActive = async (member) => {
		try {
			const headers = await getAuthHeaders();
			const res = await fetch('/api/admin/staff', {
				method: 'PATCH',
				headers,
				body: JSON.stringify({
					uid: member.uid,
					active: member.active === false,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'Error al actualizar estado');
			}
			await fetchStaff();
		} catch (err) {
			setFeedback({ type: 'error', text: err.message });
		}
	};

	const handleSaveMemberPermissions = async () => {
		if (!editingMember) return;
		try {
			setSubmitting(true);
			const headers = await getAuthHeaders();
			const res = await fetch('/api/admin/staff', {
				method: 'PATCH',
				headers,
				body: JSON.stringify({
					uid: editingMember.uid,
					role: editingMember.role,
					customPermissions: editingMember.customPermissions,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || 'Error al guardar permisos');
			}
			setFeedback({
				type: 'success',
				text: `Permisos actualizados para ${editingMember.name}.`,
			});
			setEditingMember(null);
			await fetchStaff();
		} catch (err) {
			setFeedback({ type: 'error', text: err.message });
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className={st.container}>
			<div className={st.grid}>
				<section className={st.card}>
					<h3 className={st.cardTitle}>Crear Perfil de Equipo</h3>
					<p className={st.cardSubtitle}>
						Crea cuentas de Vendedor o Mecánico y delega permisos específicos.
					</p>

					<form onSubmit={handleCreateStaff} className={st.form}>
						<div className={st.row}>
							<input
								className={st.input}
								type="text"
								placeholder="Nombre"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
							<input
								className={st.input}
								type="text"
								placeholder="Apellido"
								value={surname}
								onChange={(e) => setSurname(e.target.value)}
							/>
						</div>
						<input
							className={st.input}
							type="email"
							placeholder="Correo electrónico"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
						<input
							className={st.input}
							type="password"
							placeholder="Contraseña (mín. 6 caracteres)"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							minLength={6}
							required
						/>

						<label className={st.label}>Rol del perfil</label>
						<select
							className={st.select}
							value={role}
							onChange={(e) => handleRoleChange(e.target.value)}
						>
							<option value={ROLES.VENDEDOR}>{ROLE_LABELS[ROLES.VENDEDOR]}</option>
							<option value={ROLES.MECANICO}>{ROLE_LABELS[ROLES.MECANICO]}</option>
							<option value={ROLES.SUPER_ADMIN}>
								{ROLE_LABELS[ROLES.SUPER_ADMIN]}
							</option>
						</select>

						{role !== ROLES.SUPER_ADMIN && (
							<div className={st.permissionsBox}>
								<span className={st.label}>Permisos delegados</span>
								<div className={st.permissionsList}>
									{ASSIGNABLE_PERMISSIONS.map((perm) => (
										<label key={perm} className={st.checkboxLabel}>
											<input
												type="checkbox"
												checked={selectedPermissions.includes(perm)}
												onChange={() => togglePermission(perm)}
											/>
											<span>{PERMISSION_LABELS[perm]}</span>
										</label>
									))}
								</div>
							</div>
						)}

						<button
							type="submit"
							className={st.primaryButton}
							disabled={submitting}
						>
							{submitting ? 'Creando perfil...' : 'Crear Perfil'}
						</button>
					</form>

					{feedback && (
						<p
							className={
								feedback.type === 'error' ? st.errorMsg : st.successMsg
							}
						>
							{feedback.text}
						</p>
					)}
				</section>

				<section className={st.card}>
					<h3 className={st.cardTitle}>Perfiles Activos</h3>
					<p className={st.cardSubtitle}>
						Administra accesos, roles y permisos delegados.
					</p>

					{loading ? (
						<p className={st.muted}>Cargando perfiles...</p>
					) : staff.length === 0 ? (
						<p className={st.muted}>No hay perfiles registrados aún.</p>
					) : (
						<div className={st.staffList}>
							{staff.map((member) => {
								const isInactive = member.active === false;
								return (
									<div key={member.uid} className={st.staffItem}>
										<div className={st.staffInfo}>
											<div className={st.staffHeader}>
												<strong>
													{member.name} {member.surname}
												</strong>
												<span className={st.roleBadge}>
													{ROLE_LABELS[member.role] || member.role}
												</span>
												{isInactive && (
													<span className={st.inactiveBadge}>Suspendido</span>
												)}
											</div>
											<span className={st.staffEmail}>{member.email}</span>
										</div>
										<div className={st.staffActions}>
											{member.role !== ROLES.SUPER_ADMIN && (
												<button
													type="button"
													className={st.secondaryBtn}
													onClick={() =>
														setEditingMember({
															...member,
															customPermissions:
																member.customPermissions ||
																DEFAULT_ROLE_PERMISSIONS[member.role] ||
																[],
														})
													}
												>
													Permisos
												</button>
											)}
											<button
												type="button"
												className={
													isInactive ? st.secondaryBtn : st.dangerBtn
												}
												onClick={() => handleToggleActive(member)}
											>
												{isInactive ? 'Reactivar' : 'Suspender'}
											</button>
										</div>
									</div>
								);
							})}
						</div>
					)}

					{editingMember && (
						<div className={st.editModal}>
							<h4 className={st.editTitle}>
								Permisos de {editingMember.name} {editingMember.surname}
							</h4>
							<div className={st.permissionsList}>
								{ASSIGNABLE_PERMISSIONS.map((perm) => (
									<label key={perm} className={st.checkboxLabel}>
										<input
											type="checkbox"
											checked={editingMember.customPermissions.includes(perm)}
											onChange={() => {
												setEditingMember((prev) => ({
													...prev,
													customPermissions: prev.customPermissions.includes(
														perm
													)
														? prev.customPermissions.filter((p) => p !== perm)
														: [...prev.customPermissions, perm],
												}));
											}}
										/>
										<span>{PERMISSION_LABELS[perm]}</span>
									</label>
								))}
							</div>
							<div className={st.row}>
								<button
									type="button"
									className={st.primaryButton}
									onClick={handleSaveMemberPermissions}
									disabled={submitting}
								>
									Guardar Permisos
								</button>
								<button
									type="button"
									className={st.secondaryBtn}
									onClick={() => setEditingMember(null)}
								>
									Cancelar
								</button>
							</div>
						</div>
					)}
				</section>
			</div>
		</div>
	);
};

export default StaffManagementPanel;
