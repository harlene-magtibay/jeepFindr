// Initialize the map
const map = L.map('map').setView([13.7753, 121.0583], 13);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);


const jeepneyStopIcon = L.icon({
  iconUrl: '/img/jeepney_stop.png',
  iconSize: [30, 30], // size of the icon
  iconAnchor: [15, 30], // point of the icon which will correspond to marker's location
  popupAnchor: [1, -34] // point from which the popup should open
});

// Load and display the GeoJSON route
fetch('/geojson_files/batangas_alangilan_route.geojson')
  .then(response => response.json())
  .then(data => {
   L.geoJSON(data, {
  style: {
    color: 'blue',
    weight: 8,
    opacity: 0.7
  },
  pointToLayer: function (feature, latlng) {
  const stopNum = feature.properties.stop_number;
  const label = L.divIcon({
    className: 'stop-label',
    html: `<div style="color:white; background:red; width:18px; border-radius:50%; padding:1px; text-align:center; padding-top:3px; font-size:10px; border:1px solid black;">${stopNum}</div>`,
    iconSize: [30, 20],
    iconAnchor: [15, 10]
  });

  return L.marker(latlng, { icon: label }).bindPopup(`Stop ${stopNum}: ${feature.properties.name || 'Jeepney Stop'}`);
}
}).addTo(map);
  });


fetch('/geojson_files/batangas_balagtas_route.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
        filter: function (feature) {
        return feature.geometry.type !== 'Point';
      },
      style: {
        color: 'red',
        weight: 5,
        opacity: 1
      },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: jeepneyStopIcon }).bindPopup(feature.properties.name || 'Jeepney Stop');
      }
    }).addTo(map);
  });


fetch('/geojson_files/batangas_capitolio_hospital_route.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
        filter: function (feature) {
        return feature.geometry.type !== 'Point';
      },
      style: {
        color: 'green',
        weight: 3,
        opacity: 1
      },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: jeepneyStopIcon }).bindPopup(feature.properties.name || 'Jeepney Stop');
      }
    }).addTo(map);
  });

