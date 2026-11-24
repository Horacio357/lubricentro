import { db } from "@/services/firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';

const VEHICLES_COLLECTION = 'vehicles';
const VEHICLES_PRIVATE_COLLECTION = 'vehicles_private';

export async function getUserByPatente(patente) {
  try {
    const q = query(
      collection(db, VEHICLES_COLLECTION),
      where('patente', '==', patente)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const docSnap = snapshot.docs[0];
    const publicData = { id: docSnap.id, ...docSnap.data() };

    // Intentar obtener datos privados (puede fallar si no tiene permiso)
    let privateData = {};
    try {
      const privateDocRef = doc(db, VEHICLES_PRIVATE_COLLECTION, docSnap.id);
      const privateDocSnap = await getDoc(privateDocRef);
      if (privateDocSnap.exists()) {
        privateData = privateDocSnap.data();
      }
    } catch (error) {
      console.warn("No se pudieron obtener los datos privados (quizás sin permisos):", error.message);
    }

    return { ...publicData, ...privateData };
  } catch (error) {
    console.error('Error buscando usuario por patente:', error);
    throw new Error('Error buscando usuario por patente');
  }
}

export async function searchVehiclesFlexible(queryText) {
  const clean = String(queryText || '').trim();
  if (!clean) return [];

  const upperNoSpaces = clean.toUpperCase().replace(/\s+/g, '');
  const exact = await getUserByPatente(upperNoSpaces);
  if (exact) return [exact];

  const upper = clean.toUpperCase();
  const snapshot = await getDocs(collection(db, VEHICLES_COLLECTION));
  const matches = [];

  for (const docSnap of snapshot.docs) {
    const v = docSnap.data();
    const vehicleText = `${v.patente || ''} ${v.brand || ''} ${v.model || ''}`.toUpperCase();
    let privateData = {};
    try {
      const privSnap = await getDoc(doc(db, VEHICLES_PRIVATE_COLLECTION, docSnap.id));
      if (privSnap.exists()) privateData = privSnap.data();
    } catch (_) {
      // Sin permiso para datos privados
    }
    const ownerText = `${privateData.owner_name || ''} ${privateData.owner_surname || ''}`.toUpperCase();
    if (vehicleText.includes(upper) || ownerText.includes(upper)) {
      matches.push({ id: docSnap.id, ...v, ...privateData });
    }
    if (matches.length >= 10) break;
  }

  return matches;
}

export async function createUser(data) {
  try {
    const cleanPatente = String(
      data.patente || data.internalNumber || data.serialNumber || ''
    )
      .toUpperCase()
      .replace(/\s+/g, '');

    const publicData = {
      unitType: data.unitType || 'vehiculo',
      patente: cleanPatente,
      serialNumber: data.serialNumber || '',
      internalNumber: data.internalNumber || '',
      clientNumber: data.clientNumber || '',
      marketingOptIn: data.marketingOptIn !== false,
      brand: data.brand,
      model: data.model,
    };

    const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), publicData);

    const privateData = {
      alta: data.alta,
      owner_name: data.owner_name,
      owner_surname: data.owner_surname,
      patente: cleanPatente,
      clientNumber: data.clientNumber || '',
      marketingOptIn: data.marketingOptIn !== false,
      birthdate: data.birthdate,
      dni: data.dni,
      email: data.email,
      zip_code: data.zip_code,
      direction: data.direction,
      country: data.country,
      state: data.state,
      occupation: data.occupation,
      phone_number: data.phone_number,
    };
    await setDoc(doc(db, VEHICLES_PRIVATE_COLLECTION, docRef.id), privateData);

    return { id: docRef.id };
  } catch (error) {
    console.error('Error creando usuario:', error);
    throw new Error('Error creando usuario');
  }
}

export async function updateVehicle(vehicleId, publicData, privateData, updatedBy = null) {
  try {
    const auditFields = {
      updatedAt: new Date(),
      ...(updatedBy ? { updatedBy } : {}),
    };

    if (publicData && Object.keys(publicData).length > 0) {
      await updateDoc(doc(db, VEHICLES_COLLECTION, vehicleId), {
        ...publicData,
        ...auditFields,
      });
    }

    if (privateData && Object.keys(privateData).length > 0) {
      await setDoc(
        doc(db, VEHICLES_PRIVATE_COLLECTION, vehicleId),
        {
          ...privateData,
          ...auditFields,
        },
        { merge: true }
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error actualizando vehículo:', error);
    throw new Error(`Error actualizando vehículo: ${error.message}`);
  }
}

async function deleteSubcollectionDocs(batch, subcollectionPath) {
  const snap = await getDocs(collection(db, subcollectionPath));
  snap.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
}

export async function deleteUser(user) {
  try {
    const batch = writeBatch(db);

    await deleteSubcollectionDocs(batch, `${VEHICLES_COLLECTION}/${user.id}/services`);
    await deleteSubcollectionDocs(batch, `${VEHICLES_COLLECTION}/${user.id}/checklists`);
    batch.delete(doc(db, VEHICLES_COLLECTION, user.id));

    try {
      await deleteSubcollectionDocs(batch, `${VEHICLES_PRIVATE_COLLECTION}/${user.id}/services`);
      batch.delete(doc(db, VEHICLES_PRIVATE_COLLECTION, user.id));
    } catch (error) {
      console.warn("Error al preparar eliminación de datos privados:", error.message);
    }

    await batch.commit();
    return { success: true, message: 'Usuario eliminado correctamente' };
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    throw new Error(`Error eliminando usuario: ${error.message}`);
  }
}