#!/usr/bin/env node

import { runCli } from './run';

process.exitCode = runCli(process.argv.slice(2));
