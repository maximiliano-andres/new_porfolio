"""Portfolio backend — hexagonal architecture (ports & adapters).

    domain/       business rules and ports (pure Python, no framework imports)
    application/  use cases that orchestrate the domain through its ports
    adapters/     inbound (HTTP · FastAPI) and outbound (JSONL storage, in-memory rate limiter)
    config.py     settings read from environment variables
    main.py       composition root: wires adapters into use cases and builds the ASGI app
"""
