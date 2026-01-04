FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install OpenAgents
RUN pip install --upgrade pip
RUN pip install openagents

# Set working directory
WORKDIR /app

# Copy chef configuration
COPY . .

# Expose ports
EXPOSE 8700 8600

# Verify openagents is installed
RUN which openagents && openagents --version

# Start the network and agents
CMD ["sh", "-c", "openagents network start network.yaml & sleep 15 && openagents agent start agents/router.yaml & sleep 5 && openagents agent start agents/web-searcher.yaml & sleep 5 && openagents agent start agents/budget-chef.yaml & sleep 5 && openagents agent start agents/luxury-chef.yaml & wait"]