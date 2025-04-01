<div align="center">
  
<p align="center">
  <img src="https://kodus.io/wp-content/uploads/2025/04/koduscli.png" alt="Kodus CLI Banner" />
</p>

**Deploy and manage Kodus AI Code Review Agents in your infrastructure**

[![GitHub license](https://img.shields.io/github/license/kodustech/kodus-cli)](https://github.com/yourusername/kodus-cli/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@kodus/cli)](https://www.npmjs.com/package/@kodus/cli)
[![Downloads](https://img.shields.io/npm/dm/@kodus/cli)](https://www.npmjs.com/package/@kodus/cli)

</div>

## 🌟 Overview

Kodus CLI is your gateway to running Kodus AI Code Review Agents in your own infrastructure. With a single command, deploy and manage your code review automation system, keeping your code quality high while maintaining full control over your data and infrastructure.

## ✨ Features

- 🔥 **One-Command Deployment**: Deploy your entire Kodus infrastructure in minutes
- 🔒 **Self-Hosted**: Keep your code and data within your infrastructure
- 🤖 **AI-Powered Reviews**: Leverage advanced AI models for code review automation
- 🔄 **Git Integration**: Seamless integration with GitHub, GitLab, and Bitbucket
- 📊 **Monitoring & Analytics**: Built-in Grafana dashboards for insights
- 🐳 **Docker-Powered**: Containerized for consistency and easy management
- 🔐 **Secure by Default**: Enterprise-grade security with auto-generated credentials

## 🚀 Quick Start

```bash
# Install globally
npm install -g kodus-cli

# Deploy Kodus in your infrastructure
kodus install
```

## 📖 Documentation

### Basic Usage

```bash
# Deploy Kodus
kodus install

# Follow the interactive prompts to configure:
# - Environment type (local/external)
# - Git service integration
# - AI provider settings
# - Infrastructure preferences
```

### Environment Types

- **Local Development**

  - Perfect for testing and development
  - Runs everything on localhost
  - Ideal for small teams and individual developers

- **External Deployment**
  - Production-ready setup
  - Configurable for any domain
  - Suitable for enterprise environments

### Supported Git Services

| Service   | Features                                    |
| --------- | ------------------------------------------- |
| GitHub    | Pull Request Reviews, Issue Analysis        |
| GitLab    | Merge Request Reviews, Pipeline Integration |
| Bitbucket | Pull Request Reviews, Repository Analysis   |

### AI Integration

Kodus supports multiple AI providers for code review:

- OpenAI (GPT-4)
- Google AI
- Anthropic (Claude)
- Novita AI
- Vertex AI

## 🔒 Security

- All data stays within your infrastructure
- No code or sensitive information is sent to external servers
- Enterprise-grade encryption for all communications
- Role-based access control
- Audit logging for all operations

## 🤝 Contributing

We welcome contributions!

```bash
# Clone the repository
git clone https://github.com/yourusername/kodus-cli.git

# Install dependencies
npm install

# Run tests
npm test
```

## 📜 License

MIT © Kodus

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/kodus-cli&type=Date)](https://star-history.com/#yourusername/kodus-cli&Date)

## 🙏 Acknowledgments

Special thanks to all our contributors and the amazing open-source community.

---

<div align="center">

**[Website](https://kodus.ios)** • **[Documentation](https://docs.kodus.io)** • **[Twitter](https://twitter.com/kodustech)** • **[Discord](https://discord.gg/VkbfjbZr)**

Made with ❤️ by the Kodus Team

</div>
