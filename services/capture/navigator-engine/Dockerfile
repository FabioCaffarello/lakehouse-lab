FROM python:3.12.9-slim-bookworm as devimage

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    unzip \
    curl \
    x11-xserver-utils \
    xvfb \
    xauth \
    python3-tk \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y ca-certificates \
    && update-ca-certificates

RUN apt-get update
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt-get install -y ./google-chrome-stable_current_amd64.deb
RUN rm google-chrome-stable_current_amd64.deb

COPY dist/*.tar.gz .
RUN pip install *.tar.gz
RUN rm -rf *.tar.gz

RUN seleniumbase get chromedriver --path

ENV DISPLAY=:99
RUN touch /root/.Xauthority \
  xauth generate :99 . trusted \
  xauth add :99 . $(mcookie)

ENV PYTHONPATH=/app
COPY ./navigator_engine/ /app/navigator_engine
WORKDIR /app

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "Xvfb :99 -ac & python /app/navigator_engine/cmd/main.py"]
