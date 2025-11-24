from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from app.routes.ws import ws_router
from app.core.rooms import RoomManager
from fastapi.staticfiles import StaticFiles
import logging
import os

PRODUCTION = os.getenv("FASTAPI_ENV", "").lower() == "production"
logging.basicConfig(
    format="%(asctime)s :: %(message)s",
    level=logging.DEBUG if not PRODUCTION else logging.INFO
    )


app = FastAPI()
app.state.room_manager = RoomManager()
app.include_router(ws_router)


if PRODUCTION:
    app.mount('/', StaticFiles(directory='app/dist', html=True), name='dist')
else:
    @app.get("/")
    async def index():
        return RedirectResponse(url="http://localhost:5173")

# TODO add session


