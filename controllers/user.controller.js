const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * CONTRÔLEUR UTILISATEUR MODIFIÉ
 * 
 * Modifications apportées :
 * 1. registerUser : ajout de la gestion du rôle et des infos entreprise
 * 2. Ajout de getSolde : pour récupérer le solde d'un utilisateur
 * 3. Le reste reste identique à ton code existant
 */

// ==================== INSCRIPTION ====================
// Modifié pour gérer le rôle seller et les infos entreprise
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, entreprise } = req.body;

    // Validation des champs de base
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Veuillez fournir tous les champs requis' 
      });
    }

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ 
        message: 'Cet email est déjà utilisé' 
      });
    }

    // ============== NOUVEAU : Validation pour les sellers ==============
    // Si l'utilisateur s'inscrit comme seller, il DOIT fournir les infos entreprise
    if (role === 'seller') {
      if (!entreprise || !entreprise.nom || !entreprise.description) {
        return res.status(400).json({ 
          message: 'Les informations de l\'entreprise (nom et description) sont obligatoires pour un vendeur' 
        });
      }
    }

    // Hash du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Création de l'utilisateur avec les nouvelles données
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'client' // Par défaut : client
    };

    // ============== NOUVEAU : Ajouter les infos entreprise si seller ==============
    if (role === 'seller' && entreprise) {
      userData.entreprise = {
        nom: entreprise.nom,
        description: entreprise.description
      };
    }

    const user = await User.create(userData);

    // Générer le token JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        solde: user.solde, // ← NOUVEAU : retourner le solde
        entreprise: user.entreprise // ← NOUVEAU : retourner les infos entreprise si seller
      },
      token
    });

  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message 
    });
  }
};

// ==================== CONNEXION ====================
// Inchangé, mais on retourne maintenant le solde et l'entreprise
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Veuillez fournir email et mot de passe' 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // ============== DÉJÀ EXISTANT : Vérifier si bloqué ==============
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Votre compte a été bloqué. Contactez un administrateur.' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        solde: user.solde, // ← NOUVEAU : retourner le solde
        entreprise: user.entreprise // ← NOUVEAU : retourner les infos entreprise
      },
      token
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion',
      error: error.message 
    });
  }
};

// ==================== LISTER TOUS LES UTILISATEURS (Admin) ====================
// Inchangé
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des utilisateurs',
      error: error.message 
    });
  }
};

// ==================== BLOQUER/DÉBLOQUER UN UTILISATEUR (Admin) ====================
// Inchangé
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher de bloquer un admin
    if (user.role === 'admin') {
      return res.status(400).json({ 
        message: 'Impossible de bloquer un administrateur' 
      });
    }

    // Inverser le statut bloqué/débloqué
    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      message: user.isBlocked ? 'Utilisateur bloqué' : 'Utilisateur débloqué',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });

  } catch (error) {
    console.error('Erreur blockUser:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

// ==================== SUPPRIMER UN UTILISATEUR (Admin) ====================
// Inchangé
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher de supprimer un admin
    if (user.role === 'admin') {
      return res.status(400).json({ 
        message: 'Impossible de supprimer un administrateur' 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: 'Utilisateur supprimé avec succès' 
    });

  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

// ==================== CHANGER LE RÔLE (Admin) ====================
// Inchangé
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Vérifier que le rôle est valide
    if (!['client', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ 
        message: 'Rôle invalide. Valeurs acceptées: client, seller, admin' 
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: 'Rôle modifié avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur changeUserRole:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

// ==================== MODIFIER SON PROFIL ====================
// Inchangé
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const { name, email, password } = req.body;

    if (name) {
      user.name = name;
    }

    if (email) {
      const emailExists = await User.findOne({ 
        email, 
        _id: { $ne: req.user._id } 
      });
      
      if (emailExists) {
        return res.status(400).json({ 
          message: 'Cet email est déjà utilisé' 
        });
      }
      
      user.email = email;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          message: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur updateProfile:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

// ==================== NOUVEAU : RÉCUPÉRER SON SOLDE ====================
/**
 * Permet à un utilisateur de consulter son solde actuel
 * Utile pour afficher le solde dans l'interface
 */
const getSolde = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email role solde');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({
      solde: user.solde,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur getSolde:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  blockUser,
  deleteUser,
  changeUserRole,
  updateProfile,
  getSolde // ← NOUVEAU
};