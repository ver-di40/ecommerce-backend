const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');

const { protect, isSeller, isAdmin } = require('../middleware/auth');

// Routes publiques
router.get('/', getProducts);
router.get('/:id', getProductById);

// Routes protégées - UNIQUEMENT vendeurs (pas admin)
router.post('/', protect, isSeller, createProduct);
router.put('/:id', protect, isSeller, updateProduct);

// Admin peut UNIQUEMENT supprimer (pas créer ni modifier)
router.delete('/:id', protect, deleteProduct);

module.exports = router;