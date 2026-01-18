const Product = require('../models/product');

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ 
        message: 'Veuillez fournir tous les champs requis' 
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock: stock || 0,
      imageUrl,
      owner: req.user._id
    });

    res.status(201).json({
      message: 'Produit créé avec succès',
      product
    });

  } catch (error) {
    console.error('Erreur createProduct:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la création du produit',
      error: error.message 
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('owner', 'name email');

    res.status(200).json({
      count: products.length,
      products
    });

  } catch (error) {
    console.error('Erreur getProducts:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la récupération des produits',
      error: error.message 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('owner', 'name email');

    if (!product) {
      return res.status(404).json({ 
        message: 'Produit non trouvé' 
      });
    }

    res.status(200).json({ product });

  } catch (error) {
    console.error('Erreur getProductById:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        message: 'Produit non trouvé' 
      });
    }

    // Vérifier les permissions : admin OU propriétaire
    const isOwner = product.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        message: 'Non autorisé à modifier ce produit' 
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.status(200).json({
      message: 'Produit mis à jour avec succès',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Erreur updateProduct:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur lors de la mise à jour',
      error: error.message 
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        message: 'Produit non trouvé' 
      });
    }

    // Admin peut supprimer n'importe quel produit
    // Vendeur peut supprimer uniquement son produit
    const isOwner = product.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        message: 'Non autorisé à supprimer ce produit' 
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: 'Produit supprimé avec succès' 
    });

  } catch (error) {
    console.error('Erreur deleteProduct:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.status(500).json({ 
      message: 'Erreur serveur lors de la suppression',
      error: error.message 
    });
  }
};
module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};