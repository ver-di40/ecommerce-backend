const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const { protect } = require('../middleware/auth');

// ==================== LIKE / UNLIKE UN PRODUIT ====================
router.post('/:id/like', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Vérifier si l'utilisateur a déjà liké
    const hasLiked = product.likes.includes(req.user._id);
    
    if (hasLiked) {
      // Unlike - retirer le like
      product.likes = product.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      // Like - ajouter le like
      product.likes.push(req.user._id);
    }
    
    await product.save();
    
    res.status(200).json({
      message: hasLiked ? 'Like retiré' : 'Produit liké',
      likes: product.likes.length,
      hasLiked: !hasLiked
    });
    
  } catch (error) {
    console.error('Erreur like:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// ==================== AJOUTER UN COMMENTAIRE ====================
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    
    // Validation
    if (!text || text.trim() === '') {
      return res.status(400).json({ 
        message: 'Le commentaire ne peut pas être vide' 
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Créer le commentaire
    const comment = {
      user: req.user._id,
      userName: req.user.name,
      text: text.trim(),
      createdAt: new Date()
    };
    
    // Ajouter au produit
    product.comments.push(comment);
    await product.save();
    
    res.status(201).json({
      message: 'Commentaire ajouté avec succès',
      comment
    });
    
  } catch (error) {
    console.error('Erreur commentaire:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// ==================== RÉCUPÉRER LES COMMENTAIRES D'UN PRODUIT ====================
router.get('/:id/comments', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('comments');
    
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.status(200).json({
      comments: product.comments
    });
    
  } catch (error) {
    console.error('Erreur récupération commentaires:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

module.exports = router;