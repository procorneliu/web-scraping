import './utils/dotenv.ts';
import app from './app.ts';

const port = process.env.PORT || 3000;

// Starting server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// ERORR HANDLERS
// Unhandled Rejection
process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION!');
  console.log(err.name, err.message);
  // Exit process immediately after server is closed
  server.close(() => process.exit(1));
});

// SIGTERM
process.on('SIGTERM', (err: Error) => {
  console.log('SIGTERM RECEIVED!');
  server.close(() => {
    console.log('Process terminated!');
  });
});
