from fastapi import FastAPI
from app.routes.ws import ws_router
from app.core.rooms import RoomManager
import logging

logging.basicConfig(
    format="%(asctime)s :: %(message)s",
    level=logging.DEBUG
    )


app = FastAPI()
app.state.room_manager = RoomManager()
app.include_router(ws_router)

# TODO add session, index page, etc.


