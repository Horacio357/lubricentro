export const ROLES = {
	SUPER_ADMIN: 'super_admin',
	VENDEDOR: 'vendedor',
	MECANICO: 'mecanico',
};

export const ROLE_LABELS = {
	[ROLES.SUPER_ADMIN]: 'Super Administrador',
	[ROLES.VENDEDOR]: 'Vendedor',
	[ROLES.MECANICO]: 'Mecánico',
};

export const PERMISSIONS = {
	VIEW_DASHBOARD: 'view_dashboard',
	MANAGE_STAFF: 'manage_staff',
	SEARCH_VEHICLE: 'search_vehicle',
	CREATE_VEHICLE: 'create_vehicle',
	EDIT_VEHICLE: 'edit_vehicle',
	DELETE_VEHICLE: 'delete_vehicle',
	ADD_SERVICE: 'add_service',
	EDIT_SERVICE: 'edit_service',
	DELETE_SERVICE: 'delete_service',
	VIEW_PRICES: 'view_prices',
	VIEW_CLIENT_PRIVATE: 'view_client_private',
	FILL_CHECKLIST: 'fill_checklist',
	MANAGE_CATALOGS: 'manage_catalogs',
};

export const PERMISSION_LABELS = {
	[PERMISSIONS.VIEW_DASHBOARD]: 'Ver métricas y gráficos',
	[PERMISSIONS.MANAGE_STAFF]: 'Gestionar perfiles y permisos',
	[PERMISSIONS.MANAGE_CATALOGS]: 'Administrar catálogos de aceites y repuestos',
	[PERMISSIONS.SEARCH_VEHICLE]: 'Buscar vehículos por patente',
	[PERMISSIONS.CREATE_VEHICLE]: 'Registrar nuevos vehículos/clientes',
	[PERMISSIONS.EDIT_VEHICLE]: 'Reeditar datos de vehículo y cliente',
	[PERMISSIONS.DELETE_VEHICLE]: 'Eliminar vehículos permanentemente',
	[PERMISSIONS.ADD_SERVICE]: 'Cargar nuevos services',
	[PERMISSIONS.EDIT_SERVICE]: 'Reeditar services e importes',
	[PERMISSIONS.DELETE_SERVICE]: 'Eliminar services',
	[PERMISSIONS.VIEW_PRICES]: 'Ver importes y facturación',
	[PERMISSIONS.VIEW_CLIENT_PRIVATE]: 'Ver datos privados del cliente',
	[PERMISSIONS.FILL_CHECKLIST]: 'Completar checklists técnicos',
};

export const DEFAULT_ROLE_PERMISSIONS = {
	[ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
	[ROLES.VENDEDOR]: [
		PERMISSIONS.SEARCH_VEHICLE,
		PERMISSIONS.CREATE_VEHICLE,
		PERMISSIONS.ADD_SERVICE,
		PERMISSIONS.VIEW_PRICES,
		PERMISSIONS.VIEW_CLIENT_PRIVATE,
	],
	[ROLES.MECANICO]: [
		PERMISSIONS.SEARCH_VEHICLE,
		PERMISSIONS.ADD_SERVICE,
		PERMISSIONS.FILL_CHECKLIST,
	],
};

/**
 * Resolves the effective permissions for a staff profile.
 * Super Admin always has all permissions.
 * Other roles use customPermissions if explicitly set, or DEFAULT_ROLE_PERMISSIONS[role].
 */
export function getEffectivePermissions(profile) {
	if (!profile || profile.active === false) return [];
	if (profile.role === ROLES.SUPER_ADMIN) {
		return Object.values(PERMISSIONS);
	}
	if (Array.isArray(profile.customPermissions)) {
		return profile.customPermissions;
	}
	return DEFAULT_ROLE_PERMISSIONS[profile.role] || [];
}

export function hasPermission(profile, permission) {
	if (!profile || profile.active === false) return false;
	if (profile.role === ROLES.SUPER_ADMIN) return true;
	const perms = getEffectivePermissions(profile);
	return perms.includes(permission);
}

export function isSuperAdmin(profile) {
	return Boolean(profile && profile.active !== false && profile.role === ROLES.SUPER_ADMIN);
}
