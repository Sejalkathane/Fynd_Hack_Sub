require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/db/connect');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();