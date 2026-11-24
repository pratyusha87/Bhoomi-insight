from django.db import models

class Evidence(models.Model):
    CATEGORY_CHOICES = [
        ("research", "Research"), ("policy", "Policy"),
        ("dataset", "Dataset"), ("innovation", "Innovation"),
    ]
    title = models.CharField(max_length=220)
    organisation = models.CharField(max_length=180)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    summary = models.TextField()
    published_on = models.DateField(null=True, blank=True)
    source_url = models.URLField(blank=True)
    verified = models.BooleanField(default=False)

    class Meta:
        ordering = ["-published_on", "title"]

    def __str__(self):
        return self.title
