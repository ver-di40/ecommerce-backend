const express = require('express');
const router = express.Router();

const {
  acheterProduit,
  mesAchats,
  mesVentes,
  toutesLesTransactions
} = require('../controllers/transaction.controller');

const { protect, isAdmin } = require('../middleware/auth');

/**
 * ROUTES TRANSACTION
 * 
 * Organisation des routes :
 * - /api/transactions/acheter : POST - Acheter un produit (client uniquement)
 * - /api/transactions/mes-achats : GET - Historique achats (client uniquement)
 * - /api/transactions/mes-ventes : GET - Historique ventes (seller uniquement)
 * - /api/transactions : GET - Toutes les transactions (admin uniquement)
 */

// ============== ROUTE CLIENT : Acheter un produit ==============
// POST /api/transactions/acheter
// Nécessite d'être authentifié et d'être un client
router.post('/acheter', protect, acheterProduit);

// ============== ROUTE CLIENT : Mes achats ==============
// GET /api/transactions/mes-achats
// Nécessite d'être authentifié (tout utilisateur peut voir ses achats)
router.get('/mes-achats', protect, mesAchats);

// ============== ROUTE SELLER : Mes ventes ==============
// GET /api/transactions/mes-ventes
// Nécessite d'être authentifié (tout vendeur peut voir ses ventes)
router.get('/mes-ventes', protect, mesVentes);

// ============== ROUTE ADMIN : Toutes les transactions ==============
// GET /api/transactions
// Nécessite d'être authentifié ET d'être admin
router.get('/', protect, isAdmin, toutesLesTransactions);

module.exports = router;