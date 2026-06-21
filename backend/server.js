import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { runSeeders } from './src/seeders/index.js';

// Load environment variables
dotenv.config();

// Connect to Database
await connectDB();

// Run seeders to verify/initialize default mock records
try {
  await runSeeders();
} catch (error) {
  console.error(`⚠️ Database seeding failed: ${error.message}`);
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
