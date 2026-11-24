import fs from 'fs';
import path from 'path';

// Leer rutas relativas al proyecto
const brandsPath = path.join(process.cwd(), 'public', 'brands.json');
const modelsPath = path.join(process.cwd(), 'public', 'models.json');

const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf-8'));
const models = JSON.parse(fs.readFileSync(modelsPath, 'utf-8'));

// Convertir nombres a mayúsculas
const upperBrands = brands.map(brand => ({
  ...brand,
  brand_name: brand.brand_name.toUpperCase()
}));

const upperModels = models.map(model => ({
  ...model,
  model_name: String(model.model_name).toUpperCase()
}));

// Guardar los nuevos archivos
const outputBrands = path.join(process.cwd(), 'public', 'brands_upper.json');
const outputModels = path.join(process.cwd(), 'public', 'models_upper.json');

fs.writeFileSync(outputBrands, JSON.stringify(upperBrands, null, 2));
fs.writeFileSync(outputModels, JSON.stringify(upperModels, null, 2));

console.log('✅ Archivos "brands_upper.json" y "models_upper.json" creados en /public.');
