const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est requis'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Le prix est requis'],
      min: [0, 'Le prix ne peut pas être négatif']
    },
    category: {
      type: String,
      required: [true, 'La catégorie est requise'],
      trim: true
    },
    stock: {
      type: Number,
      required: [true, 'Le stock est requis'],
      min: [0, 'Le stock ne peut pas être négatif'],
      default: 0
    },
    imageUrl: {
      type: String,
      default: 'https://via.placeholder.com/300'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // ============== NOUVEAU : LIKES ==============
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    
    // ============== NOUVEAU : COMMENTAIRES ==============
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      userName: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;