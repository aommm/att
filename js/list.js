$(document).ready(function() {

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
    initialize: function() {
      // When underlying collection changes, SubList changes also
      this.get('items').on('add remove', function() {this.trigger('change');}, this);
    },
    // Is this category empty?
    isEmpty: function() {
      return this.get('items').isEmpty();
    },
    // Add a new item to this category
    addItem: function(item) {
      console.log("adding ",item.toJSON(), "to category", this.get('name'));
      item.on('done', this.removeItem, this);
      this.get('items').add(item);
    },
    // Remove item(s) with specified name
    removeItem: function(name) {
      // get item(s) with specified name
      var item = this.get('items').filter(function(item) {
        return item.get('name') === name;
      });
      // Remove them
      this.get('items').remove(item);
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
        db: null
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
    // Add a new category to list
    addSubList: function(subList) {
      var subLists = this.get('subLists').filter(function(sl) {
        return sl.get('name') === subList.get('name');
      });
      if (subLists.length > 0) {
        console.warn("SubList "+subList.get('name')+" already exists!");
      } else {
        this.get('subLists').add(subList);
      }
    },
    // Create new item, and add to list
    newItem: function(name, note, categoryName) {
      // TODO WIP
      // Find sublist
      // New category?
      //   add to db, add sublist, etc
      var subLists = this.get('subLists').filter(function(sl) {
        return sl.get('name') == categoryName;
      });
      if (subLists.length == 0) {
        console.warn("SubList "+categoryName+" not found!");
      } else if (subLists.length > 1) {
        console.warn("SubList "+categoryName+" found multiple times!");
      }
      else { // Create item, and add to category
        var category = subLists[0];
        var item = new Item({name: name, note: note});
        category.addItem(item);
      }
    },
    // For debugging
    toString: function() {
      var str = "";
      this.get('subLists').forEach(function(subList) {
        str += subList.toString();
      });
      return str;
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
      // 1: Give basic template
      this.$el.html(this.template());
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
    }
  });

  SubListView = Backbone.View.extend({
    tagName: 'div',
    className: 'category list-group',
    template: Handlebars.compile($("#category-template").html()),
    initialize: function() {
      this.model.on('contentChanged', this.render, this);
    },
    render: function() {
      // 1: Give basic template
      this.$el.html(this.template());
      // 2: Loop through items collection (not the category itself)
      var items = this.model.get('items');
      items.forEach(function(item) {
        var view = new ItemView({model: item});
        this.$el.append(view.render().el);
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