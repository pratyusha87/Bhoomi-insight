# Generated for the Bhoomi Insight Evidence model.
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="Evidence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=220)),
                ("organisation", models.CharField(max_length=180)),
                ("category", models.CharField(choices=[("research", "Research"), ("policy", "Policy"), ("dataset", "Dataset"), ("innovation", "Innovation")], max_length=20)),
                ("summary", models.TextField()),
                ("published_on", models.DateField(blank=True, null=True)),
                ("source_url", models.URLField(blank=True)),
                ("verified", models.BooleanField(default=False)),
            ],
            options={"ordering": ["-published_on", "title"]},
        ),
    ]
