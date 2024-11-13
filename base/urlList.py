from django.urls import path
from . import models_loc
from . import views
app_name = "base"
print("Am I printing twice?")
urlpatterns = [
    path("", views.IndexView.as_view(), name="index"),
    path('stationFinder/', views.IndexView.as_view(), name = "stationFinder"),
    path('ajax/load-layers/', views.load_layer_values, name = "ajax_load_layer_values"),#See views.py
    path('ajax/download-layers/', views.download_layer_values, name = "ajax_download_layer_values"),#See views.py
]