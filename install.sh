#!/bin/bash
# Power VPN Panel — Full Installer
set -Eeuo pipefail

REPO_URL="https://github.com/ehsanking/Power-VPN.git"
INSTALL_DIR="/opt/powervpn"
SERVICE_USER="vpnpanel"
SERVICE_FILE="/etc/systemd/system/powervpn.service"
CRED_FILE="$INSTALL_DIR/.panel_credentials.txt"
NODE_MAJOR=20
WG_PORT=51820
WG_IFACE="wg0"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
die()     { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

require_root() {
    [[ $EUID -eq 0 ]] || die "Please run as root: sudo bash install.sh"
}

generate_password() {
    LC_ALL=C tr -dc 'A-Za-z0-9!@#%^&*_+' < /dev/urandom | head -c 20
}

generate_secret() {
    LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 64
}

# ── Collect admin credentials ─────────────────────────────────────────────────
collect_credentials() {
    echo -e "\n${CYAN}====== Power VPN Panel Installer ======${NC}\n"

    while true; do
        read -rp "Enter Admin Username (min 5 chars): " ADMIN_USER
        [[ ${#ADMIN_USER} -ge 5 ]] && break
        warn "Username must be at least 5 characters."
    done

    read -s -rp "Enter Admin Password (leave blank for random): " ADMIN_PASS
    echo
    if [[ -z "$ADMIN_PASS" ]]; then
        ADMIN_PASS=$(generate_password)
        echo -e "  Generated password: ${YELLOW}${ADMIN_PASS}${NC}"
    fi

    read -rp "Enter Panel Port (default 3000): " PANEL_PORT
    PANEL_PORT=${PANEL_PORT:-3000}
    [[ "$PANEL_PORT" =~ ^[0-9]+$ ]] || PANEL_PORT=3000
}

# ── System dependencies ───────────────────────────────────────────────────────
install_dependencies() {
    info "Updating package lists…"
    apt-get update -qq

    info "Installing system packages…"
    apt-get install -y -qq \
        curl git ca-certificates gnupg lsb-release \
        mysql-server openssl ufw iptables 2>/dev/null || \
    apt-get install -y -qq \
        curl git ca-certificates gnupg \
        mariadb-server openssl ufw iptables

    # Node.js via NodeSource
    if ! command -v node &>/dev/null || [[ "$(node -e 'process.stdout.write(process.versions.node.split(".")[0])')" -lt "$NODE_MAJOR" ]]; then
        info "Installing Node.js ${NODE_MAJOR}…"
        curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
        apt-get install -y -qq nodejs
    fi
    success "Node.js $(node -v) ready."
}

# ── MySQL setup ───────────────────────────────────────────────────────────────
setup_database() {
    info "Starting MySQL / MariaDB…"
    systemctl enable --now mysql 2>/dev/null || systemctl enable --now mariadb

    DB_USER="vpn_panel_user"
    DB_PASS=$(generate_password)
    DB_NAME="vpn_panel"

    info "Creating database and user…"
    mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
    success "Database '${DB_NAME}' ready."
}

# ── WireGuard server setup ────────────────────────────────────────────────────
install_wireguard() {
    info "Installing WireGuard…"
    apt-get install -y -qq wireguard wireguard-tools

    # Generate server key pair
    WG_SERVER_PRIVKEY=$(wg genkey)
    WG_SERVER_PUBKEY=$(echo "$WG_SERVER_PRIVKEY" | wg pubkey)

    # Detect primary network interface (for NAT)
    NET_IFACE=$(ip route show default | awk '/default/ {print $5; exit}')

    # Create server config
    mkdir -p /etc/wireguard
    cat > "/etc/wireguard/${WG_IFACE}.conf" <<WGCONF
[Interface]
Address = 10.8.0.1/24
ListenPort = ${WG_PORT}
PrivateKey = ${WG_SERVER_PRIVKEY}
PostUp   = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${NET_IFACE} -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${NET_IFACE} -j MASQUERADE
WGCONF
    chmod 600 "/etc/wireguard/${WG_IFACE}.conf"

    # Enable IP forwarding
    echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-wireguard.conf
    sysctl -p /etc/sysctl.d/99-wireguard.conf >/dev/null 2>&1

    # Open WireGuard port in firewall
    if command -v ufw &>/dev/null; then
        ufw allow "${WG_PORT}/udp" >/dev/null 2>&1 || true
    fi

    # Allow the app user to run wg commands without password (for adding peers)
    echo "${SERVICE_USER} ALL=(root) NOPASSWD: /usr/bin/wg, /usr/bin/wg-quick" \
        > /etc/sudoers.d/powervpn-wg
    chmod 440 /etc/sudoers.d/powervpn-wg

    # Start WireGuard
    systemctl enable --now "wg-quick@${WG_IFACE}"
    success "WireGuard server started on port ${WG_PORT}."
    success "Server public key: ${YELLOW}${WG_SERVER_PUBKEY}${NC}"
}

# ── Application install ───────────────────────────────────────────────────────
install_app() {
    info "Creating system user '${SERVICE_USER}'…"
    id "$SERVICE_USER" &>/dev/null || useradd --system --shell /usr/sbin/nologin --home "$INSTALL_DIR" "$SERVICE_USER"

    if [[ -d "$INSTALL_DIR/.git" ]]; then
        info "Updating existing installation in ${INSTALL_DIR}…"
        git -C "$INSTALL_DIR" pull origin main
    else
        info "Cloning repository to ${INSTALL_DIR}…"
        rm -rf "$INSTALL_DIR"
        git clone "$REPO_URL" "$INSTALL_DIR"
    fi

    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

    info "Installing npm dependencies (this may take a few minutes)…"
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" npm install --omit=dev --prefer-offline 2>&1 | tail -5
    success "Dependencies installed."
}

# ── Hash admin password with bcrypt ──────────────────────────────────────────
hash_password() {
    ADMIN_PASS_HASH=$(node -e "const b=require('bcryptjs'); process.stdout.write(b.hashSync('$ADMIN_PASS',12));")
}

# ── Write .env ────────────────────────────────────────────────────────────────
write_env() {
    JWT_SECRET=$(generate_secret)
    MIGRATION_TOKEN=$(generate_secret)

    cat > "$INSTALL_DIR/.env" <<ENV
MYSQL_HOST=localhost
MYSQL_USER=${DB_USER}
MYSQL_PASSWORD=${DB_PASS}
MYSQL_DATABASE=${DB_NAME}
ADMIN_USERNAME=${ADMIN_USER}
ADMIN_PASSWORD_HASH=${ADMIN_PASS_HASH}
JWT_SECRET=${JWT_SECRET}
MIGRATION_TOKEN=${MIGRATION_TOKEN}
PORT=${PANEL_PORT}
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:${PANEL_PORT}
WG_SERVER_PUBKEY=${WG_SERVER_PUBKEY}
WG_PORT=${WG_PORT}
WG_IFACE=${WG_IFACE}
ENV
    chmod 600 "$INSTALL_DIR/.env"
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/.env"
    success ".env written (includes WG_SERVER_PUBKEY)."
}

# ── Build Next.js ─────────────────────────────────────────────────────────────
build_app() {
    info "Building Next.js application (this takes a few minutes)…"
    cd "$INSTALL_DIR"
    sudo -u "$SERVICE_USER" npm run build 2>&1 | tail -10
    success "Build complete."
}

# ── Run schema ────────────────────────────────────────────────────────────────
run_schema() {
    info "Importing database schema…"
    mysql -u root "$DB_NAME" < "$INSTALL_DIR/schema.sql"
    success "Schema imported."
}

# ── Seed WireGuard public key into settings table ─────────────────────────────
seed_wg_settings() {
    info "Seeding WireGuard settings into database…"
    mysql -u root "$DB_NAME" <<SQL
INSERT INTO settings (\`key\`, \`value\`) VALUES ('wgServerPubKey', '${WG_SERVER_PUBKEY}')
  ON DUPLICATE KEY UPDATE \`value\` = '${WG_SERVER_PUBKEY}';
INSERT INTO settings (\`key\`, \`value\`) VALUES ('wgPort', '${WG_PORT}')
  ON DUPLICATE KEY UPDATE \`value\` = '${WG_PORT}';
INSERT INTO settings (\`key\`, \`value\`) VALUES ('wgIface', '${WG_IFACE}')
  ON DUPLICATE KEY UPDATE \`value\` = '${WG_IFACE}';
SQL
    success "WireGuard settings seeded."
}

# ── Systemd service ───────────────────────────────────────────────────────────
install_service() {
    info "Installing systemd service…"
    mkdir -p "$INSTALL_DIR/logs"
    chown "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR/logs"

    cat > "$SERVICE_FILE" <<UNIT
[Unit]
Description=Power VPN Management Panel
After=network.target mysql.service mariadb.service wg-quick@${WG_IFACE}.service
Wants=mysql.service mariadb.service

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${INSTALL_DIR}/.env
ExecStart=$(which node) node_modules/.bin/next start -p \${PORT:-${PANEL_PORT}}
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
LimitNOFILE=65535
PrivateTmp=yes
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
UNIT

    systemctl daemon-reload
    systemctl enable powervpn
    systemctl restart powervpn
    success "Service started."
}

# ── CLI management script ─────────────────────────────────────────────────────
install_cli() {
    cp "$INSTALL_DIR/powervpn.sh" /usr/local/bin/powervpn
    chmod +x /usr/local/bin/powervpn
    success "'powervpn' command installed. Run: powervpn"
}

# ── Firewall ──────────────────────────────────────────────────────────────────
configure_firewall() {
    if command -v ufw &>/dev/null; then
        ufw allow "$PANEL_PORT"/tcp >/dev/null 2>&1 || true
        info "Firewall: port ${PANEL_PORT}/tcp opened."
    fi
}

# ── Save credentials ──────────────────────────────────────────────────────────
save_credentials() {
    SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    cat > "$CRED_FILE" <<CRED
====== Power VPN Panel Credentials ======
Panel URL:          http://${SERVER_IP}:${PANEL_PORT}
Admin Username:     ${ADMIN_USER}
Admin Password:     ${ADMIN_PASS}
Database User:      ${DB_USER}
Database Pass:      ${DB_PASS}
Database Name:      ${DB_NAME}
Migration Token:    ${MIGRATION_TOKEN}
WireGuard PubKey:   ${WG_SERVER_PUBKEY}
WireGuard Port:     ${WG_PORT}
==========================================
CRED
    chmod 600 "$CRED_FILE"
    chown root:root "$CRED_FILE"
}

# ── Final summary ─────────────────────────────────────────────────────────────
print_summary() {
    SERVER_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    echo
    echo -e "${GREEN}======================================================${NC}"
    echo -e "${GREEN}   Power VPN Panel installed successfully!${NC}"
    echo -e "${GREEN}======================================================${NC}"
    echo -e "  Panel URL:      ${CYAN}http://${SERVER_IP}:${PANEL_PORT}${NC}"
    echo -e "  Username:       ${YELLOW}${ADMIN_USER}${NC}"
    echo -e "  Password:       ${YELLOW}${ADMIN_PASS}${NC}"
    echo -e "  WG PubKey:      ${YELLOW}${WG_SERVER_PUBKEY}${NC}"
    echo -e "  Credentials:    ${CRED_FILE}"
    echo -e "  Manage panel:   ${CYAN}powervpn${NC}"
    echo -e "${GREEN}======================================================${NC}"
    echo -e "${RED}  Keep ${CRED_FILE} safe and delete after saving!${NC}"
    echo
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
    require_root
    collect_credentials
    install_dependencies
    install_wireguard
    setup_database
    install_app
    hash_password
    write_env
    build_app
    run_schema
    seed_wg_settings
    install_service
    install_cli
    configure_firewall
    save_credentials
    print_summary
}

main "$@"
