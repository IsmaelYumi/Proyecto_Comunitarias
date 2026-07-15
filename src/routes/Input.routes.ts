import { Router } from 'express';
import { registrarDatos, obtenerRegistros, RegistrarNivel, RegistrarPresion } from '../controllers/Input.Controller';

const router = Router();

// POST - Registrar nivel y presion
router.post('/registro', registrarDatos);

// GET - Obtener todos los registros
router.get('/registros', obtenerRegistros);

// POST - Registrar solo el nivel
router.post('/nivel', RegistrarNivel);

// POST - Registrar solo la presion
router.post('/presion', RegistrarPresion);

export default router;
