import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';

export const generateSecretKey = () => crypto.randomBytes(32).toString("base64");

export const generateDbPassword = () =>
  crypto
    .randomBytes(16)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);

export const copyTemplates = (targetDir) => {
  const templatesDir = path.join(process.cwd(), 'templates');
  fs.copySync(path.join(templatesDir, 'docker-compose.yml'), path.join(targetDir, 'docker-compose.yml'));
};

export const backupEnv = () => {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(process.cwd(), `.env.backup.${timestamp}`);
    fs.copySync(envPath, backupPath);
    return true;
  }
  return false;
};

export const restoreEnv = (backupFile) => {
  const backupPath = path.join(process.cwd(), backupFile);
  if (fs.existsSync(backupPath)) {
    const envPath = path.join(process.cwd(), '.env');
    fs.copySync(backupPath, envPath);
    return true;
  }
  return false;
};

export const getLatestVersion = () => {
  try {
    const result = execSync("git describe --tags --abbrev=0", { stdio: "pipe" })
      .toString()
      .trim();
    return result;
  } catch (error) {
    return null;
  }
};

export const getCurrentVersion = () => {
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

export const createDockerNetworks = (networks) => {
  const networkSpinner = ora("Creating Docker networks").start();
  
  for (const network of networks) {
    try {
      // Check if network exists
      execSync(`docker network inspect ${network}`, { stdio: 'ignore' });
    } catch (error) {
      // Network doesn't exist, create it
      try {
        execSync(`docker network create ${network}`, { stdio: 'pipe' });
        console.log(chalk.green(`\nCreated network: ${network}`));
      } catch (createError) {
        networkSpinner.fail(`Failed to create network: ${network}`);
        console.error(chalk.red("\nError details:"));
        console.error(chalk.white(createError.stdout?.toString() || createError.message));
        process.exit(1);
      }
    }
  }
  
  networkSpinner.succeed("Docker networks created");
}; 