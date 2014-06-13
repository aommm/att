$(document).ready(function() {

  // TODO
  // 1.
  // Ask user what should happen when category already exists
  // Use message system to do this
  // 2. Check so that empty category works all right
  // 3. Add 'administer categories' mode

  ////
  // Shopping list module
  // Shows a list of items, and allows them to be ticked off
  ////

  ////
  // -- Things --
  // List: consists of many sublists
  // SubList: consists of many items
  // Item: an item in the shopping list

  // An item in the shopping list
  Item = Backbone.Model.extend({
    defaults: {
      name: ''
    },
    done: function() {
      // Send remove event to our category
      this.trigger('done', this.get('name'));
    },
    // For debugging
    toString: function() {
      var str = this.get('name');
      return str;
    }
  });

  // A category can contain many items
  Items = Backbone.Collection.extend({
    model: Item
  });
  SubList = Backbone.Model.extend({
    defaults: function() {
      return {
        name: '',
        items: new Items()
      };
    },
    initialize: function(options) {
      // When underlying collection changes, SubList changes also
      this.get('items').on('add remove', function() {this.trigger('change');}, this);
    },
    // Is this subList empty?
    isEmpty: function() {
      return this.get('items').isEmpty();
    },
    // Add a new item to this subList
    addItem: function(item) {
      item.on('done', this.removeItem, this);
      this.get('items').add(item);
    },
    // Remove item(s) with specified name
    removeItem: function(name) {
      var item = this.getItem(name); // get item(s) with specified name,
      if (item) {
        this.get('items').remove(item); // And remove them
      }
      else {
        console.warn("Cannot remove item!");
      }
    },
    // Gets item with the specified name (if any)
    // @returns object - if one found
    // @returns null - if none found
    // @returns list - if several found (shouldn't happen)
    getItem: function(name) {
      // get item(s) with specified name
      var result = this.get('items').filter(function(item) {
        return item.get('name') === name;
      });
      if (result.length === 1) {
        return result[0];
      } else if (result.length === 0) {
        return null;
      } else {
        return result;
      }
    },
    // For debugging
    toString: function() {
      var str = "-- "+this.get('name')+" --\n";
      this.get('items').forEach(function(item) {
        str += item.toString()+"\n";
      });
      return str;
    }
  });

  // A list contains many subLists
  SubLists = Backbone.Collection.extend({
    collection: SubList
  });
  List = Backbone.Model.extend({
    defaults: function() {
      return {
        subLists: new SubLists(),
        db: null,
        message: '', // message to show on screen
        messageStatus: 'warning' // or 'info' or 'question'
      };
    },
    initialize: function() {
      // When underlying collection changes, List changes also
      this.get('subLists').on('change', function() {this.trigger('change');}, this);
      // Debug fun
      this.showInfoMessage("Välkommen!");
    },
    // Is the entire list empty?
    isEmpty: function() {
      return this.get('subLists').all(function(sl) {
        return sl.isEmpty();
      });
    },
    // Get the sublist with the given name.
    // @returns object - if one found
    // @returns null - if none found
    // @returns list - if several found (shouldn't happen)
    getSubList: function(subListName) {
      var result = this.get('subLists').filter(function(sl) {
        return sl.get('name') === subListName;
      });
      if (result.length === 1) {
        return result[0];
      } else if (result.length === 0) {
        return null;
      } else {
        return result;
      }
    },
    // Create and add new subList
    // (Note: does not create category)
    newSubList: function(categoryName) {
      // todo create
      var existingSubList = this.getSubList(categoryName);
      if (existingSubList) {
        console.warn("SubList "+categoryName+" already exists!");
      } else {
        var subList = new SubList({name: categoryName});
        this.get('subLists').add(subList);
      }
    },
    // Checks if the given product has been added to the list
    productExists: function(product) {
      var category = product.get('category');
      var subList = this.getSubList(category);
      if (subList) {
        return !!subList.getItem(product.get('name'));
      }
    },
    // Adds an item to the correct sublist
    // Creates sublist if necessary
    addItem: function(item, subListName) {
      var db = this.get('db');
      var subList = this.getSubList(subListName);
      if (subList instanceof Array) {
        console.warn("SubList "+subListName+" found multiple times!");
      }
      else if (!subList) {
        console.log("Create sublist", subList);
        console.log(this.get('subLists').toJSON());
        db.addCategory(subListName);
        this.newSubList(subListName);
        this.get('subLists').first().addItem(item);
      }
      else {
        subList.addItem(item);
      }
    },
    // Create new item, and add to list
    newItem: function(productName, note, categoryName) {
      // TOOO check if product exists
      //      check if product has different category
      //      check if category exists
      //      implement special no-category category
      var db      = this.get('db')
        , product = db.getProduct(productName);

      // "Sanitize" input (TODO do better)
      categoryName = categoryName.trim();
      productName = productName? productName.trim() : productName;
      note = note ? note.trim() : note;

      // Product exists
      if (product) {
        console.log("Product exists");

        // Product has changed category. Change db
        if (product.get('category') !== categoryName) {
          console.log("Product has changed category");
          console.warn("New category "+categoryName+" specified for product "+product.get('name')+"!");
          // TODO ask user if hen wants to change category for this product
          // Create category if necessary
          // if (!db.categoryExists(categoryName)) {
          //   db.addCategory(categoryName);
          //   this.newSubList(categoryName);
          // }
        }
        // Product has ok category. Don't change db
        else {
          // Product has no category
          if (categoryName === '') {
            console.warn("No category specified for product "+product.get('name')+"!");
            // TODO add to empty category and sublist.
          }
          // Product has the right category. 
          else {
            console.log("Product has the right category");
            if (this.productExists(product)) {
              console.warn("Product has already been added to list!");
            }
            else {
              var item = new Item({name: productName, note: note});
              this.addItem(item, categoryName);
            }
            
          }

        }
      }
      // Product does not exist
      else {
        console.log("Product doesn't exist");
        if (!db.categoryExists(categoryName)) {
          console.log("Category doesn't exist");
          db.addCategory(categoryName);
          this.newSubList(categoryName);
        }
        // Add to db
        db.addProduct(productName, categoryName);
        // Add to list
        var item = new Item({name: productName, note: note});
        this.addItem(item, categoryName);
      }
    },
    // For debugging
    toString: function() {
      var str = "";
      this.get('subLists').forEach(function(subList) {
        str += subList.toString();
      });
      return str;
    },
    // Message functions
    showInfoMessage: function(msg) {
      this.set({messageStatus: 'info', message: msg});
      var that = this;
      window.setTimeout(function() {that.hideMessage();}, 2500); // Hide automatically
    },
    showWarningMessage: function(msg) {
      this.set({messageStatus: 'warning', message: msg});
    },
    showQuestionMessage: function(msg) {
      this.set({messageStatus: 'question', message: msg});
    },
    hideMessage: function() {
      this.set({message: ''});
    }
  })

  // Define view for shopping list

  ListView = Backbone.View.extend({
    tagName: 'div',
    template: Handlebars.compile($("#list-template").html()),
    initialize: function() {
      this.model.on('change', this.render, this);
    },
    render: function() {
      console.log("renderin. Message: ",this.model.get('message'));
      // 1: Give basic template
      this.$el.html(this.template(this.model.toJSON()));
      // 2:Add all subLists to .list
      var subLists = this.model.get('subLists');
      var list = this.$(".list");
      subLists.forEach(function(subList) {
        if (!subList.isEmpty()) {
          var catView = new SubListView({model: subList});
          list.append(catView.render().el);
        }
      }, this);
      // 3: initialize text field typeaheads
      var products = this.model.get('db').getProductNames();
      var categories = this.model.get('db').getCategoryNames();
      this.$("#name").typeahead({source: products});
      this.$("#category").typeahead({source: categories});

      return this;
    },

    events: {
      'click #newItem': 'newItem',
      'click .close': 'hideMessage',
      'change #name': 'nameChanged'
    },
    // Add new item. Get name/note/category, and add to model
    newItem: function() {
      var name = this.$el.find("#name").val();
      var note = this.$el.find("#note").val();
      if (note === '') note = undefined;
      var category = this.$el.find("#category").val();
      this.model.newItem(name, note, category);
      return false;
    },
    // When user has entered a product name, auto-complete category (if possible)
    nameChanged: function() {
      var productName = this.$("#name").val();
      var categoryName = this.model.get('db').getCategory(productName);
      if (categoryName) {
        // Auto-complete category name
        this.$("#category").val(categoryName);
      } else {
        // New category is about to be created, don't auto-complete anything
        // TODO tell user she is creating new category
      }
    },
    // When message close button is clicked
    hideMessage: function() {
      this.model.hideMessage();
    }
  });

  SubListView = Backbone.View.extend({
    tagName: 'div',
    className: 'category list-group',
    template: Handlebars.compile($("#subList-template").html()),
    initialize: function() {
      this.model.on('contentChanged', this.render, this);
    },
    render: function() {
      // 1: Give basic template
      this.$el.html(this.template(this.model.toJSON()));
      // 2: Loop through items collection (not the category itself)
      var items = this.model.get('items');
      items.forEach(function(item) {
        var view = new ItemView({model: item});
        this.$(".items").append(view.render().el);
      }, this);
      return this;
    }
  });

  ItemView = Backbone.View.extend({
    tagName: 'div',
    className: 'item list-group-item',
    template: Handlebars.compile($("#item-template").html()),
    initialize: function() {
      this.model.on('change', this.render, this);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },
    events: {
      'click .done': 'done'
    },
    // Remove item from list
    done: function() {
      this.model.done();
      return false;
    }
  });

}); // end document.ready