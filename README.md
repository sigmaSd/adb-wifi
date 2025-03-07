# ADB WiFi Connect Tool

This tool simplifies the process of connecting to Android devices over WiFi using ADB (Android Debug Bridge) without requiring a USB connection.

## Features

- Automatic discovery of Android devices advertising ADB over WiFi
- Seamless pairing and connection using the QR code
- Support for both pairing and connection modes
- Displays discovered devices with their network information

## Prerequisites

- Deno runtime (1.37 or newer)
- An Android device with Developer Options enabled
- Wireless Debugging enabled on your Android device

## Usage

1. Run the script:

```bash
deno -NS --unstable-net --allow-run=adb main.ts
```

2. The script will:
   - Generate a random name and password for the connection
   - Display a QR code that can be scanned from your Android device
   - Begin searching for Android devices advertising ADB over WiFi

3. On your Android device:
   - Go to Settings → Developer options → Wireless debugging
   - Tap "Pair device with QR code"
   - Scan the QR code displayed in your terminal

4. The script will automatically detect your device and attempt to pair and connect to it.

## How It Works

The tool uses mDNS (multicast DNS) to discover Android devices that are advertising ADB over WiFi services on your local network. It listens for two service types:

- `adb-tls-pairing` - For initial pairing with a device
- `adb-tls-connect` - For connecting to an already paired device

When a device is discovered, the tool automatically attempts to pair with it using the generated password, and then establish a connection.

## Permissions

This script requires the following permissions:
- `--allow-net`: For network discovery and ADB connections
- `--allow-run`: To execute ADB commands
- `--allow-sys`: To get the hostname and the network interfaces

## License

MIT
