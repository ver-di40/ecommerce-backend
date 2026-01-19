// DIAGNOSTIC COMPLET MONGODB ATLAS
// Lance avec : node diagnostic-atlas.js

const mongoose = require('mongoose');
require('dotenv').config();

console.log('═══════════════════════════════════════════════');
console.log('🔍 DIAGNOSTIC MONGODB ATLAS');
console.log('═══════════════════════════════════════════════\n');

// Étape 1 : Vérifier que le .env est chargé
console.log('📋 ÉTAPE 1 : Vérification du fichier .env\n');

if (!process.env.MONGO_URI) {
  console.error('❌ PROBLÈME : MONGO_URI n\'est pas défini dans le .env');
  console.error('   → Vérifie que le fichier .env existe dans le dossier backend/');
  process.exit(1);
}

console.log('✅ Fichier .env chargé');
console.log('📍 MONGO_URI détecté :', process.env.MONGO_URI.substring(0, 30) + '...\n');

// Étape 2 : Analyser l'URI
console.log('📋 ÉTAPE 2 : Analyse de l\'URI\n');

const uri = process.env.MONGO_URI;

// Extraction des informations
const isAtlas = uri.includes('mongodb+srv://');
const username = uri.match(/\/\/([^:]+):/)?.[1];
const cluster = uri.match(/@([^/]+)/)?.[1];
const database = uri.match(/\.net\/([^?]+)/)?.[1];

console.log('   Type :', isAtlas ? 'MongoDB Atlas (cloud)' : 'MongoDB Local');
console.log('   Username :', username || 'Non trouvé');
console.log('   Cluster :', cluster || 'Non trouvé');
console.log('   Database :', database || 'Non spécifiée');

if (!isAtlas) {
  console.log('\n⚠️  ATTENTION : Vous utilisez une base locale, pas Atlas');
  console.log('   Pour Atlas, l\'URI doit commencer par "mongodb+srv://"');
}

if (!database || database === '?retryWrites') {
  console.log('\n⚠️  ATTENTION : Nom de base de données manquant');
  console.log('   Ajoutez le nom après .net/ : exemple "@cluster0.xxx.mongodb.net/ecommerce?..."');
}

console.log('\n');

// Étape 3 : Test de connexion avec options détaillées
console.log('📋 ÉTAPE 3 : Test de connexion à MongoDB\n');
console.log('⏳ Tentative de connexion (peut prendre 10-30 secondes)...\n');

const startTime = Date.now();

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000, // Attendre 30 secondes max
  socketTimeoutMS: 45000,
})
  .then(() => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('═══════════════════════════════════════════════');
    console.log('✅ SUCCÈS ! Connexion établie');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('📊 Informations de connexion :');
    console.log('   ├─ Host :', mongoose.connection.host);
    console.log('   ├─ Port :', mongoose.connection.port);
    console.log('   ├─ Nom de la DB :', mongoose.connection.name);
    console.log('   ├─ État :', mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté');
    console.log('   └─ Temps de connexion :', duration + 's');
    
    console.log('\n✅ Tout fonctionne correctement !');
    console.log('   Tu peux maintenant lancer ton backend avec : npm start\n');
    
    process.exit(0);
  })
  .catch((error) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('═══════════════════════════════════════════════');
    console.log('❌ ÉCHEC DE LA CONNEXION');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('⏱️  Temps écoulé :', duration + 's');
    console.log('🔴 Type d\'erreur :', error.name);
    console.log('💬 Message :', error.message);
    console.log('\n');
    
    console.log('🔧 DIAGNOSTIC ET SOLUTIONS :\n');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('❌ Problème : MongoDB local n\'est pas démarré');
      console.log('   Solutions :');
      console.log('   1. Si tu veux utiliser MongoDB local :');
      console.log('      → Lance "mongod" dans un terminal');
      console.log('   2. Si tu veux utiliser Atlas :');
      console.log('      → Vérifie que ton URI commence par "mongodb+srv://"');
      
    } else if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
      console.log('❌ Problème : Le mot de passe est INCORRECT');
      console.log('   Solutions :');
      console.log('   1. Va sur MongoDB Atlas → Database Access');
      console.log('   2. Trouve ton utilisateur "' + username + '"');
      console.log('   3. Clique sur "Edit" (crayon)');
      console.log('   4. Clique sur "Edit Password"');
      console.log('   5. Mets un nouveau mot de passe SIMPLE : "test1234"');
      console.log('   6. Mets à jour ton .env avec ce nouveau mot de passe');
      console.log('   7. Relance ce test');
      
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('Could not connect to any servers')) {
      console.log('❌ Problème : Impossible de joindre le serveur MongoDB');
      console.log('   Causes possibles :');
      console.log('   1. Ton IP n\'est pas autorisée sur Atlas');
      console.log('      → Va sur Atlas → Network Access');
      console.log('      → Vérifie que "0.0.0.0/0" est dans la liste');
      console.log('      → Si absent, clique "Add IP Address" → "Allow Access from Anywhere"');
      console.log('   2. Le nom du cluster est incorrect');
      console.log('      → Vérifie sur Atlas que ton cluster s\'appelle bien "' + cluster + '"');
      console.log('   3. Problème de pare-feu/antivirus');
      console.log('      → Désactive temporairement ton antivirus et réessaye');
      
    } else if (error.message.includes('MongooseServerSelectionError')) {
      console.log('❌ Problème : Impossible de sélectionner un serveur');
      console.log('   Solutions :');
      console.log('   1. Vérifie que ton cluster est actif (pas en pause) sur Atlas');
      console.log('   2. Vérifie Network Access (0.0.0.0/0 doit être autorisé)');
      console.log('   3. Vérifie que l\'utilisateur "' + username + '" existe');
      
    } else if (error.message.includes('URI') || error.message.includes('malformed')) {
      console.log('❌ Problème : Le format de l\'URI est incorrect');
      console.log('   Solutions :');
      console.log('   1. Va sur Atlas → Database → Connect → Connect your application');
      console.log('   2. Copie la chaîne de connexion fournie');
      console.log('   3. Remplace <password> par ton mot de passe');
      console.log('   4. Ajoute "/ecommerce" avant le "?" : ...mongodb.net/ecommerce?...');
      
    } else {
      console.log('❌ Erreur inconnue');
      console.log('   Copie cette erreur et envoie-la pour analyse :');
      console.log('   ' + error.stack);
    }
    
    console.log('\n');
    console.log('═══════════════════════════════════════════════');
    console.log('💡 BESOIN D\'AIDE ?');
    console.log('═══════════════════════════════════════════════');
    console.log('   Envoie ce diagnostic complet pour obtenir de l\'aide');
    console.log('\n');
    
    process.exit(1);
  });
