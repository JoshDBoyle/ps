(function($) {
  let model = {
    'tutorialList': [],
    'discordList': [],
    'streamList': [],
    'youtubeChannelList': [],
    'usefulLinkList': [],
    'planets': [],
  },  planetSwiper;

  function initSwiper() {
    planetSwiper = new Swiper ('.swiper-container', {
      // Optional parameters
      direction: 'horizontal',
      loop: false,
      observer: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      grabCursor: true,
      freeModeSticky: true
    });
  }

  /**
   * Populates the Planet Explorer UI based on planetModel
   */
  function buildExplorer() {
    $(".filters #planet-type").on("change", function(event){
      let filter = event.target.value;

      if(filter === "All"){
        $("[data-planet-type]").removeClass("non-swiper-slide").addClass("swiper-slide").show();
      } else if(filter === 'Homeworld' || filter === 'Exoworld') {
        $('.swiper-slide').not("[data-planet-type='" + filter + "']").addClass("non-swiper-slide").removeClass("swiper-slide").hide();
        $("[data-planet-type='" + filter + "']").removeClass("non-swiper-slide").addClass("swiper-slide").attr("style", null).show();
      } else if(filter === 'Active') {
        let $exos = $(".swiper-wrapper div[data-planet-type='Exoworld']");
        let $homeworlds = $(".swiper-wrapper div[data-planet-type='Homeworld']");
        let $other = $(".swiper-wrapper div:not([data-death]), .swiper-wrapper div[data-death='']");

        $other.removeClass('swiper-slide').addClass('non-swiper-slide').hide();
        $exos.removeClass('non-swiper-slide').addClass('swiper-slide').show();
        $homeworlds.removeClass('swiper-slide').addClass('non-swiper-slide').hide();
        $exos.each(function(index, planet) {
          const now = new Date();
          const secondsSinceEpoch = Math.round(now.getTime() / 1000);

          let planetTime = planet.getAttribute('data-death').split(',')[1];

          if(planetTime <= secondsSinceEpoch) {
            $(planet).removeClass('swiper-slide').addClass('non-swiper-slide').hide();
          } else {
            $(planet).removeClass('non-swiper-slide').addClass('swiper-slide').show();
          }
        });
      }

      initSwiper();
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
      }).done(function () {
        ko.applyBindings(model);

        window.dispatchEvent(new Event('data-ready'));

        //Load the background video now that we've gotten it from Kontent
        document.getElementById("bgVideo").load();

        // Initialize Swiper now that we've gotten all our data
        initSwiper();

        // We've got gapi initialized and we've got our data from Kontent.  Let's build the explorer!
        buildExplorer();
      });
    });
  }

  // Loads the JavaScript client library and invokes `start` afterwards.
  gapi.load('client', initializeGapi);

})(jQuery);
