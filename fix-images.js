const mongoose = require('mongoose');
const Product = require('./models/product');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fixImages() {
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

    const products = await Product.find({});
    console.log(`📊 Nombre de produits: ${products.length}`);

    if (products.length === 0) {
      console.log('⚠️  Aucun produit trouvé dans la base de données');
      console.log('💡 Ajoute des produits d\'abord avant de lancer ce script');
      await mongoose.connection.close();
      process.exit(0);
    }

    let updated = 0;

    // Images par catégorie (Unsplash)
    const images = {
      'Électronique': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      'Vêtements': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      'Alimentation': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      'Livres': 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
      'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
      'Maison': 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=400',
      'Beauté': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      'Autre': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    };

    for (const product of products) {
      // Si le produit n'a pas d'image ou a l'image placeholder
      if (!product.imageUrl || product.imageUrl.includes('placeholder') || product.imageUrl.includes('via.placeholder')) {
        const categoryImage = images[product.category] || images['Autre'];
        product.imageUrl = categoryImage;
        await product.save();
        updated++;
        console.log(`✅ ${product.name} (${product.category}) - Image ajoutée`);
      } else {
        console.log(`⏭️  ${product.name} - Image déjà présente: ${product.imageUrl.substring(0, 50)}...`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎉 TERMINÉ! ${updated}/${products.length} produit(s) mis à jour.`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    if (updated > 0) {
      console.log('\n💡 Actualise la page pour voir les nouvelles images!');
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

console.log('🚀 Démarrage du script de correction des images...\n');
fixImages();