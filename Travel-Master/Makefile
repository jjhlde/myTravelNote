# Makefile for TripCrafter development

.PHONY: help setup build up down restart logs shell console db-create db-migrate db-seed db-reset clean test

help:
	@echo "Available commands:"
	@echo "  make setup      - Initial setup (build, create DB, migrate, seed)"
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - Show logs (use LOGS=service_name for specific service)"
	@echo "  make shell      - Open shell in web container"
	@echo "  make console    - Open Rails console"
	@echo "  make db-create  - Create database"
	@echo "  make db-migrate - Run database migrations"
	@echo "  make db-seed    - Seed database"
	@echo "  make db-reset   - Reset database"
	@echo "  make clean      - Clean up Docker resources"
	@echo "  make test       - Run tests"

setup: build db-create db-migrate db-seed
	@echo "Setup complete! Run 'make up' to start the services."

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Services started!"
	@echo "Rails: http://localhost:3000"
	@echo "Sidekiq: http://localhost:3000/sidekiq (dev only)"

down:
	docker-compose down

restart: down up

logs:
ifdef SERVICE
	docker-compose logs -f $(SERVICE)
else
	docker-compose logs -f
endif

shell:
	docker-compose exec web bash

console:
	docker-compose exec web rails console

db-create:
	docker-compose exec web rails db:create

db-migrate:
	docker-compose exec web rails db:migrate

db-seed:
	docker-compose exec web rails db:seed

db-reset:
	docker-compose exec web rails db:drop db:create db:migrate db:seed

clean:
	docker-compose down -v
	docker system prune -f

test:
	docker-compose exec web rails test