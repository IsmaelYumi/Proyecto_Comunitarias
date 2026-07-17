import express, { Application, Request, Response } from 'express';
import path from 'path';
import inputRoutes from './routes/Input.routes';

const app: Application = express();

// Middlewares (puedes agregar más aquí)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del dashboard
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas de la API
app.use('/api', inputRoutes);

export default app;