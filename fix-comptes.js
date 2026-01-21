const mongoose = require('mongoose');
const User = require('./models/user');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixComptes() {
  try {
    // Vérifier que MONGO_URI existe
    if (!process.env.MONGO_URI) {
      console.error('❌ ERREUR: MONGO_URI non trouvé dans .env');
      console.log('📁 Chemin .env:', path.join(__dirname, '.env'));
      process.exit(1);
    }

    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const users = await User.find({});
    console.log(`📊 Nombre d'utilisateurs: ${users.length}`);

    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé dans la base de données');
      console.log('💡 Inscris-toi d\'abord sur le site avant de lancer ce script');
      await mongoose.connection.close();
      process.exit(0);
    }

    let updated = 0;

    for (const user of users) {
      // Si l'utilisateur n'a pas les 3 comptes
      if (!user.comptes || !user.comptes.carte) {
        user.comptes = {
          carte: 200000,
          orangeMoney: 200000,
          mobileMoney: 200000
        };
        
        // Supprimer l'ancien champ solde s'il existe
        if (user.solde !== undefined) {
          user.solde = undefined;
        }
        
        await user.save();
        updated++;
        console.log(`✅ ${user.name} (${user.role}) - Comptes ajoutés: 200k/200k/200k`);
      } else {
        console.log(`⏭️  ${user.name} (${user.role}) - Déjà à jour`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎉 TERMINÉ! ${updated}/${users.length} utilisateur(s) mis à jour.`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    if (updated > 0) {
      console.log('\n💡 IMPORTANT: Déconnecte-toi et reconnecte-toi pour voir les nouveaux soldes!');
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Connexion MongoDB fermée');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

console.log('🚀 Démarrage du script de correction des comptes...\n');
fixComptes();