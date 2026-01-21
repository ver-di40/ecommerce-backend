const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Options de connexion avec timeout augmenté
    const options = {
      serverSelectionTimeoutMS: 60000, // 60 secondes au lieu de 30
      socketTimeoutMS: 75000, // 75 secondes
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    
    console.log('✓ MongoDB connecté avec succès');
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:');
    console.error('   Type:', error.name);
    console.error('   Message:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;