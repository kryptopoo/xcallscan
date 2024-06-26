run-docker:
	@echo "Starting xcallscan on testnet (dev)"
	@docker compose -f docker-compose.yml --env-file ./.env up -d

stop-docker:
	@echo "Stopping xcallscan on testnet (dev)"
	@docker compose -f docker-compose.yml --env-file ./.env down

build-docker:
	@echo "Building xcallscan on testnet (dev)"
	@docker compose -f docker-compose.yml --env-file ./.env build --no-cache
