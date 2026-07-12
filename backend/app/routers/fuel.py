from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api", tags=["fuel"])

MANAGE_ROLES = ["fleet_manager", "financial_analyst"]


@router.get("/fuel-logs", response_model=List[schemas.FuelLogOut])
def list_fuel_logs(
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.FuelLog)
    if vehicle_id:
        q = q.filter(models.FuelLog.vehicle_id == vehicle_id)
    return q.order_by(models.FuelLog.id.desc()).all()


@router.post("/fuel-logs", response_model=schemas.FuelLogOut)
def create_fuel_log(
    payload: schemas.FuelLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    vehicle = db.query(models.Vehicle).get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    log = models.FuelLog(**payload.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/expenses", response_model=List[schemas.ExpenseOut])
def list_expenses(
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Expense)
    if vehicle_id:
        q = q.filter(models.Expense.vehicle_id == vehicle_id)
    return q.order_by(models.Expense.id.desc()).all()


@router.post("/expenses", response_model=schemas.ExpenseOut)
def create_expense(
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_roles(*MANAGE_ROLES)),
):
    vehicle = db.query(models.Vehicle).get(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    expense = models.Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense
