
from django.db.utils import IntegrityError
from django.conf import settings
import warnings, time, os
from .models import Source, Standard, Dataset, Site, Synonym, Model, fetch_data
import pandas as pd
from io import StringIO
DATABASE = "Source"
DATASET_TYPE = "Type"
URL = "URL"
LAT = "Latitude"
LONG = "Longitude"
LAT_LONG_NAME = "Lat Long Name"
Source.objects.all().delete()
Dataset.objects.all().delete()
Standard.objects.all().delete()
Site.objects.all().delete()
Synonym.objects.all().delete()
filepath = os.path.join(settings.BASE_DIR, "base\SynonymBook.xlsx")
df_syn = pd.read_excel(filepath)
df_pv = pd.read_excel(filepath, sheet_name="Primary Variables")
print(df_pv)
df_seg = pd.read_excel(filepath, sheet_name="Variable Segregation")
ISCN = {"name" : "ISCN"}
NRCS = {"name" : "RaCA"}
def catchRepeat(modl: Model, Dict: dict):
    #We want each instance of a model to have a unique name.
    #Returns the model created (or that had already been created)
    try:
        modl(**Dict).save()
    except IntegrityError:#Raise warning if instance with this name already exists
        warnings.warn(f'{Dict["name"]} is already represented.')
    return modl.objects.get(name = Dict["name"])
def standardInstanceMaker(df_syn: pd.DataFrame):
    for std in df_syn.columns:
        stdDict = {"name" : std,
                   "summary" : any(df_pv.columns.isin([std]))}
        catchRepeat(Standard, stdDict)
def sourceMaker_fromCSV(Dict: dict):
    mSource = catchRepeat(Source, Dict)
    keys = df_syn.loc[df_syn[DATABASE] == mSource.name].dropna(axis=1)
    return mSource, keys
def synMaker_fromCSV(mSource: Source, keys):
        print(f'Storing {mSource.name} synonyms...')
        x = time.time()
        for label in keys.columns:
            synDict = {"name" : keys.iloc[0][label],
                    "standard" : Standard.objects.get(name = label)}
            catchRepeat(Synonym, synDict)
        y = time.time()
        print(f'Synonyms stored! Time to store: {round(y-x, 3)} seconds.')
def datasetMaker_fromCSV(mSource: Source, keys):
    i = 0
    for _, row in df_seg.loc[df_seg[DATABASE] == mSource.name].iterrows():
        dtstDict = {
            "name" : f'{mSource.name}{i}',
            "source" : mSource,
            "file" : row[URL],
            "delimiter" : row["Delimiter"]
        }
        dtst = catchRepeat(Dataset, dtstDict)
        for syn in row.iloc[3:]:
            if syn != syn:
                break
            #Get each of the Synonyms found in this file and associate them with this Dataset
            Synonym.objects.get(name = syn).dataset.add(dtst)
        i+=1
def siteMaker_fromCSV(mSource: Source, keys):
    print(f"Fetching {mSource.name} location data...")
    x = time.time()
    df = fetch_data(mSource, [LAT, LONG, LAT_LONG_NAME])
    dfSite = df.drop_duplicates()
    y = time.time()
    print(f'Data fetched! Time to fetch: {round(y-x, 3)} seconds.')
    print(f'Storing {mSource.name} sites...')
    for _, site in dfSite.iterrows():
        siteDict = {"name" : site[LAT_LONG_NAME],
                    "latitude" : site[LAT],
                    "longitude" : site[LONG],
                    "source" : mSource,
                    "county" : "",
                    "state" : ""}
        catchRepeat(Site, siteDict)  
    z = time.time()
    print(f'Sites stored! Time to store: {round(z-y, 3)} seconds.')
def maker_fromCSV(Dict: dict):
    mSource, keys = sourceMaker_fromCSV(Dict)
    synMaker_fromCSV(mSource, keys)
    datasetMaker_fromCSV(mSource, keys)
    siteMaker_fromCSV(mSource, keys)
standardInstanceMaker(df_syn)
#sourceSiteSynInstanceMaker_fromCSV(ISCN)
maker_fromCSV(NRCS)