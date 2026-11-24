import { db } from '@/services/firebase/firebaseConfig';
import { doc, getDoc, setDoc,addDoc, collection } from 'firebase/firestore';

// Trae todas las marcas desde form_data/brands
export const getBrandsDb = async () => {
  const docRef = doc(db, 'form_data', 'brands');
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const brands = snapshot.data().brands || [];

    return brands.sort((a, b) => a.brand_name.localeCompare(b.brand_name));
  }

  return [];
};

// Trae los modelos para una marca desde form_data/models/lists/{brandId}
export const getModelsDb = async (brandId) => {
  const docRef = doc(db, 'form_data', 'models', 'lists', String(brandId));
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const models = snapshot.data().models || [];

    return models.sort((a, b) => a.localeCompare(b));
  }

  return [];
};

export const updateModelsDb = async (brandId, modelName) => {
	console.log('updating model');
	// Leer modelos actuales de Firestore
	const modelDocRef = doc(db, "form_data", "models", "lists", String(brandId));
	const modelSnap = await getDoc(modelDocRef);
	const existingModels = modelSnap.exists() ? modelSnap.data().models || [] : [];

	// Si el modelo no existe, lo agregamos
	if (!existingModels.includes(modelName)) {
	const updatedModels = [...existingModels, modelName];
	await setDoc(modelDocRef, { models: updatedModels });
	}
}

export const addBrandAndModelDb = async (brandName, modelName) => {
	console.log('adding brand and model');
	// 1. Crear nuevo documento de modelos
	const modelsCollectionRef = collection(db, "form_data", "models", "lists");
	const newModelDoc = await addDoc(modelsCollectionRef, {
		models: [modelName]
	});

	const newId = newModelDoc.id;

	// 2. Leer las marcas actuales desde Firestore
	const brandsDocRef = doc(db, "form_data", "brands");
	const brandsSnap = await getDoc(brandsDocRef);
	const existingBrands = brandsSnap.exists() ? brandsSnap.data().brands || [] : [];

	// 3. Agregar nueva marca al array
	const updatedBrands = [...existingBrands, {
		id: newId,
		brand_name: brandName
	}];

	// 4. Subir el array actualizado
	await setDoc(brandsDocRef, {
		brands: updatedBrands
	});
};