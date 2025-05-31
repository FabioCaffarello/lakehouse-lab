FROM fabiocaffarello/scraper-engine:latest as devimage

COPY dist/*.tar.gz .
RUN pip install *.tar.gz
RUN rm -rf *.tar.gz

COPY ./bot/ /app/scraper_engine/bot

WORKDIR /app

FROM devimage as prodimage

COPY --from=devimage /app/scraper_engine/ /app/scraper_engine/

ENTRYPOINT ["python", "/app/scraper_engine/cmd/main.py"]


