# apps/projects/urls.py
from django.urls import include, path
from .views import (
    ApartmentPaymentViewSet,
    ApartmentSaleViewSet,
    ApartmentViewSet,
    BuildingViewSet,
    CustomerViewSet,
    FloorViewSet,
    project_list_create,
    ProjectDetailView,
    ProjectPDFExportView
)

from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("buildings", BuildingViewSet, basename="building")
router.register("floors", FloorViewSet, basename="floor")
router.register("apartments", ApartmentViewSet, basename="apartment")
router.register("apartment-customers", CustomerViewSet, basename="apartment-customer")
router.register("apartment-sales", ApartmentSaleViewSet, basename="apartment-sale")
router.register("apartment-payments", ApartmentPaymentViewSet, basename="apartment-payment")

urlpatterns = [
    path("", project_list_create, name="project-list-create"),
    path("", include(router.urls)),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("<int:pk>/export-pdf/",ProjectPDFExportView.as_view())
]
