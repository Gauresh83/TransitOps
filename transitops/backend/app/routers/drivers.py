from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import auth, models

from .. import schemas
from ..database import get_db

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

MANAGE_ROLES = ["fleet_manager", "safety_officer"]


@router.get("", response_model=List[schemas.DriverOut])
def list_drivers(
    status: Optional[models.DriverStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Driver)
    if status:
        q = q.filter(models.Driver.status == status)
    return q.order_by(models.Driver.id.desc()).all()


@router.post("", response_model=schemas.DriverOut)
def create_driver(
    payload: schemas.DriverCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    existing = db.query(models.Driver).filter(
        models.Driver.license_number == payload.license_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="License number must be unique")
    driver = models.Driver(**payload.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.put("/{driver_id}", response_model=schemas.DriverOut)
def update_driver(
    driver_id: int,
    payload: schemas.DriverUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    driver = db.query(models.Driver).get(driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(driver, k, v)
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}")
def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    driver = db.query(models.Driver).get(driver_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    active_trip = db.query(models.Trip).filter(
        models.Trip.driver_id == driver_id,
        models.Trip.status == models.TripStatus.dispatched,
    ).first()
    if active_trip:
        raise HTTPException(status_code=400, detail="Cannot delete a driver who is on an active trip")
    db.delete(driver)
    db.commit()
    return {"ok": True}
