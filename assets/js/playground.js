;(function ($) {

  function makeApiCall(url) {
    let request = new XMLHttpRequest();

    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function () {
      let arrayBuffer = request.response;
      if (arrayBuffer) {
        let byteArray = new Uint8Array(arrayBuffer);
        let orders = msgpack.deserialize(byteArray);
        console.log(orders);
      }
    };

    request.send(null);
  }

  function getWorlds() {
    makeApiCall('http://api.boundlexx.app/api/v1/worlds/dump/');
  }

  $('#api-test-btn').click(function() {
    getWorlds();
  });
})(jQuery);
