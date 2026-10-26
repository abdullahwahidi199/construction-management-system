from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ApartmentServiceSettingViewSet,
    ServiceChargeViewSet,
    ServicePaymentViewSet,
)


router = DefaultRouter()
router.register("settings", ApartmentServiceSettingViewSet, basename="service-setting")
router.register("charges", ServiceChargeViewSet, basename="service-charge")
router.register("payments", ServicePaymentViewSet, basename="service-payment")

urlpatterns = [path("", include(router.urls))]

