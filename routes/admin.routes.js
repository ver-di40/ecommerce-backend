const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { protect, isAdmin } = require('../middleware/auth');

// RÉCUPÉRER TOUS LES UTILISATEURS
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ users, total: users.length });
  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// BLOQUER / DÉBLOQUER UN UTILISATEUR
router.put('/users/:id/block', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous bloquer vous-même' });
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.status(200).json({
      message: user.isBlocked ? 'Utilisateur bloqué' : 'Utilisateur débloqué',
      user: { id: user._id, name: user.name, isBlocked: user.isBlocked }
    });
  } catch (error) {
    console.error('Erreur blockUser:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// SUPPRIMER UN UTILISATEUR
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous supprimer vous-même' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// RÉCUPÉRER TOUTES LES TRANSACTIONS
router.get('/transactions', protect, isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate('acheteur', 'name email')
      .populate('vendeur', 'name email')
      .populate('produit', 'name price')
      .sort({ createdAt: -1 });
    res.status(200).json({ transactions, total: transactions.length });
  } catch (error) {
    console.error('Erreur getTransactions:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
