;(function ($) {
  $('#api-test-btn').click(function(event) {
    $.getJSON('https://api.boundlexx.app/api/v1/worlds/?limit=10000', function(worldResponse) {
      $.each(worldResponse.results, function (worldIndex, world) {
        $.getJSON('https://api.boundlexx.app/api/v1/worlds/' + world.id + '/block-colors/', function (colorsResponse) {
          console.log(colorsResponse);
        });
      });
    });
  });
})(jQuery);
