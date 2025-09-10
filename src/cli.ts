#!/usr/bin/env node

import { XPM } from './xpm';

const args = process.argv.slice(2);
const xpm = new XPM(args);
xpm.run();