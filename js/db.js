$(document).ready(function() {
  ////
  // Product database module
  // Keeps track of all categories and products
  ////

  Product = Backbone.Model.extend({
    defaults: {
      name: '',
      category: ''
    },
    initialize: function() {
      this.set({'id': this.get('name')});
      console.log("id: ", this.id);
    }
  });

  Products = Backbone.Collection.extend({
    model: Product
  });

  Database = Backbone.Model.extend({
    defaults: function() {
      return {
        products: new Products(),
        categories: []
      };
    },
    // Returns all product names
    getProductNames: function() {
      return _(this.get('products').toJSON()).pluck('name');;
    },
    // Returns all category names
    getCategoryNames: function() {
      return this.get('categories');
    },

    // Add a category to database
    // (If already exists, does nothing)
    addCategory: function(categoryName) {
      if (this.categoryExists(categoryName)) {
        console.warn("Category already added!");
      } else {
        this.get('categories').push(categoryName);
      }
    },

    // Add a product/category to database
    // (If not already exists)
    addProduct: function(productName, categoryName) {
      var product = this.get('products').get(productName);
      if (product) {
        console.warn("Product already added!");
      }
      else if (!this.categoryExists(categoryName)) {
        console.warn("Category doesn't exist!");
      }  
      else {
        this.get('products').add({name: productName, category: categoryName});
      }
    },
    // Get category of specified product
    // TODO needed?
    getCategory: function(productName) {
      var product = this.get('products').get(productName);
      if (product) {
        return product.get('category');
      }
    },
    // Get the product with the specified name (if any)
    getProduct: function(productName) {
      return this.get('products').get(productName);
    },

    // Checks if category exists
    categoryExists: function(categoryName) {
      return _(this.get('categories')).contains(categoryName);
    },
    moveCategory: function(categoryName, newIndex) {
      // TODO
      console.warn("TODO implement!")
    }
  });

});