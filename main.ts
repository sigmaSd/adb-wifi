import {
  browse,
  MulticastInterface,
  Service,
} from "jsr:@earthstar/dns-sd@3.1.0";
import { DriverDeno } from "jsr:@earthstar/dns-sd@3.1.0/deno";
import qrcode from "npm:qrcode-terminal@0.12.0";
import { Adb } from "./adb.ts";

function showQr({ name, pass }: { name: string; pass: string }) {
  qrcode.generate(`WIFI:T:ADB;S:${name};P:${pass};;`);
}

async function startDiscovery({ pass }: { pass: string }) {
  console.log("Starting concurrent discovery...");

  const pairingBrowser = browse({
    multicastInterface: new MulticastInterface(new DriverDeno("IPv4")),
    service: {
      protocol: "tcp",
      type: "adb-tls-pairing",
    },
  });

  const connectBrowser = browse({
    multicastInterface: new MulticastInterface(new DriverDeno("IPv4")),
    service: {
      protocol: "tcp",
      type: "adb-tls-connect",
    },
  });

  const handlePairingService = async (service: Service) => {
    if (service.isActive) {
      console.log(
        `📡 ${service.name} - ${service.host}:${service.port} (Pairing)`,
      );
      console.log(`Pairing with ${service.host}:${service.port}`);
      const status = await Adb.pair({
        host: service.host,
        port: service.port,
        pass,
      });
      if (status.success) {
        console.log("Pairing successful.");
      } else {
        console.log("Pairing failed.");
      }
    }
  };
  const handleConnectService = async (service: Service) => {
    if (service.isActive) {
      console.log(
        `📡 ${service.name} - ${service.host}:${service.port} (Connect)`,
      );
      console.log(`Connecting to ${service.host}:${service.port}`);
      const status = await Adb.connect({
        host: service.host,
        port: service.port,
      });
      if (status.success) {
        console.log("Connection successful!");
      } else {
        console.log("Connection failed.");
      }
    }
  };

  // Use Promise.all to handle both streams concurrently
  await Promise.all([
    (async () => {
      for await (const service of pairingBrowser) {
        await handlePairingService(service);
      }
    })(),
    (async () => {
      for await (const service of connectBrowser) {
        await handleConnectService(service);
      }
    })(),
  ]);
  console.log("Discovery finished.");
}

// Function to generate a random string
function generateRandomString(length: number) {
  const randomBytes = crypto.getRandomValues(new Uint8Array(length)); // Use the global crypto object
  return Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

if (import.meta.main) {
  // Generate a random name (e.g., 8 hex characters)
  const name = `debug-${generateRandomString(4)}`;

  // Generate a strong, random password (e.g., 16 hex characters - 128 bits of entropy)
  const pass = generateRandomString(8);

  console.log(`Generated Name: ${name}`);
  console.log(`Generated Pass: ${pass}`); // Display the password for manual entry if needed

  showQr({ name, pass });
  startDiscovery({ pass });
}
