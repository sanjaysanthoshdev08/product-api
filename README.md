\# Product REST API



A secure Product REST API developed using Java and Spring Boot as part of the Zest India IT Pvt. Ltd. Java Backend Developer Technical Assessment.



\## Tech Stack



\* Java 23

\* Spring Boot 4.1.1

\* Spring Data JPA

\* MySQL

\* Spring Security

\* JWT Authentication

\* Maven

\* JUnit

\* Docker / Docker Compose



\## Features



\* Product CRUD operations

\* RESTful API architecture

\* MySQL database integration

\* Input validation

\* Global exception handling

\* User registration and login

\* JWT-based authentication

\* Role-based authorization

\* Secure API endpoints

\* Unit/Spring Boot test setup

\* Dockerfile and Docker Compose configuration



\## API Endpoints



\### Authentication



```text

POST /api/v1/auth/register

POST /api/v1/auth/login

```



\### Products



```text

GET    /api/v1/products

GET    /api/v1/products/{id}

POST   /api/v1/products

PUT    /api/v1/products/{id}

DELETE /api/v1/products/{id}

```



\## Authentication



Protected product endpoints require a JWT access token.



In Postman, use:



```text

Authorization → Bearer Token → <JWT\_TOKEN>

```



The API also supports role-based authorization for protected operations.



\## Database



The application uses MySQL with Spring Data JPA.



Configure the database connection in:



```text

src/main/resources/application.properties

```



Do not commit real database passwords or other secrets to the repository.



\## Running Locally



Clone the repository and navigate to the project directory:



```bash

cd product-api

```



Build the application:



```bash

mvn clean package -DskipTests

```



Run the application:



```bash

mvn spring-boot:run

```



The API runs on:



```text

http://localhost:8080

```



\## Docker



The project includes:



```text

Dockerfile

docker-compose.yml

```



Docker configuration is included for containerized deployment.



\## Testing



The project contains Spring Boot test configuration under:



```text

src/test

```



API endpoints were tested using Postman.



\## Project Structure



```text

src/

&#x20;├── main/

&#x20;│   ├── java/com/assignment/product\_api/

&#x20;│   │   ├── config/

&#x20;│   │   ├── controller/

&#x20;│   │   ├── dto/

&#x20;│   │   ├── entity/

&#x20;│   │   ├── exception/

&#x20;│   │   ├── repository/

&#x20;│   │   ├── security/

&#x20;│   │   └── service/

&#x20;│   └── resources/

&#x20;│       └── application.properties

&#x20;└── test/

&#x20;    └── java/

```



\## Author



Sanjay Santhosh



