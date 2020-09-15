;(function($) {
  var model = {
    'tutorialList': [],
    'discordList': [],
    'streamList': [],
    'youtubeChannelList': [],
    'usefulLinkList': [],
    'planets': [],
    'items': [],
    }, items,
      colorMappings,
      colors,
      regions,
      planetSwiper,
      orders = [];

  fetch('assets/js/data/items.json')
    .then(res => res.json())
    .then(data => {
      items = data
    })
    .then(function () {
      initShopping();
    })
    .catch(err => console.error(err));

  fetch('assets/js/data/color-mappings.json')
    .then(res => res.json())
    .then(data => { colorMappings = data })
    .catch(err => console.error(err));

  fetch('assets/js/data/colors.json')
    .then(res => res.json())
    .then(data => { colors = data })
    .catch(err => console.error(err));

  fetch('assets/js/data/regions.json')
    .then(res => res.json())
    .then(data => { regions = data })
    .catch(err => console.error(err));

  function initShopping() {
    $("#shop").autocomplete({
      minLength: 3,
      source: items,
      focus: function (event, ui) {
        $("shop").val(ui.item.label);
        return false;
      },
      select: function (event, ui) {
        $("#shop").text(ui.item.label);
      }
    }).autocomplete("instance")._renderItem = function (ul, item) {
      return $("<li>")
        .append("<div>" + item.label + "</div>")
        .appendTo(ul);
    };
  }

  function initPlanetExplorer() {
    planetSwiper = new Swiper ('.swiper-container', {
      direction: 'horizontal',
      loop: false,
      observer: true,
      observeParents: true,
      cache: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      simulateTouch: false,
      freeModeSticky: true,
      watchSlidesProgress: true,
      watchSlidesVisibility: true
    });

    function filterOnPlanetType() {
      // Get planet type to filter on
      let planetType = $('#planet-type').val();

      if (planetType === "all") {
        $('.planet-slide').removeClass("non-swiper-slide").addClass("swiper-slide filter-match").show();
      } else if (planetType === 'homeworld' || planetType === 'exoworld') {
        $('.planet-slide').not("[data-planet-type='" + planetType + "']").addClass("non-swiper-slide").removeClass("filter-match swiper-slide").hide();
        $("[data-planet-type='" + planetType + "']").removeClass("non-swiper-slide").addClass("swiper-slide filter-match").attr("style", null).show();
      } else if (planetType === 'active') {
        let $all = $('.planet-slide');
        let $exos = $(".swiper-wrapper div[data-planet-type='exoworld']");

        $all.removeClass("swiper-slide filter-match").addClass('non-swiper-slide').hide();
        $exos.removeClass('non-swiper-slide').addClass("swiper-slide filter-match").show();

        $exos.each(function(index, planet) {
          const now = new Date();
          const secondsSinceEpoch = Math.round(now.getTime() / 1000);

          let planetTime = planet.getAttribute('data-death').split(',')[1];

          if (planetTime <= secondsSinceEpoch) {
            $(planet).removeClass('swiper-slide filter-match').addClass('non-swiper-slide').hide();
          } else {
            $(planet).removeClass('non-swiper-slide ').addClass('swiper-slide filter-match').show();
          }
        });
      }
    }

    function filterOnPlanetName() {
      let searchTerm = $('#planet-search').val();

      if (searchTerm && searchTerm.length > 0) {
        $('.filter-match').each(function () {
          let visible = false,
            namesPerSlide = $(this).find(".planet-header-left h2");

          $(namesPerSlide).each(function () {
            if ($(this).text().toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              visible = true;
              return false;
            }
          });

          if (visible) {
            $(this).removeClass('non-swiper-slide').addClass('swiper-slide filter-match').show();
          } else {
            $(this).removeClass('swiper-slide filter-match').addClass('non-swiper-slide').hide();
          }
        });
      }
    }

    function filterOnColor() {
      let searchTerm = $('#color-search').val(),
          searchType = $('#color-search-type').val();

      $('.planet-slide tbody').each(function(index, tbody) {
        $(tbody).find('tr').css('display', 'none');
        if (searchType === 'all') {
          $(tbody).find('tr').css('display', 'table-row');
        } else {
          $(tbody).find('tr.' + searchType).css('display', 'table-row');
        }
      });

      if (searchTerm && searchTerm.length > 0) {
        $('.filter-match').each(function () {
          let visible = false,
            secondTdsPerSlide;

          if (searchType === 'all' || searchType === '') {
            secondTdsPerSlide = $(this).find("td:nth-of-type(2)");
          } else {
            secondTdsPerSlide = $(this).find("tr[data-block-type='" + searchType + "'] td:nth-of-type(2)");
          }

          $(secondTdsPerSlide).each(function () {
            if ($(this).text().toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              visible = true;
              return false;
            }
          });

          if (visible) {
            $(this).removeClass('non-swiper-slide').addClass('swiper-slide filter-match').show();
          } else {
            $(this).removeClass('swiper-slide filter-match').addClass('non-swiper-slide').hide();
          }
        });
      }
    }

    // Planet type filter
    $(".filters #planet-type, .filters #color-search-type").on("change", function() {
      filterOnPlanetType();
      filterOnPlanetName();
      filterOnColor();

      planetSwiper.update();
      planetSwiper.slideTo(0);
    });

    // Color search filter
    $(".filters #color-search, .filters #planet-search").on('keyup', function (e) {
      if (e.keyCode === 13) {
        e.preventDefault();

        filterOnPlanetType();
        filterOnPlanetName();
        filterOnColor();

        planetSwiper.update();
        planetSwiper.slideTo(0);

        return false;
      }
    });
  }

  /**
   * Initializes the gapi.client and calls sheets for the planetModel
   */
  function initializeGapi() {
    // Initializes the client with the API key and the Translate API.
    gapi.client.init({
      'apiKey': 'AIzaSyD8U-s4VcgBHNfvR4aztOwWaVjHaFe9Q3o',
      'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    }).then(function() {
      return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1yT1Fqepw5YjiO5O_5SzruRrSQFBzO2PsY5rwzTaXRBc',
        range: 'buwecDBcore!A:BH',
      });
    }).then(function(response) {
      model.planets = response.result.values;
      model.planets.splice(0, 1);
    }, function(reason) {
      console.log('Error: ' + reason);
    }).then(function () {
      // gapi is initialized so let's get our content now
      $.get("https://deliver.kontent.ai/a4f95819-8594-0090-4d5a-9046d8d19c69/items", function(data) {
        $.each(data.items, function(index, item) {
          var name = item.system.codename;
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
      }).done(function () {
        model.getColorName = function(value) {
          if (value) {
            var arr = value.split(',');
            return colors['' + arr[0]] + ' (' + arr[0] + ')';
          } else {
            return '';
          }
        };

        model.getColorHex = function(value) {
          if (value) {
            var arr = value.split(',');
            return colorMappings['' + arr[0]];
          } else {
            return '';
          }
        };

        model.getRegion = function(value) {
          if (value) {
            return regions['' + value];
          } else {
            return '';
          }
        };

        model.getVerified = function(value) {
          if (value) {
            let arr = value.split(',');
            return arr[1] === 'True' ? '<i style=\"color: green; font-size: 28px;\" class=\"fa fa-check\"></i>' : '<i style=\"color: lightgrey; font-size: 28px;\" class=\"fa fa-question\"></i>';
          } else {
            return '<i style=\"color: lightgrey; font-size: 28px;\" class=\"fa fa-question\"></i>';
          }
        };

        model.getNew = function(value) {
          if (value) {
            let arr = value.split(',');
            return arr.length >= 3 && arr[2] === 'True' ? '<i style=\"color: green; font-size: 28px;\" class=\"fa fa-search-plus\"></i>' : '';
          } else {
            return '';
          }
        };

        ko.applyBindings(model);

        window.dispatchEvent(new Event('data-ready'));

        document.getElementById("bgVideo").load();
      });
    }).then(function() {
      return gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1CEbz80I_EUkTEoZjRITm-jhU4eVxYsv6YFz4J9tSEbk',
        range: 'items!A:C'
      });
    }).then(function(response) {
      model.items = response.result.values;
      model.items.splice(0, 1);
      initShopping();
    });
  }

  initPlanetExplorer();
  //makeApiCall('http://192.168.1.16:8983/api/shopping/S/32805');

  // Loads the JavaScript client library and invokes `start` afterwards.
  setTimeout(function() {
    gapi.load('client', initializeGapi);
  }, 1200);

})(jQuery);
