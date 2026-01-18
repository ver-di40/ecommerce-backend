// Importation des dépendances nécessaires
const express = require('express'); // Framework web pour créer l'API
const dotenv = require('dotenv'); // Pour charger les variables d'environnement
const cors = require('cors'); // Pour autoriser les requêtes cross-origin
const connectDB = require('./config/db'); // Fonction de connexion MongoDB

// Import des routes
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const transactionRoutes = require('./routes/transaction.routes'); // ← NOUVEAU

// Chargement des variables d'environnement depuis le fichier .env
dotenv.config();

// Création de l'application Express
const app = express();

// Connexion à la base de données MongoDB
connectDB();

// ============== MIDDLEWARE CORS ==============
// Permet au frontend (sur un autre port) de communiquer avec le backend
app.use(cors({
  origin: '*', // En production, remplacer par l'URL exacte du frontend
  credentials: true
}));

// ============== MIDDLEWARE JSON ==============
// Permet de lire req.body dans les controllers
app.use(express.json());

// ============== DÉCLARATION DES ROUTES ==============
// Toutes les routes commençant par /api/users seront gérées par userRoutes
app.use('/api/users', userRoutes);

// Toutes les routes commençant par /api/products seront gérées par productRoutes
app.use('/api/products', productRoutes);

// ← NOUVEAU : Toutes les routes commençant par /api/transactions
app.use('/api/transactions', transactionRoutes);

// ============== ROUTE DE TEST ==============
// Pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ 
    message: 'API E-commerce fonctionne correctement !',
    routes: {
      users: '/api/users',
      products: '/api/products',
      transactions: '/api/transactions'
    }
  });
});

// ============== DÉMARRAGE DU SERVEUR ==============
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('📋 Routes disponibles:');
  console.log('   - /api/users');
  console.log('   - /api/products');
  console.log('   - /api/transactions'); // ← NOUVEAU
});