console.log("Hello there")
//Placeholder constants
const BCOLOR = ["black", "pink", "orange", "blue", "green", "yellow"];//List of colors for the layers of the bar graph
let X_AXIS_DEFAULT_TEXT = "State: ";
let GRAPH_MODE = "Spline "
const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    noWrap: true
})
var circlearray = [];
circles.forEach(function (circle, index) {
    var onecircle =  L.circle(circle, {
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.8,
        radius: 8000,//Radius in feet. Definitely needs to be changed.
            }).bindPopup();
    onecircle.bindTooltip(sites[index]);
    onecircle.feature = {};
    onecircle.feature.site = sites[index];
    circlearray.push(onecircle);//Future proofing, on the off chance we need a list of the markers.
});
var circleLayer = L.layerGroup(circlearray);
var stateGeo = L.geoJson(stateData, {style: style, onEachFeature: onEachFeature});
var countyGeo = L.geoJson(countyData, {style: style, onEachFeature: onEachFeature});
const map = L.map('map', {
    center: init_geo,
    zoom: 4,
    layers: [tiles, stateGeo]
});
const baseLayer = {"tiles" : tiles};
const overlay = {
    "Individual Stations" : circleLayer,
    "State" : stateGeo,
    "County" : countyGeo
};
var soilLayerBarChart = null;//Initial chart curve.
map.on('popupopen', function(e) {
    console.log(e);
    if(e.popup._source.feature.site === ""){
        const popupGraph = `No data to display. Sorry!`;
        e.popup._source.bindPopup(popupGraph);
        return;
    }
    $.ajax({                       // initialize an AJAX request
        url: myUrl,  // set the url of the request (= localhost:8000/base/load-params/)
        data: {
            "site" : e.popup._source.feature.site      // add the country id to the GET parameters
        },
        success: function (data) {
            console.log("Starting Graph");
            if(soilLayerBarChart != null){
                soilLayerBarChart.destroy();
                //If the chartId is 1, set it to 0. If 0, set it to 1.
                //This allows us to change bar charts easily. My best guess as to why it works is it... allows the old chart time to replace the stuff it had?
                //I said it was my best guess, not a good one.
                //To see the problem with bar charts not appearing, simply comment out the line below.
                chartId = chartId == 1 ? 0 : 1;
            }
            const popupGraph = `<div><canvas id="soilLayerBarChart`+chartId+`" width="560" height="315" site = `+ e.popup._source.feature.site + `></canvas></div>
                                <button id="download" onclick="downloadData(event)">Download</button>
                                <button id="switch" onclick="updateSoilSpline(event)">` + GRAPH_MODE +  `View</button>`;
            console.log("Binding Graph");
            e.popup._source.bindPopup(popupGraph);
            console.log(document.getElementById("soilLayerBarChart"+chartId));
            var ctxMap = document.getElementById("soilLayerBarChart"+chartId).getContext("2d");
            console.log("Making Chart");
            const dataBar = {datasets: [{type: 'bar'}]};
            soilLayerBarChart = new Chart(ctxMap, {
                // The type of chart we want to create
                type: "bar",
                // The data for our dataset
                data: dataBar,
                //The configuration details for our graph
                options: configBar
            });
            var cdd = soilLayerBarChart.data.datasets;//cdd short for chart data datasets
            const footer_keys_count = data.footer_keys.length;
            const footer = (tooltipItems) => {
                let footer_lines = [];
                tooltipItems.forEach(function(tooltipItem) {//For each layer of soil data
                    for(let i = 0; i < footer_keys_count; i++){//For each string in footer_keys
                        value = cdd[tooltipItem.datasetIndex-1][data.footer_keys[i]][tooltipItem.dataIndex];
                        if(value){//If this value exists
                            //have the following string show up.
                            footer_lines.push(data.footer_values[i] + ": " + value);
                        }
                            
                    }
                });
                return footer_lines;
            };
            soilLayerBarChart.options.scales.x.title.text = X_AXIS_DEFAULT_TEXT + e.popup._source._tooltip._content;//Set x-axis label
            soilLayerBarChart.options.plugins.tooltip.callbacks.footer = footer;//Set the footers.
            console.log(data.layer_.length)
            for(let layer_num = 0; layer_num < data.layer_.length; layer_num++){
                var newDataset = {
                    data: data.data[layer_num],
                    type : "bar",
                    label : "Layer " + data.layer_[layer_num],
                    backgroundColor : BCOLOR[layer_num % BCOLOR.length]
                };
                for (let i = 0; i < footer_keys_count; i++){
                    cdd[layer_num][data.footer_keys[i]] = data[data.footer_keys[i]][layer_num];
                }
                cdd.push(newDataset);
            }
            for(let i = 1; i <= cdd[DATASET_BAR_GRAPH].data.length; i++){soilLayerBarChart.data.labels.push("Sample " + i);}
            soilLayerBarChart.update();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            alert("Status: " + textStatus); alert("Error: " + errorThrown); 
        }   
    });
});
const layerControl = L.control.layers(overlay, {}).addTo(map);
var searchControl = new L.Control.Search({
    layer: stateGeo,
    propertyName: 'name',
    marker: false,
    moveToLocation: function(latlng, title, map) {
        //map.fitBounds( latlng.layer.getBounds() );
        var zoom = map.getBoundsZoom(latlng.layer.getBounds());
          map.setView(latlng, zoom); // access the zoom
    }
});
map.on("baselayerchange", function(event){
    searchControl.collapse();
    map.closePopup();
    X_AXIS_DEFAULT_TEXT = event.name + ": ";
    searchControl.setLayer(overlay[event.name]);
});
searchControl.on('search:locationfound', function(e) {
		
    //console.log('search:locationfound', );

    //map.removeLayer(this._markerSearch)

    e.layer.setStyle({fillColor: '#3f0', color: '#0f0'});
    if(e.layer._popup)
        e.layer.openPopup();

}).on('search:collapsed', function(e) {
    stateGeo.resetStyle(e.layer);
});
map.addControl( searchControl );  //inizialize search control 
const defaultScalesMap = {
    x: {
        type: "category",
        stacked: true,
        offset: true,
        title: {
            display: true,
            text: X_AXIS_DEFAULT_TEXT,
            color: "black",
            font: {
                size: 14
            }
        },
    },
    y: {
        stacked: true,
        title: {
            display: true,
            text: "Distance Underground (cm)"
        }
    },
};
const configBar = {
    maintainAspectRatio: false,
    scales: defaultScalesMap,
    plugins: {
        legend: {
            display: false
        }
    },
};
//chartId is a janky method of making the bar graphs easier to handle.
//Without this, the user would need to fully close each popup they opened before opening a new one,
//otherwise they would get an empty popup.
var chartId = 0;
const DATASET_BAR_GRAPH = 1;

