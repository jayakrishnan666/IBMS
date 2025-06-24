from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Inventory, Customer, Bill, BillItem
from django.db import transaction

# Create your views here.

@api_view(['POST'])
def add_inventory(request):
    data = request.data
    try:
        item = Inventory.objects.create(
            name=data.get('name'),
            description=data.get('description', ''),
            quantity=data.get('quantity', 0),
            price=data.get('price', 0.0)
        )
        return Response({
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'quantity': item.quantity,
            'price': str(item.price),
            'created_at': item.created_at,
            'updated_at': item.updated_at,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_inventory(request):
    items = Inventory.objects.all().order_by('-created_at')
    data = [
        {
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'quantity': item.quantity,
            'price': str(item.price),
            'created_at': item.created_at,
            'updated_at': item.updated_at,
        }
        for item in items
    ]
    return Response(data)

@api_view(['GET'])
def list_customers(request):
    customers = Customer.objects.all().order_by('name')
    data = [
        {
            'id': c.id,
            'name': c.name,
            'email': c.email,
            'phone': c.phone,
            'created_at': c.created_at,
            'updated_at': c.updated_at,
        }
        for c in customers
    ]
    return Response(data)

@api_view(['POST'])
def add_customer(request):
    data = request.data
    try:
        customer, created = Customer.objects.get_or_create(
            email=data.get('email'),
            defaults={
                'name': data.get('name'),
                'phone': data.get('phone'),
            }
        )
        if not created:
            return Response({'error': 'Customer already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'id': customer.id,
            'name': customer.name,
            'email': customer.email,
            'phone': customer.phone,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def create_bill(request):
    data = request.data
    customer_id = data.get('customer_id')
    items = data.get('items', [])  # [{inventory_id, quantity, price}]
    if not customer_id or not items:
        return Response({'error': 'Customer and items are required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        with transaction.atomic():
            customer = Customer.objects.get(id=customer_id)
            total = sum(float(item['price']) * int(item['quantity']) for item in items)
            bill = Bill.objects.create(customer=customer, total=total)
            for item in items:
                inventory = Inventory.objects.get(id=item['inventory_id'])
                qty = int(item['quantity'])
                price = float(item['price'])
                if inventory.quantity < qty:
                    raise Exception(f'Not enough stock for {inventory.name}')
                BillItem.objects.create(bill=bill, inventory=inventory, quantity=qty, price=price)
                inventory.quantity -= qty
                inventory.save()
            return Response({'bill_id': bill.id, 'total': str(bill.total)}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def edit_customer(request, id):
    try:
        customer = Customer.objects.get(id=id)
        data = request.data
        customer.name = data.get('name', customer.name)
        customer.email = data.get('email', customer.email)
        customer.phone = data.get('phone', customer.phone)
        customer.save()
        return Response({'success': True})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def customer_history(request, id):
    try:
        customer = Customer.objects.get(id=id)
        bills = Bill.objects.filter(customer=customer).order_by('-date')
        data = [
            {
                'id': bill.id,
                'date': bill.date,
                'total': str(bill.total),
            }
            for bill in bills
        ]
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def bill_details(request, id):
    from .models import BillItem
    try:
        bill = Bill.objects.get(id=id)
        items = BillItem.objects.filter(bill=bill)
        data = {
            'id': bill.id,
            'date': bill.date,
            'total': str(bill.total),
            'customer': {
                'id': bill.customer.id,
                'name': bill.customer.name,
                'email': bill.customer.email,
                'phone': bill.customer.phone,
            },
            'items': [
                {
                    'id': item.id,
                    'name': item.inventory.name,
                    'quantity': item.quantity,
                    'price': str(item.price),
                    'total': str(item.quantity * item.price),
                }
                for item in items
            ]
        }
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
