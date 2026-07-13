import 'dotenv/config';
import './config/firebasebase.config'; // Inicializa Firebase
import app from './app';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(` Servidor corriendo en el puerto ${PORT}`);
});

export default server;