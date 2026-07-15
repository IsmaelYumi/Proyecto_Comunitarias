import { db } from '../config/firebasebase.config';

export interface RegistroInput {
  nivel: number;
  presion: number;

}
export class InputService {

async guardarRegistro (data: RegistroInput){
    try {
const nuevoRegistro = {
    nivel: data.nivel,
    presion: data.presion,
    createdAt: new Date()
  };

  const docRef = await db.collection('Registros').add(nuevoRegistro);

  return {
    id: docRef.id,
    ...nuevoRegistro
  };
     }catch(error:any){
        throw new Error("Error al guardar el registro:");
    }
}
async guardarNivel(nivel:number){
    try {
      const docRef = await db.collection('Nivel').add({
        nivel,
        createdAt: new Date()
      });
      return {
        id: docRef.id,
        nivel,
        createdAt: new Date()
      };
    } catch (error: any) {
      throw new Error('Error al guardar el nivel: ' + error.message);
    }
}
async guardarPresion(presion:number){
    try {
      const docRef = await db.collection('Presion').add({
        presion,
        createdAt: new Date()
      });
      return {
        id: docRef.id,
        presion,
        createdAt: new Date()
      };
    } catch (error: any) {
      throw new Error('Error al guardar la presion: ' + error.message);
    }
}
async getRegistros() {
    try {
      const snapshot = await db.collection('Registros').orderBy('createdAt', 'desc').get();
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.createdAt;

        // Convierte el Timestamp de Firestore a un string legible
        const fechaHora = timestamp?.toDate
          ? timestamp.toDate().toLocaleString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
          : String(timestamp);

        return {
          id: doc.id,
          nivel: data.nivel,
          presion: data.presion,
          fechaHora
        };
      });
    } catch (error: any) {
      throw new Error('Error al obtener los registros: ' + error.message);
    }
  }
}


