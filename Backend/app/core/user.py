from dataclasses import dataclass
from app.core.rooms import Room

@dataclass
class User:
    name:str
    user_id:str
    room:Room|None


