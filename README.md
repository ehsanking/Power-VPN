# 🛡️ OpenVPN Panel (Control Plane)

> **Enterprise-grade OpenVPN fleet management system.**

This project is a high-performance Control Plane designed to manage multiple OpenVPN nodes, handle dynamic certificate issuance via Easy-RSA, and provide a secure, real-time dashboard for administrators.

---

## 🏗 Architecture
- **Control Plane**: Next.js 15, MySQL, JWT/Session Auth.
- **Node Manager**: Shell scripts + Easy-RSA PKI architecture.
- **Data Plane**: Optimized OpenVPN community nodes.
- **Queue System**: Synchronous certificate processing with optional Redis/BullMQ migration paths.

---

## 🔥 Features
- **Multi-Node Support**: Manage dozens of VPN servers from one panel.
- **Smart Routing**: Generates `.ovpn` files with multiple `remote` lines for high availability.
- **Certificate Lifecycle**: Full issuing and CRL revocation system.
- **Real-time Metrics**: Track traffic throughput and active session counts.
- **Hardened Security**: Defaulting to `AES-256-GCM` with SHA256 auth.

---

## 🚀 One-Line Installation (Ubuntu 22.04)

```bash
git clone https://github.com/ehsanking/openvpn-panel.git && cd openvpn-panel && chmod +x install.sh && ./install.sh
```

---

## 🔧 Environment Variables

Configure your `.env` based on `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_HOST` | Database host | `localhost` |
| `ADMIN_USERNAME` | Admin login | `admin` |
| `ADMIN_PASSWORD` | Admin password | `admin` |
| `PORT` | Web service port | `3000` |

---

## 🛠 Manual Deployment

1. **Database Setup**:
   ```bash
   mysql -u root -p < schema.sql
   ```

2. **Initialize Cert Authority**:
   ```bash
   ./scripts/ovpn-manager.sh init
   ```

3. **Start Application**:
   ```bash
   npm install
   npm run build
   npm start
   ```

---

## 🤝 Community & Support
- **Author**: [Ehsan](https://github.com/ehsanking)
- **License**: MIT

---
*Optimized for privacy, security, and low-latency performance.*
