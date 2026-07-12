# Security policy

Please report security issues privately through GitHub's **Report a vulnerability** feature. Do not include secrets, network credentials, serial numbers or private IP addresses in public issues.

Supported releases receive security fixes on the latest published major version. Production dependencies are checked with:

```bash
npm audit --omit=dev
```
