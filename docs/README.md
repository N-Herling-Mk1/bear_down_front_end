# B.E.A.R. D.O.W.N. — Local WAV Connector (Front End)

Static front-end for streaming `.wav` files through a local FastAPI backend.

### 🚀 Setup (GitHub Pages)

1. Place all files in `/docs`.
2. In repo settings → Pages → Source = `main` branch, `/docs` folder.
3. GitHub Pages URL: `https://<your-username>.github.io/bear-down-ui/`.

### ⚙️ Connect to Local Backend

1. Run your FastAPI server locally:
   ```bash
   uvicorn backend.main:app --host 127.0.0.1 --port 8443 \
      --ssl-keyfile=certs/localhost-key.pem \
      --ssl-certfile=certs/localhost.pem
