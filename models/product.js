// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  prix: {
    type: Number,
    required: true,
    min: 0
  },
  quantiteStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  categorie: {
    type: String,
    required: true,
    enum: ['Électronique', 'Vêtements', 'Alimentation', 'Livres', 'Sports', 'Maison', 'Beauté', 'Autre']
  },
  vendeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String
  }],
  estDisponible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

productSchema.index({ nom: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);