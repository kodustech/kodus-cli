#!/usr/bin/env node

import { program } from "commander";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupEnvironment } from './src/commands/install.js';

// CLI version
program.version("0.0.11");

// Install command
program
  .command("install")
  .description("Install and configure Kodus")
  .action(setupEnvironment);

program.parse(process.argv);
