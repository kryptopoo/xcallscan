run-testnet:
	@echo "Starting xcallscan on testnet"
	@docker compose -f docker-compose-testnet.yml --env-file ./explorer/.env up -d

stop-testnet:
	@echo "Stopping xcallscan on testnet"
	@docker compose -f docker-compose-testnet.yml --env-file ./explorer/.env down

build-testnet:
	@echo "Building xcallscan on testnet"
	@docker compose -f docker-compose-testnet.yml --env-file ./explorer/.env build
