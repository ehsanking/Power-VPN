# PowerVPN Panel Architecture

## 🚀 Overview
The system acts as a centralized **Control Plane** managing OpenVPN nodes. It provides an API-first approach to manage VPN users, servers, and configuration generation.

## 🧱 Key Components

### 1. Control Plane (Backend API)
- **Tech Stack**: Next.js (App Router), MySQL, Tailwind CSS.
- **Responsibility**:
  - Manage users, servers, and session connectivity logging.
  - Generate and render `.ovpn` configuration files using templates.
  - Implement RBAC (Admin/User).
  - Provide dashboards and management UI.

## 📡 Communication Flow

1. **User Request**: User logs into the Web Panel.
2. **Access Control**: Backend verifies user status, expiration, and traffic limits against the MySQL database.
3. **Download**: The user downloads a pre-formatted `.ovpn` configuration, with credentials/keys injected by the server.

## 📂 Folder Structure

```text
/app/           # Next.js App Router (UI & API)
/components/    # Reusable UI components
/lib/           # Core Utilities
  db.ts         # MySQL Pool & Query helper
  logger.ts     # Centralized logging (pino)
  ovpn-generator.ts # Config Template Engine
/public/        # Static Assets
/scripts/       # SQL scripts & maintenance
```

## 🔒 Security & Operations
- **Authentication**: JWT/Session based authentication.
- **Data Integrity**: MySQL with parameterized queries to prevent SQL injections.
- **Logging**: Structured logging using Pino.

## 🚧 Status of Ad-hoc Features (Known Limitations)
The following features mentioned in some legacy documentation are **partially implemented or pending realization**:
- **Multi-Node Fleet Management**: Centralized orchestration is limited. Syncing users across nodes requires manual intervention or extensions.
- **Live Monitoring**: Dashboard metrics are placeholder-based or static. Real-time integration with node-level agents (like `vnstat` or OpenVPN Management Interface) is pending.
- **CRL Syncing**: Real-time revocation syncing to remote nodes requires additional agent setup.
