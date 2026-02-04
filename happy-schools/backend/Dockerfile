# Use official Python runtime as a parent image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for some python packages or sqlite)
# sqlite3 is usually included in python images, but good to be safe if needed extensions
# RUN apt-get update && apt-get install -y sqlite3

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port (FastAPI defaults to 8000, usually we run on 8000 inside, map to 8001 outside)
EXPOSE 8000

# Command to run the application
# Using --host 0.0.0.0 is crucial for Docker networking
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
