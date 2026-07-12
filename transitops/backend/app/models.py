import enum
import datetime as dt

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
)
from sqlalchemy.orm import relationship

from .database import Base


class Role(str, enum.Enum):
    admin = "admin"
    fleet_manager = "fleet_manager"
    safety_officer = "safety_officer"
    financial_analyst = "financial_analyst"
    driver = "driver"


class VehicleStatus(str, enum.Enum):
    available = "available"
    on_trip = "on_trip"
    in_shop = "in_shop"
    retired = "retired"


class DriverStatus(str, enum.Enum):
    pending = "pending"
    available = "available"
    on_trip = "on_trip"
    off_duty = "off_duty"
    suspended = "suspended"


class TripStatus(str, enum.Enum):
    draft = "draft"
    dispatched = "dispatched"
    completed = "completed"
    cancelled = "cancelled"


class MaintenanceStatus(str, enum.Enum):
    open = "open"
    in_shop = "in_shop"
    resolved = "resolved"
    closed = "closed"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(Role), nullable=False, default=Role.fleet_manager)
    created_at = Column(DateTime, default=dt.datetime.utcnow)


class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    capacity_kg = Column(Float, nullable=False)
    odometer = Column(Float, default=0)
    acquisition_cost = Column(Float, default=0)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.available)
    region = Column(String, default="")
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)
    license_category = Column(String, default="LMV")
    license_expiry = Column(DateTime, nullable=False)
    contact_number = Column(String, default="")
    safety_score = Column(Float, default=100)
    status = Column(Enum(DriverStatus), default=DriverStatus.available)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    trips = relationship("Trip", back_populates="driver")
    user = relationship("User", backref="driver_profile")


class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight = Column(Float, nullable=False)
    planned_distance = Column(Float, nullable=False)
    status = Column(Enum(TripStatus), default=TripStatus.draft)

    final_odometer = Column(Float, nullable=True)
    fuel_used = Column(Float, nullable=True)
    toll_cost = Column(Float, default=0)
    revenue = Column(Float, nullable=True)

    dispatched_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    issue = Column(String, nullable=False)
    description = Column(String, default="")
    cost = Column(Float, default=0)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.open)
    reported_by_driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    opened_at = Column(DateTime, default=dt.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
    reported_by_driver = relationship("Driver")


class FuelLog(Base):
    __tablename__ = "fuel_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    liters = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    date = Column(DateTime, default=dt.datetime.utcnow)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")


class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=dt.datetime.utcnow)
    note = Column(String, default="")

    vehicle = relationship("Vehicle", back_populates="expenses")
