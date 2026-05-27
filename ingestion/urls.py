from django.urls import path
from . import views

urlpatterns = [
    path('ingest/sap/', views.ingest_sap),
    path('ingest/utility/', views.ingest_utility),
    path('ingest/travel/', views.ingest_travel),
    path('records/', views.get_records),
    path('records/<uuid:record_id>/review/', views.review_record),
    path('batches/', views.get_batches),
    path('dashboard/stats/', views.dashboard_stats),
]