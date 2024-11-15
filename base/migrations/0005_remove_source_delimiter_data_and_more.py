# Generated by Django 5.0.4 on 2024-11-12 17:43

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0004_remove_dataset_issoil_remove_dataset_source_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='source',
            name='delimiter_data',
        ),
        migrations.RemoveField(
            model_name='source',
            name='delimiter_place',
        ),
        migrations.RemoveField(
            model_name='source',
            name='url_data',
        ),
        migrations.RemoveField(
            model_name='source',
            name='url_place',
        ),
        migrations.RemoveField(
            model_name='synonym',
            name='source',
        ),
        migrations.AddField(
            model_name='dataset',
            name='hasSoil',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='dataset',
            name='hasTime',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='dataset',
            name='source',
            field=models.ForeignKey(default='', on_delete=django.db.models.deletion.CASCADE, to='base.source'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='standard',
            name='isSoil',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='standard',
            name='isTime',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='standard',
            name='summary',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='synonym',
            name='dataset',
            field=models.ManyToManyField(to='base.dataset'),
        ),
        migrations.AlterField(
            model_name='dataset',
            name='delimiter',
            field=models.CharField(default=',', max_length=1),
        ),
        migrations.AlterField(
            model_name='site',
            name='latitude',
            field=models.FloatField(default=0),
        ),
        migrations.AlterField(
            model_name='site',
            name='longitude',
            field=models.FloatField(default=0),
        ),
    ]
