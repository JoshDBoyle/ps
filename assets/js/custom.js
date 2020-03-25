;(function($) {
  var model = {
    'tutorialList': [],
    'discordList': [],
    'streamList': [],
    'youtubeChannelList': [],
    'usefulLinkList': [],
    'planets': [],
    'items': [],
  },  blocks,
      colorMappings,
      colors,
      regions,
      planetSwiper,
      orders = [];

  // sampleShoppingResponse = '00010010000000000100110101100001011011000110110000100010001010010010110000101000001000100100100101101110011010100110010101100011011101000110100101101111011011100000000100000000000000000000000000000000000000000000000000000000111010000000001100000000000000000000000000000000000000000000000011111010111111001111101100000000000100000000011000000000010011010110000101101100011011000010000001001001000101000000000000000000000000000000000000000000000000000000000010010000000000010000000000000000000000000000000000000000000000000000101011111101000001110000000100010000000001110000000001001101011000010110110001101100001000000100100101001001000010100000000000000000000000000000000000000000000000000000000011001000000000000000000000000000000000000000000000000000000000000001010111111101000001110000000100010000';

  fetch('assets/js/data/blocks.json')
    .then(res => res.json())
    .then(data => { blocks = data })
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
  }

  function initShopping() {
    model.items =
    $("#shop").autocomplete({
      source: model.items
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
    var filter = event.target.value;

    if(filter === "All"){
      $('.planet-slide').removeClass("non-swiper-slide").addClass("swiper-slide").show();
    } else if(filter === 'Homeworld' || filter === 'Exoworld') {
      $('.planet-slide').not("[data-planet-type='" + filter + "']").addClass("non-swiper-slide").removeClass("swiper-slide").hide();
      $("[data-planet-type='" + filter + "']").removeClass("non-swiper-slide").addClass("swiper-slide").attr("style", null).show();
    } else if(filter === 'Active') {
      var $exos = $(".swiper-wrapper div[data-planet-type='Exoworld']");
      var $homeworlds = $(".swiper-wrapper div[data-planet-type='Homeworld']");
      var $other = $(".swiper-wrapper div:not([data-death]), .swiper-wrapper div[data-death='']");

      $other.removeClass('swiper-slide').addClass('non-swiper-slide').hide();
      $exos.removeClass('non-swiper-slide').addClass('swiper-slide').show();
      $homeworlds.removeClass('swiper-slide').addClass('non-swiper-slide').hide();
      $exos.each(function(index, planet) {
        const now = new Date();
        const secondsSinceEpoch = Math.round(now.getTime() / 1000);

        var planetTime = planet.getAttribute('data-death').split(',')[1];

        if(planetTime <= secondsSinceEpoch) {
          $(planet).removeClass('swiper-slide').addClass('non-swiper-slide').hide();
        } else {
          $(planet).removeClass('non-swiper-slide').addClass('swiper-slide').show();
        }
      });
    }

    planetSwiper.update();
    planetSwiper.slideTo(0);
  });

  initPlanetExplorer();
  makeApiCall('http://192.168.1.16:8983/api/shopping/S/32805');

  // Loads the JavaScript client library and invokes `start` afterwards.
  gapi.load('client', initializeGapi);

})(jQuery);
