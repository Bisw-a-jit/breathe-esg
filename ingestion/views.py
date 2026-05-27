from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Tenant, IngestionBatch, EmissionRecord
import pandas as pd
import json

def get_or_create_tenant():
    tenant, _ = Tenant.objects.get_or_create(name="Demo Client")
    return tenant

def clean_raw(row):
    """Convert a pandas row to a clean JSON-serializable dict"""
    result = {}
    for k, v in row.items():
        if pd.isna(v) if not isinstance(v, str) else False:
            result[str(k)] = None
        else:
            result[str(k)] = str(v)
    return result

def normalize_unit(quantity, unit):
    unit = unit.strip().lower()
    conversions = {
        'mwh': (quantity * 1000, 'kWh'),
        'gwh': (quantity * 1000000, 'kWh'),
        'kwh': (quantity, 'kWh'),
        'gallons': (quantity * 3.785, 'liters'),
        'gallon': (quantity * 3.785, 'liters'),
        'l': (quantity, 'liters'),
        'liters': (quantity, 'liters'),
        'km': (quantity, 'km'),
        'miles': (quantity * 1.609, 'km'),
        'mi': (quantity * 1.609, 'km'),
    }
    return conversions.get(unit, (quantity, unit))

def calculate_co2(quantity, unit, category):
    factors = {
        'electricity': 0.233,
        'fuel': 2.68,
        'flight': 0.255,
        'hotel': 20.0,
        'ground': 0.14,
        'procurement': 1.0,
    }
    return quantity * factors.get(category, 1.0)

def flag_suspicious(quantity, category):
    thresholds = {
        'electricity': 1000000,
        'fuel': 100000,
        'flight': 50000,
        'hotel': 10000,
        'ground': 10000,
        'procurement': 500000,
    }
    return quantity > thresholds.get(category, 999999)

@api_view(['POST'])
def ingest_sap(request):
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided'}, status=400)

    tenant = get_or_create_tenant()
    batch = IngestionBatch.objects.create(
        tenant=tenant,
        source_type='sap',
        filename=file.name,
        status='pending'
    )

    try:
        df = pd.read_csv(file)
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

        records = []
        for _, row in df.iterrows():
            raw = clean_raw(row)
            qty = float(row.get('quantity') or 0)
            unit = str(row.get('unit') or 'liters')
            category = str(row.get('category') or 'fuel').lower()
            norm_qty, norm_unit = normalize_unit(qty, unit)
            co2 = calculate_co2(norm_qty, norm_unit, category)
            suspicious = flag_suspicious(norm_qty, category)

            records.append(EmissionRecord(
                tenant=tenant,
                batch=batch,
                source_type='sap',
                source_row_id=str(row.get('document_number') or ''),
                scope='scope1',
                category=category,
                description=str(row.get('material_description') or ''),
                quantity=norm_qty,
                unit=norm_unit,
                co2_equivalent=co2,
                raw_quantity=qty,
                raw_unit=unit,
                raw_data=raw,
                activity_date=pd.to_datetime(row.get('posting_date') or '2024-01-01').date(),
                status='flagged' if suspicious else 'pending',
                flag_reason='Quantity exceeds normal threshold' if suspicious else '',
            ))

        EmissionRecord.objects.bulk_create(records)
        batch.status = 'processed'
        batch.row_count = len(records)
        batch.save()
        return Response({'message': 'SAP ingestion successful', 'rows': len(records)})

    except Exception as e:
        batch.status = 'failed'
        batch.error_message = str(e)
        batch.save()
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def ingest_utility(request):
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided'}, status=400)

    tenant = get_or_create_tenant()
    batch = IngestionBatch.objects.create(
        tenant=tenant,
        source_type='utility',
        filename=file.name,
        status='pending'
    )

    try:
        df = pd.read_csv(file)
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

        records = []
        for _, row in df.iterrows():
            raw = clean_raw(row)
            qty = float(row.get('consumption_kwh') or 0)
            norm_qty, norm_unit = normalize_unit(qty, 'kWh')
            co2 = calculate_co2(norm_qty, norm_unit, 'electricity')
            suspicious = flag_suspicious(norm_qty, 'electricity')

            records.append(EmissionRecord(
                tenant=tenant,
                batch=batch,
                source_type='utility',
                source_row_id=str(row.get('meter_id') or ''),
                scope='scope2',
                category='electricity',
                description=f"Meter: {row.get('meter_id') or ''} - {row.get('site_name') or ''}",
                quantity=norm_qty,
                unit=norm_unit,
                co2_equivalent=co2,
                raw_quantity=qty,
                raw_unit='kWh',
                raw_data=raw,
                activity_date=pd.to_datetime(row.get('billing_period_start') or '2024-01-01').date(),
                billing_period_start=pd.to_datetime(row.get('billing_period_start') or '2024-01-01').date(),
                billing_period_end=pd.to_datetime(row.get('billing_period_end') or '2024-01-31').date(),
                status='flagged' if suspicious else 'pending',
                flag_reason='Consumption exceeds normal threshold' if suspicious else '',
            ))

        EmissionRecord.objects.bulk_create(records)
        batch.status = 'processed'
        batch.row_count = len(records)
        batch.save()
        return Response({'message': 'Utility ingestion successful', 'rows': len(records)})

    except Exception as e:
        batch.status = 'failed'
        batch.error_message = str(e)
        batch.save()
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
def ingest_travel(request):
    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided'}, status=400)

    tenant = get_or_create_tenant()
    batch = IngestionBatch.objects.create(
        tenant=tenant,
        source_type='travel',
        filename=file.name,
        status='pending'
    )

    try:
        df = pd.read_csv(file)
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]

        records = []
        for _, row in df.iterrows():
            raw = clean_raw(row)
            category = str(row.get('travel_type') or 'flight').lower()
            qty = float(row.get('distance_km') or 0)
            nights = float(row.get('nights') or 0)

            if category == 'hotel':
                norm_qty, norm_unit = nights, 'nights'
            else:
                norm_qty, norm_unit = normalize_unit(qty, 'km')

            co2 = calculate_co2(norm_qty, norm_unit, category)
            suspicious = flag_suspicious(norm_qty, category)

            records.append(EmissionRecord(
                tenant=tenant,
                batch=batch,
                source_type='travel',
                source_row_id=str(row.get('trip_id') or ''),
                scope='scope3',
                category=category,
                description=f"{row.get('origin') or ''} → {row.get('destination') or ''}",
                quantity=norm_qty,
                unit=norm_unit,
                co2_equivalent=co2,
                raw_quantity=qty,
                raw_unit='km',
                raw_data=raw,
                activity_date=pd.to_datetime(row.get('travel_date') or '2024-01-01').date(),
                status='flagged' if suspicious else 'pending',
                flag_reason='Distance exceeds normal threshold' if suspicious else '',
            ))

        EmissionRecord.objects.bulk_create(records)
        batch.status = 'processed'
        batch.row_count = len(records)
        batch.save()
        return Response({'message': 'Travel ingestion successful', 'rows': len(records)})

    except Exception as e:
        batch.status = 'failed'
        batch.error_message = str(e)
        batch.save()
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def get_records(request):
    records = EmissionRecord.objects.all().order_by('-created_at')
    data = []
    for r in records:
        data.append({
            'id': str(r.id),
            'source_type': r.source_type,
            'scope': r.scope,
            'category': r.category,
            'description': r.description,
            'quantity': r.quantity,
            'unit': r.unit,
            'co2_equivalent': r.co2_equivalent,
            'activity_date': str(r.activity_date),
            'status': r.status,
            'flag_reason': r.flag_reason,
            'reviewer_note': r.reviewer_note,
            'created_at': str(r.created_at),
        })
    return Response(data)

