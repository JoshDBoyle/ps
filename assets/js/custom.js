(function($) {
  let model = {
    'tutorialList': [],
    'discordList': [],
    'streamList': [],
    'youtubeChannelList': [],
    'usefulLinkList': [],
    'planets': [],
  },  planetsSwiper;

  /**
   * Populates the Planet Explorer UI based on planetModel
   */
  function buildExplorer() {

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
      model.planets.splice(0, 1)
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
        planetsSwiper = new Swiper ('.swiper-container', {
          // Optional parameters
          direction: 'horizontal',
          loop: true,
          observer: true,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          grabCursor: true,
          freeModeSticky: true
        });

        // We've got gapi initialized and we've got our data from Kontent.  Let's build the explorer!
        buildExplorer();
      });
    });
  }

  // Loads the JavaScript client library and invokes `start` afterwards.
  gapi.load('client', initializeGapi);

})(jQuery);
