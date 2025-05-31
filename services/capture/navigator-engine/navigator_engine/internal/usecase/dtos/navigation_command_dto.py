from pydantic import BaseModel


class NavigationCommandDTO(BaseModel):
    cmd: str
