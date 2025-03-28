#!/usr/bin/env node

import { program } from "commander";
import setupEnvironment from "./src/commands/install.js";

// CLI version
program.version("1.0.0");

// Install command
program
  .command("install")
  .description("Install and configure Kodus")
  .action(setupEnvironment);

program.parse(process.argv);
