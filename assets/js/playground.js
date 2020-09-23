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

function cachedFetch(url, options) {
  let cacheKey = url;
  let cached = localStorage.getItem(cacheKey);
  let whenCached = localStorage.getItem(cacheKey + ':ts');
  if (cached !== null && whenCached !== null) {
    let age = (Date.now() - whenCached) / 1000;
    if (age < expiry) {
      let response = new Response(new Blob([cached]));
      return Promise.resolve(response)
    } else {
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheKey + ':ts')
    }
  }

  return fetch(url, options).then(response => {
    if (response.status === 200) {
      let ct = response.headers.get('Content-Type')
      if (ct && (ct.match(/application\/json/i) || ct.match(/text\//i))) {
        response.clone().text().then(content => {
          localStorage.setItem(cacheKey, content)
          localStorage.setItem(cacheKey+':ts', Date.now())
        })
      }
    }

    return response;
  });
}
