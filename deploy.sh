cd Frontend
npm run install
npm run build
mkdir ../Backend/app/dist/
cp -r dist/* ../Backend/app/dist/
cd ..
docker compose down -v
docker compose up --build
