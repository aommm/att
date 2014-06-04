$(document).ready(function() {

  ////
  // Shopping list module
  // Shows a list of items, and allows them to be ticked off
  ////

  ////
  // -- Things --
  // List: consists of many categories
  // Category: consists of many items
  // Item: an item in the shopping list

  // An item in the shopping list
  Item = Backbone.Model.extend({
    defaults: {
      name: ''
    },
    done: function() {
      // Send remove event to our category
      this.trigger('done', this.get('name'));
    }
  });

  // A category can contain many items
  Items = Backbone.Collection.extend({
    model: Item
  });
  Category = Backbone.Model.extend({
    initialize: function() {
      this.items = new Items();
      this.items.on('add remove', function() {this.trigger('change')}, this); // When underlying collection changes, trigger event
    },
    defaults: {
      name: ''
    },
    // Is this category empty?
    isEmpty: function() {
      return this.items.isEmpty();
    },
    // Add a new item to this category
    addItem: function(item) {
      item.on('done', this.removeItem, this);
      this.items.add(item);
    },
    // Remove item(s) with specified name
    removeItem: function(name) {
      console.log("remove item", name);

      // get item(s) with specified name
      var item = this.items.filter(function(p) {
        return p.get('name') == name;
      });
      // Remove them
      this.items.remove(item);
    }
  });

  // A list contains many categories
  Categories = Backbone.Collection.extend({
    collection: Category
  });
  List = Backbone.Model.extend({
    initialize: function() {
      this.categories = new Categories();
    },

    // Add a new category to list
    addCategory: function(category) {
      var categories = this.categories.filter(function(c) {
        return c.get('name') == category.get('name');
      });
      if (categories.length > 0) {
        console.warn("Category "+category.get('name')+" already exists!");
      } else {
        this.categories.add(category);
      }
    },
    // Create new item, and add to list
    newItem: function(name, note, categoryName) {
      // Find category
      var categories = this.categories.filter(function(c) {
        return c.get('name') == categoryName;
      });
      if (categories.length == 0) {
        console.warn("Category "+categoryName+" not found!");
      } else if (categories.length > 1) {
        console.warn("Category "+categoryName+" found multiple times!");
      } 
      else { // Create item, and add to category
        var category = categories[0];
        var item = new Item({name: name, note: note});
        category.addItem(item);
      }
    }
  })

  // Define view for shopping list

  ListView = Backbone.View.extend({
    tagName: 'div',
    template: Handlebars.compile($("#list-template").html()),
    render: function() {
      // 1: Give basic template
      this.$el.html(this.template());
      // 2:Add all categories to .list
      var categories = this.model.categories;
      var list = this.$(".list");
      categories.forEach(function(category) {
        if (!category.isEmpty()) {
          var catView = new CategoryView({model: category});
          list.append(catView.render().el);
        }
      }, this);
      // 3: initialize js components
      // TODO do not hard code
      this.$("#category").typeahead({source: ["grönsaker", "mejeri"]});

      return this;
    },

    events: {
      'click #newItem': 'newItem'
    },
    // Add new item. Get name/note/category, and add to model
    newItem: function() {
      var name = this.$el.find("#name").val();
      var note = this.$el.find("#note").val();
      if (note === '') note = undefined;
      var category = this.$el.find("#category").val();
      this.model.newItem(name, note, category);
      return false;
    }
  });

  CategoryView = Backbone.View.extend({
    tagName: 'div',
    className: 'category list-group',
    template: Handlebars.compile($("#category-template").html()),
    initialize: function() {
      this.model.on('change', this.render, this);
    },
    render: function() {
      // 1: Give basic template
      this.$el.html(this.template());
      // 2: Loop through items collection (not the category itself)
      var items = this.model.items;
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