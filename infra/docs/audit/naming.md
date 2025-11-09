# Naming Conventions

## Folder Structure
| Location | Purpose | Naming Rule |
|----------|---------|-------------|
| `/infra/ci_cd/pipelines` | CI/CD pipeline configs | `{platform}-{env}.yml` (e.g., `railway-prod.yml`) |
| `/infra/probes/health` | Health check scripts | `healthcheck.sh`, `readiness.sh` |
| `/infra/probes/error` | Error detection scripts | `{service}-error.sh` |
| `/infra/logs/app` | Application logs | `app-{date}.log` (e.g., `app-2025-01-15.log`) |
| `/infra/logs/infra` | Infrastructure logs | `infra-{service}-{date}.log` |
| `/infra/logs/fallback` | Fallback/error logs | `fallback-{date}.log` |
| `/infra/monitoring/dashboards` | Dashboard configs | `{service}-dashboard.json` |
| `/infra/monitoring/alerts` | Alert rules | `{severity}-{service}.yml` |
| `/infra/scaling/autoscale` | Auto-scaling rules | `{service}-scale.yml` |
| `/infra/scaling/thresholds` | Threshold configs | `{metric}-threshold.json` |
| `/infra/workflows/deployment` | Deployment workflows | `deploy-{env}.yml` |
| `/infra/workflows/maintenance` | Maintenance scripts | `maint-{task}.sh` |
| `/infra/workflows/rollback` | Rollback procedures | `rollback-{version}.md` |

## File Naming
- Scripts: lowercase, hyphen-separated, `.sh` extension
- Configs: lowercase, hyphen-separated, `.yml`/`.json`
- Docs: lowercase, hyphen-separated, `.md`
- Logs: `{type}-{identifier}-{timestamp}.log`

## Environment Labels
- `dev`: Development
- `staging`: Staging/QA
- `prod`: Production

## Service Identifiers
- `api`: Main API service
- `web`: Frontend/web service
- `rag`: RAG/vector service
- `agent`: Agent services
