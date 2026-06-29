# Pake Python versi ringan
FROM python:3.11-slim

# Bikin folder kerja di dalam container
WORKDIR /app

# Copy daftar belanjaan & install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy sisa kodingan (main.py, dll)
COPY . .

# Buka port 8000
EXPOSE 8000

# Jalanin server pas container nyala
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]