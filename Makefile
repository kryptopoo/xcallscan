run-testnet:
	@echo "Starting xcallscan on testnet"
	@docker compose -f docker-compose-testnet.yml --env-file ./explorer/.env up -d

stop-testnet:
	@echo "Stopping xcallscan on testnet"
	@docker compose -f docker-compose-testnet.yml --env-file ./explorer/.env down

build-testnet:
	@echo "Building xcallscan on testnet"
	@docker compose -f docker-compose-testnet.yml --env-file ./explorer/.env build

run-mainnet:
	@echo "Starting xcallscan on mainnet"
	@docker compose -f docker-compose-mainnet.yml --env-file ./explorer/.env up -d

stop-mainnet:
	@echo "Stopping xcallscan on mainnet"
	@docker compose -f docker-compose-mainnet.yml --env-file ./explorer/.env down

build-mainnet:
	@echo "Building xcallscan on mainnet"
	@docker compose -f docker-compose-mainnet.yml --env-file ./explorer/.env build
