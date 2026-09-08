from django.contrib import admin
from .models import Apartment, ApartmentPayment, ApartmentSale, Building, Customer, Floor, Project


admin.site.register(Project)
admin.site.register(Building)
admin.site.register(Floor)
admin.site.register(Apartment)
admin.site.register(Customer)
admin.site.register(ApartmentSale)
admin.site.register(ApartmentPayment)
