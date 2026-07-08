# apps/projects/urls.py
from django.urls import path
from .views import (
    project_list_create,
    ProjectDetailView,
    ProjectPDFExportView
)

from rest_framework.routers import DefaultRouter

urlpatterns = [
    path("", project_list_create, name="project-list-create"),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("<int:pk>/export-pdf/",ProjectPDFExportView.as_view())
]