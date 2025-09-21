FROM python:3.11-alpine

WORKDIR /app

# Alpine использует apk вместо apt
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev \
    linux-headers

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN adduser -D -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000
CMD ["python", "app.py"]