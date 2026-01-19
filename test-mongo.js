// TEST DE CONNEXION MONGODB
// Lance ce fichier avec : node test-mongo.js

const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Test de connexion MongoDB...\n');
console.log('📍 URI utilisée :', process.env.MONGO_URI);
console.log('\n⏳ Tentative de connexion...\n');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ SUCCÈS ! MongoDB est connecté !\n');
    console.log('📊 Informations de connexion :');
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Port:', mongoose.connection.port);
    console.log('   - Nom de la DB:', mongoose.connection.name);
    console.log('\n✅ Tout fonctionne ! Tu peux fermer ce test.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ ERREUR de connexion !\n');
    console.error('Type d\'erreur :', error.name);
    console.error('Message :', error.message);
    console.error('\n🔧 Solutions possibles :');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   → MongoDB n\'est pas démarré. Lance "mongod" dans un terminal.');
    } else if (error.message.includes('Authentication failed')) {
      console.error('   → Le mot de passe dans MONGO_URI est incorrect.');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('   → Vérifie Network Access sur MongoDB Atlas.');
    } else {
      console.error('   → Vérifie que ton fichier .env est correct.');
    }
    
    console.error('\n');
    process.exit(1);
  });
