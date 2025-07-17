from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Inventory, Customer, Bill, BillItem, NotificationSetting
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.db.models.deletion import ProtectedError
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from twilio.rest import Client
from django.views.decorators.csrf import csrf_exempt
import json
import base64
import requests
import re

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

                # Low stock alert logic
                setting = NotificationSetting.objects.first()
                if inventory.quantity < 2 and not getattr(inventory, 'low_stock_alert_sent', False):
                    # Send email
                    if setting and setting.email:
                        send_mail(
                            'Low Stock Alert',
                            f'Item "{inventory.name}" is low on stock (quantity: {inventory.quantity}).',
                            'noreply@example.com',
                            [setting.email],
                            fail_silently=True,
                        )
                    # Send SMS via Twilio
                    if setting and setting.phone_number:
                        try:
                            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                            client.messages.create(
                                body=f"Item '{inventory.name}' is low on stock (quantity: {inventory.quantity})",
                                from_=settings.TWILIO_PHONE_NUMBER,
                                to=setting.phone_number
                            )
                        except Exception as sms_exc:
                            print(f"Twilio SMS failed: {sms_exc}")
                    # Mark alert as sent
                    inventory.low_stock_alert_sent = True
                    inventory.save(update_fields=["low_stock_alert_sent"])
                elif inventory.quantity >= 2 and getattr(inventory, 'low_stock_alert_sent', False):
                    # Reset alert flag if restocked
                    inventory.low_stock_alert_sent = False
                    inventory.save(update_fields=["low_stock_alert_sent"])
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

@api_view(['GET'])
def list_bills(request):
    search = request.GET.get('search', '').strip()
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    bills = Bill.objects.select_related('customer').all().order_by('-date')
    if search:
        if search.isdigit():
            bills = bills.filter(id=int(search))
        else:
            bills = bills.filter(customer__name__icontains=search)
    if start_date:
        bills = bills.filter(date__gte=start_date)
    if end_date:
        bills = bills.filter(date__lte=end_date)
    data = [
        {
            'id': bill.id,
            'date': bill.date,
            'total': str(bill.total),
            'customer': bill.customer.name,
        }
        for bill in bills
    ]
    return Response(data)

