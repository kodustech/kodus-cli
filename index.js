#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper functions
const generateSecretKey = () => crypto.randomBytes(32).toString("base64");
const generateDbPassword = () =>
  crypto
    .randomBytes(16)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);

const backupEnv = () => {
  if (fs.existsSync(".env")) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copySync(".env", `.env.backup.${timestamp}`);
    return true;
  }
  return false;
};

const restoreEnv = (backupFile) => {
  if (fs.existsSync(backupFile)) {
    fs.copySync(backupFile, ".env");
    return true;
  }
  return false;
};

const getLatestVersion = () => {
  try {
    const result = execSync("git describe --tags --abbrev=0", { stdio: "pipe" })
      .toString()
      .trim();
    return result;
  } catch (error) {
    Y;
    return null;
  }
};

const getCurrentVersion = () => {
  try {
    const result = execSync("git rev-parse --abbrev-ref HEAD", {
      stdio: "pipe",
    })
      .toString()
      .trim();
    return result;
  } catch (error) {
    return null;
  }
};

// CLI version
program.version("1.0.0");

// Install command
program
  .command("install")
  .description("Install and configure Kodus")
  .action(async () => {
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
          name: "fireworksKey",
          message: "Enter your Fireworks API key (optional):",
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

      // Start installation
      console.log(chalk.blue("\n🚀 Starting installation..."));

      // Generate .env content
      const envContent = {
        // Base configuration
        WEB_NODE_ENV: "development",
        WEB_HOSTNAME_API: "localhost",
        WEB_PORT_API: "3001",
        WEB_PORT: "3000",
        WEB_NEXTAUTH_URL: "http://localhost:3000",
        WEB_NEXTAUTH_SECRET: generateSecretKey(),
        WEB_JWT_SECRET_KEY: generateSecretKey(),
        
        API_NODE_ENV: "development",
        API_LOG_LEVEL: "error",
        API_LOG_PRETTY: "true",
        API_HOST: "0.0.0.0",
        API_PORT: "3001",
        API_RATE_MAX_REQUEST: "100",
        API_RATE_INTERVAL: "1000",
        API_JWT_EXPIRES_IN: "365d",
        API_JWT_SECRET: generateSecretKey(),
        API_JWT_REFRESHSECRET: generateSecretKey(),
        API_JWT_REFRESH_EXPIRES_IN: "7d",
        
        GLOBAL_API_CONTAINER_NAME: "kodus-orchestrator-prod",

        // Database
        API_DATABASE_ENV: "development",
        API_PG_DB_USERNAME: "kodusdev",
        API_PG_DB_PASSWORD: generateDbPassword(),
        API_PG_DB_DATABASE: "kodus_db",
        API_PG_DB_HOST: "db_kodus_postgres",
        API_PG_DB_PORT: "5432",

        API_MG_DB_USERNAME: "kodusdev",
        API_MG_DB_PASSWORD: generateDbPassword(),
        API_MG_DB_DATABASE: "kodus_db",
        API_MG_DB_HOST: "db_kodus_mongodb",
        API_MG_DB_PORT: "27017",
        API_MG_DB_PRODUCTION_CONFIG: "",

        // LLM API Keys
        API_OPEN_AI_APIKEY: llmKeys.openAiKey,
        API_GOOGLE_AI_API_KEY: llmKeys.googleAiKey,
        API_ANTHROPIC_API_KEY: llmKeys.anthropicKey,
        API_FIREWORKS_API_KEY: llmKeys.fireworksKey,
        API_NOVITA_AI_API_KEY: llmKeys.novitaKey,
        API_VERTEX_AI_API_KEY: llmKeys.vertexKey,

        // LLM Models
        API_LLM_MODEL_CHATGPT_3_5_TURBO: "gpt-4o-mini",
        API_LLM_MODEL_CHATGPT_3_5_TURBO_16K: "gpt-4o-mini",
        API_LLM_MODEL_CHATGPT_4: "gpt-4o-mini",
        API_LLM_MODEL_CHATGPT_4_TURBO: "gpt-4o-mini",
        API_LLM_MODEL_CHATGPT_4_ALL: "gpt-4o",
        API_LLM_MODEL_CHATGPT_4_ALL_MINI: "gpt-4o-mini",
        API_LLM_MODEL_CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20241022",
        API_LLM_MODEL_CLAUDE_3_5_SONNET_20241022: "claude-3-5-sonnet-20241022",
        API_LLM_MODEL_GEMINI_1_5_PRO: "gpt-4o-mini",
        API_LLM_MODEL_GEMINI_1_5_PRO_EXP: "gpt-4o-mini",

        // Git service configuration
        ...gitConfig,

        // Ports
        WEB_PORT: "3000",
        API_PORT: "3001",

        // RabbitMQ
        RABBITMQ_DEFAULT_USER: "kodus",
        RABBITMQ_DEFAULT_PASS: generateDbPassword(),

        // Monitoring
        GRAFANA_ADMIN_PASSWORD: generateDbPassword(),
      };

      // Create .env file
      const envSpinner = ora("Creating .env file").start();
      const envContentString = Object.entries(envContent)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
      fs.writeFileSync(".env", envContentString);
      envSpinner.succeed("Created .env file");

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

      const maxAttempts = 30; // 5 minutes with 10 second intervals

      // Wait for PostgreSQL to be ready
      const pgSpinner = ora("Waiting for PostgreSQL to be ready").start();
      let isPgReady = false;
      let pgAttempts = 0;

      while (!isPgReady && pgAttempts < maxAttempts) {
        try {
          const logs = execSync("docker-compose logs db_kodus_postgres", { stdio: "pipe" }).toString();
          if (logs.includes("database system is ready to accept connections")) {
            isPgReady = true;
            pgSpinner.succeed("PostgreSQL is ready");
          } else {
            pgAttempts++;
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } catch (error) {
          pgAttempts++;
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      if (!isPgReady) {
        pgSpinner.fail("PostgreSQL failed to start");
        console.error(chalk.red("\nError: PostgreSQL failed to start properly"));
        console.error(chalk.yellow("\nTroubleshooting steps:"));
        console.error(chalk.white("1. Check PostgreSQL logs: docker-compose logs db_kodus_postgres"));
        console.error(chalk.white("2. Verify PostgreSQL container is running: docker-compose ps db_kodus_postgres"));
        process.exit(1);
      }

      // Wait for MongoDB to be ready
      const mongoSpinner = ora("Waiting for MongoDB to be ready").start();
      let isMongoReady = false;
      let mongoAttempts = 0;

      while (!isMongoReady && mongoAttempts < maxAttempts) {
        try {
          const logs = execSync("docker-compose logs db_kodus_mongodb", { stdio: "pipe" }).toString();
          if (logs.includes("Waiting for connections") || logs.includes("Connection accepted")) {
            isMongoReady = true;
            mongoSpinner.succeed("MongoDB is ready");
          } else {
            mongoAttempts++;
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } catch (error) {
          mongoAttempts++;
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }

      if (!isMongoReady) {
        mongoSpinner.fail("MongoDB failed to start");
        console.error(chalk.red("\nError: MongoDB failed to start properly"));
        console.error(chalk.yellow("\nTroubleshooting steps:"));
        console.error(chalk.white("1. Check MongoDB logs: docker-compose logs db_kodus_mongodb"));
        console.error(chalk.white("2. Verify MongoDB container is running: docker-compose ps db_kodus_mongodb"));
        process.exit(1);
      }

      // Now wait for orchestrator to be ready
      const healthSpinner = ora("Waiting for orchestrator to be ready").start();
      let isOrchestratorReady = false;
      let attempts = 0;

      const criticalErrors = [
        "password authentication failed",
        "Unable to connect to the database",
        "FATAL:",
        "MongoServerError:",
        "connection refused"
      ];

      while (!isOrchestratorReady && attempts < maxAttempts) {
        try {
          // Check if container is running
          const containerStatus = execSync("docker-compose ps orchestrator --format json", { stdio: "pipe" }).toString();
          const status = JSON.parse(containerStatus)[0];
          
          if (status.State === "running") {
            // Check logs for any errors
            const logs = execSync("docker-compose logs --tail=50 orchestrator", { stdio: "pipe" }).toString();
            
            // Check for critical errors that should stop the process
            const foundCriticalError = criticalErrors.find(error => logs.includes(error));
            if (foundCriticalError) {
              healthSpinner.fail("Critical error detected");
              console.error(chalk.red("\nError: Database connection failed"));
              console.error(chalk.yellow("\nTroubleshooting steps:"));
              console.error(chalk.white("1. Check if the database passwords in .env match the ones in your database"));
              console.error(chalk.white("2. Verify if the database containers are running: docker-compose ps"));
              console.error(chalk.white("3. Check database logs: docker-compose logs db_kodus_postgres db_kodus_mongodb"));
              console.error(chalk.white("\nFull error log:"));
              console.error(chalk.white(logs));
              process.exit(1);
            }
            
            // If no critical errors and we see successful connection messages, proceed
            if (logs.includes("Database connection established") || logs.includes("Connected to MongoDB")) {
              isOrchestratorReady = true;
              healthSpinner.succeed("Orchestrator is ready");
            } else {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            }
          } else {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          }
        } catch (error) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
      }

      if (!isOrchestratorReady) {
        healthSpinner.fail("Orchestrator failed to start");
        console.error(chalk.red("\nError: The orchestrator service failed to start properly."));
        console.error(chalk.yellow("\nTroubleshooting steps:"));
        console.error(chalk.white("1. Check the orchestrator logs: docker-compose logs orchestrator"));
        console.error(chalk.white("2. Verify all required services are running: docker-compose ps"));
        console.error(chalk.white("3. Try restarting the services: docker-compose restart"));
        process.exit(1);
      }

      // Setup database
      const dbSpinner = ora("Setting up database").start();
      try {
        execSync("./scripts/setup-db.sh", { stdio: "pipe" });
        dbSpinner.succeed("Database setup completed");
      } catch (error) {
        dbSpinner.fail("Failed to setup database");
        console.error(chalk.red("\nError details:"));
        console.error(chalk.white(error.stdout?.toString() || error.message));
        process.exit(1);
      }

      // Verify database connection by checking orchestrator logs
      const dbCheckSpinner = ora("Verifying database connection").start();
      try {
        const logs = execSync("docker-compose logs --tail=50 orchestrator", { stdio: "pipe" }).toString();
        
        // Look for database connection errors in logs
        if (logs.includes("database connection error") || logs.includes("Database connection failed")) {
          throw new Error("Database connection errors found in logs");
        }
        
        dbCheckSpinner.succeed("Database connection verified");
      } catch (error) {
        dbCheckSpinner.fail("Failed to verify database connection");
        console.error(chalk.red("\nError: Could not verify database connection."));
        console.error(chalk.yellow("Please check the logs with: docker-compose logs orchestrator"));
        process.exit(1);
      }

      // Installation complete
      console.log(chalk.green("\n✨ Installation completed successfully!"));

      console.log(chalk.blue("\n📝 Installation Summary:"));
      console.log(
        chalk.white(
          `  - Environment: ${envType === "local" ? "Local" : "External"}`
        )
      );
      if (envType === "external") {
        console.log(chalk.white(`  - Base URL: ${baseUrl}`));
      }
      console.log(
        chalk.white(
          `  - Git Service: ${
            gitService.charAt(0).toUpperCase() + gitService.slice(1)
          }`
        )
      );
      console.log(
        chalk.white(
          `  - Database: ${
            useDefaultDb ? "Default configuration" : "Custom configuration"
          }`
        )
      );

      console.log(chalk.blue("\n🔗 Access URLs:"));
      console.log(chalk.white(`  - Web Interface: ${baseUrl}`));
      console.log(chalk.white("  - Grafana Dashboard: http://localhost:3001"));
      console.log(
        chalk.white("  - RabbitMQ Management: http://localhost:15672")
      );

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
  });

program.parse(process.argv);
