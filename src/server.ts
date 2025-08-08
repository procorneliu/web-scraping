import './utils/dotenv.ts';
import app from './app.ts';

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION!');
  console.log(err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', (err: Error) => {
  console.log('SIGTERM RECEIVED!');
  server.close(() => {
    console.log('Process terminated!');
  });
});
