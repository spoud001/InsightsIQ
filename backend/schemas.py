from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class DatasetRead(BaseModel):
    id: int
    name: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

    @field_serializer('uploaded_at')
    def serialize_uploaded_at(self, value):
        # Convert to local time before formatting
        import pytz
        from datetime import timezone
        import os
        # Use system local timezone or UTC if not available
        local_tz = os.environ.get('TZ', 'UTC')
        try:
            tz = pytz.timezone(local_tz)
            value = value.replace(tzinfo=timezone.utc).astimezone(tz)
        except Exception:
            value = value.replace(tzinfo=timezone.utc)
        return value.strftime('%Y-%m-%d %H:%M:%S') if value else None

class DatasetPreview(BaseModel):
    columns: List[str]
    rows: List[list]

class InsightRead(BaseModel):
    id: int
    summary: Optional[str]
    config: Optional[str]
    chart: Optional[str] = None  # base64 encoded PNG
    class Config:
        from_attributes = True

    @field_serializer('chart')
    def serialize_chart(self, value):
        if value:
            import base64
            return base64.b64encode(value).decode('utf-8')
        return None
