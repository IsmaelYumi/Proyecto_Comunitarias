import express, { Application, Request, Response } from 'express';
import inputRoutes from './routes/Input.routes';

const app: Application = express();

// Middlewares (puedes agregar más aquí)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api', inputRoutes);

export default app;