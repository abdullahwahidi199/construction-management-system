from django.contrib import admin

from .models import ApartmentServiceSetting, ServiceCharge, ServicePayment


admin.site.register(ApartmentServiceSetting)
admin.site.register(ServiceCharge)
admin.site.register(ServicePayment)

