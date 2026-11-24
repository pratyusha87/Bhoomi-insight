from django.contrib import admin
from .models import Evidence
@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ("title", "organisation", "category", "published_on", "verified")
    list_filter = ("category", "verified")
    search_fields = ("title", "organisation", "summary")
