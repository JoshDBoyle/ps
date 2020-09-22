;(function ($) {
  let model = {
      'tutorialList': [],
      'discordList': [],
      'streamList': [],
      'youtubeChannelList': [],
      'usefulLinkList': [],
      'planets': []
    },
    items,
    colorMappings,
    colors;

  function getItemTitle(gameId) {
    let title = '';
    $.each(items.results, function(index, item) {
      if (item.game_id === gameId) {
        title = item.localization[0].name;
        return false;
      }
    });

    return title;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function cachedFetch(url, options) {
    let expiry = 15 * 60;
    if (typeof options === 'number') {
      expiry = options;
      options = undefined;
    } else if (typeof options === 'object') {
      expiry = options.seconds || expiry
    }

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

  function initializeSliiide() {
    $('#filter-sliiide').sliiide({
      toggle: '#filter-btn',
      exit_selector: "#close-filter-btn",
      animation_duration: "0.5s",
      place: "left",
      body_slide: false
    });
  }

  /**
   * Initializes content from Kentico Kontent
   */
  function initializeContent() {
    $.get("https://deliver.kontent.ai/a4f95819-8594-0090-4d5a-9046d8d19c69/items", function (data) {
      $.each(data.items, function (index, item) {
        let name = item.system.codename;
        if (name.includes('tutorial_')) {
          model.tutorialList.push(item.elements);
        } else if (name.includes('stream_')) {
          model.streamList.push(item.elements);
        } else if (name.includes('useful_link_')) {
          model.usefulLinkList.push(item.elements);
        } else if (name.includes('youtube_channel_')) {
          model.youtubeChannelList.push(item.elements);
        } else {
          model[name] = item.elements;
        }
      });
    });

    model.getPlanetType = function (id) {
      if (id) {
        let planet = {};
        for (let i = 0; i < model.planets.length; i++) {
          if (model.planets[i].id === id) {
            planet = model.planets[i];
            break;
          }
        }

        let creative = planet.is_creative,
            sovereign = planet.is_sovereign,
            exo = planet.is_exo;

        if (creative) {
          return 'Creative';
        } else if (sovereign) {
          return 'Sovereign';
        } else if (exo) {
          return 'Exo'
        } else {
          return 'Home';
        }

      } else {
        return '';
      }
    };

    model.getPlanetTier = function (id) {
      if (id) {
        let planet = {};
        for (let i = 0; i < model.planets.length; i++) {
          if (model.planets[i].id === id) {
            planet = model.planets[i];
            break;
          }
        }

        return 'T' + (planet.tier + 1);
      } else {
        return '';
      }
    };

    model.getPlanetAtmosphere = function (id) {
      if (id) {
        let planet = {};
        for (let i = 0; i < model.planets.length; i++) {
          if (model.planets[i].id === id) {
            planet = model.planets[i];
            break;
          }
        }

        return planet.world_type;
      } else {
        return '';
      }
    };
  }

  function initializeExplorer() {
    fetch('assets/js/data/color-mappings.json')
      .then(res => res.json())
      .then(data => {
        colorMappings = data;
        fetch('assets/js/data/colors.json')
          .then(res => res.json())
          .then(data => {
            colors = data;
            fetch('assets/js/data/items.json')
              .then(res => res.json())
              .then(data => {
                items = data;
                $(document).trigger('mappings-ready');
              })
              .catch(err => console.error(err));
          })
          .catch(err => console.error(err));
      })
      .catch(err => console.error(err));

    $(document).on('mappings-ready', function () {
      $.getJSON('https://api.boundlexx.app/api/v1/worlds/?limit=10000', function(worldResponse) {
        let count = 0;
        $.each(worldResponse.results, function (worldIndex, world) {
          model.planets.push(world);
          cachedFetch('https://api.boundlexx.app/api/v1/worlds/' + world.id + '/block-colors/')
            .then(r => r.json())
            .then(colorsResponse => {
              model.planets[worldIndex].colors = colorsResponse.block_colors;
              $.each(model.planets[worldIndex].colors, function (blockIndex, block) {
                block.color.color_name = colors[block.color.game_id];
                block.color.color_hex = colorMappings[block.color.game_id];
                block.color.color_id = block.color.game_id;
                for (let i = 0; i < items.count; i++) {
                  if (items.results[i].game_id === block.item.game_id) {
                    block.item.title = items.results[i].localization[0].name;
                    break;
                  }
                }
              });

              if (++count === worldResponse.results.length) {
                ko.applyBindings(model);

                $('.resource-btn').click(function(event) {
                  let planet = $(event.currentTarget).closest('.planet'),
                    planetId = $(planet).data('planet-id');

                  let $planetResources = $(planet).find('.planet-resources-card');
                  let $planetBlocks = $(planet).find('.planet-blocks-card');
                  if ($(planet).find('.planet-resources-card .resource-name').length <= 0) {
                    $.getJSON('https://api.boundlexx.app/api/v1/worlds/' + planetId + '/polls/latest/resources/', function (resourcesResponse) {
                      $planetResources.append('<h3>' + $(event.currentTarget).closest(".planet").find(".planet-name").text() + '</h3>');
                      $.each(resourcesResponse.resources.resources, function (index, resource) {
                        $planetResources.append('<div class="resource-row">' +
                          '  <div class="resource-name">' + getItemTitle(resource.item.game_id) + '</div>' +
                          '  <div class="resource-percent">' + resource.percentage + '%' + '</div>' +
                          '  <div class="resource-count">' + resource.count + '</div>' +
                          '</div>');
                      });
                    });
                  }

                  $planetBlocks.hide();
                  $planetResources.show();
                });

                $('.block-btn').click(function(event) {
                  let planet = $(event.currentTarget).closest('.planet'),
                      $planetResources = $(planet).find('.planet-resources-card'),
                      $planetBlocks = $(planet).find('.planet-blocks-card');

                  $planetBlocks.show();
                  $planetResources.hide();
                });

                $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
              }
            });
        });
      });
    });

    $('#planet-type').on('change', function(event) {
      $('.planet').each(function(index, planet) {
        if ($(event.currentTarget).val().toLowerCase() === 'all') {
          $(planet).show();
        } else if ($(planet).find('.planet-type').text().toLowerCase() === $(event.currentTarget).val().toLowerCase()) {
          $(planet).show();
        } else {
          $(planet).hide();
        }
      });

      $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
    });

    $('#planet-tier').on('change', function(event) {
      $('.planet').each(function(index, planet) {
        if ($(event.currentTarget).val().toLowerCase() === 'all') {
          $(planet).show();
        } else if ($(planet).find('.planet-tier').text().toLowerCase() === $(event.currentTarget).val().toLowerCase()) {
          $(planet).show();
        } else {
          $(planet).hide();
        }
      });

      $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
    });

    $('#planet-atmosphere').on('change', function(event) {
      $('.planet').each(function(index, planet) {
        if ($(event.currentTarget).val().toLowerCase() === 'all') {
          $(planet).show();
        } else if ($(planet).find('.planet-atmosphere').text().toLowerCase() === $(event.currentTarget).val().toLowerCase()) {
          $(planet).show();
        } else {
          $(planet).hide();
        }
      });

      $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
    });

    $('#color-search').on('input', function(event) {
      let searchTerm = $(event.currentTarget).val();

      $('.highlighted').removeClass('highlighted');

      if (searchTerm === '') {
        $('.planet').each(function(index, planet) {
          $(planet).show();
        });

        $('.data-bar .count').text($('.planet:visible').length + ' planets found...');

        return;
      }

      $('.planet').each(function(index, planet) {
        let visible = false;
        if ($(planet).find('.color').length > 0) {
          $(planet).find('.color').each(function (index, color) {
            if ($(color).text().toLowerCase().includes(searchTerm.toLowerCase())) {
              visible = true;

              $(color).closest('.color-row').find('.block, .color').addClass('highlighted');

              // Break out of the each loop
              return false;
            }
          });
        }

        if (visible) {
          $(planet).show();
        } else {
          $(planet).hide();
        }
      });

      $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
    });
  }

  $(document).mouseup(function(e) {
    let $container = $('.planet-resources');
    if (!$container.is(e.target) && $container.has(e.target).length === 0) {
      $container.fadeOut(500);
    }
  });

  initializeContent();
  initializeExplorer();
  initializeSliiide();

})(jQuery);
