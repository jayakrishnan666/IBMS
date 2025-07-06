from django.urls import path
from .views import add_inventory, list_inventory, list_customers, add_customer, create_bill, edit_customer, customer_history, bill_details, bill_pdf, list_bills, inventory_detail, notification_setting, recognize_item_ai

urlpatterns = [
    path('add/', add_inventory, name='add_inventory'),
    path('list/', list_inventory, name='list_inventory'),
    path('customers/', list_customers, name='list_customers'),
    path('customers/add/', add_customer, name='add_customer'),
    path('customers/edit/<int:id>/', edit_customer, name='edit_customer'),
    path('customer/<int:id>/history/', customer_history, name='customer_history'),
    path('bill/<int:id>/details/', bill_details, name='bill_details'),
    path('bill/create/', create_bill, name='create_bill'),
    path('bill/<int:id>/pdf/', bill_pdf, name='bill_pdf'),
    path('bills/', list_bills, name='list_bills'),
    path('<int:id>/', inventory_detail, name='inventory_detail'),
    path('notification-setting/', notification_setting, name='notification_setting'),
    path('ai/recognize-item/', recognize_item_ai, name='recognize_item_ai'),
] 