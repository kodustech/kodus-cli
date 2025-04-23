import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { DEFAULT_CONFIG, DOCKER_NETWORKS, CRITICAL_ERRORS } from "../config/default.js";
import {
  generateSecretKey,
  generateDbPassword,
  copyTemplates,
  createDockerNetworks,
} from "../utils/helpers.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const maxAttempts = 30; // 5 minutes with 10 second intervals

const waitForService = async (serviceName, successMessage, errorMessage) => {
  const spinner = ora(`Waiting for ${serviceName} to be ready`).start();
  let isReady = false;
  let attempts = 0;

  while (!isReady && attempts < maxAttempts) {
    try {
      const logs = execSync(`docker-compose logs ${serviceName}`, { stdio: "pipe" }).toString();
      
      if (logs.includes(successMessage)) {
        isReady = true;
        spinner.succeed(`${serviceName} is ready`);
      } else {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  if (!isReady) {
    spinner.fail(errorMessage);
    console.error(chalk.yellow("\nTroubleshooting steps:"));
    console.error(chalk.white(`1. Check ${serviceName} logs: docker-compose logs ${serviceName}`));
    console.error(chalk.white(`2. Verify ${serviceName} container is running: docker-compose ps ${serviceName}`));
    process.exit(1);
  }
};

export const setupEnvironment = async () => {
  try {
    // Check prerequisites
    console.log(chalk.blue("\n🔍 Checking prerequisites..."));
    const spinner = ora("Checking Docker installation").start();

    try {
      execSync("docker --version", { stdio: "ignore" });
      spinner.succeed("Docker is installed");
    } catch (error) {
      spinner.fail("Docker is not installed");
      console.error(
        chalk.red(
          "\nPlease install Docker first: https://docs.docker.com/get-docker/"
        )
      );
      process.exit(1);
    }

    // Copy template files
    const templateSpinner = ora("Copying template files").start();
    try {
      copyTemplates(process.cwd());
      templateSpinner.succeed("Template files copied");
    } catch (error) {
      templateSpinner.fail("Failed to copy template files");
      console.error(chalk.red("\nError details:"));
      console.error(chalk.white(error.message));
      process.exit(1);
    }

    // Environment type selection
    const { envType } = await inquirer.prompt([
      {
        type: "list",
        name: "envType",
        message: "What type of environment are you setting up?",
        choices: [
          { name: "Local (localhost)", value: "local" },
          { name: "External (with public URL)", value: "external" },
        ],
        default: "local",
      },
    ]);

    let baseUrl = "http://localhost:3000";
    if (envType === "external") {
      const { url } = await inquirer.prompt([
        {
          type: "input",
          name: "url",
          message: "Enter your public URL (e.g., https://kodus.yourdomain.com):",
          validate: (input) => {
            try {
              const url = new URL(input);
              if (!url.protocol.startsWith('http')) {
                return "URL must start with http:// or https://";
              }
              if (!url.hostname.includes('.')) {
                return "URL must include a valid domain name";
              }
              return true;
            } catch (e) {
              return "Please enter a valid URL (e.g., https://kodus.yourdomain.com)";
            }
          },
        },
      ]);
      baseUrl = url;
    }

    // Git service selection
    const { gitService } = await inquirer.prompt([
      {
        type: "list",
        name: "gitService",
        message: "Which Git service will you use?",
        choices: [
          { name: "GitHub", value: "github" },
          { name: "GitLab", value: "gitlab" },
          { name: "Bitbucket", value: "bitbucket" },
        ],
      },
    ]);

    // Git service configuration
    let gitConfig = {};
    
    if (envType === "local") {
      console.log(chalk.yellow("\n⚠️  IMPORTANT: If you're using a cloud Git service (GitHub, GitLab, Bitbucket), you'll need to configure the webhook manually."));
      console.log(chalk.yellow("For local or self-hosted Git instances, no additional configuration is needed."));
      console.log(chalk.yellow("The webhook URL will be:"));
      console.log(chalk.white(`${baseUrl}/api/webhook/${gitService}`));
    }

    // Configure webhook URL based on the selected Git service
    if (gitService === "github") {
      gitConfig = {
        API_GITHUB_CODE_MANAGEMENT_WEBHOOK: `${baseUrl}/api/webhook/${gitService}`,
      };
    } else if (gitService === "gitlab") {
      gitConfig = {
        API_GITLAB_CODE_MANAGEMENT_WEBHOOK: `${baseUrl}/api/webhook/${gitService}`,
      };
    } else if (gitService === "bitbucket") {
      gitConfig = {
        GLOBAL_BITBUCKET_CODE_MANAGEMENT_WEBHOOK: `${baseUrl}/api/webhook/${gitService}`,
      };
    }

    // Database configuration
    const { useDefaultDb } = await inquirer.prompt([
      {
        type: "confirm",
        name: "useDefaultDb",
        message: "Would you like to use default database configurations?",
        default: true,
      },
    ]);

    // LLM API Keys configuration
    console.log(chalk.blue("\n🔑 Configuring LLM API Keys..."));
    const llmKeys = await inquirer.prompt([
      {
        type: "input",
        name: "openAiKey",
        message: "Enter your OpenAI API key (optional):",
        default: "",
      },
      {
        type: "input",
        name: "googleAiKey",
        message: "Enter your Google AI API key (optional):",
        default: "",
      },
      {
        type: "input",
        name: "anthropicKey",
        message: "Enter your Anthropic API key (optional):",
        default: "",
      },
      {
        type: "input",
        name: "novitaKey",
        message: "Enter your Novita AI API key (optional):",
        default: "",
      },
      {
        type: "input",
        name: "vertexKey",
        message: "Enter your Vertex AI API key (optional):",
        default: "",
      },
    ]);

    // Generate .env content
    const envContent = {
      ...DEFAULT_CONFIG,
      WEB_NEXTAUTH_SECRET: generateSecretKey(),
      WEB_JWT_SECRET_KEY: generateSecretKey(),
      API_JWT_SECRET: generateSecretKey(),
      API_JWT_REFRESHSECRET: generateSecretKey(),
      API_PG_DB_PASSWORD: generateDbPassword(),
      API_MG_DB_PASSWORD: generateDbPassword(),
      RABBITMQ_DEFAULT_PASS: generateDbPassword(),
      GRAFANA_ADMIN_PASSWORD: generateDbPassword(),
      API_OPEN_AI_APIKEY: llmKeys.openAiKey,
      API_GOOGLE_AI_API_KEY: llmKeys.googleAiKey,
      API_ANTHROPIC_API_KEY: llmKeys.anthropicKey,
      API_NOVITA_AI_API_KEY: llmKeys.novitaKey,
      API_VERTEX_AI_API_KEY: llmKeys.vertexKey,
      ...gitConfig,
    };

    // Create .env file
    const envSpinner = ora("Creating .env file").start();
    const envContentString = Object.entries(envContent)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    
    const envPath = path.join(process.cwd(), '.env');
    fs.writeFileSync(envPath, envContentString);
    envSpinner.succeed("Created .env file");

    // Create Docker networks
    createDockerNetworks(DOCKER_NETWORKS);

    // Start containers
    const dockerSpinner = ora("Starting containers").start();
    try {
      execSync("docker-compose up -d", { stdio: "pipe" });
      dockerSpinner.succeed("Containers started");
    } catch (error) {
      dockerSpinner.fail("Failed to start containers");
      console.error(chalk.red("\nError details:"));
      console.error(chalk.white(error.stdout?.toString() || error.message));
      process.exit(1);
    }

    // Wait for services to be ready
    await waitForService(
      "db_kodus_postgres",
      "database system is ready to accept connections",
      "PostgreSQL failed to start"
    );

    await waitForService(
      "db_kodus_mongodb",
      "Waiting for connections",
      "MongoDB failed to start"
    );

    // Setup database
    const dbSpinner = ora("Setting up database").start();
    try {
      const moduleRoot = dirname(dirname(__dirname)); // Sobe 2 níveis: commands -> src -> root
      const scriptPath = path.join(moduleRoot, 'scripts', 'setup-db.sh');
      
      if (!fs.existsSync(scriptPath)) {
        dbSpinner.fail('setup-db.sh script not found!');
        console.error(chalk.red(`\nScript expected at: ${scriptPath}`));
        process.exit(1);
      }

      execSync(`sh ${scriptPath}`, { stdio: "pipe" });
      dbSpinner.succeed("Database setup completed");
    } catch (error) {
      dbSpinner.fail("Failed to setup database");
      console.error(chalk.red("\nError details:"));
      console.error(chalk.white(error.stdout?.toString() || error.message));
      process.exit(1);
    }

    // Installation complete
    console.log(chalk.green("\n✨ Installation completed successfully!"));

    console.log(chalk.blue("\n📝 Installation Summary:"));
    console.log(chalk.white(`  - Environment: ${envType === "local" ? "Local" : "External"}`));
    if (envType === "external") {
      console.log(chalk.white(`  - Base URL: ${baseUrl}`));
    }
    console.log(chalk.white(`  - Git Service: ${gitService.charAt(0).toUpperCase() + gitService.slice(1)}`));
    console.log(chalk.white(`  - Database: ${useDefaultDb ? "Default configuration" : "Custom configuration"}`));

    console.log(chalk.blue("\n🔗 Access URLs:"));
    console.log(chalk.white(`  - Web Interface: ${baseUrl}`));
    console.log(chalk.white("  - Grafana Dashboard: http://localhost:3001"));
    console.log(chalk.white("  - RabbitMQ Management: http://localhost:15672"));

    console.log(chalk.blue("\n📚 Next Steps:"));
    console.log(chalk.white("  1. Access the web interface"));
    console.log(chalk.white("  2. Set up your first user"));
    console.log(chalk.white("  3. Start using Kodus!"));

    const { startServices } = await inquirer.prompt([
      {
        type: "confirm",
        name: "startServices",
        message: "Would you like to start the services now?",
        default: true,
      },
    ]);

    if (startServices) {
      execSync("docker-compose up -d", { stdio: "ignore" });
      console.log(chalk.green("\nServices started successfully!"));
    }
  } catch (error) {
    console.error(chalk.red("\n❌ Installation failed:"), error.message);
    process.exit(1);
  }
}; 