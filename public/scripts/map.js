mapboxgl.accessToken =  mapToken;
var map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/light-v10',
center: [24.673106,45.951519 ],
zoom: 6
});

map.on('click', function(){
    $(".lista-nevoiasi .nevoias").removeClass("selected-nevoias")
    $(".info-div").css("display", "none")
    $(".div-donatie").css("display", "none")
    $(".selectnevoias").css("display", "block")
})

map.on('load', function () {
// Add a new source from our GeoJSON data and
// set the 'cluster' option to true. GL-JS will

// add the point_count property to your source data.
map.addSource('nevoiasi', {
type: 'geojson',
// Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.

data: nevoiasi,
cluster: true,
clusterMaxZoom: 14, // Max zoom to cluster points on
clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)
});
 
map.addLayer({
id: 'clusters',
type: 'circle',
source: 'nevoiasi',
filter: ['has', 'point_count'],
paint: {
// Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
// with three steps to implement three types of circles:
//   * Blue, 20px circles when point count is less than 100
//   * Yellow, 30px circles when point count is between 100 and 750
//   * Pink, 40px circles when point count is greater than or equal to 750
'circle-color': [
'step',
['get', 'point_count'],
'#405371',
100,
'#f1f075',
750,
'#f28cb1'
],
'circle-radius': [
'step',
['get', 'point_count'],
20,
100,
30,
750,
40
]
}
});
 
map.addLayer({
id: 'cluster-count',
type: 'symbol',
source: 'nevoiasi',
filter: ['has', 'point_count'],
layout: {
'text-field': '{point_count_abbreviated}',
'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
'text-size': 12
},
paint: {
    "text-color": "#ffffff"
  }
});
 
map.addLayer({
id: 'unclustered-point',
type: 'circle',
source: 'nevoiasi',
filter: ['!', ['has', 'point_count']],
paint: {
'circle-color': '#F57B50',
'circle-radius': 4,
'circle-stroke-width': 1,
'circle-stroke-color': '#fff'
}
});
 
// inspect a cluster on click
map.on('click', 'clusters', function (e) {
var features = map.queryRenderedFeatures(e.point, {
layers: ['clusters']
});
var clusterId = features[0].properties.cluster_id;
map.getSource('nevoiasi').getClusterExpansionZoom(
clusterId,
function (err, zoom) {
if (err) return;
 
map.easeTo({
center: features[0].geometry.coordinates,
zoom: zoom
});
}
);
});



// When a click event occurs on a feature in
// the unclustered-point layer, open a popup at
// the location of the feature, with
// description HTML from its properties.
map.on('click', 'unclustered-point', function (e) {
    
    
        
    
            $(".info-div").css("display", "flex")
            $(".div-donatie").css("display", "flex")
            $(".selectnevoias").css("display", "none")
    const text = e.features[0].properties.popText;
var coordinates = e.features[0].geometry.coordinates.slice();
// const cut = nevoiasi.features[4].geometry.coordinates[0];
//  console.log(cut.toString().slice(0,5));
//  console.log(e.features[0].geometry.coordinates[0].toString().slice(0,5))
for(let a of nevoiasi.features){
    for (let b of a.geometry.coordinates){
          if(b.toString().slice(0,5) == e.features[0].geometry.coordinates[0].toString().slice(0,5)){
            $("#nume").text(a.nume)
            $("#poza").attr('src', a.poza.url)
            $("#varsta").text(a.varsta)
            $("#telefon").text(a.telefon)
            $("#adresa").text(a.adresa)
            let necesitati = '<ul>';
            for (let necesitate of a.necesitati) {
                necesitati += `<li>${necesitate}</li>`
            }
            necesitati += '</ul>'
            $("#necesitati").html(
                necesitati
            ).css("list-style-type", "none")
            //   console.log(a);
            //   console.log(e.features[0].geometry.coordinates[0].toString().slice(0,5));

               $(".lista-nevoiasi .nevoias").each(function () { 
            //       if($(".lista-nevoiasi .nevoias[data-id]").attr("data-id", a.id)){
            //           console.log($(this).attr("data-id"));
            //           if (!$(this).attr("data-id",a.id).hasClass("selected-nevoias") && $(".lista-nevoiasi .nevoias").hasClass(
            //             "selected-nevoias")) {

                     $(".lista-nevoiasi .nevoias").removeClass("selected-nevoias")
            //         $(this).attr("data-id",a.id).toggleClass("selected-nevoias")





            //     } else(
            //         $(this).attr("data-id",a.id).addClass("selected-nevoias")

            //     )
            //       };
            });
          }
    }
}




// Ensure that if the map is zoomed out such that
// multiple copies of the feature are visible, the
// popup appears over the copy being pointed to.
while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
}


 
const popup = new mapboxgl.Popup()
.setLngLat(coordinates)
.setHTML(text)
.addTo(map);



setTimeout(function(){
    $(".info-div").css("display", "flex")
    $(".div-donatie").css("display", "flex")
    $(".selectnevoias").css("display", "none") 
}, 50)



popup.on('close', function(e) {
    
    
    $(".info-div").css("display", "none")
    $(".div-donatie").css("display", "none")
    $(".selectnevoias").css("display", "block")
 
})





}

);


 
map.on('mouseenter', 'unclustered-point', function () {
map.getCanvas().style.cursor = 'pointer';

});
map.on('mouseleave', 'unclustered-point', function () {
map.getCanvas().style.cursor = '';
});
});