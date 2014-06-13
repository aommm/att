$(document).ready(function() {


	// Instantiate db

  window.db = new Database();
  db.addCategory('grönsaker');
  db.addCategory('mejeri');
  db.addCategory('kött');
  db.addProduct('morötter', 'grönsaker');
  db.addProduct('potatis', 'grönsaker');
  db.addProduct('zucchinisar', 'grönsaker');
  db.addProduct('mjölk', 'mejeri');
  db.addProduct('ägg', 'mejeri');
  db.addProduct('smör', 'mejeri');

  // Instantiate list
	window.list = new List({db: db});

	list.newSubList('grönsaker');
  list.newSubList('mejeri');
	list.newSubList('kött');

  window.list.newItem('morötter', null, "grönsaker");

  // vegetableSubList.addItem(new Item({name: 'potatis'}));
  // vegetableSubList.addItem(new Item({name: 'zucchinisar'}));

  // dairySubList.addItem(new Item({name: 'mjölk'}));
  // dairySubList.addItem(new Item({name: 'ägg'}));
  // dairySubList.addItem(new Item({name: 'smör'}));

	// Instantiate view
	var listView = new ListView({model: list});

	// Add to DOM
	listView.render();
	$("#app").html(listView.el);

});

// TODO När produktdatabas finns: redigera kategori på produkter
