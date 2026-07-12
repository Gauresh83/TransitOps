import datetime as dt
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import auth

from .. import models
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    vehicles = db.query(models.Vehicle).all()
    drivers = db.query(models.Driver).all()
    trips = db.query(models.Trip).all()

    total_vehicles = len(vehicles)
    active_vehicles = len([v for v in vehicles if v.status != models.VehicleStatus.retired])
    available_vehicles = len([v for v in vehicles if v.status == models.VehicleStatus.available])
    in_shop_vehicles = len([v for v in vehicles if v.status == models.VehicleStatus.in_shop])

    active_trips = len([t for t in trips if t.status == models.TripStatus.dispatched])
    pending_trips = len([t for t in trips if t.status == models.TripStatus.draft])
    trips_today = len([
        t for t in trips
        if t.created_at.date() == dt.datetime.utcnow().date()
    ])

    drivers_on_duty = len([d for d in drivers if d.status == models.DriverStatus.on_trip])

    fleet_utilization = round((active_trips / active_vehicles * 100), 1) if active_vehicles else 0.0

    fuel_logs = db.query(models.FuelLog).all()
    maintenance_logs = db.query(models.MaintenanceLog).all()
    fuel_cost_total = sum(f.cost for f in fuel_logs)
    maintenance_cost_total = sum(m.cost for m in maintenance_logs)

    # Trips per month (last 6 months)
    trips_per_month = defaultdict(int)
    fuel_per_month = defaultdict(float)
    for t in trips:
        key = t.created_at.strftime("%Y-%m")
        trips_per_month[key] += 1
    for f in fuel_logs:
        key = f.date.strftime("%Y-%m")
        fuel_per_month[key] += f.cost

    months = sorted(set(list(trips_per_month.keys()) + list(fuel_per_month.keys())))[-6:]
    trips_chart = [{"month": m, "trips": trips_per_month.get(m, 0)} for m in months]
    fuel_chart = [{"month": m, "cost": round(fuel_per_month.get(m, 0), 2)} for m in months]

    vehicle_usage = [
        {"vehicle": v.registration_number, "trips": len([t for t in trips if t.vehicle_id == v.id and t.status == models.TripStatus.completed])}
        for v in vehicles
    ]

    status_breakdown = defaultdict(int)
    for v in vehicles:
        status_breakdown[v.status.value] += 1

    return {
        "kpis": {
            "active_vehicles": active_vehicles,
            "available_vehicles": available_vehicles,
            "vehicles_in_shop": in_shop_vehicles,
            "active_trips": active_trips,
            "pending_trips": pending_trips,
            "trips_today": trips_today,
            "drivers_on_duty": drivers_on_duty,
            "fleet_utilization": fleet_utilization,
            "fuel_cost_total": round(fuel_cost_total, 2),
            "maintenance_cost_total": round(maintenance_cost_total, 2),
        },
        "charts": {
            "trips_per_month": trips_chart,
            "fuel_expense": fuel_chart,
            "vehicle_usage": vehicle_usage,
            "status_breakdown": [{"status": k, "count": v} for k, v in status_breakdown.items()],
        },
    }
