FROM python:3.12.9-slim-bookworm as devimage

COPY dist/*.tar.gz .
RUN pip install *.tar.gz
RUN rm -rf *.tar.gz

COPY ./emulator/ /app/emulator/

WORKDIR /app


FROM devimage as prodimage

COPY --from=devimage /app/emulator/ /app/emulator/

ENTRYPOINT ["python", "/app/emulator/cmd/main.py"]
