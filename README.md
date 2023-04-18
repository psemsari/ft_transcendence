![image](https://img.shields.io/badge/Maintained%3F-no-red.svg)
# Ft_transcendence

`ft_transcendence` is an open-source web application that uses Node.js and the NestJS framework. It is a Pong multiplayer game that allows users to create accounts, play against each other, and interact through chat and private messaging. The project also includes two-factor authentication and a backend server that handles game data and communication between clients. I was responsible for implementing the private messaging feature in the client-side of the project.

## Technologies used

- Node.js
- NestJS framework
- TypeScript
- ExpressJS
- PostgreSQL
- Docker

## Backend

The backend of the project uses a variety of technologies and tools including:

- 0auth for two-factor authentication
- postgreSQL and SQL for database management
- Docker and docker-compose for containerization

## Node.js

### Package system

- npm is used as the package system for the project.
- npm i -g package installs packages globally.
- npm link creates symbolic links to local packages.

### npx

- npx is used to execute npm commands without installing the package.

### NestJS dev

- nest new name-project creates a new NestJS project.
- npm run start:dev launches the server on port 3000 with hot reload.

## TypeScript

- TypeScript is used to transpile code into JavaScript.
- tsc name.ts transpiles the code.
- tsc name.ts --watch transpiles the code on every modification.

## NestJS

- NestJS uses decorators to modify the behavior of classes.
- Typeorm is used as an interface between the database and code.
- Class-validator is used for data validation.

## Docker

- Docker is used to create a development environment.
- Dockerfile is used to create an image.
- Docker-compose is used to communicate between databases and other services.

## SocketIO and NestJS

- [Socket.IO](http://socket.io/) is used for real-time communication between the client and the server.

## Swagger / openapi

- Swagger / openapi is used for API documentation.

## Private messaging

- Private messaging is implemented on the client-side.
