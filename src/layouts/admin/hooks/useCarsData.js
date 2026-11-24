import { useState, useEffect, useCallback } from 'react';
import {
	getBrandsDb,
	getModelsDb,
	updateModelsDb,
	addBrandAndModelDb,
} from '../utils/firestoreFormDataHandlers';
import { FORKLIFT_AND_MACHINERY_BRANDS } from '@/utils/firebase/catalogHandlers';
import localBrands from '@/utils/options/brands.json';
import localModels from '@/utils/options/models.json';

const CUSTOM_BRANDS_KEY = 'rudy_custom_brands_v1';

function getStoredCustomBrands() {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(CUSTOM_BRANDS_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveStoredCustomBrands(list) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(list));
	} catch {
		// ignorar errores de almacenamiento
	}
}

function mergeBrandLists(baseBrands, extraGroups) {
	const map = new Map();
	baseBrands.forEach((b) => {
		const name = String(b.brand_name || '').toUpperCase().trim();
		if (name) map.set(name, { ...b, brand_name: name });
	});
	extraGroups.forEach((g) => {
		const name = String(g.brand_name || '').toUpperCase().trim();
		if (!name) return;
		if (!map.has(name)) {
			map.set(name, {
				id: `custom-${name}`,
				brand_name: name,
				customModels: g.models || [],
			});
		} else {
			const prev = map.get(name);
			const combined = Array.from(
				new Set([...(prev.customModels || []), ...(g.models || [])])
			);
			map.set(name, { ...prev, customModels: combined });
		}
	});
	return Array.from(map.values()).sort((a, b) =>
		a.brand_name.localeCompare(b.brand_name)
	);
}

const useCarsData = () => {
	const [car_brands, setCar_brands] = useState([]);
	const [car_models, setCar_models] = useState([]);

	const getBrands = useCallback(async () => {
		const custom = getStoredCustomBrands();
		const extra = [...FORKLIFT_AND_MACHINERY_BRANDS, ...custom];
		try {
			const brands = await getBrandsDb();
			const base =
				Array.isArray(brands) && brands.length > 0 ? brands : localBrands;
			setCar_brands(formatBrands(mergeBrandLists(base, extra)));
		} catch {
			setCar_brands(formatBrands(mergeBrandLists(localBrands, extra)));
		}
	}, []);

	useEffect(() => {
		getBrands();
	}, [getBrands]);

	const getCars = async (brandIdOrObj) => {
		const brandId =
			typeof brandIdOrObj === 'object' ? brandIdOrObj.id : brandIdOrObj;
		const matchedBrand = car_brands.find(
			(b) => String(b.id) === String(brandId)
		);
		const extraModels = matchedBrand?.customModels || [];

		try {
			if (String(brandId).startsWith('custom-')) {
				setCar_models(formatModels(extraModels, brandId));
				return;
			}
			const models = await getModelsDb(brandId);
			const merged = Array.from(new Set([...(models || []), ...extraModels]));
			setCar_models(formatModels(merged, brandId));
		} catch {
			const filtered = localModels
				.filter((m) => String(m.brand_id) === String(brandId))
				.map((m) => m.model_name);
			const merged = Array.from(new Set([...filtered, ...extraModels]));
			setCar_models(formatModels(merged, brandId));
		}
	};

	const saveCar = async (brandName, modelName) => {
		const cleanBrand = String(brandName || '').toUpperCase().trim();
		const cleanModel = String(modelName || '').toUpperCase().trim();
		if (!cleanBrand) return;

		// Persistir también localmente para uso inmediato en cualquier unidad
		const currentCustom = getStoredCustomBrands();
		const existingIdx = currentCustom.findIndex(
			(c) => c.brand_name === cleanBrand
		);
		if (existingIdx >= 0) {
			const models = Array.from(
				new Set([
					...(currentCustom[existingIdx].models || []),
					...(cleanModel ? [cleanModel] : []),
				])
			);
			currentCustom[existingIdx] = { ...currentCustom[existingIdx], models };
		} else {
			currentCustom.push({
				brand_name: cleanBrand,
				models: cleanModel ? [cleanModel] : [],
			});
		}
		saveStoredCustomBrands(currentCustom);

		try {
			const existingBrand = car_brands.find(
				(b) => b.brand_name === cleanBrand && !String(b.id).startsWith('custom-')
			);
			if (existingBrand && cleanModel) {
				await updateModelsDb(existingBrand.id, cleanModel);
			} else if (cleanModel) {
				await addBrandAndModelDb(cleanBrand, cleanModel);
			}
		} catch {
			// Fallback local ya guardado
		}
		await getBrands();
	};

	return { car_brands, car_models, getCars, saveCar, refreshBrands: getBrands };
};

export default useCarsData;

const formatBrands = (brands) => {
	return brands.map((brand) => ({ ...brand, label: brand.brand_name }));
};

const formatModels = (models, brand_id) => {
	return models.map((model) => ({ model_name: model, brand_id, label: model }));
};