"""
Emulator Service REST API
This module sets up a FastAPI application for the Emulator Service.
It includes the main application instance, routes, and event handlers.
"""

from controllers import emulator_controller
from fastapi import FastAPI
from mem_repository.in_memory_repository import InMemoryRepository

app = FastAPI(
    title="Emulator Service REST API",
    description="API for the Emulator Service.",
    version="1.0.0",
)


@app.on_event("startup")
def startup_event():
    app.state.repository = InMemoryRepository()


app.include_router(emulator_controller.router)


@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint for the Emulator Service REST API.
    Returns a welcome message.
    """
    return {"message": "Welcome to the Emulator Service REST API!"}


@app.on_event("shutdown")
def shutdown_event():
    """
    Event handler for application shutdown.
    Can be used to perform cleanup tasks.
    """
    # Perform any necessary cleanup tasks here
    pass