@api_view(['PATCH'])
def review_record(request, record_id):
    try:
        record = EmissionRecord.objects.get(id=record_id)
        new_status = request.data.get('status')
        note = request.data.get('reviewer_note', '')
        if new_status in ['approved', 'rejected', 'flagged']:
            record.status = new_status
            record.reviewer_note = note
            record.reviewed_at = timezone.now()
            record.save()
            return Response({'message': 'Record updated'})
        return Response({'error': 'Invalid status'}, status=400)
    except EmissionRecord.DoesNotExist:
        return Response({'error': 'Record not found'}, status=404)

@api_view(['GET'])
def get_batches(request):
    batches = IngestionBatch.objects.all().order_by('-uploaded_at')
    data = []
    for b in batches:
        data.append({
            'id': str(b.id),
            'source_type': b.source_type,
            'filename': b.filename,
            'status': b.status,
            'row_count': b.row_count,
            'uploaded_at': str(b.uploaded_at),
            'error_message': b.error_message,
        })
    return Response(data)

@api_view(['GET'])
def dashboard_stats(request):
    records = EmissionRecord.objects.all()
    total_co2 = sum(r.co2_equivalent for r in records)
    scope1 = sum(r.co2_equivalent for r in records.filter(scope='scope1'))
    scope2 = sum(r.co2_equivalent for r in records.filter(scope='scope2'))
    scope3 = sum(r.co2_equivalent for r in records.filter(scope='scope3'))
    return Response({
        'total': records.count(),
        'pending': records.filter(status='pending').count(),
        'approved': records.filter(status='approved').count(),
        'rejected': records.filter(status='rejected').count(),
        'flagged': records.filter(status='flagged').count(),
        'total_co2': total_co2,
        'scope1_co2': scope1,
        'scope2_co2': scope2,
        'scope3_co2': scope3,
    })
