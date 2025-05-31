from dataclasses import dataclass

from pydantic import BaseModel


class StartNavigationSessionDTO(BaseModel):
    engine: str
    proxy_loader: str
    port: str
    ip: str


@dataclass(frozen=True)
class NavigationSessionDTO:
    id: str
