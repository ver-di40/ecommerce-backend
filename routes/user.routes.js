const express = require('express');
const router = express.Router();

const { 
  registerUser, 
  loginUser, 
  getUsers,
  blockUser,
  deleteUser,
  changeUserRole,
  updateProfile,
  getSolde // ← NOUVEAU : Ajouté
} = require('../controllers/user.controller');

const { protect, isAdmin } = require('../middleware/auth');

/**
 * ROUTES UTILISATEUR
 * 
 * Routes publiques :
 * - POST /api/users/register : Inscription
 * - POST /api/users/login : Connexion
 * 
 * Routes protégées (utilisateur authentifié) :
 * - PUT /api/users/profile : Modifier son profil
 * - GET /api/users/solde : Récupérer son solde ← NOUVEAU
 * 
 * Routes admin uniquement :
 * - GET /api/users : Lister tous les utilisateurs
 * - PUT /api/users/:id/block : Bloquer/débloquer un utilisateur
 * - DELETE /api/users/:id : Supprimer un utilisateur
 * - PUT /api/users/:id/role : Changer le rôle d'un utilisateur
 */

// ============== ROUTES PUBLIQUES ==============
router.post('/register', registerUser);
router.post('/login', loginUser);

// ============== ROUTES PROTÉGÉES (tout utilisateur authentifié) ==============
router.put('/profile', protect, updateProfile);
router.get('/solde', protect, getSolde); // ← NOUVEAU

// ============== ROUTES ADMIN UNIQUEMENT ==============
router.get('/', protect, isAdmin, getUsers);
router.put('/:id/block', protect, isAdmin, blockUser);
router.delete('/:id', protect, isAdmin, deleteUser);
router.put('/:id/role', protect, isAdmin, changeUserRole);

module.exports = router;