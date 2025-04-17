import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { SharedConfigGeneratorSchema } from './schema';

export async function sharedConfigGenerator(
  tree: Tree,
  options: SharedConfigGeneratorSchema
) {}

export default sharedConfigGenerator;
