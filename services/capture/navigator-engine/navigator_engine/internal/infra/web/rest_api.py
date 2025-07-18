from fastapi import FastAPI
from navigator_engine.internal.infra.repository.navigation_in_memory import (
    NavigationSessionInMemoryRepository,
)
from navigator_engine.internal.infra.web.handlers import rest_navigation_session_handler

app = FastAPI(
    title="Navigator Engine REST API",
    description="API for the Navigator Engine.",
    version="1.0.0",
)

app.include_router(rest_navigation_session_handler.router)


@app.on_event("startup")
def startup_event():
    app.state.repository = NavigationSessionInMemoryRepository()


@app.on_event("shutdown")
def shutdown_event():
    """
    Event handler for application shutdown.
    Can be used to perform cleanup tasks.
    """
    # Perform any necessary cleanup tasks here
    pass
