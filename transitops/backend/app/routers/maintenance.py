import datetime as dt
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])

MANAGE_ROLES = ["fleet_manager"]


@router.get("/mine", response_model=List[schemas.MaintenanceOut])
def list_my_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("driver")),
):
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        return []
    return db.query(models.MaintenanceLog).options(joinedload(models.MaintenanceLog.vehicle)).filter(
        models.MaintenanceLog.reported_by_driver_id == driver.id
    ).order_by(models.MaintenanceLog.id.desc()).all()


@router.post("/report", response_model=schemas.MaintenanceOut)
def report_issue(
    payload: schemas.MaintenanceReportCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles("driver")),
):
    driver = db.query(models.Driver).filter(models.Driver.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    vehicle = db.query(models.Vehicle).get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    active_trip = db.query(models.Trip).filter(
        models.Trip.driver_id == driver.id,
        models.Trip.vehicle_id == payload.vehicle_id,
        models.Trip.status == models.TripStatus.dispatched,
    ).first()
    if not active_trip:
        raise HTTPException(
            status_code=400,
            detail="You can only report an issue for a vehicle you're currently assigned to",
        )

    log = models.MaintenanceLog(
        vehicle_id=payload.vehicle_id,
        issue=payload.issue,
        description=payload.description,
        status=models.MaintenanceStatus.open,
        reported_by_driver_id=driver.id,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("", response_model=List[schemas.MaintenanceOut])
def list_maintenance(
    status: Optional[models.MaintenanceStatus] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.MaintenanceLog).options(joinedload(models.MaintenanceLog.vehicle))
    if status:
        q = q.filter(models.MaintenanceLog.status == status)
    return q.order_by(models.MaintenanceLog.id.desc()).all()


@router.post("", response_model=schemas.MaintenanceOut)
def create_maintenance(
    payload: schemas.MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    vehicle = db.query(models.Vehicle).get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle.status == models.VehicleStatus.on_trip:
        raise HTTPException(status_code=400, detail="Cannot open maintenance while vehicle is on a trip")

    log = models.MaintenanceLog(
        vehicle_id=payload.vehicle_id,
        issue=payload.issue,
        description=payload.description,
        cost=payload.cost,
        status=models.MaintenanceStatus.in_shop,
    )
    vehicle.status = models.VehicleStatus.in_shop
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.put("/{log_id}", response_model=schemas.MaintenanceOut)
def update_maintenance(
    log_id: int,
    payload: schemas.MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    log = db.query(models.MaintenanceLog).options(joinedload(models.MaintenanceLog.vehicle)).get(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance record not found")

    data = payload.model_dump(exclude_unset=True)
    new_status = data.get("status")
    closing = new_status in (models.MaintenanceStatus.resolved, models.MaintenanceStatus.closed)
    escalating = new_status == models.MaintenanceStatus.in_shop and log.status != models.MaintenanceStatus.in_shop

    if escalating and log.vehicle.status == models.VehicleStatus.on_trip:
        raise HTTPException(
            status_code=400,
            detail="Vehicle is still on a trip — wait for it to complete or cancel it before sending it to the shop",
        )

    for k, v in data.items():
        setattr(log, k, v)

    if escalating:
        log.vehicle.status = models.VehicleStatus.in_shop

    if closing and log.vehicle.status != models.VehicleStatus.retired:
        log.closed_at = dt.datetime.utcnow()
        log.status = models.MaintenanceStatus.closed
        log.vehicle.status = models.VehicleStatus.available

    db.commit()
    db.refresh(log)
    return log
