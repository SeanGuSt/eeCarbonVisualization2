from django.contrib import admin
from .models import Source, Standard, Site, Synonym, Dataset
admin.site.register(Source)
admin.site.register(Standard)
admin.site.register(Site)
admin.site.register(Dataset)
admin.site.register(Synonym)