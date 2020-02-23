(function($) {

  function ContentModel() {
    this.content = {
      'hero_homepage.title.value': '',
      'hero_homepage.description.value': '',
      'homepage_section_1.title.value': '',
      'homepage_section_1.body.value': '',
      'homepage_section_2.title.value': '',
      'homepage_section_2.body.value': '',
      'guidelines_section_1.title.value': '',
      'guidelines_section_1.body.value': '',
      'guidelines_section_2.title.value': '',
      'guidelines_section_2.body.value': '',
      'farm_locations_section_1.title.value': '',
      'farm_locations_section_1.subtitle.value': '',
      'farm_locations_section_1.body.value': '',
      'network_map_section_1.title.value': '',
      'network_map_section_1.body.value': '',
      'network_map_section_2.title.value': '',
      'network_map_section_2.body.value': '',
      'network_map.image.value.url': '',
      'network_map.image.value.description': '',
      'blinksecs.image.value.url': '',
      'blinksecs.image.value.description': ''
    };
  }

  var model = new ContentModel();
  $.get("https://deliver.kontent.ai/a4f95819-8594-0090-4d5a-9046d8d19c69/items", function(data) {
    $.each(data.items, function(index, item) {
      model.content[item.system.codename] = item.elements;
    });
  }).done(function () {
    ko.applyBindings(model);
  });

})(jQuery);
