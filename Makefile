run-docker:
	@echo "Starting xcallscan on testnet (dev)"
	@docker compose -f docker-compose.yml up -d

stop-docker:
	@echo "Stopping xcallscan on testnet (dev)"
	@docker compose -f docker-compose.yml down

build-docker:
	@echo "Building xcallscan on testnet (dev)"
	@docker compose -f docker-compose.yml build --no-cache
