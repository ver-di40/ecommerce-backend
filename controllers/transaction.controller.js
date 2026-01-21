const Product = require('../models/product');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const mongoose = require('mongoose');

/**
 * CONTRÔLEUR TRANSACTION - VERSION AVEC TÉLÉPHONE
 * 
 * Modifications :
 * - Ajout du champ telephoneLivraison
 * - Validation du numéro de téléphone
 */

// ==================== ACHETER UN PRODUIT ====================
const acheterProduit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { produitId, quantite, modePaiement, telephoneLivraison } = req.body;
    const clientId = req.user._id;

    // ============== 1. VALIDATION ==============
    if (!quantite || quantite < 1) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'La quantité doit être au moins de 1' 
      });
    }

    // Vérifier le mode de paiement
    const modesValides = ['carte', 'orangeMoney', 'mobileMoney'];
    if (!modePaiement || !modesValides.includes(modePaiement)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Mode de paiement invalide. Choisissez : carte, orangeMoney ou mobileMoney' 
      });
    }

    // NOUVEAU : Vérifier le téléphone
    if (!telephoneLivraison || telephoneLivraison.trim() === '') {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Le numéro de téléphone pour la livraison est requis' 
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

    // ============== 4. CALCULER LE MONTANT ==============
    const montantProduits = produit.price * quantite;
    const fraisService = montantProduits * 0.02; // 2% de frais
    const montantTotal = montantProduits + fraisService;

    // ============== 5. RÉCUPÉRER LE CLIENT ==============
    const client = await User.findById(clientId).session(session);
    
    if (!client) {
      await session.abortTransaction();
      return res.status(404).json({ 
        message: 'Client non trouvé' 
      });
    }

    // ============== 6. VÉRIFIER LE SOLDE DU COMPTE CHOISI ==============
    if (!client.comptes || client.comptes[modePaiement] === undefined) {
      await session.abortTransaction();
      return res.status(500).json({ 
        message: 'Compte non initialisé. Contactez le support.' 
      });
    }

    const soldeActuel = client.comptes[modePaiement];

    if (soldeActuel < montantTotal) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Fonds insuffisants', 
        soldeActuel: soldeActuel,
        montantNecessaire: montantTotal,
        manquant: montantTotal - soldeActuel
      });
    }

    // ============== 7. DÉDUIRE DU COMPTE CLIENT ==============
    client.comptes[modePaiement] -= montantTotal;
    await client.save({ session });

    // ============== 8. AJOUTER AU COMPTE VENDEUR (carte) ==============
    const vendeur = await User.findById(produit.owner).session(session);
    
    if (vendeur) {
      if (!vendeur.comptes) {
        vendeur.comptes = {
          carte: 0,
          orangeMoney: 0,
          mobileMoney: 0
        };
      }
      vendeur.comptes.carte += montantProduits; // Sans les frais
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
      modePaiement: modePaiement,
      telephoneLivraison: telephoneLivraison,
      statutPaiement: 'reussi'
    }], { session });

    // ============== 11. VALIDER ==============
    await session.commitTransaction();

    // ============== 12. RÉPONSE ==============
    res.status(201).json({
      message: 'Achat effectué avec succès !',
      transaction: {
        id: transaction[0]._id,
        produit: produit.name,
        quantite: quantite,
        montantProduits: montantProduits,
        fraisService: fraisService,
        montantTotal: montantTotal,
        modePaiement: modePaiement,
        telephoneLivraison: telephoneLivraison,
        date: transaction[0].createdAt
      },
      nouveauSolde: client.comptes[modePaiement]
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Erreur acheterProduit:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'achat', 
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

// ==================== HISTORIQUE DES ACHATS (Client) ====================
const mesAchats = async (req, res) => {
  try {
    const transactions = await Transaction.find({ client: req.user._id })
      .populate('produit', 'name price imageUrl')
      .populate('vendeur', 'name entreprise')
      .sort({ createdAt: -1 });

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
const mesVentes = async (req, res) => {
  try {
    const transactions = await Transaction.find({ vendeur: req.user._id })
      .populate('produit', 'name price imageUrl')
      .populate('client', 'name email')
      .sort({ createdAt: -1 });

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
const toutesLesTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('client', 'name email')
      .populate('produit', 'name price')
      .populate('vendeur', 'name entreprise')
      .sort({ createdAt: -1 });

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