from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: str          # acepta email o nombre de usuario
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