function getColor(d) {
    return d > 1000 ? '#800026' :
           d > 500  ? '#BD0026' :
           d > 200  ? '#E31A1C' :
           d > 100  ? '#FC4E2A' :
           d > 50   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
                      '#FFEDA0';
}
function style(feature) {
    return {
        fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    layer.bringToFront();
}
function resetHighlight(e) {
    var layer = e.target;
    stateGeo.resetStyle(layer);
}
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
    });
    layer.bindTooltip(feature.properties.name);
    layer.bindPopup()
    var sites = "";
    circlearray.forEach(function(circle){
        const isInLoc = layer._latlngs.some(isPointInPolygon, circle._latlng);
        if(isInLoc){
            sites = sites.concat(circle._tooltip._content).concat(",");
        }
    });
    
    feature.site = sites;
}
function isPointInPolygon(polygon) {
    let isInside = false;
    polygon = polygon.length > 1 ? polygon : polygon[0];
    const x = this.lat, y = this.lng;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat, yi = polygon[i].lng;
        const xj = polygon[j].lat, yj = polygon[j].lng;
        const intersect = ((yi > y) !== (yj > y)) &&
                        ( x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        isInside = intersect ? !isInside : isInside;
    }
    return isInside;
}
function downloadData(e){
    var site = soilLayerBarChart.options.scales.x.title.text;
    $.ajax({                       // initialize an AJAX request
        url: dlUrl,  // set the url of the request (= localhost:8000/Many_Layers/download-params/)
        data: {
            "site" : document.getElementById("soilLayerBarChart"+chartId).getAttribute("site")      // add the country id to the GET parameters
        },
        success: function(response){
            const blob = new Blob([response], { type: 'text/csv' });
            console.log(typeof(response));
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = site + ".csv";
            document.body.appendChild(elem);
            elem.click();
            document.body.removeChild(elem);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            alert("Status: " + textStatus); alert("Error: " + errorThrown); 
        } 
    })
    
}