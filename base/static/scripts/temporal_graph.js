/*This just creates the initial graph we see on loading the page*/
const date0_default = 0;
const date1_default = 365;
var ctxGraph = document.getElementById("chartCurve").getContext("2d");
graphDrawn = false;
const defaultScalesGraph = {
    x: {
        type: "category",
        stacked: true,
        offset: true,
        title: {
            display: true,
            text: "x-axis",
            color: "black",
            font: {
                size: 14
            }
        },
        //ticks: {callback: function(val, index) {return index % 30 === 0 ? this.getLabelForValue(val) : '';}}
    },
    y: {
        stacked: true,
        title: {
            display: true,
            text: "y-axis"
        }
    },
};
const DATASET_LINE_CHART = 0;
var dataCurve = {datasets: [{type: 'line'}]};
var configCurve = {
    maintainAspectRatio: false,
    scales: defaultScalesGraph,
    plugins: {
        legend: {
            display: false
        }
    },
    //responsive: false
};
var chartCurve = new Chart(ctxGraph, {
    // The type of chart we want to create
    type: "line",
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

$(".graphButton").click(function () {
    console.log($("#Location").val())
    if($("#Location").val() === ""){
        return
    }
    $.ajax({                       // initialize an AJAX request
    url: $(this).attr("update-url"),
    data: {
        "requested_variable" : $(this).val(),
        "site_id" : $("#Location").val()
    },
    success: function (data) {
            dataset = data.dataset;
            dates = data.dates;
            chartCurve.setDatasetVisibility(DATASET_LINE_CHART, true);
            try {
                date2str($("#date0").val());
                date2str($("#date1").val());
            } catch (error) {
                $("#date0").val(str2date(dates[date0_default]));
                $("#date1").val(str2date(dates[date1_default]));
            }
            redrawGraph();
            updateDateBounds();
            graphDrawn = true;
    }
    });

});
$(".dateRangeInput").change(function(){
    updateDateBounds();
    if(graphDrawn){redrawGraph();}
});
function str2date(date_str){
    let date_array = date_str.split("/");
    for(let i = 0; i < 2; i++){
        //date_array[i] = (date_array[i].length === 1 ? "0" : "") + date_array[i];
    }
    let new_date = date_str;//rearrange(date_array, [2, 0, 1]).join("-");
    return new_date
}
function date2str(date_str){
    let date_array = date_str.split("-");
    for(let i = 1; i < 3; i++){
        if(date_array[i][0] == "0"){
            date_array[i] = date_array[i][1];
        }
    }
    let new_date = date_str//rearrange(date_array, [1, 2, 0]).join("/");
    return new_date
}
function rearrange(array, neworder){
    let newarray = structuredClone(array);
    for(let i = 0; i < array.length; i++){
        newarray[i] = array[neworder[i]];
    }
    return newarray;
}
function redrawGraph(){
    let date0 = date2str($("#date0").val());
    let date1 = date2str($("#date1").val());
    let ind_date0 = dates.indexOf(date0);
    let ind_date1 = dates.indexOf(date1) + 1;
    cd[DATASET_LINE_CHART].data = dataset.slice(ind_date0, ind_date1);
    chartCurve.data.labels = dates.slice(ind_date0, ind_date1);
    chartCurve.update();
}
function updateDateBounds(){
    if($("#date0").val()) {$("#date1").attr("min", $("#date0").val());}
    if($("#date1").val()) {$("#date0").attr("max", $("#date1").val());}
    if(!dates.isEmpty) {
        $("#date0").attr("min", str2date(dates[0]));
        $("#date1").attr("max", str2date(dates[dates.length-1]));
    }
}