const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts
} = require('../controllers/product.controller');

const { protect, isSeller, isAdmin } = require('../middleware/auth');

// ============== ROUTES PUBLIQUES ==============
router.get('/', getProducts);

// ============== ROUTES PROTÉGÉES ==============
// ⚠️ IMPORTANT : /my-products AVANT /:id !
router.get('/my-products', protect, getMyProducts); // ← DÉPLACÉ ICI !

// Routes vendeurs
router.post('/', protect, isSeller, createProduct);
router.put('/:id', protect, isSeller, updateProduct);

// Route avec paramètre dynamique (doit être APRÈS les routes spécifiques)
router.get('/:id', getProductById);

// Admin peut supprimer
router.delete('/:id', protect, deleteProduct);

module.exports = router;