@api_view(['GET', 'PUT', 'DELETE'])
def inventory_detail(request, id):
    try:
        item = Inventory.objects.get(id=id)
        if request.method == 'GET':
            return Response({
                'id': item.id,
                'name': item.name,
                'description': item.description,
                'quantity': item.quantity,
                'price': str(item.price),
                'created_at': item.created_at,
                'updated_at': item.updated_at,
            })
        elif request.method == 'PUT':
            data = request.data
            item.name = data.get('name', item.name)
            item.description = data.get('description', item.description)
            item.quantity = data.get('quantity', item.quantity)
            item.price = data.get('price', item.price)
            item.save()

            # Low stock alert logic
            setting = NotificationSetting.objects.first()
            if item.quantity < 2 and not getattr(item, 'low_stock_alert_sent', False):
                # Send email
                if setting and setting.email:
                    send_mail(
                        'Low Stock Alert',
                        f'Item {item.name} is low on stock (quantity: {item.quantity}).',
                        'noreply@example.com',
                        [setting.email],
                        fail_silently=True,
                    )
                # Send SMS via Twilio
                if setting and setting.phone_number:
                    try:
                        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                        client.messages.create(
                            body=f"Item 'Low Stock Alert!{item.name}' is low on stock (quantity: {item.quantity})",
                            from_=settings.TWILIO_PHONE_NUMBER,
                            to=setting.phone_number
                        )
                    except Exception as sms_exc:
                        print(f"Twilio SMS failed: {sms_exc}")
                # Mark alert as sent
                item.low_stock_alert_sent = True
                item.save(update_fields=["low_stock_alert_sent"])
            elif item.quantity >= 2 and getattr(item, 'low_stock_alert_sent', False):
                # Reset alert flag if restocked
                item.low_stock_alert_sent = False
                item.save(update_fields=["low_stock_alert_sent"])
            return Response({'success': True})
        elif request.method == 'DELETE':
            try:
                item.delete()
                return Response({'success': True})
            except ProtectedError:
                return Response(
                    {'error': 'Cannot delete this item because it is used in bills.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
    except Inventory.DoesNotExist:
        return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(["GET", "POST"])
def notification_setting(request):
    # Always use the first (and only) NotificationSetting
    setting, created = NotificationSetting.objects.get_or_create(id=1)
    if request.method == "GET":
        return Response({
            "phone_number": setting.phone_number,
            "email": setting.email,
        })
    elif request.method == "POST":
        phone = request.data.get("phone_number")
        email = request.data.get("email")
        if phone is not None:
            setting.phone_number = phone
        if email is not None:
            setting.email = email
        setting.save()
        return Response({
            "phone_number": setting.phone_number,
            "email": setting.email,
        })

@csrf_exempt
def recognize_item_ai(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required.'}, status=405)
    try:
        data = json.loads(request.body)
        image_data = data.get('image')
        if not image_data:
            return JsonResponse({'error': 'No image provided.'}, status=400)
        # Remove data:image/jpeg;base64, prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        # Gemini Vision API call
        api_key = settings.GEMINI_API_KEY
        print("Gemini API Key loaded:", api_key[:6] + "..." if api_key else None)
        gemini_url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=' + api_key
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": "Identify the object in this image and provide a short name and a concise description suitable for an inventory system. Respond in JSON with 'name' and 'description' fields only."},
                        {"inlineData": {"mimeType": "image/jpeg", "data": image_data}}
                    ]
                }
            ]
        }
        print("Gemini API payload:", str(payload)[:500])
        response = requests.post(gemini_url, json=payload)
        if response.status_code != 200:
            print("Gemini API error details:", response.text)
            return JsonResponse({'error': 'Gemini API error', 'details': response.text}, status=500)
        gemini_data = response.json()
        # Parse Gemini response for JSON with name/description
        try:
            # Extract JSON from Gemini's text response
            text = gemini_data['candidates'][0]['content']['parts'][0]['text']
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                ai_result = json.loads(match.group(0))
                return JsonResponse({
                    'name': ai_result.get('name', ''),
                    'description': ai_result.get('description', '')
                })
            else:
                return JsonResponse({'error': 'Could not parse AI response', 'raw': text}, status=500)
        except Exception as e:
            return JsonResponse({'error': 'Error parsing AI response', 'details': str(e), 'raw': gemini_data}, status=500)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# --- REPORTS API VIEWS ---
from django.db.models import Sum, Count, F
from datetime import timedelta
from django.utils import timezone
import io

@api_view(['GET'])
def report_summary(request):
    total_sales = Bill.objects.aggregate(total=Sum('total'))['total'] or 0
    transactions = Bill.objects.count()
    avg_bill = Bill.objects.aggregate(avg=Sum('total')/Count('id'))['avg'] if transactions else 0
    low_stock = Inventory.objects.filter(quantity__lt=2).count()
    return Response({
        'total_sales': float(total_sales),
        'transactions': transactions,
        'avg_bill': float(avg_bill) if avg_bill else 0,
        'low_stock': low_stock,
    })

@api_view(['GET'])
def report_top_products(request):
    top = (
        BillItem.objects.values('inventory__name')
        .annotate(units_sold=Sum('quantity'), revenue=Sum(F('quantity') * F('price')))
        .order_by('-units_sold')[:10]
    )
    return Response([
        {
            'name': item['inventory__name'],
            'units_sold': item['units_sold'],
            'revenue': float(item['revenue'])
        } for item in top
    ])

@api_view(['GET'])
def report_inventory_status(request):
    low_stock_items = Inventory.objects.filter(quantity__lt=2)
    return Response([
        {'name': item.name, 'stock': item.quantity} for item in low_stock_items
    ])

@api_view(['GET'])
def report_recent_transactions(request):
    recent = Bill.objects.select_related('customer').order_by('-date')[:10]
    return Response([
        {
            'date': bill.date.strftime('%Y-%m-%d %H:%M'),
            'bill_no': bill.id,
            'customer': bill.customer.name,
            'total': float(bill.total)
        } for bill in recent
    ])

