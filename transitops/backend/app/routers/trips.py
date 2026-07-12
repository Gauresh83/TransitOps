import datetime as dt
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/trips", tags=["trips"])

DISPATCH_ROLES = ["fleet_manager"]


def _with_relations(q):
    return q.options(joinedload(models.Trip.vehicle), joinedload(models.Trip.driver))


@router.get("/mine", response_model=List[schemas.TripOut])
def list_my_trips(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("driver")),
):
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        return []
    return _with_relations(db.query(models.Trip)).filter(
        models.Trip.driver_id == driver.id
    ).order_by(models.Trip.id.desc()).all()


@router.get("", response_model=List[schemas.TripOut])
def list_trips(
    status: Optional[models.TripStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = _with_relations(db.query(models.Trip))
    if status:
        q = q.filter(models.Trip.status == status)
    return q.order_by(models.Trip.id.desc()).all()


@router.post("", response_model=schemas.TripOut)
def create_trip(
    payload: schemas.TripCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*DISPATCH_ROLES)),
):
    vehicle = db.query(models.Vehicle).get(payload.vehicle_id)
    driver = db.query(models.Driver).get(payload.driver_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if vehicle.status in (models.VehicleStatus.retired, models.VehicleStatus.in_shop):
        raise HTTPException(status_code=400, detail="Vehicle is retired or in maintenance and cannot be dispatched")
    if vehicle.status == models.VehicleStatus.on_trip:
        raise HTTPException(status_code=400, detail="Vehicle is already on a trip")
    if driver.status == models.DriverStatus.suspended:
        raise HTTPException(status_code=400, detail="Driver is suspended and cannot be assigned")
    if driver.status == models.DriverStatus.on_trip:
        raise HTTPException(status_code=400, detail="Driver is already on a trip")
    if driver.status == models.DriverStatus.off_duty:
        raise HTTPException(status_code=400, detail="Driver is off duty")
    if driver.license_expiry.replace(tzinfo=None) < dt.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Driver's license has expired")
    if payload.cargo_weight > vehicle.capacity_kg:
        raise HTTPException(
            status_code=400,
            detail=f"Cargo weight ({payload.cargo_weight}kg) exceeds vehicle capacity ({vehicle.capacity_kg}kg)",
        )

    trip = models.Trip(
        source=payload.source,
        destination=payload.destination,
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        cargo_weight=payload.cargo_weight,
        planned_distance=payload.planned_distance,
        status=models.TripStatus.draft,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.put("/{trip_id}/dispatch", response_model=schemas.TripOut)
def dispatch_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*DISPATCH_ROLES)),
):
    trip = _with_relations(db.query(models.Trip)).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status != models.TripStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft trips can be dispatched")

    vehicle = trip.vehicle
    driver = trip.driver
    if vehicle.status != models.VehicleStatus.available:
        raise HTTPException(status_code=400, detail="Vehicle is no longer available")
    if driver.status != models.DriverStatus.available:
        raise HTTPException(status_code=400, detail="Driver is no longer available")

    trip.status = models.TripStatus.dispatched
    trip.dispatched_at = dt.datetime.utcnow()
    vehicle.status = models.VehicleStatus.on_trip
    driver.status = models.DriverStatus.on_trip
    db.commit()
    db.refresh(trip)
    return trip


@router.put("/{trip_id}/complete", response_model=schemas.TripOut)
def complete_trip(
    trip_id: int,
    payload: schemas.TripCompleteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*DISPATCH_ROLES)),
):
    trip = _with_relations(db.query(models.Trip)).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status != models.TripStatus.dispatched:
        raise HTTPException(status_code=400, detail="Only dispatched trips can be completed")

    vehicle = trip.vehicle
    driver = trip.driver

    trip.status = models.TripStatus.completed
    trip.completed_at = dt.datetime.utcnow()
    trip.final_odometer = payload.final_odometer
    trip.fuel_used = payload.fuel_used
    trip.toll_cost = payload.toll_cost
    trip.revenue = payload.revenue

    vehicle.odometer = max(vehicle.odometer, payload.final_odometer)
    vehicle.status = models.VehicleStatus.available
    driver.status = models.DriverStatus.available

    if payload.fuel_used > 0:
        fuel_log = models.FuelLog(
            vehicle_id=vehicle.id,
            liters=payload.fuel_used,
            cost=payload.fuel_cost,
            trip_id=trip.id,
        )
        db.add(fuel_log)

    db.commit()
    db.refresh(trip)
    return trip


@router.put("/{trip_id}/cancel", response_model=schemas.TripOut)
def cancel_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*DISPATCH_ROLES)),
):
    trip = _with_relations(db.query(models.Trip)).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status not in (models.TripStatus.draft, models.TripStatus.dispatched):
        raise HTTPException(status_code=400, detail="Only draft or dispatched trips can be cancelled")

    was_dispatched = trip.status == models.TripStatus.dispatched
    trip.status = models.TripStatus.cancelled

    if was_dispatched:
        trip.vehicle.status = models.VehicleStatus.available
        trip.driver.status = models.DriverStatus.available

    db.commit()
    db.refresh(trip)
    return trip
