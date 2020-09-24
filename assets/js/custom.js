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

  // Set cache expiration to 4 hours
  let expiry = 240 * 60;

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

    model.getPlanetRegion = function (id) {
      if (id) {
        let planet = {};
        for (let i = 0; i < model.planets.length; i++) {
          if (model.planets[i].id === id) {
            planet = model.planets[i];
            break;
          }
        }

        return planet.region;
      } else {
        return '';
      }
    };
  }

  function finalize() {
    ko.applyBindings(model);

    $('.planet').show();

    $('.resource-btn').click(function(event) {
      let planet = $(event.currentTarget).closest('.planet'),
        planetId = $(planet).data('planet-id');

      let $planetResources = $(planet).find('.planet-resources-card');
      let $planetBlocks = $(planet).find('.planet-blocks-card');
      if ($(planet).find('.planet-resources-card .resource-name').length <= 0) {
        $.getJSON('https://api.boundlexx.app/api/v1/worlds/' + planetId + '/polls/latest/resources/', function (resourcesResponse) {
          $planetResources.append('<h3>' + $(event.currentTarget).closest(".planet").find(".planet-name").text() + '</h3>');
          $planetResources.append('<div class="embedded-resources"><h4>Embedded Resources</h4></div>');
          $planetResources.append('<div class="surface-resources"><h4>Surface Resources</h4></div>');
          $.each(resourcesResponse.resources.resources, function (index, resource) {
            let $rowLocation = resource.is_embedded ? $planetResources.find('.embedded-resources') : $planetResources.find('.surface-resources');
            $rowLocation.append('<div class="resource-row">' +
              '  <div class="resource-name">' + getItemTitle(resource.item.game_id) + '</div>' +
              '  <div class="resource-percent">' + resource.percentage + '%' + '</div>' +
              '  <div class="resource-count">' + resource.count + '</div>' +
              '  <div class="resource-avg-per-chunk">' + resource.average_per_chunk + '</div>' +
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

  function getWorlds() {
    $.ajax({
      url: 'https://api.boundlexx.app/api/v1/worlds/?limit=10000',
      async: false,
      dataType: 'json',
      success: function(worldResponse) {
        model.planets = worldResponse.results;
        $(document).trigger('worlds-ready');
      },
      error: function(worldError) {
        console.log('ERROR RETRIEVING WORLDS: ' + worldError);
      }
    });
  }

  function buildWorldColors(world) {
    $.each(world.colors, function (blockIndex, block) {
      block.color.color_name = colors[block.color.game_id];
      block.color.color_hex = colorMappings[block.color.game_id];
      block.color.color_id = block.color.game_id;

      // For each item that we have loaded from our mappings, set the item title for the block
      for (let i = 0; i < items.count; i++) {
        if (items.results[i].game_id === block.item.game_id) {
          block.item.title = items.results[i].localization[0].name;
          break;
        }
      }
    });
  }

  async function getBlocks() {
    // At this point, the worlds have been retrieved and stuffed in model.planets
    let worldIndex = 0;

    // For each planet
    for (const world of model.planets) {
      let cacheKey = 'https://api.boundlexx.app/api/v1/worlds/' + world.id + '/block-colors/';
      let cached = localStorage.getItem(cacheKey);
      let whenCached = localStorage.getItem(cacheKey + ':ts');

      if (cached !== null && whenCached !== null && ((Date.now() - whenCached) / 1000) < expiry) {
        world.colors = JSON.parse(cached);

        // For each block color, set the name, hex and id for ease of reference
        buildWorldColors(world);

      } else {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheKey + ':ts');

        await sleep(40);

        // Get the block colors for the current planet
        $.ajax({
          url: cacheKey,
          dataType: 'json',
          success: function (colorsResponse) {
            world.colors = colorsResponse.block_colors;

            // For each block color, set the name, hex and id for ease of reference
            buildWorldColors(world);

            localStorage.setItem(cacheKey, JSON.stringify(world.colors));
            localStorage.setItem(cacheKey + ':ts', Date.now());
          }
        });
      }

      // If our pre-incremented world index equals the number of planets we have then let's finalize
      if (++worldIndex === model.planets.length) {
        $('.data-bar .count').text('Rendering planet grid...');
        $(document).trigger('blocks-ready');
      } else {
        $('.data-bar .count').text('Loaded ' + (worldIndex + 1) + ' of ' + model.planets.length + ' planets...');
      }
    }
  }

  function initializeExplorer() {
    $('.data-bar .count').text('Loading content...');
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
      $('.data-bar .count').text('Retrieving worlds...');
      getWorlds();
    });

    $(document).on('worlds-ready', function () {
      $('.data-bar .count').text('Retrieving block data...');
      getBlocks();
    });

    $(document).on('blocks-ready', function () {
      finalize();
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

    $('#planet-region').on('change', function(event) {
      $('.planet').each(function(index, planet) {
        if ($(event.currentTarget).val().toLowerCase() === 'all') {
          $(planet).show();
        } else if ($(planet).find('.planet-region').text().toLowerCase() === $(event.currentTarget).val().toLowerCase()) {
          $(planet).show();
        } else {
          $(planet).hide();
        }
      });

      $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
    });

    $('#block-search').on('input', function(event) {
      let searchTerm = $(event.currentTarget).val();

      if (searchTerm === '') {
        $('.planet').each(function(index, planet) {
          $(planet).find('.color-row').show();
          $(planet).show();
        });

        $('.data-bar .count').text($('.planet:visible').length + ' planets found...');

        return;
      }

      $('.planet .color-row .block').each(function(index, block) {
        if ($(block).text().toLowerCase().includes(searchTerm.toLowerCase())) {
          $(block).parent().show();
        } else {
          $(block).parent().hide();
        }
      });

      $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
    });

    $('#color-search').on('input', function(event) {
      let searchTerm = $(event.currentTarget).val();

      if (searchTerm === '') {
        $('.planet').each(function(index, planet) {
          $(planet).find('.color-row').show();
          $(planet).show();
        });

        $('.data-bar .count').text($('.planet:visible').length + ' planets found...');

        return;
      }

      $('.planet .color-row .color').each(function(index, color) {
        if ($(color).text().toLowerCase().includes(searchTerm.toLowerCase())) {
          $(color).parent().show();
        } else {
          $(color).parent().hide();
        }
      });

      $('.planet').each(function(index, planet) {
        if ($(planet).find('.color-row:visible').length > 0) {
          $(planet).show();
        } else {
          $(planet).hide();
        }
      });

      $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
    });

    $('#name-search').on('input', function(event) {
      let searchTerm = $(event.currentTarget).val();

      if (searchTerm === '') {
        $('.planet').each(function(index, planet) {
          $(planet).show();
        });

        $('.data-bar .count').text($('.planet:visible').length + ' planets found...');

        return;
      }

      $('.planet').each(function(index, planet) {
        let visible = false;
        if ($(planet).find('.planet-name').length > 0) {
          $(planet).find('.planet-name').each(function (index, name) {
            if ($(name).text().toLowerCase().includes(searchTerm.toLowerCase())) {
              visible = true;

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
