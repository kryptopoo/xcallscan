run-docker-testnet:
	@echo "Starting xcallscan on testnet (dev)"
	@docker compose -f docker-compose-testnet.yml up -d

stop-docker-testnet:
	@echo "Stopping xcallscan on testnet (dev)"
	@docker compose -f docker-compose-testnet.yml down

build-docker-testnet:
	@echo "Building xcallscan on testnet (dev)"
	@docker compose -f docker-compose-testnet.yml build --no-cache

run-docker-mainnet:
	@echo "Starting xcallscan on mainnet (dev)"
	@docker compose -f docker-compose-mainnet.yml up -d

stop-docker-mainnet:
	@echo "Stopping xcallscan on mainnet (dev)"
	@docker compose -f docker-compose-mainnet.yml down

build-docker-mainnet:
	@echo "Building xcallscan on mainnet (dev)"
	@docker compose -f docker-compose-mainnet.yml build --no-cache
