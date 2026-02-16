#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════╗
# ║   MSB E-Commerce — Single Runner                             ║
# ║   Run the entire microservices stack with one command         ║
# ╚═══════════════════════════════════════════════════════════════╝
set -euo pipefail

# ─── Constants ───────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_ROOT/.run_pids"

SERVICES=(product-service order-service inventory-service notification-service payment-service auth-service api-gateway)
SERVICE_PORTS=(8080 8081 8082 8083 8084 8085 9000)
FRONTEND_PORT=4200

# ─── Colors ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── Helpers ─────────────────────────────────────────────────────
banner() {
  echo ""
  echo -e "${CYAN}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║  $1$(printf '%*s' $((55 - ${#1})) '')║${NC}"
  echo -e "${CYAN}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

info()    { echo -e "${BLUE}[INFO]${NC}    $1"; }
success() { echo -e "${GREEN}[✓]${NC}       $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}    $1"; }
error()   { echo -e "${RED}[✗]${NC}       $1"; }
step()    { echo -e "${MAGENTA}[STEP]${NC}    $1"; }

# ─── Check prerequisites ────────────────────────────────────────
check_prereqs() {
  local missing=()

  if ! command -v docker &>/dev/null; then
    missing+=("docker")
  fi
  if ! command -v docker compose version &>/dev/null 2>&1; then
    # Try docker-compose (legacy)
    if ! command -v docker-compose &>/dev/null; then
      missing+=("docker-compose")
    fi
  fi

  if [[ "$1" == "local" ]]; then
    if ! command -v java &>/dev/null; then
      missing+=("java (JDK 21+)")
    fi
    if ! command -v mvn &>/dev/null && ! [ -f "$PROJECT_ROOT/product-service/mvnw" ]; then
      missing+=("maven or mvnw")
    fi
    if ! command -v node &>/dev/null; then
      missing+=("node")
    fi
    if ! command -v npm &>/dev/null; then
      missing+=("npm")
    fi
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    error "Missing prerequisites: ${missing[*]}"
    echo ""
    echo "  Please install the missing tools and try again."
    exit 1
  fi
  success "All prerequisites satisfied"
}

# ─── Docker Compose wrapper (v1 / v2 compat) ────────────────────
dc() {
  if docker compose version &>/dev/null 2>&1; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

# ─── Wait for a TCP port to accept connections ──────────────────
wait_for_port() {
  local host="$1" port="$2" label="$3" timeout="${4:-120}"
  local elapsed=0
  while ! (echo >/dev/tcp/"$host"/"$port") 2>/dev/null; do
    if [ "$elapsed" -ge "$timeout" ]; then
      error "$label did not become ready on port $port within ${timeout}s"
      return 1
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  success "$label is ready (port $port) [${elapsed}s]"
}

# ─── Wait for HTTP endpoint ─────────────────────────────────────
wait_for_http() {
  local url="$1" label="$2" timeout="${3:-120}"
  local elapsed=0
  while ! curl -sf "$url" >/dev/null 2>&1; do
    if [ "$elapsed" -ge "$timeout" ]; then
      error "$label did not become ready at $url within ${timeout}s"
      return 1
    fi
    sleep 3
    elapsed=$((elapsed + 3))
  done
  success "$label is ready ($url) [${elapsed}s]"
}

# ─── Print a dashboard of all service URLs ──────────────────────
print_dashboard() {
  local mode="$1"
  echo ""
  echo -e "${CYAN}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}${BOLD}║               🚀  MSB E-Commerce — Running               ║${NC}"
  echo -e "${CYAN}${BOLD}╠═══════════════════════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Mode:  ${GREEN}${BOLD}$mode${NC}$(printf '%*s' $((45 - ${#mode})) '')${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}╠═══════════════════════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  ${BOLD}Service${NC}                  ${BOLD}URL${NC}                         ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}╠═══════════════════════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  API Gateway            http://localhost:9000          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Product Service        http://localhost:8080          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Order Service          http://localhost:8081          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Inventory Service      http://localhost:8082          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Notification Service   http://localhost:8083          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Payment Service        http://localhost:8084          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Auth Service           http://localhost:8085          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Frontend               http://localhost:4200          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}╠═══════════════════════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  ${BOLD}Infrastructure${NC}                                         ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}╠═══════════════════════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Keycloak Admin         http://localhost:8181          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Kafka UI               http://localhost:8080          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Mailpit UI             http://localhost:8025          ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  MongoDB                localhost:27017                ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  MySQL                  localhost:3306                 ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}╠═══════════════════════════════════════════════════════════╣${NC}"
  echo -e "${CYAN}${BOLD}║${NC}  Stop everything:  ${YELLOW}./run.sh stop${NC}                       ${CYAN}${BOLD}║${NC}"
  echo -e "${CYAN}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# ─── Cleanup trap (for local mode) ──────────────────────────────
cleanup() {
  echo ""
  warn "Caught interrupt — shutting down..."
  do_stop
  exit 0
}

# ─── CREATE MySQL DATABASES ─────────────────────────────────────
create_mysql_databases() {
  step "Creating MySQL databases (order_service, inventory_service, payment_service)..."
  local password="${MYSQL_ROOT_PASSWORD:-mysql}"

  for db in order_service inventory_service payment_service; do
    docker exec -i mysql mysql -uroot -p"$password" -e "CREATE DATABASE IF NOT EXISTS $db;" 2>/dev/null \
      && success "Database '$db' ready" \
      || warn "Could not create '$db' (may already exist)"
  done
}

# ═════════════════════════════════════════════════════════════════
#  MODE: LOCAL
# ═════════════════════════════════════════════════════════════════
do_local() {
  banner "MSB E-Commerce — Local Dev Mode"
  check_prereqs "local"

  trap cleanup INT TERM

  # ── 1. Start infrastructure containers ──────────────────────
  step "Starting infrastructure containers..."
  cd "$PROJECT_ROOT"
  dc up -d
  success "Infrastructure containers started"

  # ── 2. Wait for infrastructure readiness ────────────────────
  step "Waiting for infrastructure to be ready..."
  wait_for_port localhost 27017 "MongoDB"        120
  wait_for_port localhost 3306  "MySQL"           120
  wait_for_port localhost 9092  "Kafka Broker"    120
  wait_for_port localhost 8181  "Keycloak"        180
  wait_for_port localhost 1025  "Mailpit SMTP"     60

  # ── 3. Create MySQL databases ───────────────────────────────
  create_mysql_databases

  # ── 4. Build all Java services ──────────────────────────────
  step "Building all Java services with Maven (this may take a few minutes)..."
  local mvn_cmd="mvn"
  if [ -f "$PROJECT_ROOT/product-service/mvnw" ]; then
    # Use the wrapper from one of the services; they share the same parent
    mvn_cmd=""
  fi

  # Build from the parent POM
  if [ -n "$mvn_cmd" ]; then
    (cd "$PROJECT_ROOT" && mvn clean package -DskipTests -B)
  elif [ -f "$PROJECT_ROOT/mvnw" ]; then
    (cd "$PROJECT_ROOT" && "$PROJECT_ROOT/mvnw" clean package -DskipTests -B)
  else
    # Use the Maven wrapper from any service, pointing to the parent pom
    (cd "$PROJECT_ROOT" && "$PROJECT_ROOT/product-service/mvnw" -f pom.xml clean package -DskipTests -B)
  fi
  success "Maven build complete"

  # ── 5. Start all Java services in background ────────────────
  > "$PID_FILE"  # Clear PID file

  for i in "${!SERVICES[@]}"; do
    local svc="${SERVICES[$i]}"
    local port="${SERVICE_PORTS[$i]}"
    local jar
    jar=$(find "$PROJECT_ROOT/$svc/target" -name "*.jar" -not -name "*-sources.jar" -not -name "*-javadoc.jar" | head -1)

    if [ -z "$jar" ]; then
      error "No JAR found for $svc — skipping"
      continue
    fi

    step "Starting $svc on port $port..."
    java -jar "$jar" \
      --server.port="$port" \
      > "$PROJECT_ROOT/$svc/target/$svc.log" 2>&1 &
    local pid=$!
    echo "$svc:$pid" >> "$PID_FILE"
    info "$svc started (PID $pid, log: $svc/target/$svc.log)"
  done

  # ── 6. Start Angular frontend ───────────────────────────────
  step "Starting Angular frontend..."
  (cd "$PROJECT_ROOT/frontend" && npm install --silent 2>/dev/null && npm start > "$PROJECT_ROOT/frontend/frontend.log" 2>&1) &
  local frontend_pid=$!
  echo "frontend:$frontend_pid" >> "$PID_FILE"
  info "Frontend starting (PID $frontend_pid, log: frontend/frontend.log)"

  # ── 7. Wait for services to be ready ────────────────────────
  step "Waiting for services to start..."
  for i in "${!SERVICES[@]}"; do
    wait_for_port localhost "${SERVICE_PORTS[$i]}" "${SERVICES[$i]}" 120 || true
  done
  wait_for_port localhost $FRONTEND_PORT "Frontend" 120 || true

  # ── 8. Dashboard ────────────────────────────────────────────
  print_dashboard "LOCAL"

  info "All services are running in the background."
  info "Press Ctrl+C to stop everything, or run: ./run.sh stop"

  # Keep script alive to handle Ctrl+C
  wait
}

# ═════════════════════════════════════════════════════════════════
#  MODE: DOCKER
# ═════════════════════════════════════════════════════════════════
do_docker() {
  banner "MSB E-Commerce — Docker Mode"
  check_prereqs "docker"

  # ── 1. Build & start everything ─────────────────────────────
  step "Building and starting all containers (infra + app)..."
  cd "$PROJECT_ROOT"
  dc -f docker-compose.yml -f docker-compose.prod.yml up --build -d

  # ── 2. Wait for infrastructure ──────────────────────────────
  step "Waiting for infrastructure..."
  wait_for_port localhost 27017 "MongoDB"        120
  wait_for_port localhost 3306  "MySQL"           120
  wait_for_port localhost 9092  "Kafka Broker"    120

  # ── 3. Create MySQL databases ───────────────────────────────
  create_mysql_databases

  # ── 4. Wait for application services ────────────────────────
  step "Waiting for application services..."
  for i in "${!SERVICES[@]}"; do
    wait_for_port localhost "${SERVICE_PORTS[$i]}" "${SERVICES[$i]}" 180 || true
  done
  wait_for_port localhost $FRONTEND_PORT "Frontend" 120 || true

  # ── 5. Dashboard ────────────────────────────────────────────
  print_dashboard "DOCKER"

  info "All containers running. View logs: docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
  info "Stop everything: ./run.sh stop"
}

# ═════════════════════════════════════════════════════════════════
#  MODE: STOP
# ═════════════════════════════════════════════════════════════════
do_stop() {
  banner "MSB E-Commerce — Stopping"

  # ── Kill background Java / frontend processes ───────────────
  if [ -f "$PID_FILE" ]; then
    step "Stopping local services..."
    while IFS=: read -r svc pid; do
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null && success "Stopped $svc (PID $pid)" || warn "Could not stop $svc (PID $pid)"
      else
        info "$svc (PID $pid) already stopped"
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  # ── Stop Docker containers ─────────────────────────────────
  step "Stopping Docker containers..."
  cd "$PROJECT_ROOT"
  dc -f docker-compose.yml -f docker-compose.prod.yml down 2>/dev/null || dc down 2>/dev/null || true

  success "Everything stopped."
}

# ═════════════════════════════════════════════════════════════════
#  MODE: STATUS
# ═════════════════════════════════════════════════════════════════
do_status() {
  banner "MSB E-Commerce — Status"

  echo -e "${BOLD}Docker Containers:${NC}"
  cd "$PROJECT_ROOT"
  dc -f docker-compose.yml -f docker-compose.prod.yml ps 2>/dev/null || dc ps 2>/dev/null || info "No containers running"

  echo ""
  echo -e "${BOLD}Port Check:${NC}"
  for i in "${!SERVICES[@]}"; do
    if (echo >/dev/tcp/localhost/"${SERVICE_PORTS[$i]}") 2>/dev/null; then
      success "${SERVICES[$i]} — port ${SERVICE_PORTS[$i]} OPEN"
    else
      error "${SERVICES[$i]} — port ${SERVICE_PORTS[$i]} CLOSED"
    fi
  done
  if (echo >/dev/tcp/localhost/$FRONTEND_PORT) 2>/dev/null; then
    success "Frontend — port $FRONTEND_PORT OPEN"
  else
    error "Frontend — port $FRONTEND_PORT CLOSED"
  fi
}

# ═════════════════════════════════════════════════════════════════
#  MODE: LOGS
# ═════════════════════════════════════════════════════════════════
do_logs() {
  local svc="${2:-}"
  if [ -n "$svc" ]; then
    if [ -f "$PROJECT_ROOT/$svc/target/$svc.log" ]; then
      tail -f "$PROJECT_ROOT/$svc/target/$svc.log"
    else
      dc -f docker-compose.yml -f docker-compose.prod.yml logs -f "$svc" 2>/dev/null || dc logs -f "$svc"
    fi
  else
    dc -f docker-compose.yml -f docker-compose.prod.yml logs -f 2>/dev/null || dc logs -f
  fi
}

# ═════════════════════════════════════════════════════════════════
#  USAGE
# ═════════════════════════════════════════════════════════════════
usage() {
  echo ""
  echo -e "${BOLD}Usage:${NC} ./run.sh <command>"
  echo ""
  echo -e "${BOLD}Commands:${NC}"
  echo -e "  ${GREEN}local${NC}          Start infra in Docker, run Java services + frontend natively"
  echo -e "  ${GREEN}docker${NC}         Build & run everything in Docker containers"
  echo -e "  ${GREEN}stop${NC}           Stop all services and containers"
  echo -e "  ${GREEN}status${NC}         Check which services are running"
  echo -e "  ${GREEN}logs${NC} [service] Tail logs (optionally for a specific service)"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo "  ./run.sh local          # Dev mode — fast rebuilds"
  echo "  ./run.sh docker         # Full containerized — cloud-ready"
  echo "  ./run.sh stop           # Tear everything down"
  echo "  ./run.sh status         # Quick health check"
  echo "  ./run.sh logs api-gateway"
  echo ""
}

# ═════════════════════════════════════════════════════════════════
#  MAIN
# ═════════════════════════════════════════════════════════════════
main() {
  local cmd="${1:-}"

  case "$cmd" in
    local)    do_local ;;
    docker)   do_docker ;;
    stop)     do_stop ;;
    status)   do_status ;;
    logs)     do_logs "$@" ;;
    *)        usage ;;
  esac
}

main "$@"
