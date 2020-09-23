;(function ($) {

  let model = {
    planets: []
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getWorlds() {
    $.ajax({
      url: 'https://api.boundlexx.app/api/v1/worlds/?limit=10000',
      async: false,
      dataType: 'json',
      success: function(worldResponse) {
        model.planets = worldResponse.results;
      },
      error: function(worldError) {
        console.log('ERROR RETRIEVING WORLDS');
      }
    });
  }

  async function getBlocks() {
    for (const world of model.planets) {
      await sleep(100);
      $.getJSON('https://api.boundlexx.app/api/v1/worlds/' + world.id + '/block-colors/', function (colorsResponse) {
        console.log(colorsResponse);
      });
    }
  }

  $('#api-test-btn').click( function(event) {
    getWorlds();
    getBlocks();
  });
})(jQuery);
