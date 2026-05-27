from django.db import models
import uuid

# Represents a client company using Breathe ESG
class Tenant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

# Tracks every file/upload that came in
class IngestionBatch(models.Model):
    SOURCE_CHOICES = [
        ('sap', 'SAP Fuel & Procurement'),
        ('utility', 'Utility Electricity'),
        ('travel', 'Corporate Travel'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    filename = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    row_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.source_type} - {self.filename}"

# Every single emission row from any source
class EmissionRecord(models.Model):
    SCOPE_CHOICES = [
        ('scope1', 'Scope 1 - Direct'),
        ('scope2', 'Scope 2 - Indirect Electricity'),
        ('scope3', 'Scope 3 - Value Chain'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('flagged', 'Flagged - Suspicious'),
    ]
    CATEGORY_CHOICES = [
        ('fuel', 'Fuel Combustion'),
        ('procurement', 'Procurement'),
        ('electricity', 'Electricity'),
        ('flight', 'Business Flight'),
        ('hotel', 'Hotel Stay'),
        ('ground', 'Ground Transport'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    batch = models.ForeignKey(IngestionBatch, on_delete=models.CASCADE)

    # Source tracking
    source_type = models.CharField(max_length=20)
    source_row_id = models.CharField(max_length=255, blank=True)

    # Classification
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)

    # Normalized data (always stored in standard units)
    description = models.TextField(blank=True)
    quantity = models.FloatField()
    unit = models.CharField(max_length=50)  # always normalized: kWh, liters, km
    co2_equivalent = models.FloatField(default=0.0)  # always in kg CO2e

    # Original raw data (for audit trail)
    raw_quantity = models.FloatField()
    raw_unit = models.CharField(max_length=50)
    raw_data = models.JSONField(default=dict)  # full original row

    # Date info
    activity_date = models.DateField()
    billing_period_start = models.DateField(null=True, blank=True)
    billing_period_end = models.DateField(null=True, blank=True)

    # Review
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    reviewer_note = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    is_edited = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category} - {self.quantity} {self.unit} ({self.activity_date})"