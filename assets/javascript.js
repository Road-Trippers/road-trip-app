var input = {
  starting: { latitude: 0, longitude: 0 },
  destination: { latitude: 0, longitude: 0 },
};

document
  .getElementById("submit-button")
  .addEventListener("click", async function (event) {
    event.preventDefault();
    var startingPoint = document.getElementById("startingPoint").value;
    var destination = document.getElementById("endPoint").value;
    startingPoint = startingPoint.split(",");
    destination = destination.split(",");
    input = {
      starting: { latitude: startingPoint[0], longitude: startingPoint[1] },
      destination: { latitude: destination[0], longitude: destination[1] },
    };

    var mapBoxQueryURL =
      "https://api.mapbox.com/directions/v5/mapbox/driving/" +
      input.starting.longitude +
      "%2C" +
      input.starting.latitude +
      "%3B" +
      input.destination.longitude +
      "%2C" +
      input.destination.latitude +
      "?alternatives=true&geometries=geojson&steps=true&access_token=pk.eyJ1Ijoia2F5Z3JvZyIsImEiOiJjazh2dnBueXgwMnltM3ByejY2Y3hlM25kIn0.jyN4BskKiVdTLxWbxcPWsw";

    var mapResponse = await apiCall(mapBoxQueryURL);
    console.log(mapResponse);
    var tripDuration = mapResponse.routes[0].duration;
    var minutes = tripDuration / 60;
    console.log(Math.floor(minutes));
  });

function apiCall(queryURL) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", queryURL);
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject("Request failed.  Returned status of " + xhr.status);
      }
    };
    xhr.send();
  });
}
