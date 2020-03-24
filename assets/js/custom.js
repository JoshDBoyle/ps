;(function($) {
  var model = {
    'tutorialList': [],
    'discordList': [],
    'streamList': [],
    'youtubeChannelList': [],
    'usefulLinkList': [],
    'planets': []
  },  blocks,
      colorMappings,
      colors,
      regions,
      planetSwiper;

  fetch('/ps/assets/js/data/blocks.json')
    .then(res => res.json())
    .then(data => { blocks = data })
    .catch(err => console.error(err));

  fetch('/ps/assets/js/data/color-mappings.json')
    .then(res => res.json())
    .then(data => { colorMappings = data })
    .catch(err => console.error(err));

  fetch('/ps/assets/js/data/colors.json')
    .then(res => res.json())
    .then(data => { colors = data })
    .catch(err => console.error(err));

  fetch('/ps/assets/js/data/regions.json')
    .then(res => res.json())
    .then(data => { regions = data })
    .catch(err => console.error(err));

  function initSwiper() {
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

  initSwiper();

  // Loads the JavaScript client library and invokes `start` afterwards.
  gapi.load('client', initializeGapi);

})(jQuery);
