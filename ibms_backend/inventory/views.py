from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Inventory, Customer, Bill, BillItem
from django.db import transaction
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

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

@api_view(['GET'])
def bill_pdf(request, id):
    try:
        bill = Bill.objects.get(id=id)
        items = BillItem.objects.filter(bill=bill)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="bill_{bill.id}.pdf"'
        p = canvas.Canvas(response, pagesize=letter)
        width, height = letter
        y = height - 50

        # Header Section
        p.setFont("Helvetica-Bold", 16)
        p.drawCentredString(width / 2, y, "CAR PARTS AND SERVICES")
        y -= 20
        p.setFont("Helvetica", 10)
        p.drawCentredString(width / 2, y, "123 Main Street, YourCity, State, ZIP")
        p.drawCentredString(width / 2, y - 15, "Phone: 9876543210 | GSTIN: 22AAAAA0000A1Z5")
        y -= 40

        # Bill Info
        p.setFont("Helvetica", 10)
        p.drawString(50, y, f"Bill No: {bill.id}")
        p.drawString(300, y, f"Date: {bill.date.strftime('%d-%m-%Y %H:%M')}")
        y -= 15
        p.drawString(50, y, f"Customer: {bill.customer.name}")
        y -= 25

        # Table Header
        p.setFont("Helvetica-Bold", 10)
        p.line(45, y, width - 45, y)
        y -= 12
        p.drawString(50, y, "S.No")
        p.drawString(90, y, "Item")
        p.drawString(250, y, "Qty")
        p.drawString(300, y, "Rate")
        p.drawString(370, y, "Total")
        y -= 10
        p.line(45, y, width - 45, y)
        y -= 15

        # Items
        p.setFont("Helvetica", 10)
        total = 0
        for idx, item in enumerate(items, 1):
            if y < 100:
                p.showPage()
                y = height - 50
            line_total = item.quantity * item.price
            total += line_total
            p.drawString(50, y, str(idx))
            p.drawString(90, y, item.inventory.name[:25])
            p.drawString(250, y, str(item.quantity))
            p.drawString(300, y, f"{item.price:.2f}")
            p.drawString(370, y, f"{line_total:.2f}")
            y -= 15

        # Total Line
        y -= 5
        p.line(45, y, width - 45, y)
        y -= 20
        p.setFont("Helvetica-Bold", 11)
        p.drawString(300, y, "Grand Total:")
        p.drawString(400, y, f"{total:.2f}")

        # Footer
        y -= 40
        p.setFont("Helvetica-Oblique", 11)
        p.drawCentredString(width / 2, y, "Thank you for your purchase!")
        p.drawCentredString(width / 2, y - 15, "Visit Again")

        p.showPage()
        p.save()
        return response

    except Exception as e:
        return HttpResponse(f"Error generating PDF: {str(e)}", status=500)
