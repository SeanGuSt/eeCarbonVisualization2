var ctx = document.getElementById("chartCurve").getContext("2d");
var graphDrawn = false;
const defaultScales = {
    x: {
        type: "category",
        stacked: true,
        offset: true,
        title: {
            display: true,
            text: "Site ID: ",
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
            text: "Distance Underground (cm) (I assume)"
        }
    },
};
const DATASET_LINE_CHART = 0;
const DATASET_BAR_GRAPH = 1;
var dataCurve = {datasets: [{type: 'bar'}]};
var configCurve = {
    maintainAspectRatio: false,
    scales: defaultScales,
    plugins: {
        legend: {
            display: false
        }
    },
    //responsive: false
};
var chartCurve = new Chart(ctx, {
    // The type of chart we want to create
    type: "bar",
    // The data for our dataset
    data: dataCurve,
    //The configuration details for our graph
    options: configCurve
});
var footer_values = [];
var footer_keys = [];
const footer = (tooltipItems) => {
    let footer_lines = [];
    tooltipItems.forEach(function(tooltipItem) {
        for(let i = 0; i < footer_keys.length; i++){
            footer_lines.push(footer_values[i] + ": " + cd[tooltipItem.datasetIndex-1][footer_keys[i]][tooltipItem.dataIndex]);
        }
    });
    return footer_lines;
  };
var cd = chartCurve.data.datasets;
var dataset = [];
var dates = [];
const BCOLOR = ["black", "pink", "orange", "blue", "green", "yellow"];
function drawSoilSamples(data, chart){
    var cd = chart.data.datasets;
    changeGraphType(chart, "bar", true, "Site ID: " + data.site, true, "Distance Underground (cm) (I assume)", footer);
    footer_keys = data.footer_keys;
    footer_values = data.footer_values;
    console.log(data.layer_.length)
    for(let layer_num = 0; layer_num < data.layer_.length; layer_num++){
        var newDataset = {
            data: data.data[layer_num],
            type : "bar",
            label : "Layer " + data.layer_[layer_num],
            backgroundColor : BCOLOR[layer_num % BCOLOR.length]
        };
        for (let i = 0; i < footer_keys.length; i++){cd[layer_num][footer_keys[i]] = data[footer_keys[i]][layer_num];}
        cd.push(newDataset);
        console.log(newDataset);
    }
    for(let i = 1; i <= cd[DATASET_BAR_GRAPH].data.length; i++){chart.data.labels.push("Sample " + i);}
    chart.update();
}
$("#chartCurve").load(function(){
    $.ajax({                       // initialize an AJAX request
        url: $(this).attr("url"),  // set the url of the request (= localhost:8000/base/load-params/)
        data: {},
        success: function (data) {
            drawSoilSamples(data, chartCurve)
        }
    });
});