@api_view(['GET'])
def report_sales_trend(request):
    # Last 14 days sales
    today = timezone.now().date()
    days = [today - timedelta(days=i) for i in range(13, -1, -1)]
    data = []
    for day in days:
        total = Bill.objects.filter(date__date=day).aggregate(total=Sum('total'))['total'] or 0
        data.append({'date': day.strftime('%Y-%m-%d'), 'sales': float(total)})
    return Response(data)

@api_view(['POST'])
def report_send_to_manager(request):
    setting = NotificationSetting.objects.first()
    if not setting or not setting.email:
        return Response({'error': 'Manager email not set.'}, status=400)

    # Gather data
    total_sales = Bill.objects.aggregate(total=Sum('total'))['total'] or 0
    transactions = Bill.objects.count()
    avg_bill = Bill.objects.aggregate(avg=Sum('total')/Count('id'))['avg'] if transactions else 0
    low_stock_items = Inventory.objects.filter(quantity__lt=2)
    top_products = (
        BillItem.objects.values('inventory__name')
        .annotate(units_sold=Sum('quantity'), revenue=Sum(F('quantity') * F('price')))
        .order_by('-units_sold')[:10]
    )
    # Sales trend for top day/month
    from datetime import timedelta
    from django.utils import timezone
    today = timezone.now().date()
    days = [today - timedelta(days=i) for i in range(29, -1, -1)]
    trend = []
    for day in days:
        total = Bill.objects.filter(date__date=day).aggregate(total=Sum('total'))['total'] or 0
        trend.append({'date': day.strftime('%Y-%m-%d'), 'sales': float(total)})
    # Top day
    top_day = max(trend, key=lambda x: x['sales']) if trend else None
    # Top month
    month_map = {}
    for item in trend:
        month = item['date'][:7]  # YYYY-MM
        month_map[month] = month_map.get(month, 0) + item['sales']
    top_month = max(month_map.items(), key=lambda x: x[1]) if month_map else None

    # Generate PDF in memory
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "Report Summary")
    y -= 30

    p.setFont("Helvetica", 12)
    p.drawString(50, y, f"Total Sales: {total_sales}")
    y -= 20
    p.drawString(50, y, f"Total Transactions: {transactions}")
    y -= 20
    p.drawString(50, y, f"Average Bill: {avg_bill}")
    y -= 30

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Low Stock Items:")
    y -= 18
    p.setFont("Helvetica", 11)
    if low_stock_items:
        p.drawString(60, y, "Product Name           Stock")
        y -= 15
        for item in low_stock_items:
            p.drawString(60, y, f"{item.name:20} {item.quantity}")
            y -= 15
    else:
        p.drawString(60, y, "None")
        y -= 15
    y -= 10

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Top Selling Products:")
    y -= 18
    p.setFont("Helvetica", 11)
    if top_products:
        p.drawString(60, y, "Product Name           Units Sold   Revenue")
        y -= 15
        for prod in top_products:
            p.drawString(60, y, f"{prod['inventory__name']:20} {prod['units_sold']:10}   {prod['revenue']}")
            y -= 15
    else:
        p.drawString(60, y, "None")
        y -= 15
    y -= 10

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Top Selling Day:")
    y -= 18
    p.setFont("Helvetica", 11)
    if top_day:
        p.drawString(60, y, f"{top_day['date']} (Sales: {top_day['sales']})")
        y -= 15
    else:
        p.drawString(60, y, "N/A")
        y -= 15
    y -= 10

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Top Selling Month:")
    y -= 18
    p.setFont("Helvetica", 11)
    if top_month:
        p.drawString(60, y, f"{top_month[0]} (Sales: {top_month[1]})")
        y -= 15
    else:
        p.drawString(60, y, "N/A")
        y -= 15
    y -= 20

    p.setFont("Helvetica-Oblique", 10)
    p.drawString(50, y, "Generated by IBMS System")
    p.save()

    buffer.seek(0)
    pdf_data = buffer.getvalue()

    # Create email with PDF attachment
    email = EmailMessage(
        subject=' Report Summary',
        body='Please find the attached PDF report.',
        from_email='noreply@example.com',
        to=[setting.email],
    )
    email.attach('report_summary.pdf', pdf_data, 'application/pdf')
    try:
        email.send(fail_silently=False)
        return Response({'success': True})
    except Exception as e:
        print("EMAIL ERROR:", e)
        return Response({'error': str(e)}, status=500)
