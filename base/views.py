from django.db.models import F
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views import generic
from .static.scripts.python.other import js, calculate_centroid, count_changes
from .models import Source, Site, Synonym, Standard, Dataset, fetch_data
from global_land_mask import globe
from .graph_prep import xy2dataset
import numpy as np
import pandas as pd
DATABASE = "Database"
LAT = "Latitude"
LONG = "Longitude"
LAT_LONG_NAME = "Lat Long Name"
LOC_LVL_0 = "Loc Lvl 0"
SAMPLE_NUM = "Sample Name"
TOP = "Top"
BOTTOM = "Bottom"
already_loaded = []
#footer_keys are the keys to the dictionary superDict
summary_keys = list(Standard.objects.filter(summary = True).values_list("name", flat = True))
#footer_values are the values that will go in the tooltips
summary_values = summary_keys
df = pd.DataFrame(columns = summary_keys)
df0 = pd.DataFrame(columns = summary_keys)
print("Getting button params...")
propnames = []#[prop[0] for prop in WeatherObservation.__all_properties__]#The actual names of the properties, what it's called in the file/database
propverbose = propnames#What we expect a person to call it
prophover = propnames#A brief description to show up on hover
print("Finding geolocations...")
def get_geolocation():
    #initialize variables
    sites = []
    geolocations = []
    for site in Site.objects.all():
        if globe.is_land(site.latitude, site.longitude):
            geolocations.append({"lat" : site.latitude, "lon" : site.longitude})
            sites.append(site.name)
    return geolocations, sites
geolocations, sites = get_geolocation()
print(f"Samples grouped down to {len(sites)} points. Finding center...")
initial_geocenter = calculate_centroid(geolocations)#Where the map should be centered
class IndexView(generic.ListView):
    template_name = "searcher/stationFinder.html"
    context_object_name = "Location"
    def get_queryset(self):
        return {"geolocations": js(geolocations), "initial_geocenter" : js(initial_geocenter), "sites" : js(sites)}

def load_layer_values(request):
    global df   
    station = request.GET.get("site").split(",")[:-1]
    if station == []:
        station = [request.GET.get("site")]
    reqSites = Site.objects.filter(name__in = station)
    sources = reqSites.values_list("source", flat=True)
    for source in sources:
        if source not in already_loaded:
            already_loaded.append(source)
            dfNew = fetch_data(source, exclude = [LAT_LONG_NAME, LAT, LONG])
            df = pd.concat([df, dfNew])
        for site in reqSites:
            df.loc[df[LOC_LVL_0] == site.name, LAT] = site.latitude
            df.loc[df[LOC_LVL_0] == site.name, LONG] = site.longitude
    layers = df.loc[df[LOC_LVL_0].isin(station)].fillna(-1)
    print(layers["SOC"])
    sample_list = layers[SAMPLE_NUM].to_list()
    num_samples, num_layers = count_changes(sample_list)
    print(f'{sample_list} with {num_samples} samples each having at most {num_layers} layers')
    superDict = {"site" : station, "footer_keys" : summary_keys, "footer_values" : summary_values}
    def prepare_data_4_box_chart_js(myList: list):
        layer_num = -1
        sample_num = 0
        if type(myList[0]) == str:
            data_values = [[""] * num_samples for _ in range(num_layers)]
        else:
            data_values = [[0] * num_samples for _ in range(num_layers)]
        old_place = sample_list[0]
        for i in range(len(sample_list)):
            if old_place != sample_list[i]:
                sample_num += 1
                layer_num = -1
                old_place = sample_list[i]
            layer_num += 1
            data_values[layer_num][sample_num] = myList[i]
        return data_values
    for key in summary_keys:
        superDict[key] = prepare_data_4_box_chart_js(layers[key].to_list())
    superDict["data"] = prepare_data_4_box_chart_js(np.subtract(layers[TOP].to_list(), layers[BOTTOM].to_list()))
    superDict["layer_"] = list(set(sample_list))
    json_stuff = js(superDict)
    return HttpResponse(json_stuff, content_type ="application/json")
def download_layer_values(request):   
    station = request.GET.get("site").split(",")[:-1]
    layers = df.loc[df[LOC_LVL_0].isin(station)].fillna(-1)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="data.csv"'
    layers.to_csv(response, index=False)
    return response
