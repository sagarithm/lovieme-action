# ⚡ LovieMe GitHub PR Preview Action (`sagarithm/lovieme-action`)

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-LovieMe%20PR%20Preview-blue?logo=github)](https://github.com/marketplace/actions/lovieme-ephemeral-pr-preview-subdomains)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Automatically provision ephemeral, custom `*.lovie.me` subdomains with sub-2-second Anycast DNS propagation for your Pull Request preview deployments, and tear them down automatically when the PR is merged or closed!

---

## 🚀 Quick Start Example

Add this workflow to your repository under `.github/workflows/preview.yml`:

```yaml
name: Ephemeral Preview Subdomain

on:
  pull_request:
    types: [opened, synchronize, closed]

jobs:
  preview-domain:
    runs-on: ubuntu-latest
    steps:
      - name: Provision or Teardown LovieMe Preview Subdomain
        uses: sagarithm/lovieme-action@v1
        with:
          api-key: ${{ secrets.LOVIE_API_KEY }}
          subdomain: pr-${{ github.event.number }}-myapp
          action: auto
          preset: vercel # or cname-target: cname.vercel-dns.com
```

---

## ⚙️ Inputs

| Input | Description | Required | Default |
| :--- | :--- | :---: | :---: |
| `api-key` | Your LovieMe developer or AI Agent API key (`lovie_live_...`) | **Yes** | - |
| `subdomain` | Subdomain prefix (e.g. `pr-42-myapp` -> `pr-42-myapp.lovie.me`) | **Yes** | - |
| `action` | Action to perform: `auto` (auto-detects PR open/close), `claim`, or `release` | No | `auto` |
| `preset` | 1-click cloud preset (`vercel`, `railway`, `render`, `github-pages`, `cloudflare-pages`, `supabase`) | No | - |
| `cname-target` | Custom CNAME target to point the subdomain to (e.g. `cname.vercel-dns.com`) | No | - |
| `api-url` | Custom LovieMe API URL | No | `https://www.lovie.me` |

---

## 📤 Outputs

| Output | Description |
| :--- | :--- |
| `fqdn` | Fully qualified domain name (e.g. `pr-42-myapp.lovie.me`) |
| `status` | Operation status (`claimed` or `released`) |
| `preview-url` | Live HTTPS URL (`https://pr-42-myapp.lovie.me`) |

---

## 🔒 Security Best Practice

Generate a dedicated API key in the [LovieMe Dashboard](https://www.lovie.me/dashboard/api-keys) scoped to `subdomains:write` and `dns:write`. You can also sandbox the key with the `pr-*` subdomain wildcard pattern so the CI token can never alter your production subdomains.

---

## 📄 License

MIT © [Sagar Kewat (Sagarithm)](https://github.com/sagarithm)
