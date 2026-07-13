import { Router } from 'express';
import { registrarDatos, obtenerRegistros } from '../controller/Input.Controller';

const router = Router();

// POST - Registrar nivel y presion
router.post('/registro', registrarDatos);

// GET - Obtener todos los registros
router.get('/registros', obtenerRegistros);

export default router;
