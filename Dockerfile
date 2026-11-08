# syntax=docker/dockerfile:1.7
# One Dockerfile for every service: docker build --build-arg MODULE=payment-service .

FROM maven:3.9-eclipse-temurin-25 AS build
ARG MODULE
WORKDIR /src
COPY . .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -pl ${MODULE} -am package -DskipTests \
 && java -Djarmode=tools -jar ${MODULE}/target/app.jar extract --layers --launcher --destination /extracted

FROM eclipse-temurin:25-jre-alpine
# Numeric UID so Kubernetes can verify runAsNonRoot.
RUN addgroup -S -g 10001 app && adduser -S -u 10001 -G app app
WORKDIR /app
# Dependencies change less often than application code, so they get their own cached layers.
COPY --from=build /extracted/dependencies/ ./
COPY --from=build /extracted/spring-boot-loader/ ./
COPY --from=build /extracted/snapshot-dependencies/ ./
COPY --from=build /extracted/application/ ./
USER 10001:10001
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
