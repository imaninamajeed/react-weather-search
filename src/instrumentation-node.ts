import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";

// Node's happy-eyeballs gives each address 250 ms to connect, which is shorter than the
// TCP + TLS handshake on a slow or distant link; every attempt then fails with ETIMEDOUT
// even though the host is reachable. Give it room so server-side fetches stay reliable.
setDefaultAutoSelectFamilyAttemptTimeout(2000);
