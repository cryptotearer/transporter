## Transporter

This is a project for simulation of realtime bus movement on Google Maps map.

## You may visit the deployed version here [transporter](https://transporter-tau.vercel.app/)
For reviewer's convenience, I have deployed this project as a `Demo`. Feel free to visit it on the above url

## How would we test it locally?

1. Clone the repostory `transporter`
2. Run `npm install` or `yarn` depending on your preferred package manager
3. Add `.env.local` file, where you will add your `Google Maps API Key` and `firebase configuration` variables
4. Run `yarn dev` to initialize the localhost
5. To experience realtime, you will need to act as a `driver` (driver page is found at `http://localhost:3000/`) and `user` at (`http://localhost:3000/user`). Put them side by side and animate the bus from the admin page and enjoy how realtime it is across all users.
6. `Note:` I have included `example env` file that contains every environment variable you will need to use

## Technologies used
1. NextJs and Typescript on the front-end
2. Firebase Firestore for `storage` and `streams` for realtime updates. In real project I recommend `socket.io` for bidirectional communications between client and server (realtime)
3. Google Maps API
4. Chadcn component library
5. Tailwind css

## UI Design

1. Driver's Page
   ![image](https://github.com/nirifabien1234/transporter/assets/58140627/2413c0e2-d16c-4b77-a0d5-6ffcc90bd620)


3. Users Page
![image](https://github.com/nirifabien1234/transporter/assets/58140627/ed673157-b9f4-43dc-a5b6-8ae91753bec5)

