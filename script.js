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


