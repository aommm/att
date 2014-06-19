$(document).ready(function() {

  // TODO
  // *. Add item: if already eit, update note
  // *. If category has changed, and was blank previously,
  //    Do not prompt!
  // *. Rename category
  // *. Remove category - set all related product's categories to ''
  // *. Remove product (if spelling mistake) - show red cross in autocomplete dropdown
  // *. Fix mobile
  // *. "Disappearing in 3..2..1.." for alerts
  // *. Rename product (hard? check for conflicts etc)
  // *. Message: do not use attributes, but trigger custom events instead
  //            (since changing attributes forces re-rendering, and model shouldn't have to remember text field values)

  // 1.
  // Ask user what should happen when category already exists
  // Use message system to do this
  // 2. Check so that empty category works all right
  // 3. Add 'administer categories' mode
  //    Allo different profile - no I ant to hop at ICA1
  //    A store contains product db as well as category info
  //    New store: Get product info from all stores - where category
  //               field differs, just leave it blank!

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
    // Updates the note of an item
    updateItem: function(name, note) {
      var item = this.getItem(name);
      item.set({note: note});
    },
    // Remove item(s) with specified name
    // Returns the removed items
    removeItem: function(name) {
      var item = this.getItem(name); // get item(s) with specified name,
      if (item) {
        return this.get('items').remove(item); // And remove them
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
      // TODO use 'name' as id of model instead
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
    // (Note: does not create db category)
    newSubList: function(categoryName) {
      var existingSubList = this.getSubList(categoryName);
      if (existingSubList) {
        console.warn("SubList "+categoryName+" already exists!");
      } else {
        var subList = new SubList({name: categoryName});
        this.get('subLists').add(subList);
      }
    },
    // Checks if the given product has been added to the list
    itemExists: function(productName, categoryName) {
      var subList = this.getSubList(categoryName);
      if (subList) {
        return !!subList.getItem(productName);
      }
    },
    // Adds an item to the correct sublist
    // Creates category/sublist if necessary
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
    // Updates an item with new information
    // Assumes item already exists in list
    // (newCategory: may pass null)
    updateItem: function(name, note, oldCategory, newCategory) {
      // Simple: update item note.
      if (newCategory === null) {
        console.log("Update note");
        // Get sublist, and update item
        var subList = this.getSubList(oldCategory);
        subList.updateItem(name, note);
      }
      // Advanced: update item category. Remove from one sublist, add to another
      else {
        console.log("Update category");
        // Get lists
        var oldSubList = this.getSubList(oldCategory)
          , newSubList = this.getSubList(newCategory);
        // Move from old to new
        oldSubList.removeItem(name);
        var item = new Item({name: name, note: note});
        newSubList.addItem(item);
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
          // Ask user what she wants to do (next in flow: changeCategory or resetCategory)
          this.showQuestion("You have changed the category of "+product.get('name')+" to "+categoryName+". Do you want to change to "+categoryName+", or use the old category "+product.get('category')+"?", "Continue using "+product.get('category'), "Change to "+categoryName);
          // Save change data in model (is later accessed by button callbacks)
          var data = {
                      productName: product.get('name'),
                      note:        note,
                      oldCategory: product.get('category'),
                      newCategory: categoryName
                    }
          this.set({changeCategory: data}, {silent: true});
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
            if (this.itemExists(productName, categoryName)) {
              this.updateItem(productName, note, categoryName, null); // Maybe update note (null: no new category)
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
    // Message functions (simply sends events to view)
    showInfoMessage: function(msg, delay) {
      this.trigger('showInfoMessage', msg);
      var that = this;
      window.setTimeout(function() {that.hideMessage();}, delay); // Hide automatically
    },
    showWarningMessage: function(msg) {
      this.trigger('showWarningMessage', msg);
    },
    showQuestion: function(msg, button1Text, button2Text) { // Shows a question, with two available answers
      this.trigger('showQuestion', msg, button1Text, button2Text);
    },
    hideMessage: function() {
      this.trigger('hideMessage');
    },

    // Changes the category of a product.
    // Updates database and list, and creates new things if necessary.
    //
    // Note: Do not call directly! Is called onClick from dialog.
    //       Uses data from 'changeCategory' attribute
    changeCategory: function() {
      console.log("Change category");
      var db   = this.get('db')
        , data = this.get('changeCategory');

      if (!db.categoryExists(data.newCategory)) {
        console.log("Category doesn't exist");
        db.addCategory(data.newCategory);
        this.newSubList(data.newCategory);
      }
      // Change in db
      db.changeProduct(data.productName, data.newCategory);
      
      // If item exists in list, update it
      if (this.itemExists(data.productName, data.oldCategory)) {
        this.updateItem(data.productName, data.note, data.oldCategory, data.newCategory);
      } 
      else { // Otherwise, add to list
        var item = new Item({name: data.productName, note: data.note});
        this.addItem(item, data.newCategory);        
      }
      this.hideMessage();
    },
    // Reset category of form to values from db
    resetCategory: function() {
      console.log("Reset category");
      var data = this.get('changeCategory');
      this.hideMessage();
      // Tell view to update
      this.trigger('updateFormCategory', data.oldCategory);
      
    }
  })

  // Define view for shopping list

  ListView = Backbone.View.extend({
    tagName: 'div',
    template: Handlebars.compile($("#list-template").html()),
    initialize: function() {
      this.model.on('change', this.render, this);
      this.model.on('updateFormCategory', this.updateFormCategory, this);
      // Create Message dialog view (model can control it using events)
      this.messageView = new MessageView({model: this.model});
      this.model.on('hideMessage', function() {this.messageView.hide();}, this);
      this.model.on('showInfoMessage', function(msg) {this.messageView.showInfo(msg);}, this);
      this.model.on('showWarningMessage', function(msg) {this.messageView.showWarning(msg);}, this);
      this.model.on('showQuestion', function(msg, btn1t, btn2t) {this.messageView.showQuestion(msg, btn1t, btn2t);}, this);
    },
    render: function() {
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
      
      // 3: Add MessageView to DOM
      this.$("#message").html(this.messageView.el);

      // 4: Get typeahead data
      var products = this.model.get('db').getProductNames();
      var categories = this.model.get('db').getCategoryNames();
      var productAdapter = Utils.createTypeaheadAdapter(products); // (Creates bloodhound etc)
      var categoryAdapter = Utils.createTypeaheadAdapter(categories);

      // 5: initialize typeaheads
      this.$("#name").typeahead({}, {
        displayKey: 'value',
        source: productAdapter
      });
      this.$("#category").typeahead({}, {
        displayKey: 'value',
        source: categoryAdapter
      });

      // Listen to events etc
      Utils.applyFormListeners(this.$("#name"), this.$("#note"));
      Utils.applyFormListeners(this.$("#category"), this.$("#newItem"));

      return this;
    },
    events: {
      'click #newItem': 'newItem',
      'change #name': 'nameChanged',
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
      // If db has entry for this product,
      if (categoryName) {
        // Auto-complete category name
        this.$("#category").val(categoryName);
      }
    },
    // Updates the form with a new category
    updateFormCategory: function(categoryName) {
      console.log("updating form cat",categoryName);
      this.$("#category").val(categoryName);
      this.$("#category").focus();
    }
  });

  // Message dialog, possibly with two buttons
  // Change its state by calling: hide, showInfo, showQuestion
  // Reports directly to List model when buttons are clicked
  MessageView = Backbone.View.extend({
    tagName: 'div',
    className: 'messageArea form-group',
    template: Handlebars.compile($("#message-template").html()),
    render: function(settings) {
      this.$el.html(this.template(settings));
      this.delegateEvents(); // (This is normally run from constructor,but MessageView is never re-created)
    },
    events: {
      'click .close': 'hideMessage',
      'click #changeCategory': 'changeCategory',
      'click #resetCategory': 'resetCategory'
    },
    // Methods for hiding/displatying/etc the message
    hide: function() {
      this.render({show: false});
    },
    showInfo: function(msg) {
      this.render({show: true, messageStatus: "info", message: msg});
    },
    showWarning: function(msg) {
      this.render({show: true, messageStatus: "warning", message: msg});
    },
    showQuestion: function(msg, btn1Text, btn2Text) {
      this.render({show: true, messageStatus: "question", message: msg, button1: btn1Text, button2: btn2Text});
    },
    // Callback fns, do not call directly
    changeCategory: function() {
      this.model.changeCategory();
      return false;
    },
    resetCategory: function() {
      this.model.resetCategory();
      return false;
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