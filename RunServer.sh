trap "kill 0" EXIT
npm --install

npm run build

npm run peer &
npm start &
wait
