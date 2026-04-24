# OpenVPN Panel Architecture

## 🚀 Overview
The system is designed as a centralized **Control Plane** that manages a fleet of **Data Plane** (OpenVPN Nodes). It follows an API-first approach, decoupling the UI from the underlying certificate management and config generation logic.

## 🧱 Components

### 1. Control Plane (Backend API)
- **Tech Stack**: Next.js (App Router), MySQL.
- **Responsibility**: 
  - Manage users, servers, and sessions.
  - Generate dynamic `.ovpn` files.
  - Coordinate certificate issuance and revocation.
  - RBAC (Admin/User) implementation.

### 2. Node Manager (Worker Process)
- **Tech Stack**: Shell Scripts + Easy-RSA.
- **Responsibility**:
  - Direct interaction with OpenSSL to issue/revoke certificates.
  - Maintains the CRL (Certificate Revocation List).
  - Syncs state with OpenVPN nodes.

### 3. Data Plane (OpenVPN Nodes)
- **Tech Stack**: OpenVPN Community Edition.
- **Responsibility**:
  - Encapsulate and route client traffic.
  - Report usage metrics and active sessions back to the Control Plane.

## 📡 Communication Flow

1. **User Request**: User logs into the Web Panel and requests a new `.ovpn` file.
2. **Auth Verification**: Backend verifies user status and expiration date.
3. **Cert Generation**: Backend triggers the Cert Service to generate a unique key pair (if not already cached).
4. **Config Assembly**: Backend identifies active servers from `vpn_servers` table, selects the best endpoints, and embeds certificates into the config.
5. **Download**: The browser receives a signed `.ovpn` package.

## 📂 Folder Structure

```text
/app/api/         # REST Endpoints
/components/      # UI Layer (React)
/lib/             # Core Utilities
  db.ts           # MySQL Pool
  ovpn-gen.ts     # Config Template Engine
  cert-auth.ts    # Easy-RSA Wrapper
/scripts/         # Bash Deployment & Management
/public/          # Static Assets
/styles/          # Tailwind Config
```

## 🔒 Security Measures
- **JWT/Session Auth**: Hardened login with credential validation.
- **Ephemeral Storage**: Private keys are stored securely and never exposed in public directories.
- **GCM Ciphers**: Defaulting to `AES-256-GCM` for higher performance and security.
- **CRL Syncing**: Real-time revocation check to block suspended accounts immediately.
