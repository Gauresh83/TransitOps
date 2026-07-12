import csv
import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _vehicle_report_rows(db: Session):
    vehicles = db.query(models.Vehicle).all()
    rows = []
    for v in vehicles:
        completed_trips = [t for t in v.trips if t.status == models.TripStatus.completed]
        total_distance = sum((t.final_odometer or 0) for t in completed_trips)
        fuel_total = sum(f.liters for f in v.fuel_logs)
        fuel_cost = sum(f.cost for f in v.fuel_logs)
        maintenance_cost = sum(m.cost for m in v.maintenance_logs)
        revenue = sum((t.revenue or 0) for t in completed_trips)
        operational_cost = fuel_cost + maintenance_cost
        fuel_efficiency = round(total_distance / fuel_total, 2) if fuel_total else 0
        roi = round((revenue - operational_cost) / v.acquisition_cost, 4) if v.acquisition_cost else 0

        rows.append({
            "registration_number": v.registration_number,
            "name": v.name,
            "status": v.status.value,
            "completed_trips": len(completed_trips),
            "total_distance_km": round(total_distance, 1),
            "fuel_liters": round(fuel_total, 1),
            "fuel_cost": round(fuel_cost, 2),
            "maintenance_cost": round(maintenance_cost, 2),
            "operational_cost": round(operational_cost, 2),
            "revenue": round(revenue, 2),
            "fuel_efficiency_km_per_l": fuel_efficiency,
            "roi": roi,
        })
    return rows


@router.get("/fleet")
def fleet_report(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return {"vehicles": _vehicle_report_rows(db)}


@router.get("/fleet.csv")
def fleet_report_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    rows = _vehicle_report_rows(db)
    output = io.StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fleet_report.csv"},
    )


@router.get("/trips.csv")
def trips_report_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    trips = db.query(models.Trip).all()
    output = io.StringIO()
    fieldnames = [
        "id", "source", "destination", "vehicle", "driver", "status",
        "cargo_weight", "planned_distance", "final_odometer", "fuel_used",
        "toll_cost", "revenue", "created_at",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for t in trips:
        writer.writerow({
            "id": t.id,
            "source": t.source,
            "destination": t.destination,
            "vehicle": t.vehicle.registration_number if t.vehicle else "",
            "driver": t.driver.name if t.driver else "",
            "status": t.status.value,
            "cargo_weight": t.cargo_weight,
            "planned_distance": t.planned_distance,
            "final_odometer": t.final_odometer or "",
            "fuel_used": t.fuel_used or "",
            "toll_cost": t.toll_cost,
            "revenue": t.revenue or "",
            "created_at": t.created_at.isoformat(),
        })
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trips_report.csv"},
    )
