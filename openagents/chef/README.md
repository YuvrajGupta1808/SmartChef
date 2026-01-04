# Smart Chef - Multi-Agent Recipe System

A multi-agent system using OpenAgents for creating budget and luxury recipes with real ingredient prices.

## Architecture

```
┌─────────────┐
│   Router    │  Coordinates workflow, delegates tasks
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Web-Searcher │  Searches for ingredient prices
└──────┬──────┘
       │
       ▼
┌─────────────┬─────────────┐
│Budget-Chef  │ Luxury-Chef │  Create formatted recipes
└─────────────┴─────────────┘
```

## Agents

### Router (`agents/router.yaml`)
- Receives recipe requests from users
- Routes to web-searcher for price lookup
- Delegates to appropriate chef based on recipe type
- Compiles and returns final recipe

### Web-Searcher (`agents/web-searcher.yaml`)
- Searches web for current ingredient prices
- Returns price data for both budget and premium ingredients
- Uses DuckDuckGo or Brave Search API

### Budget-Chef (`agents/budget-chef.yaml`)
- Creates affordable recipes ($15-20 range)
- Focuses on cost-saving substitutions
- Includes budget-friendly tips

### Luxury-Chef (`agents/luxury-chef.yaml`)
- Creates premium recipes ($40-80+ range)
- Uses high-quality ingredients
- Includes wine pairings and plating suggestions

## Workflow

1. User submits dish request with location
2. Router delegates price search to web-searcher
3. Web-searcher returns ingredient prices
4. Router delegates to budget-chef or luxury-chef
5. Chef creates formatted recipe with prices
6. Router returns complete recipe to user

## Project Templates

- **budget_recipe**: Budget-friendly recipe workflow
- **luxury_recipe**: Premium recipe workflow

## Running the Agents

```bash
# Start the network
openagents network start --config network.yaml

# Start each agent (in separate terminals)
openagents agent start --config agents/router.yaml
openagents agent start --config agents/web-searcher.yaml
openagents agent start --config agents/budget-chef.yaml
openagents agent start --config agents/luxury-chef.yaml
```

## Access Points

- Studio UI: http://localhost:8700/studio
- API: http://localhost:8700/api
- gRPC: localhost:8600

## Recipe Output Format

### Budget Recipe
```markdown
## [Dish Name] - Budget Version

**Prep Time:** X mins | **Cook Time:** X mins | **Servings:** 4
**Estimated Cost: $XX.XX**

### Budget Ingredients
| Item | Est. Price |
|------|------------|
| [ingredient] | $X.XX |

### Method
**1. [Step Title]:** [Instructions]

### Notes
[Budget tips]
```

### Luxury Recipe
```markdown
## [Dish Name] - Luxury Version

**Prep Time:** X mins | **Cook Time:** X mins | **Servings:** 4
**Estimated Cost: $XX.XX**
**Wine Pairing:** [Wine recommendation]

### Premium Ingredients
| Item | Est. Price |
|------|------------|
| [ingredient] | $XX.XX |

### Method
**1. [Step Title]:** [Professional instructions]

### Finishing & Garnish
[Plating suggestions]
```

## Environment Variables

- `BRAVE_API_KEY` (optional): For Brave Search API. Falls back to DuckDuckGo if not set.
