# SF-academy-exchange-microservice
Prova SF academy microservizi

## Database setup
If you have not a database setup already run

```shell
docker-compose -f docker-compose.database-setup.yml up
```

which creates the default `Exchanger` database and creates the table using the `./BuildingBlocks/Database/latest_schema.sql` file

## Sdk Generation
To generate the Javascript SDK from the OpenAPI doc using

```shell
docker-compose -f docker-compose.swagger-codegen.yml up
```

## Run solution

```shell
docker-compose up
```

which binds
- [api](http://localhost:8000)
- [adminer](http://localhost:8080)
- [web](http://localhost:3000)

## Update protos defination, package.json dependencies, OpenAPI doc, tsconfig.json

```shell
docker-compose up --build
```