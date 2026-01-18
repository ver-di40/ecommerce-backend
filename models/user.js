const mongoose = require('mongoose');

/**
 * MODÈLE UTILISATEUR AMÉLIORÉ
 * 
 * Modifications apportées à ton modèle existant :
 * 1. Ajout du champ "solde" pour les clients (solde initial de 1000)
 * 2. Ajout du champ "entreprise" pour les vendeurs (nom + description obligatoires)
 * 3. Le reste reste identique (isBlocked déjà présent)
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
    },
    role: {
      type: String,
      enum: ['client', 'seller', 'admin'],
      default: 'client'
    },
    
    // ============== NOUVEAU : SOLDE (pour les clients et vendeurs) ==============
    solde: {
      type: Number,
      default: 1000, // Chaque utilisateur commence avec 1000 unités
      min: [0, 'Le solde ne peut pas être négatif']
    },
    
    // ============== NOUVEAU : INFORMATIONS ENTREPRISE (pour les sellers) ==============
    entreprise: {
      nom: {
        type: String,
        required: function() {
          // Ce champ est obligatoire UNIQUEMENT si l'utilisateur est un seller
          return this.role === 'seller';
        },
        trim: true
      },
      description: {
        type: String,
        required: function() {
          // Ce champ est obligatoire UNIQUEMENT si l'utilisateur est un seller
          return this.role === 'seller';
        },
        trim: true
      }
    },
    
    // ============== DÉJÀ EXISTANT : Blocage ==============
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // Ajoute automatiquement createdAt et updatedAt
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;