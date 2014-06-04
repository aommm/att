$(document).ready(function() {


	// Instantiate model

	var list = new List();

	var vegetableCategory = new Category({name: 'grönsaker'});
  vegetableCategory.addItem(new Item({name: 'morötter'}));
  vegetableCategory.addItem(new Item({name: 'potatis'}));
  vegetableCategory.addItem(new Item({name: 'zucchinisar'}));

  var dairyCategory = new Category({name: 'mejeri'});
  dairyCategory.addItem(new Item({name: 'mjölk'}));
  dairyCategory.addItem(new Item({name: 'ägg'}));
  dairyCategory.addItem(new Item({name: 'smör'}));

  var meatCategory = new Category({name: 'Kött'});

	list.addCategory(vegetableCategory);
  list.addCategory(dairyCategory);
	list.addCategory(meatCategory);

	// Instantiate view
	var listView = new ListView({model: list});

	// Add to DOM
	listView.render();
	$("#app").html(listView.el);

});

// TODO När produktdatabas finns: redigera kategori på produkter
