FROM python:3.8-alpine

WORKDIR /app

COPY src/backend/requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

CMD [ "python3", "-m", "src.backend.src.main_agent_module"]
