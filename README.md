# Project setup

```bash
npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Generar una nueva migración basada en los cambios en las entidades

```bash
npm run migration:generate -- src/migrations/NombreMigracion
```

## Crear una migración vacía para escribir manualmente

```bash
npm run migration:create -- src/migrations/NombreMigracion
```

## Ejecutar las migraciones pendientes

```bash
npm run migration:run
```

## Revertir la última migración

```bash
npm run migration:revert
