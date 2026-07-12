import datetime as dt

from .database import SessionLocal, engine, Base
from . import models, auth

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            print("Database already seeded, skipping.")
            return

        users = [
            models.User(name="Admin", email="admin@transitops.io", role=models.Role.admin,
                        password_hash=auth.hash_password("admin123")),
            models.User(name="Priya Sharma", email="fleet@transitops.io", role=models.Role.fleet_manager,
                        password_hash=auth.hash_password("fleet123")),
            models.User(name="Karan Mehta", email="safety@transitops.io", role=models.Role.safety_officer,
                        password_hash=auth.hash_password("safety123")),
            models.User(name="Neha Verma", email="finance@transitops.io", role=models.Role.financial_analyst,
                        password_hash=auth.hash_password("finance123")),
        ]
        db.add_all(users)

        vehicles = [
            models.Vehicle(registration_number="UP78-AB-1234", name="Truck-1", type="Truck",
                            capacity_kg=5000, odometer=42350, acquisition_cost=1800000,
                            status=models.VehicleStatus.available, region="North"),
            models.Vehicle(registration_number="UP78-AB-5678", name="Truck-2", type="Truck",
                            capacity_kg=5000, odometer=58120, acquisition_cost=1800000,
                            status=models.VehicleStatus.available, region="North"),
            models.Vehicle(registration_number="UP78-VN-0912", name="Van-1", type="Van",
                            capacity_kg=1200, odometer=21870, acquisition_cost=650000,
                            status=models.VehicleStatus.available, region="North"),
            models.Vehicle(registration_number="DL05-XY-4411", name="Truck-3", type="Truck",
                            capacity_kg=7500, odometer=91500, acquisition_cost=2200000,
                            status=models.VehicleStatus.in_shop, region="Central"),
        ]
        db.add_all(vehicles)

        drivers = [
            models.Driver(name="Rahul Yadav", license_number="UP14-2020-0044521",
                           license_expiry=dt.datetime.utcnow() + dt.timedelta(days=400),
                           contact_number="+91 98765 43210", safety_score=92,
                           status=models.DriverStatus.available),
            models.Driver(name="Amit Kumar", license_number="UP14-2019-0038820",
                           license_expiry=dt.datetime.utcnow() + dt.timedelta(days=200),
                           contact_number="+91 98765 11122", safety_score=88,
                           status=models.DriverStatus.available),
            models.Driver(name="Alex Fernandes", license_number="DL08-2021-0091234",
                           license_expiry=dt.datetime.utcnow() - dt.timedelta(days=10),
                           contact_number="+91 91234 56780", safety_score=76,
                           status=models.DriverStatus.available),
        ]
        db.add_all(drivers)
        db.commit()

        # Give one existing driver a login so the driver portal can be demoed end-to-end.
        rahul_user = models.User(
            name="Rahul Yadav", email="driver@transitops.io", role=models.Role.driver,
            password_hash=auth.hash_password("driver123"),
        )
        db.add(rahul_user)
        db.commit()
        db.refresh(rahul_user)
        drivers[0].user_id = rahul_user.id
        db.commit()

        # A pending driver application, to demo the fleet manager approval workflow.
        applicant_user = models.User(
            name="Sanjay Gupta", email="sanjay.driver@transitops.io", role=models.Role.driver,
            password_hash=auth.hash_password("sanjay123"),
        )
        db.add(applicant_user)
        db.commit()
        db.refresh(applicant_user)
        applicant_driver = models.Driver(
            name="Sanjay Gupta", license_number="UP14-2023-0099812",
            license_expiry=dt.datetime.utcnow() + dt.timedelta(days=500),
            contact_number="+91 90000 11223", safety_score=100,
            status=models.DriverStatus.pending, user_id=applicant_user.id,
        )
        db.add(applicant_driver)
        db.commit()

        maintenance = models.MaintenanceLog(
            vehicle_id=vehicles[3].id, issue="Oil Leakage",
            description="Engine oil leak reported by driver after last trip.",
            cost=8500, status=models.MaintenanceStatus.in_shop,
        )
        db.add(maintenance)

        trip1 = models.Trip(
            source="Delhi", destination="Kanpur", vehicle_id=vehicles[0].id,
            driver_id=drivers[0].id, cargo_weight=1200, planned_distance=490,
            status=models.TripStatus.completed,
            final_odometer=vehicles[0].odometer, fuel_used=68, toll_cost=450, revenue=32000,
            dispatched_at=dt.datetime.utcnow() - dt.timedelta(days=2),
            completed_at=dt.datetime.utcnow() - dt.timedelta(days=1),
        )
        db.add(trip1)
        db.add(models.FuelLog(vehicle_id=vehicles[0].id, liters=68, cost=7100, trip_id=1))
        db.commit()
        print("Seed data created.")
        print("Login with: admin@transitops.io / admin123")
        print("           fleet@transitops.io / fleet123")
        print("           safety@transitops.io / safety123")
        print("           finance@transitops.io / finance123")
        print("           driver@transitops.io / driver123   (approved driver, Rahul Yadav)")
        print("           sanjay.driver@transitops.io / sanjay123   (pending approval)")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
