Utils = {
  // Creates and returns a typeahead adapter,
  // to use as 'source' for twitter typeahead plugin.
  // 
  // @param list - a list of strings, e.g. ["New York", "Lund", "Uddevalla"]
  createTypeaheadAdapter: function(list, displayKey) {
    var engine = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'), // ?
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      // 'local' must be array of objects
      local: _(list).map(function(i) { return {value: i}; })
    });
    engine.initialize();
    return engine.ttAdapter();
  },


  // Applies form listeners to a specific element
  // (Makes sure 'enter' hops down to next text field, etc)
  // 
  // @param listView - the containing Backbone list view
  // @param thisEl - the el to setup listeners for
  // @param nextEl - the next element in the user's flow
  applyFormListeners: function(thisEl, nextEl) {

    // When an element is selected in the dropdown,
    // or when text field is autocompleted (user presses tab),
    thisEl.on('typeahead:selected typeahead:autocompleted', function() {
      // auto-complete category & move to next element
      $(this).trigger('change');
      nextEl.focus();
    });

    // When user presses "enter" within text box,
    // move to next element (do NOT submit)
    thisEl.keypress(function(e) {
      if (e.which === 13) {
        nextEl.focus();
        return false;
      }
    });

    // TODO when enter is pressed, trigger autocomplete somehow
  }

};