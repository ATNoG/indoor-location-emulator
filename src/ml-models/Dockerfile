FROM python:3.8-alpine

WORKDIR /app

COPY src/ml-models/requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

CMD [ "python3", "-m", "src.ml-models.src.predictor"]