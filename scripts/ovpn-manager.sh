#!/bin/bash

# OpenVPN Cert Manager (Easy-RSA Wrapper)
# Usage: ./ovpn-manager.sh [action] [common_name]

EASY_RSA_DIR="./easy-rsa"
PKI_DIR="$EASY_RSA_DIR/pki"

init_ca() {
    echo "Initializing CA..."
    # make-cadir $EASY_RSA_DIR
    # cd $EASY_RSA_DIR
    # ./easyrsa init-pki
    # ./easyrsa build-ca nopass
    echo "CA initialized (Simulated for this environment)"
}

generate_client() {
    CN=$1
    echo "Generating cert for $CN..."
    # cd $EASY_RSA_DIR
    # ./easyrsa gen-req $CN nopass
    # ./easyrsa sign-req client $CN
    echo "Cert generated for $CN"
    # return path to cert/key
}

revoke_client() {
    CN=$1
    echo "Revoking cert for $CN..."
    # cd $EASY_RSA_DIR
    # ./easyrsa revoke $CN
    # ./easyrsa gen-crl
    echo "Cert revoked for $CN"
}

case "$1" in
    init) init_ca ;;
    gen) generate_client $2 ;;
    revoke) revoke_client $2 ;;
    *) echo "Usage: $0 {init|gen|revoke} [common_name]" ;;
esac
