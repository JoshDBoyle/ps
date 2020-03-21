(function($) {
  let model = {
    'tutorialList': [],
    'discordList': [],
    'streamList': [],
    'youtubeChannelList': [],
    'usefulLinkList': []
  };
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
    document.getElementById("bgVideo").load();
  });
})(jQuery);
