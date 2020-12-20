"use strict";
var LL = {};								// 緯度(latitude)と経度(longitude)
const OvServer = 'https://overpass-api.de/api/interpreter'
const api_query = 'way["name"="大阪城"]';
const api_wikipedia = "wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=";

// initialize leaflet
let map = L.map('mapid', { center: [34.6867, 135.5273], zoom: 16 });
let osm_std = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxNativeZoom: 19, attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);

// get OpenStreetMap data & get Wikipedia text & write QR Code
osmdata_get(api_query).then(geojson => {
    let coords = geojson.features[0].geometry.coordinates[0][0];
    let wiki = geojson.features[0].properties.wikipedia.split(':');
    let url = encodeURI(`https://${wiki[0]}.wikipedia.org/wiki/${wiki[1]}`);
    let latlng = { lat: coords[1], lng: coords[0] };
    wikipedia_get(wiki[0], wiki[1]).then(text => qr_add(url, latlng, text));   // make QR Code
});

// get OpenStreetMap data
function osmdata_get(ovpass) {
    return new Promise((resolve) => {
        LL.NW = map.getBounds().getNorthWest();
        LL.SE = map.getBounds().getSouthEast();
        let maparea = '(' + LL.SE.lat + ',' + LL.NW.lng + ',' + LL.NW.lat + ',' + LL.SE.lng + ');';
        let query = OvServer + '?data=[out:json][timeout:30];(' + ovpass + maparea + ');out body;>;out skel qt;'
        $.get(query).done(function (data) {
            let geojson = osmtogeojson(data, { flatProperties: true });
            resolve(geojson);
        });
    });
};

// get Wikipedia text
function wikipedia_get(lang, name) {      // get wikipedia contents
    return new Promise((resolve) => {
        let encurl = "https://" + lang + "." + api_wikipedia + encodeURI(name);
        $.get({ url: encurl, dataType: "jsonp" }, function (data) {
            let key = Object.keys(data.query.pages);
            let text = data.query.pages[key].extract;
            resolve(text);
        });
    });
}

function qr_add(url, latlng, text) {
    let qrcode = new QRCode({ content: url, join: true, container: "svg", width: 128, height: 128 });
    let data = qrcode.svg();
    let icon = L.divIcon({ "className": "icon", "iconSize": [512, 128], "html": `<div style="float: left;">${data}</div><div>${text}</div>` });
    let qr_marker = L.marker(new L.LatLng(latlng.lat, latlng.lng), { icon: icon, draggable: true });
    qr_marker.addTo(map);
};
