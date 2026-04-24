# 🛡️ OpenVPN Panel

A production-grade, secure, and modern web-based control panel for managing OpenVPN servers, users, and sessions. Built with **Next.js**, **MySQL**, and **Tailwind CSS**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Star](https://img.shields.io/github/stars/ehsanking/openvpn-panel?style=social)](https://github.com/ehsanking/openvpn-panel)

---

## ✨ Features

- **Real-time Monitoring**: Track active VPN sessions, uptime, and node status.
- **User Management**: Fast CRUD operations for VPN users with instant status toggling (Active/Suspended).
- **Automated Configs**: One-click `.ovpn` profile generation with embedded certificates.
- **MySQL Integration**: Reliable and scalable data storage for users, settings, and logs.
- **Snapshot Sync**: Robust backup and restore system (JSON export/import) to move between nodes effortlessly.
- **Security First**: Production-ready encryption ciphers and architectural hardening.

---

## 🚀 Quick Installation

Run the following one-liner to clone, configure, and install all dependencies:

```bash
git clone https://github.com/ehsanking/openvpn-panel.git && cd openvpn-panel && chmod +x install.sh && ./install.sh
```

---

## ⚙️ Configuration

The system uses a `.env` file for all critical configurations. Ensure the following values match your environment:

### Database Settings
- `MYSQL_HOST`: Your database host (e.g., `localhost`)
- `MYSQL_USER`: Database username
- `MYSQL_PASSWORD`: Database password
- `MYSQL_DATABASE`: Database name (e.g., `vpn_panel`)

### Panel Access
- `ADMIN_USERNAME`: Your login username (Default: `admin`)
- `ADMIN_PASSWORD`: Your secret password
- `PORT`: The web panel port (Default: `3000`)

---

## 🛠 Manual Setup

If you prefer to install step-by-step:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database**:
   Run the `schema.sql` script on your MySQL server to set up tables and default settings.

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Development Mode**:
   ```bash
   npm run dev
   ```

5. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 📁 Project Architecture

- **`/app/api`**: REST/Serverless endpoints for user management and database operations.
- **`/components/views`**: Core dashboard logic and UI components.
- **`/lib/db.ts`**: MySQL connection pool and query utility.
- **`/lib/ovpn-generator.ts`**: Logic for constructing `.ovpn` files.

---

## 🔒 Security Checklist

- [ ] Change default `ADMIN_PASSWORD` in `.env`.
- [ ] Ensure `MYSQL_PORT` is not exposed publicly.
- [ ] Use `AES-256-GCM` for production encryption (configurable in Settings).
- [ ] Run the panel behind a reverse proxy (Nginx) with SSL.

---

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request on [GitHub](https://github.com/ehsanking/openvpn-panel).

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ by [Ehsan](https://github.com/ehsanking)**
