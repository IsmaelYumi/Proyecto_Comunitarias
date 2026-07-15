import { Request, Response } from 'express';
import { InputService, RegistroInput } from '../service/Input.service';

const inputService = new InputService();

export const registrarDatos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nivel, presion } = req.body;
    // Validación de campos requeridos
    if (nivel === undefined || presion === undefined) {
      res.status(400).json({
        ok: false,
        message: 'Los campos "nivel" y "presion" son requeridos en el cuerpo de la petición.'
      });
      return;
    }

    // Validación de tipo de datos
    const parsedNivel = Number(nivel);
    const parsedPresion = Number(presion);

    if (isNaN(parsedNivel) || isNaN(parsedPresion)) {
      res.status(400).json({
        ok: false,
        message: 'Los campos "nivel" y "presion" deben ser números válidos.'
      });
      return;
    }

    const data: RegistroInput = {
      nivel: parsedNivel,
      presion: parsedPresion
    };

    const nuevoRegistro = await inputService.guardarRegistro(data);

    res.status(201).json({
      ok: true,
      message: 'Registro guardado correctamente en la colección "Registros".',
      data: nuevoRegistro
    });
  } catch (error: any) {
    console.error('Error en registrarDatos:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al intentar guardar el registro.',
      error: error.message || error
    });
  }
};

export const obtenerRegistros = async (req: Request, res: Response): Promise<void> => {
  try {
    const registros = await inputService.getRegistros();

    res.status(200).json({
      ok: true,
      total: registros.length,
      data: registros
    });
  } catch (error: any) {
    console.error('Error en obtenerRegistros:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los registros.',
      error: error.message || error
    });
  }
}
export const RegistrarNivel = async (req: Request, res: Response): Promise<void> => {
  try {
    const {nivel} = req.body;

    if (nivel === undefined ) {
      res.status(400).json({
        ok: false,
        message: 'El campo "nivel" es requerido en el cuerpo de la petición.'
      });
      return;
    }

    // Validación de tipo de datos
    const parsedNivel = Number(nivel);
    if (isNaN(parsedNivel)) {
      res.status(400).json({
        ok: false,
        message: 'El campo "nivel" debe ser un número válido.'
      });
      return;
    }
    const nuevoRegistro = await inputService.guardarNivel(parsedNivel);
    res.status(200).json({
      ok: true,
      message: 'Registro guardado correctamente en la colección "Nivel".',
      data: nuevoRegistro
    });
  } catch (error: any) {
    console.error('Error en regsitrar el nivel:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al registrar el nivel.',
      error: error.message || error
    });
  }
};

export const RegistrarPresion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { presion } = req.body;

    if (presion === undefined) {
      res.status(400).json({
        ok: false,
        message: 'El campo "presion" es requerido en el cuerpo de la petición.'
      });
      return;
    }

    // Validación de tipo de datos
    const parsedPresion = Number(presion);
    if (isNaN(parsedPresion)) {
      res.status(400).json({
        ok: false,
        message: 'El campo "presion" debe ser un número válido.'
      });
      return;
    }

    const nuevoRegistro = await inputService.guardarPresion(parsedPresion);
    res.status(200).json({
      ok: true,
      message: 'Registro guardado correctamente en la colección "Presion".',
      data: nuevoRegistro
    });
  } catch (error: any) {
    console.error('Error en registrar la presion:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al registrar la presion.',
      error: error.message || error
    });
  }
};

