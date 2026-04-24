#!/usr/bin/env bash
# ============================================================
# PowerVPN Node Agent
# Runs on each VPN server node. Collects real system metrics
# and pushes them to the control panel every 30 seconds.
#
# Setup:
#   1. Register the server from the admin panel to get an AGENT_KEY
#   2. Edit the CONFIG section below
#   3. chmod +x node-agent.sh && ./node-agent.sh
#   4. (Optional) run as a systemd service — see bottom of this file
# ============================================================

# ── CONFIG ──────────────────────────────────────────────────
PANEL_URL="https://your-panel-domain.com"   # No trailing slash
SERVER_ID="1"                                # vpn_servers.id in panel DB
AGENT_KEY="your-agent-key-here"             # From /api/agent/register
IFACE="eth0"                                 # Primary network interface
OVPN_STATUS="/var/log/openvpn/openvpn-status.log"
PUSH_INTERVAL=30                             # Seconds between pushes
# ────────────────────────────────────────────────────────────

set -euo pipefail

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

get_cpu_percent() {
  # Average CPU usage over 1 second sample
  local idle
  idle=$(top -bn2 -d0.5 | grep "Cpu(s)" | tail -1 | awk '{print $8}' | tr -d '%')
  echo "${idle%.*}" | awk '{printf "%d", 100 - $1}'
}

get_bandwidth_mbps() {
  local iface="$1" direction="$2"  # direction: rx or tx
  local col=1
  [ "$direction" = "tx" ] && col=9

  local b1
  b1=$(awk -v iface="$iface" -v col="$col" \
    '$0 ~ iface":" {gsub(iface":", ""); print $col}' /proc/net/dev 2>/dev/null || echo 0)
  sleep 1
  local b2
  b2=$(awk -v iface="$iface" -v col="$col" \
    '$0 ~ iface":" {gsub(iface":", ""); print $col}' /proc/net/dev 2>/dev/null || echo 0)

  # bytes/sec → Mbps
  echo $(( (b2 - b1) * 8 / 1_000_000 ))
}

get_active_connections() {
  if [ -f "$OVPN_STATUS" ]; then
    grep -c "^CLIENT_LIST" "$OVPN_STATUS" 2>/dev/null || echo 0
  else
    echo 0
  fi
}

get_server_status() {
  # Check if OpenVPN process is running
  pgrep -x openvpn >/dev/null 2>&1 && echo "online" || echo "offline"
}

push_metrics() {
  local cpu bw_in bw_out connections status latency_ms

  cpu=$(get_cpu_percent)
  bw_in=$(get_bandwidth_mbps "$IFACE" rx)
  bw_out=$(get_bandwidth_mbps "$IFACE" tx)
  connections=$(get_active_connections)
  status=$(get_server_status)

  # Self-latency: ping the panel host and get avg latency
  panel_host=$(echo "$PANEL_URL" | awk -F/ '{print $3}')
  latency_ms=$(ping -c 1 -W 2 "$panel_host" 2>/dev/null \
    | tail -1 | awk -F'/' '{printf "%d", $5+0}' 2>/dev/null || echo 0)

  local payload
  payload=$(cat <<EOF
{
  "server_id": $SERVER_ID,
  "cpu_percent": $cpu,
  "bandwidth_ingress_mbps": $bw_in,
  "bandwidth_egress_mbps": $bw_out,
  "active_connections": $connections,
  "latency_ms": $latency_ms,
  "status": "$status"
}
EOF
)

  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${PANEL_URL}/api/agent/metrics" \
    -H "Authorization: Bearer ${AGENT_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    --connect-timeout 5 --max-time 10 2>/dev/null || echo "000")

  if [ "$http_code" = "200" ]; then
    log "Metrics pushed — CPU:${cpu}% BW:${bw_in}↓/${bw_out}↑ Mbps Conns:${connections} Status:${status}"
  else
    log "Push failed (HTTP $http_code)"
  fi
}

log "PowerVPN Node Agent starting — server_id=$SERVER_ID panel=$PANEL_URL"

while true; do
  push_metrics || log "push_metrics error (will retry)"
  sleep "$PUSH_INTERVAL"
done

# ============================================================
# SYSTEMD SERVICE (optional)
# Save as /etc/systemd/system/powervpn-agent.service:
#
# [Unit]
# Description=PowerVPN Node Agent
# After=network.target
#
# [Service]
# ExecStart=/opt/powervpn/node-agent.sh
# Restart=always
# RestartSec=10
#
# [Install]
# WantedBy=multi-user.target
#
# Then: systemctl enable --now powervpn-agent
# ============================================================
