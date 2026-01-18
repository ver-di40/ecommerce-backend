const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware de base : vérifie le token JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }

      // Vérifier si l'utilisateur est bloqué
      if (req.user.isBlocked) {
        return res.status(403).json({ 
          message: 'Votre compte a été bloqué. Contactez un administrateur.' 
        });
      }

      next();

    } catch (error) {
      console.error('Erreur token:', error.message);
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      message: 'Non autorisé, token manquant' 
    });
  }
};

// Middleware : vérifie que l'utilisateur est admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Accès refusé : privilèges administrateur requis' 
    });
  }
};

// Middleware : vérifie que l'utilisateur est vendeur UNIQUEMENT (pas admin)
const isSeller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Accès refusé : vous devez être vendeur' 
    });
  }
};

// Middleware : vérifie que l'utilisateur n'est pas bloqué
const isNotBlocked = (req, res, next) => {
  if (req.user && req.user.isBlocked) {
    return res.status(403).json({ 
      message: 'Votre compte est bloqué' 
    });
  }
  next();
};

module.exports = { protect, isAdmin, isSeller, isNotBlocked };