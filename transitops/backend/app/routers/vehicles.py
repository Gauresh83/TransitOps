from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import auth, models

from .. import schemas
from ..database import get_db

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])

MANAGE_ROLES = ["fleet_manager"]


@router.get("", response_model=List[schemas.VehicleOut])
def list_vehicles(
    status: Optional[models.VehicleStatus] = None,
    type: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Vehicle)
    if status:
        q = q.filter(models.Vehicle.status == status)
    if type:
        q = q.filter(models.Vehicle.type == type)
    if region:
        q = q.filter(models.Vehicle.region == region)
    return q.order_by(models.Vehicle.id.desc()).all()


@router.post("", response_model=schemas.VehicleOut)
def create_vehicle(
    payload: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    existing = db.query(models.Vehicle).filter(
        models.Vehicle.registration_number == payload.registration_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Registration number must be unique")
    vehicle = models.Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.put("/{vehicle_id}", response_model=schemas.VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: schemas.VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    vehicle = db.query(models.Vehicle).get(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, k, v)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}")
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    vehicle = db.query(models.Vehicle).get(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    active_trip = db.query(models.Trip).filter(
        models.Trip.vehicle_id == vehicle_id,
        models.Trip.status == models.TripStatus.dispatched,
    ).first()
    if active_trip:
        raise HTTPException(status_code=400, detail="Cannot delete a vehicle that is on an active trip")
    db.delete(vehicle)
    db.commit()
    return {"ok": True}
