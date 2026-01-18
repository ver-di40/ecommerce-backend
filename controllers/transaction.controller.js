const Product = require('../models/product');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const mongoose = require('mongoose');

/**
 * CONTRÔLEUR TRANSACTION (NOUVEAU)
 * 
 * Gère toutes les opérations liées aux achats :
 * - Achat de produit par un client
 * - Historique des achats (client)
 * - Historique des ventes (seller)
 */

// ==================== ACHETER UN PRODUIT ====================
/**
 * Processus d'achat :
 * 1. Vérifier que le produit existe et est disponible
 * 2. Vérifier que le stock est suffisant
 * 3. Calculer le montant total
 * 4. Vérifier que le client a assez de solde
 * 5. Déduire le montant du solde du client
 * 6. Ajouter le montant au solde du vendeur
 * 7. Réduire le stock du produit
 * 8. Créer la transaction
 * 
 * On utilise une SESSION MongoDB pour que tout soit atomique
 * (soit tout réussit, soit tout échoue - pas d'état intermédiaire)
 */
const acheterProduit = async (req, res) => {
  // Créer une session MongoDB pour la transaction atomique
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { produitId, quantite } = req.body;
    const clientId = req.user._id; // ID du client connecté

    // ============== 1. VALIDATION DE LA QUANTITÉ ==============
    if (!quantite || quantite < 1) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'La quantité doit être au moins de 1' 
      });
    }

    // ============== 2. RÉCUPÉRER LE PRODUIT ==============
    const produit = await Product.findById(produitId).session(session);
    
    if (!produit) {
      await session.abortTransaction();
      return res.status(404).json({ 
        message: 'Produit non trouvé' 
      });
    }

    // ============== 3. VÉRIFIER LE STOCK ==============
    if (produit.stock < quantite) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Stock insuffisant', 
        stockDisponible: produit.stock 
      });
    }

    // ============== 4. CALCULER LE MONTANT TOTAL ==============
    const montantTotal = produit.price * quantite;

    // ============== 5. RÉCUPÉRER LE CLIENT ==============
    const client = await User.findById(clientId).session(session);
    
    if (!client) {
      await session.abortTransaction();
      return res.status(404).json({ 
        message: 'Client non trouvé' 
      });
    }

    // ============== 6. VÉRIFIER LE SOLDE DU CLIENT ==============
    if (client.solde < montantTotal) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Fonds insuffisants', 
        soldeActuel: client.solde,
        montantNecessaire: montantTotal,
        manquant: montantTotal - client.solde
      });
    }

    // ============== 7. DÉDUIRE LE MONTANT DU SOLDE CLIENT ==============
    client.solde -= montantTotal;
    await client.save({ session });

    // ============== 8. AJOUTER LE MONTANT AU VENDEUR ==============
    const vendeur = await User.findById(produit.owner).session(session);
    
    if (vendeur) {
      vendeur.solde += montantTotal;
      await vendeur.save({ session });
    }

    // ============== 9. RÉDUIRE LE STOCK ==============
    produit.stock -= quantite;
    await produit.save({ session });

    // ============== 10. CRÉER LA TRANSACTION ==============
    const transaction = await Transaction.create([{
      client: clientId,
      produit: produitId,
      vendeur: produit.owner,
      quantite: quantite,
      prixUnitaire: produit.price,
      montantTotal: montantTotal,
      statutPaiement: 'reussi'
    }], { session });

    // ============== 11. VALIDER LA TRANSACTION ==============
    await session.commitTransaction();

    // ============== 12. RETOURNER LA RÉPONSE ==============
    res.status(201).json({
      message: 'Achat effectué avec succès !',
      transaction: {
        id: transaction[0]._id,
        produit: produit.name,
        quantite: quantite,
        montantTotal: montantTotal,
        date: transaction[0].createdAt
      },
      nouveauSolde: client.solde
    });

  } catch (error) {
    // En cas d'erreur, annuler toute la transaction
    await session.abortTransaction();
    console.error('Erreur acheterProduit:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'achat', 
      error: error.message 
    });
  } finally {
    // Toujours fermer la session
    session.endSession();
  }
};

// ==================== HISTORIQUE DES ACHATS (Client) ====================
/**
 * Récupère toutes les transactions où l'utilisateur connecté est le client
 * Utile pour afficher l'historique d'achat dans l'interface client
 */
const mesAchats = async (req, res) => {
  try {
    const transactions = await Transaction.find({ client: req.user._id })
      .populate('produit', 'name price imageUrl') // Récupère les infos du produit
      .populate('vendeur', 'name entreprise') // Récupère les infos du vendeur
      .sort({ createdAt: -1 }); // Trier du plus récent au plus ancien

    // Calculer le total dépensé
    const totalDepense = transactions.reduce((sum, t) => sum + t.montantTotal, 0);

    res.status(200).json({
      count: transactions.length,
      totalDepense: totalDepense,
      transactions
    });

  } catch (error) {
    console.error('Erreur mesAchats:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message 
    });
  }
};

// ==================== HISTORIQUE DES VENTES (Seller) ====================
/**
 * Récupère toutes les transactions où l'utilisateur connecté est le vendeur
 * Utile pour afficher l'historique des ventes dans l'interface vendeur
 */
const mesVentes = async (req, res) => {
  try {
    const transactions = await Transaction.find({ vendeur: req.user._id })
      .populate('produit', 'name price imageUrl') // Récupère les infos du produit
      .populate('client', 'name email') // Récupère les infos du client
      .sort({ createdAt: -1 }); // Trier du plus récent au plus ancien

    // Calculer le total des ventes
    const totalVentes = transactions.reduce((sum, t) => sum + t.montantTotal, 0);

    res.status(200).json({
      count: transactions.length,
      totalVentes: totalVentes,
      transactions
    });

  } catch (error) {
    console.error('Erreur mesVentes:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message 
    });
  }
};

// ==================== TOUTES LES TRANSACTIONS (Admin) ====================
/**
 * Récupère toutes les transactions du système
 * Réservé aux administrateurs pour avoir une vue d'ensemble
 */
const toutesLesTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('client', 'name email')
      .populate('produit', 'name price')
      .populate('vendeur', 'name entreprise')
      .sort({ createdAt: -1 });

    // Statistiques globales
    const totalTransactions = transactions.length;
    const chiffreAffaires = transactions.reduce((sum, t) => sum + t.montantTotal, 0);

    res.status(200).json({
      count: totalTransactions,
      chiffreAffaires: chiffreAffaires,
      transactions
    });

  } catch (error) {
    console.error('Erreur toutesLesTransactions:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des transactions',
      error: error.message 
    });
  }
};

module.exports = {
  acheterProduit,
  mesAchats,
  mesVentes,
  toutesLesTransactions
};