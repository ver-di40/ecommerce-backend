const mongoose = require('mongoose');

/**
 * MODÈLE TRANSACTION (NOUVEAU)
 * 
 * Ce modèle enregistre chaque achat effectué par un client.
 * Il permet de :
 * - Garder l'historique des achats
 * - Suivre les ventes des vendeurs
 * - Avoir une traçabilité complète des transactions
 */

const transactionSchema = new mongoose.Schema(
  {
    // Référence vers le client qui achète
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Référence vers le produit acheté
    produit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    
    // Référence vers le vendeur (pour faciliter les recherches)
    vendeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Quantité achetée
    quantite: {
      type: Number,
      required: true,
      min: 1
    },
    
    // Prix unitaire au moment de l'achat (important car le prix peut changer)
    prixUnitaire: {
      type: Number,
      required: true
    },
    
    // Montant total de la transaction
    montantTotal: {
      type: Number,
      required: true
    },
    
    // Statut du paiement
    statutPaiement: {
      type: String,
      enum: ['reussi', 'echoue'],
      default: 'reussi'
    }
  },
  {
    timestamps: true // Ajoute automatiquement createdAt (date de la transaction)
  }
);

// Index pour accélérer les recherches
transactionSchema.index({ client: 1 }); // Recherche des achats d'un client
transactionSchema.index({ vendeur: 1 }); // Recherche des ventes d'un vendeur

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;