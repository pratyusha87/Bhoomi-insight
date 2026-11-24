from django.urls import path
from . import views
from .territory_views import territory_profile

urlpatterns = [
    path("", views.home, name="home"),
    path("api/search/", views.search_evidence, name="search_evidence"),
    path("api/territory/", territory_profile, name="territory_profile"),
]
