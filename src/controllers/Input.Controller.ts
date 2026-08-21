import { Request, Response } from 'express';
import { InputService, RegistroInput } from '../service/Input.service';

const inputService = new InputService();

export const registrarDatos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { altura, presion, caudal, temperatura, estadoExtractor } = req.body;

    // Validación de campos requeridos
    if (
      altura === undefined ||
      presion === undefined ||
      caudal === undefined ||
      temperatura === undefined ||
      estadoExtractor === undefined
    ) {
      res.status(400).json({
        ok: false,
        message: 'Los campos "altura", "presion", "caudal", "temperatura" y "estadoExtractor" son requeridos en el cuerpo de la petición.'
      });
      return;
    }

    // Validación de tipo de datos
    const parsedAltura = Number(altura);
    const parsedPresion = Number(presion);
    const parsedCaudal = Number(caudal);
    const parsedTemperatura = Number(temperatura);
    const parsedEstadoExtractor = Number(estadoExtractor);

    if (
      isNaN(parsedAltura) ||
      isNaN(parsedPresion) ||
      isNaN(parsedCaudal) ||
      isNaN(parsedTemperatura) ||
      isNaN(parsedEstadoExtractor)
    ) {
      res.status(400).json({
        ok: false,
        message: 'Los campos "altura", "presion", "caudal", "temperatura" y "estadoExtractor" deben ser números válidos.'
      });
      return;
    }

    const data: RegistroInput = {
      altura: parsedAltura,
      presion: parsedPresion,
      caudal: parsedCaudal,
      temperatura: parsedTemperatura,
      estadoExtractor: parsedEstadoExtractor
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

