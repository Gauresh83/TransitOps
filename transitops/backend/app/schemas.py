import datetime as dt
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict

from .models import Role, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role = Role.fleet_manager


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DriverSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    license_number: str
    license_category: str = "LMV"
    license_expiry: dt.date
    contact_number: str = ""


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Vehicle ----------
class VehicleCreate(BaseModel):
    registration_number: str
    name: str
    type: str
    capacity_kg: float
    odometer: float = 0
    acquisition_cost: float = 0
    region: str = ""


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    capacity_kg: Optional[float] = None
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    region: Optional[str] = None
    status: Optional[VehicleStatus] = None


class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    registration_number: str
    name: str
    type: str
    capacity_kg: float
    odometer: float
    acquisition_cost: float
    status: VehicleStatus
    region: str


# ---------- Driver ----------
class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str = "LMV"
    license_expiry: dt.date
    contact_number: str = ""
    safety_score: float = 100


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[dt.date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[DriverStatus] = None


class DriverOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    license_number: str
    license_category: str
    license_expiry: dt.datetime
    contact_number: str
    safety_score: float
    status: DriverStatus
    user_id: Optional[int] = None


# ---------- Trip ----------
class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float


class TripCompleteRequest(BaseModel):
    final_odometer: float
    fuel_used: float
    fuel_cost: float = 0
    toll_cost: float = 0
    revenue: float = 0


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float
    status: TripStatus
    final_odometer: Optional[float] = None
    fuel_used: Optional[float] = None
    toll_cost: float
    revenue: Optional[float] = None
    dispatched_at: Optional[dt.datetime] = None
    completed_at: Optional[dt.datetime] = None
    created_at: dt.datetime
    vehicle: Optional[VehicleOut] = None
    driver: Optional[DriverOut] = None


# ---------- Maintenance ----------
class MaintenanceCreate(BaseModel):
    vehicle_id: int
    issue: str
    description: str = ""
    cost: float = 0


class MaintenanceReportCreate(BaseModel):
    vehicle_id: int
    issue: str
    description: str = ""


class MaintenanceUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    cost: Optional[float] = None
    description: Optional[str] = None


class MaintenanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    issue: str
    description: str
    cost: float
    status: MaintenanceStatus
    reported_by_driver_id: Optional[int] = None
    opened_at: dt.datetime
    closed_at: Optional[dt.datetime] = None
    vehicle: Optional[VehicleOut] = None


# ---------- Fuel ----------
class FuelLogCreate(BaseModel):
    vehicle_id: int
    liters: float
    cost: float
    date: Optional[dt.date] = None


class FuelLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    liters: float
    cost: float
    date: dt.datetime


# ---------- Expense ----------
class ExpenseCreate(BaseModel):
    vehicle_id: int
    type: str
    amount: float
    note: str = ""


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    type: str
    amount: float
    date: dt.datetime
    note: str
