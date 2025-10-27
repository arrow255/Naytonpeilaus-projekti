cd Frontend
npm run build
cd ..
docker compose down -v
docker compose up --build
