from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=auth.hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/register-driver", response_model=schemas.Token)
def register_driver(payload: schemas.DriverSignup, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_license = db.query(models.Driver).filter(
        models.Driver.license_number == payload.license_number
    ).first()
    if existing_license:
        raise HTTPException(status_code=400, detail="License number is already registered")

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=auth.hash_password(payload.password),
        role=models.Role.driver,
    )
    db.add(user)
    db.flush()  # assign user.id before creating the linked driver profile

    driver = models.Driver(
        name=payload.name,
        license_number=payload.license_number,
        license_category=payload.license_category,
        license_expiry=payload.license_expiry,
        contact_number=payload.contact_number,
        status=models.DriverStatus.pending,
        user_id=user.id,
    )
    db.add(driver)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "user": user}


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = auth.create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
