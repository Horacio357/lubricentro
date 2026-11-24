import { db } from "@/services/firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

/**
 * Carga models_upper.json desde /public y sube un documento por brand_id en form_data/models/{brand_id}
 */
export async function uploadModels() {
  try {
    // 1. Obtener los modelos
    const res = await fetch('/models_upper.json');
    const models = await res.json();

    // 2. Agrupar modelos por brand_id
    const modelsByBrand = {};

    for (const model of models) {
      const brandId = String(model.brand_id);
      const name = String(model.model_name).toUpperCase();

      if (!modelsByBrand[brandId]) {
        modelsByBrand[brandId] = new Set();
      }

      modelsByBrand[brandId].add(name); // Set para evitar duplicados
    }

    // 3. Subir un documento por brand_id a Firestore
    const entries = Object.entries(modelsByBrand);

    for (const [brandId, modelsSet] of entries) {
      const modelsArray = Array.from(modelsSet).sort();

      await setDoc(doc(db, 'form_data', 'models', 'lists', brandId), {
        models: modelsArray
      });

      console.log(`✅ Subidos modelos para brand_id ${brandId}`);
    }

    console.log('🎉 Todos los modelos fueron subidos correctamente.');
  } catch (error) {
    console.error("❌ Error al subir los modelos:", error);
    throw error;
  }
}
