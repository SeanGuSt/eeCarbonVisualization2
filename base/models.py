from django.db import models
from django.db.models import Model
import requests
from io import StringIO
import pandas as pd
MAX_DELIM_LENGTH = 1
MAX_STR_LENGTH = 255
class Standard(Model):
    name = models.CharField(max_length=MAX_STR_LENGTH, unique=True)#This is the unifying name for the variables
    summary = models.BooleanField(default = False)#Should this variable be shown on the initial display, or only when downloading the data?
    isSoil = models.BooleanField(default = False)
    isTime = models.BooleanField(default = False)
    def __str__(self):
        return self.name
class Source(Model):
    name = models.CharField(max_length=MAX_STR_LENGTH, unique=True)
    def __str__(self):
        return self.name
class Dataset(Model):
    #This model's purpose is to account for the possibility that a source may store all its data in multiple files
    name = models.CharField(max_length=MAX_STR_LENGTH, unique=True)
    hasTime = models.BooleanField(default = False)#Temporal data
    hasSoil = models.BooleanField(default = False)#Soil data
    source = models.ForeignKey(Source, on_delete = models.CASCADE)
    file = models.URLField(max_length=MAX_STR_LENGTH)#Set as empty if this is a Database
    delimiter = models.CharField(max_length=MAX_DELIM_LENGTH, default = ",")#Set as empty if this is a Database
    def __str__(self):
        return self.name
class Synonym(Model):
    name = models.CharField(max_length=MAX_STR_LENGTH, unique=True)
    dataset = models.ManyToManyField(Dataset)#Just in case 2 places actually do use the same variable to mean the same thing
    standard = models.ForeignKey(Standard, on_delete=models.CASCADE)
    def __str__(self):
        return self.name
class Site(Model):
    name = models.CharField(max_length=MAX_STR_LENGTH, unique=True)
    latitude = models.FloatField(default = 0)
    longitude = models.FloatField(default = 0)
    county = models.CharField(max_length=MAX_STR_LENGTH)
    state = models.CharField(max_length=MAX_STR_LENGTH)
    source = models.ForeignKey(Source, on_delete=models.CASCADE)#All Sites come from a Source
    def __str__(self):
        return self.name
def intersection(lst1, lst2):
    lst3 = [value for value in lst1 if value in lst2]
    return lst3

def fetch_data(source: Source, include = [], exclude = []):
    datasets = Dataset.objects.filter(source = source)#Get 
    df = pd.DataFrame()#initialize df
    for dataset in datasets:
        synonyms = Synonym.objects.filter(dataset = dataset)#Get synonyms which belong to dataset.
        synList = list(synonyms.values_list("name", flat = True))
        print(synList)
        if include != []:
            synList = intersection(synList, list(synonyms.filter(standard__name__in = include).values_list("name", flat = True)))
        for syn in list(synonyms.filter(standard__name__in = exclude).values_list("name", flat = True)):
            if syn in synList:
                synList.remove(syn)
        if synList == []:
            continue
        print(synList)
        standards = list(synonyms.values_list("standard__name", flat = True))
        response = requests.get(dataset.file) # make a request
        if response.status_code == 200:
            file_received = StringIO(response.text) #convert to string
            dfNew = pd.read_csv(file_received, delimiter=dataset.delimiter, low_memory=False, usecols=synList, on_bad_lines='warn').fillna("")
            dfNew = dfNew.rename(columns = {syn : stan for syn, stan in zip(synList, standards)})
            df = pd.concat([df, dfNew], axis = 1)
        else:
            print("Warning! File not obtained")
    return df