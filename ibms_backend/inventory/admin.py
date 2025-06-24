from django.contrib import admin
from .models import Inventory, Customer, Bill, BillItem

# Register your models here.
admin.site.register(Inventory)
admin.site.register(Customer)
admin.site.register(Bill)
admin.site.register(BillItem)
