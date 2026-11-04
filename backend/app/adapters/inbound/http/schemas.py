"""Request/response DTOs. Validation delegates to the domain rules, so the HTTP layer adds no business logic."""
from pydantic import BaseModel, Field, field_validator

from app.domain import contact
from app.domain.contact import ContactSubmission


class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=contact.NAME_MAX)
    email: str = Field(min_length=contact.EMAIL_MIN, max_length=contact.EMAIL_MAX)
    message: str = Field(min_length=1, max_length=contact.MESSAGE_MAX)
    # honeypot: invisible to people, bots tend to fill it in
    website: str = Field(default="", max_length=contact.HONEYPOT_MAX)

    @field_validator("name", "message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        return contact.clean_text(v)

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        return contact.normalize_email(v)

    def to_domain(self) -> ContactSubmission:
        return ContactSubmission(name=self.name, email=self.email, message=self.message, honeypot=self.website)


class StatusResponse(BaseModel):
    status: str
