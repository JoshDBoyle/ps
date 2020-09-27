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
    colors,
    $leftNav = $('#left-nav');

  function showWaitOverlay() {
    $.LoadingOverlay("show", {
      image       : "",
      fontawesome : "fa fa-spinner fa-spin",
      fontawesomeColor: 'white',
      background: "rgba(0, 0, 0, 0.0)"
    });
  }

  function hideWaitOverlay() {
    $.LoadingOverlay("hide");
  }

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
          if (moment().isBefore(moment(planet.end))) {
            return 'Active Exo'
          } else {
            return 'Past Exo'
          }
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

    model.getItemTitle = function (gameId) {
      let title = '';
      $.each(items.results, function(index, item) {
        if (item.game_id === gameId) {
          title = item.localization[0].name;
          return false;
        }
      });

      return title;
    }
  }

  function finalize() {
    ko.applyBindings(model);

    hideWaitOverlay();

    $('.planet').show();

    $('.resource-btn').click(function(event) {
      let planet = $(event.currentTarget).closest('.planet');

      let $planetResources = $(planet).find('.planet-resources-card'),
        $planetBlocks = $(planet).find('.planet-blocks-card'),
        $planetData = $(planet).find('.planet-data-card');

      $planetBlocks.hide();
      $planetData.hide();
      $planetResources.show();
    });

    $('.block-btn').click(function(event) {
      let planet = $(event.currentTarget).closest('.planet'),
        $planetResources = $(planet).find('.planet-resources-card'),
        $planetBlocks = $(planet).find('.planet-blocks-card'),
        $planetData = $(planet).find('.planet-data-card');

      $planetResources.hide();
      $planetData.hide();
      $planetBlocks.show();
    });

    $('.data-btn').click(function(event) {
      let planet = $(event.currentTarget).closest('.planet'),
        $planetResources = $(planet).find('.planet-resources-card'),
        $planetBlocks = $(planet).find('.planet-blocks-card'),
        $planetData = $(planet).find('.planet-data-card');

      $planetResources.hide();
      $planetBlocks.hide();
      $planetData.show();
    });

    $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
  }

  function getWorlds() {
    let request = new XMLHttpRequest();

    request.open("GET", 'https://api.boundlexx.app/api/v1/worlds/dump/', true);
    request.responseType = "arraybuffer";

    request.onload = function () {
      let arrayBuffer = request.response;
      if (arrayBuffer) {
        let byteArray = new Uint8Array(arrayBuffer);
        model.planets = msgpack.deserialize(byteArray);
        $(document).trigger('worlds-ready');
      }
    };

    request.send(null);
  }

  function buildWorldColors(world) {
    $.each(world.block_colors, function (blockIndex, block) {
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

  function getBlocks() {
    for (const world of model.planets) {
      buildWorldColors(world);
    }

    $('.data-bar .count').text('Rendering planet grid...');
    $(document).trigger('blocks-ready');
  }

  function evaluateColor(planet) {
    let searchTerm = $('#color-search').val();
    if (searchTerm.length < 3) {
      $(planet).find('.color-row').show();
      return true;
    }

    $(planet).find('.color-row .color').each(function(index, color) {
      if ($(color).text().toLowerCase().includes(searchTerm.toLowerCase())) {
        $(color).parent().show();
      } else {
        $(color).parent().hide();
      }
    });

    return $(planet).find('.color-row:visible').length > 0;
  }

  function evaluateFilters() {
    for (const planet of $('.planet')) {
      let typeMatch       = $('#planet-type').val() === 'all'       || $(planet).find('.planet-type').text().toLowerCase() === $('#planet-type').val().toLowerCase();
      let tierMatch       = $('#planet-tier').val() === 'all'       || $(planet).find('.planet-tier').text().toLowerCase() === $('#planet-tier').val().toLowerCase();
      let atmosphereMatch = $('#planet-atmosphere').val() === 'all' || $(planet).find('.planet-atmosphere').text().toLowerCase() === $('#planet-atmosphere').val().toLowerCase();
      let regionMatch     = $('#planet-region').val() === 'all'     || $(planet).find('.planet-region').text().toLowerCase() === $('#planet-region').val().toLowerCase();
      let visitableMatch  = $('#planet-visitable').val() === 'all'  || $(planet).find('.canvisit').text().toLowerCase() === $('#planet-visitable').val().toLowerCase();
      let colorMatch      = evaluateColor(planet);

      if (typeMatch && tierMatch && atmosphereMatch && regionMatch && visitableMatch && colorMatch) {
        $(planet).show();
      } else {
        $(planet).hide();
      }
    }

    $('.data-bar .count').text($('.planet:visible').length + ' planets found...');
  }

  function evaluateSorting(resource) {
    let $grid = $('.planet-grid');
    let $planets = $('.planet');

    let sorted = $planets.sort(function (a, b) {
        let aResourceNameNode = $(a).find('.planet-resources-card .resource-name:contains(' + resource + ')'),
          bResourceNameNode = $(b).find('.planet-resources-card .resource-name:contains(' + resource + ')'),
          aNum,
          bNum;

      if (aResourceNameNode) {
        let aPercentText = aResourceNameNode.next().text();
        aNum = parseFloat(aPercentText.substr(0, aPercentText.indexOf('%')));
      } else {
        aNum = 0.0;
      }

      if (bResourceNameNode) {
        let bPercentText = bResourceNameNode.next().text();
        bNum = parseFloat(bPercentText.substr(0, bPercentText.indexOf('%')));
      } else {
        bNum = 0.0;
      }

      return aNum > bNum;
    });

    $grid.html(sorted);
  }

  $('#sort-type').on('change', function(event) {
    showWaitOverlay();
    evaluateSorting();
    hideWaitOverlay();
  });

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
      $('.data-bar .count').text('Rendering world grid...');
      finalize();
    });

    $('#planet-type').on('change', function(event) {
      evaluateFilters();
    });

    $('#planet-tier').on('change', function(event) {
      evaluateFilters();
    });

    $('#planet-atmosphere').on('change', function(event) {
      evaluateFilters();
    });

    $('#planet-region').on('change', function(event) {
      evaluateFilters();
    });

    $('#planet-visitable').on('change', function(event) {
      evaluateFilters();
    });

    $('#color-search').on('input', function(event) {
      evaluateFilters();
    });
  }

  $('#left-nav #close-filter-btn').click(function(event) {
    $leftNav.animate({ 'left': -375 })
  });

  $('#filter-btn').click(function(event) {
    $leftNav.animate({ 'left': 0 });
    $leftNav.find('.filter-section').show();
    $leftNav.find('.sort-section').hide();
  });

  $('#sort-btn').click(function(event) {
    $leftNav.animate({ 'left': 0 });
    $leftNav.find('.filter-section').hide();
    $leftNav.find('.sort-section').show();
  });

  $(document).mouseup(function(e) {
    if (!$leftNav.is(e.target) && $leftNav.has(e.target).length === 0) {
      if ($leftNav.position().left === 0) {
        $leftNav.animate({'left': -375});
      }
    }
  });

  $('#watcher-btn').click(function(event) {
    $('.watcher-bg').show();
    $('#close-watcher-btn').click(function(event) {
      $('.watcher-bg').hide();
      $('body').removeClass('noscroll');
      $('.planet-grid').removeClass('noscroll');
    });

    $('#watcher #block-type').on('change', function(event) {
      showWaitOverlay();

      let value = $(event.currentTarget).val();
      if (value !== '') {
        $.ajax({
          url: 'https://api.boundlexx.app/api/v1/items/' + value + '/sovereign-colors/?limit=255',
          dataType: 'json',
          success: function(response) {
            $('body').addClass('noscroll');
            $('.planet-grid').addClass('noscroll');
            $('.watcher-colors').empty();
            for (const color of response.results) {
              $('.watcher-colors').append('<div class="watcher-color-name">' +
                colors[color.color.game_id] + ' (' + color.color.game_id + ')' +
                '</div>' +
                '<div class="watcher-color-hex">' +
                colorMappings[color.color.game_id] +
                '</div>');
              $('.watcher-color-hex:last-of-type').css('background-color', colorMappings[color.color.game_id]);
            }

            hideWaitOverlay();
          },
          error: function() {
            console.log('Failed to retrieve block colors');
            hideWaitOverlay();
          }
        })
      }
    });
  });

  showWaitOverlay();
  initializeContent();
  initializeExplorer();

})(jQuery);
