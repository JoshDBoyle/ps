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
      source: items,
      focus: function (event, ui) {
        $("shop").val(ui.item.text);
        return false;
      },
      select: function (event, ui) {
        $("shop").val(ui.item.text);
        $("item-id").val(ui.item.value);
      }
    }).autocomplete("instance")._renderItem = function (ul, item) {
      debugger;
      return $("<li>")
        .append("<div>" + item.text + "</div>")
        .appendTo(ul);
    };

    $(".ui-autocomplete").on('click', function (event) {
      event.stopPropagation();

    });
  }

  function initPlanetExplorer() {
    planetSwiper = new Swiper ('.swiper-container', {
      // Optional parameters
      direction: 'horizontal',
      loop: false,
      observer: true,
      observeParents: true,
      cache: false,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      grabCursor: true,
      freeModeSticky: true,
      watchSlidesProgress: true,
      watchSlidesVisibility: true
    });

    $("#color-search").bind('input', function () {
      let searchTerm = this.value;
      let searchType = $("#color-search-type").val();
      if (searchTerm.length > 2) {
        $(".planet-type-match").each(function () {
          let visible = false,
            secondTdsPerSlide;

          if (searchType === 'all') {
            secondTdsPerSlide = $(this).find("td:nth-of-type(2)");
          } else if (searchType === 'gleam') {
            secondTdsPerSlide = $(this).find("tr:nth-of-type(1) td:nth-of-type(2)");
          } else if (searchType === 'rocks') {
            secondTdsPerSlide = $(this).find("tr:nth-of-type(2) td:nth-of-type(2), tr:nth-of-type(3) td:nth-of-type(2), tr:nth-of-type(4) td:nth-of-type(2)");
          } else if (searchType === 'trunks') {
            secondTdsPerSlide = $(this).find("tr:nth-of-type(7) td:nth-of-type(2), tr:nth-of-type(8) td:nth-of-type(2), tr:nth-of-type(9) td:nth-of-type(2)");
          }

          $(secondTdsPerSlide).each(function () {
            if ($(this).text().toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              visible = true;
              return false;
            }
          });

          if (visible) {
            $(this).removeClass('non-swiper-slide').addClass('swiper-slide').show();
          } else {
            $(this).removeClass('swiper-slide').addClass('non-swiper-slide').hide();
          }
        });

        planetSwiper.update();
        planetSwiper.slideTo(0);
      }
    });
  }

  /**
   * Given the url to call, makes the api call and returns the shopping data as json
   *
   * @param url The shopping url to call
   */
  function makeApiCall(url) {
    let request = new XMLHttpRequest();

    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function () {
      let arrayBuffer = request.response;
      if (arrayBuffer) {
        let byteArray = new Uint8Array(arrayBuffer);
        orders = parseShoppingApiResponse(byteArray);
      }
    };

    request.send(null);
  }

  /*
    [
      u8    : size of beacon-name string
      u8    : size of guild-tag string
      char[]: beacon-name string (not null terminated)
      char[]: guild-tag string (not null terminated)
      u32   : item count
      u32   : shop activity
      i64   : price
      i16   : location-x
      i16   : location-z
      u8    : location-y
    ] for each result until end of response [ implicit count ]
    testingssss
  */
  function parseShoppingApiResponse(byteArray) {
    let results = [];
    let byteOffset = 0;
    let dataView = new DataView(byteArray.buffer);
    while(byteOffset < byteArray.byteLength) {
      let beaconNameLength = dataView.getUint8(byteOffset);
      let guildNameLength = dataView.getUint8(byteOffset + 1);
      let order = {};
      order.beaconName = '';
      for(let i = 0; i < beaconNameLength; i++) {
        let nameCharInt = dataView.getUint8(byteOffset + 2 + i);
        order.beaconName += String.fromCharCode(nameCharInt);
      }
      order.guildName = '';
      for(let i = 0; i < guildNameLength; i++) {
        let nameCharInt = dataView.getUint8(byteOffset + 2 + guildNameLength + i);
        order.guildName += String.fromCharCode(nameCharInt);
      }
      order.qty = dataView.getUint32(byteOffset + 2 + beaconNameLength + guildNameLength, true);
      order.patrons = dataView.getUint32(byteOffset + 2 + beaconNameLength + guildNameLength + 4, true);
      order.price = dataView.getBigInt64(byteOffset + 2 + beaconNameLength + guildNameLength + 8, true);
      order.coordinates = {
        x : dataView.getInt16(byteOffset + 2 + beaconNameLength + guildNameLength + 16, true),
        z : dataView.getInt16(byteOffset + 2 + beaconNameLength + guildNameLength + 18, true),
        y : dataView.getUint8(byteOffset + 2 + beaconNameLength + guildNameLength + 20)
      };

      order.price = Number(order.price) / 100;
      results.push(order);
      byteOffset += 23 + beaconNameLength + guildNameLength;
    }
    return results;
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
            return colors['' + arr[0]];
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
            var arr = value.split(',');
            return arr[1] === 'True' ? '<i style=\"color: green; font-size: 28px;\" class=\"fa fa-check\"></i>' : '<i style=\"color: lightgrey; font-size: 28px;\" class=\"fa fa-question\"></i>';
          } else {
            return '<i style=\"color: lightgrey; font-size: 28px;\" class=\"fa fa-question\"></i>';
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

  $(".filters #planet-type").on("change", function(event) {
    let filter = event.target.value;

    $("#color-search-type").val("all");
    $("#color-search").val("");
    if(filter === "All"){
      $('.planet-slide').removeClass("non-swiper-slide").addClass("swiper-slide").addClass("planet-type-match").show();
    } else if(filter === 'Homeworld' || filter === 'Exoworld') {
      $('.planet-slide').not("[data-planet-type='" + filter + "']").addClass("non-swiper-slide").removeClass("planet-type-match").removeClass("swiper-slide").hide();
      $("[data-planet-type='" + filter + "']").removeClass("non-swiper-slide").addClass("swiper-slide").addClass("planet-type-match").attr("style", null).show();
    } else if(filter === 'Active') {
      let $exos = $(".swiper-wrapper div[data-planet-type='Exoworld']");
      let $homeworlds = $(".swiper-wrapper div[data-planet-type='Homeworld']");
      let $other = $(".swiper-wrapper div:not([data-death]), .swiper-wrapper div[data-death='']");

      $other.removeClass('swiper-slide').removeClass("planet-type-match").addClass('non-swiper-slide').hide();
      $exos.removeClass('non-swiper-slide').addClass('swiper-slide').addClass("planet-type-match").show();
      $homeworlds.removeClass('swiper-slide').remove("planet-type-match").addClass('non-swiper-slide').hide();
      $exos.each(function(index, planet) {
        const now = new Date();
        const secondsSinceEpoch = Math.round(now.getTime() / 1000);

        let planetTime = planet.getAttribute('data-death').split(',')[1];

        if(planetTime <= secondsSinceEpoch) {
          $(planet).removeClass('swiper-slide').addClass('non-swiper-slide').hide();
          $(planet).removeClass('planet-type-match');
        } else {
          $(planet).removeClass('non-swiper-slide').addClass('swiper-slide').show();
          $(planet).addClass('planet-type-match');
        }
      });
    }

    planetSwiper.update();
    planetSwiper.slideTo(0);
  });

  initPlanetExplorer();
  //makeApiCall('http://192.168.1.16:8983/api/shopping/S/32805');

  // Loads the JavaScript client library and invokes `start` afterwards.
  gapi.load('client', initializeGapi);

})(jQuery);
